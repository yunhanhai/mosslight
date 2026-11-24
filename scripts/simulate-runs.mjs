import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  Game,
  KEEPERS,
  MODES,
  UPGRADES,
  WORLD,
  distance,
  scoreFor,
  sweepCircle,
} from "../src/core.js";

// Diagnostic bot with normal HP. It only moves, dashes and chooses legal
// upgrades; it does not change health, damage, spawn timing or enemy state.
// Results measure this policy, not human difficulty, enjoyment or win rates.
const version = JSON.parse(await readFile("package.json", "utf8")).version;
const seeds = [42, 84, 20261121, 271828, 314159];
const viewports = [
  { name: "desktop", width: 1184, height: 660 },
  { name: "mobile", width: 374 / 0.82, height: 776 / 0.82 },
];
const weights = {
  multi: 10,
  power: 8,
  haste: 7,
  orbit: 6,
  magnet: 5,
  speed: 4,
  dash: 3,
  vitality: 2,
};
const choose = (g) => {
  const value = (id) =>
    weights[id] +
    (id === "vitality" && g.player.hp / g.stats.maxHp < 0.65 ? 16 : 0) +
    (id === "dash" && g.player.hp / g.stats.maxHp < 0.5 ? 7 : 0) +
    (id === "magnet" && !g.build.magnet ? 3 : 0);
  return [...g.choices].sort((a, b) => value(b) - value(a))[0];
};
const inputFor = (g) => {
  const p = g.player;
  const threats = g.enemies.filter((e) => e.hp > 0 && distance(e, p) < 430);
  const motes = g.motes
    .filter((m) => m.life > 0)
    .sort(
      (a, b) =>
        distance(a, p) / Math.sqrt(a.value) -
        distance(b, p) / Math.sqrt(b.value),
    );
  const target = motes[0] || {
    x: WORLD.width / 2 + Math.cos(g.elapsed * 0.08) * 400,
    y: WORLD.height / 2 + Math.sin(g.elapsed * 0.08) * 350,
  };
  const desired = Math.atan2(target.y - p.y, target.x - p.x);
  const angles = [
    desired,
    ...Array.from({ length: 24 }, (_, i) => (i * Math.PI) / 12),
  ];
  let best = null,
    nearest = Infinity;
  for (const e of threats)
    nearest = Math.min(nearest, distance(e, p) - e.radius - p.radius);
  for (const angle of angles) {
    const direction = { x: Math.cos(angle), y: Math.sin(angle) },
      horizon = 0.55;
    const end = {
      x: p.x + direction.x * g.stats.speed * horizon,
      y: p.y + direction.y * g.stats.speed * horizon,
    };
    const wall = Math.min(
      end.x - 25,
      WORLD.width - 25 - end.x,
      end.y - 25,
      WORLD.height - 25 - end.y,
    );
    let score =
      (distance(p, target) - distance(end, target)) * 0.6 -
      Math.max(0, 65 - wall) * 5;
    for (const e of threats) {
      const d = distance(e, p) || 1;
      let vx = ((p.x - e.x) / d) * e.speed,
        vy = ((p.y - e.y) / d) * e.speed;
      if (e.type === "boss" && (e.windup > 0 || e.chargeRemaining > 0)) {
        vx = e.chargeX * 330;
        vy = e.chargeY * 330;
      }
      const future = { x: e.x + vx * horizon, y: e.y + vy * horizon };
      const clearance = distance(end, future) - e.radius - p.radius;
      score -= Math.max(0, 100 - clearance) ** 2 * 0.05;
      if (
        sweepCircle(
          { x: e.x - p.x, y: e.y - p.y },
          { x: future.x - end.x, y: future.y - end.y },
          { x: 0, y: 0 },
          e.radius + p.radius + 14,
        ) !== null
      )
        score -= 2000;
    }
    if (!best || score > best.score) best = { ...direction, score };
  }
  return {
    input: { x: best.x, y: best.y },
    dash: nearest < 65 && p.dashRemaining <= 0,
  };
};

const results = [];
for (const view of viewports)
  for (const mode of ["night", "practice"])
    for (const keeper of Object.keys(KEEPERS))
      for (const seed of seeds) {
        const g = new Game({ mode, keeper, seed });
        g.setViewport(view.width, view.height);
        g.seedDew();
        let input = { x: 0, y: 0 },
          peakEnemies = 0,
          steps = 0;
        while (
          !["won", "lost"].includes(g.status) &&
          steps < MODES[mode].duration * 60 + 60
        ) {
          if (g.status === "choosing") g.choose(choose(g));
          if (steps % 6 === 0) {
            const action = inputFor(g);
            input = action.input;
            if (action.dash) g.dash(input);
          }
          g.update(1 / 60, input);
          g.events.length = 0;
          peakEnemies = Math.max(peakEnemies, g.enemies.length);
          steps++;
        }
        if (
          !Number.isFinite(g.player.hp) ||
          peakEnemies > 145 ||
          g.motes.length > 240 ||
          Object.entries(g.build).some(
            ([id, n]) => n > UPGRADES.find((u) => u.id === id).max,
          )
        )
          throw new Error(
            `Invalid model state: ${view.name}/${mode}/${keeper}/${seed}`,
          );
        results.push({
          viewport: view.name,
          mode,
          keeper,
          seed,
          status: g.status,
          elapsed: Number(g.elapsed.toFixed(2)),
          hp: Number(g.player.hp.toFixed(2)),
          level: g.level,
          score: scoreFor(g),
          kills: g.kills,
          bossDefeated: g.bossDefeated,
          peakEnemies,
          build: g.build,
          metrics: g.metrics,
        });
      }
const summary = [];
for (const view of viewports)
  for (const mode of ["night", "practice"])
    for (const keeper of Object.keys(KEEPERS)) {
      const rows = results.filter(
        (r) =>
          r.viewport === view.name && r.mode === mode && r.keeper === keeper,
      );
      summary.push({
        viewport: view.name,
        mode,
        keeper,
        completed: rows.filter((r) => r.status === "won").length,
        runs: rows.length,
        meanTime: Number(
          (rows.reduce((n, r) => n + r.elapsed, 0) / rows.length).toFixed(1),
        ),
        meanLevel: Number(
          (rows.reduce((n, r) => n + r.level, 0) / rows.length).toFixed(1),
        ),
        bossesDefeated: rows.filter((r) => r.bossDefeated).length,
      });
    }
const output =
  process.argv[2] || `.impeccable/review/simulation-v${version}.json`;
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  JSON.stringify(
    {
      version,
      checkedAt: new Date().toISOString(),
      method:
        "Five fixed seeds × three keepers × two modes × two viewports, normal HP and unchanged combat values; 60Hz, bot decisions at 10Hz. Diagnostic policy only; no human win-rate claim.",
      summary,
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify({ runs: results.length, summary }, null, 2));
