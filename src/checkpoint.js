import {
  Game,
  KEEPERS,
  MODES,
  UPGRADES,
  WORLD,
  MAX_ENEMIES,
  rng,
  dailyChallenge,
} from "./core.js";

const KEY = "mosslight:session:v1";
const FORMAT = 1;
const LIMIT = 200000;
const active = new Set(["playing", "paused", "choosing"]);
const scalars = [
  "mode",
  "challengeDate",
  "keeper",
  "seed",
  "status",
  "elapsed",
  "level",
  "xp",
  "kills",
  "collected",
  "nextId",
  "shotTimer",
  "spawnTimer",
  "orbitTimer",
  "bossSpawned",
  "bossDefeated",
  "wave",
  "attackRange",
  "dashSerial",
  "dewSeeded",
  "rerolls",
];
const objects = [
  "player",
  "build",
  "choices",
  "metrics",
  "lastHit",
  "viewport",
  "enemies",
  "bullets",
  "motes",
];
function finite(value, min, max, integer = false) {
  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    throw Error("Invalid saved number");
  return value;
}
const count = (n, max = 1e7) => finite(n, 0, max, true);
const bool = (n) => {
  if (typeof n !== "boolean") throw Error("Invalid saved flag");
  return n;
};
const record = (v) => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("Invalid saved object");
  return v;
};
const position = (v) => ({
  x: finite(v.x, 0, WORLD.width),
  y: finite(v.y, 0, WORLD.height),
});
const array = (v, max) => {
  if (!Array.isArray(v) || v.length > max)
    throw Error("Invalid saved collection");
  return v;
};
export function captureCheckpoint(game, savedAt = Date.now()) {
  if (!active.has(game.status))
    throw Error("Only unfinished games can be saved");
  const state = {};
  for (const key of [...scalars, ...objects]) state[key] = game[key];
  state.randomState = game.random.getState();
  // No events, stats, DOM, closures or references survive serialization.
  return JSON.parse(JSON.stringify({ format: FORMAT, savedAt, state }));
}
export function restoreCheckpoint(snapshot) {
  try {
    record(snapshot);
    if (snapshot.format !== FORMAT) return null;
    finite(snapshot.savedAt, 0, 8640000000000000);
    const s = record(snapshot.state);
    if (
      !active.has(s.status) ||
      !Object.hasOwn(MODES, s.mode) ||
      !Object.hasOwn(KEEPERS, s.keeper)
    )
      return null;
    const g = new Game({
      mode: s.mode,
      keeper: s.keeper,
      seed: count(s.seed, 0xffffffff),
      challengeDate: s.challengeDate,
    });
    if (s.mode === "daily") {
      const daily = dailyChallenge(s.challengeDate);
      if (!daily || s.seed !== daily.seed || s.keeper !== daily.keeper)
        return null;
    }
    g.elapsed = finite(s.elapsed, 0, g.rules.duration - 1e-8);
    g.level = finite(s.level, 1, 512, true);
    g.xp = count(s.xp);
    g.kills = count(s.kills);
    g.collected = count(s.collected);
    g.nextId = finite(s.nextId, 1, 1e7, true);
    for (const key of ["shotTimer", "spawnTimer", "orbitTimer"])
      g[key] = finite(s[key], -g.rules.duration, 1e6);
    for (const key of ["bossSpawned", "bossDefeated", "dewSeeded"])
      g[key] = bool(s[key]);
    g.wave = count(s.wave, 6);
    g.rerolls = count(s.rerolls, 1);
    g.dashSerial = count(s.dashSerial);
    record(s.build);
    if (Object.keys(s.build).some((id) => !UPGRADES.some((u) => u.id === id)))
      return null;
    // Recompute all stats from known rules. Never accept saved damage or speed.
    for (const u of UPGRADES) {
      const level = count(s.build[u.id] ?? 0, u.max);
      if (!level) continue;
      for (let i = 0; i < level; i++) u.apply(g.stats, g);
      g.build[u.id] = level;
    }
    const p = record(s.player);
    g.player = {
      ...position(p),
      hp: finite(p.hp, 0.000001, g.stats.maxHp),
      radius: 13,
      invincible: finite(p.invincible, 0, 1e6),
      dashTime: finite(p.dashTime, 0, 0.19),
      dashRemaining: finite(
        p.dashRemaining,
        0,
        KEEPERS[g.keeper].stats.dashCooldown || 3.8,
      ),
      lastX: finite(p.lastX, -1, 1),
      lastY: finite(p.lastY, -1, 1),
      dashX: finite(p.dashX, -1, 1),
      dashY: finite(p.dashY, -1, 1),
    };
    const m = record(s.metrics);
    g.metrics = {
      damageDealt: finite(m.damageDealt, 0, 1e10),
      damageTaken: finite(m.damageTaken, 0, 1e7),
      healed: finite(m.healed, 0, 1e7),
      dashes: count(m.dashes),
    };
    g.lastHit =
      s.lastHit === null
        ? null
        : {
            type: Object.hasOwn(
              { mite: 1, beetle: 1, wisp: 1, boss: 1 },
              s.lastHit.type,
            )
              ? s.lastHit.type
              : "mite",
            damage: finite(s.lastHit.damage, 0, 1e6),
          };
    g.choices = [...array(s.choices, 3)];
    if (
      new Set(g.choices).size !== g.choices.length ||
      g.choices.some(
        (id) =>
          !UPGRADES.some((u) => u.id === id && (g.build[id] || 0) < u.max),
      )
    )
      return null;
    const hasChoices = g.choices.length > 0;
    if ((s.status === "choosing") !== hasChoices) return null;
    const v = record(s.viewport);
    g.setViewport(finite(v.width, 320, 1800), finite(v.height, 260, 1200));
    g.attackRange = finite(s.attackRange, 240, 520);
    const enemyTypes = {
      mite: { radius: 12, damage: 10, xp: 2 },
      beetle: { radius: 19, damage: 16, xp: 4 },
      wisp: { radius: 9, damage: 9, xp: 3 },
      boss: { radius: 43, damage: 25, xp: 40 },
    };
    g.enemies = array(s.enemies, MAX_ENEMIES).map((e) => {
      record(e);
      if (!Object.hasOwn(enemyTypes, e.type)) throw Error("Invalid enemy");
      const maxHp = finite(e.maxHp, 1, 1000);
      const next = {
        ...position(e),
        ...enemyTypes[e.type],
        type: e.type,
        id: finite(e.id, 1, g.nextId - 1, true),
        hp: finite(e.hp, -1e6, maxHp),
        maxHp,
        speed: finite(e.speed, 0, 200),
        hit: finite(e.hit, 0, 0.12),
        phase: finite(e.phase, 0, 6.28),
        chargeCooldown: finite(e.chargeCooldown, -1, 10),
        windup: finite(e.windup, 0, 0.85),
        chargeRemaining: finite(e.chargeRemaining, 0, 0.6),
        charges: count(e.charges),
      };
      if (e.chargeX !== undefined) next.chargeX = finite(e.chargeX, -1, 1);
      if (e.chargeY !== undefined) next.chargeY = finite(e.chargeY, -1, 1);
      if (
        (next.windup > 0 || next.chargeRemaining > 0) &&
        (next.chargeX === undefined || next.chargeY === undefined)
      )
        throw Error("Missing charge route");
      if (e.lastDash !== undefined)
        next.lastDash = count(e.lastDash, g.dashSerial);
      return next;
    });
    if (
      new Set(g.enemies.map((e) => e.id)).size !== g.enemies.length ||
      g.enemies.filter((e) => e.type === "boss").length > 1
    )
      return null;
    g.bullets = array(s.bullets, 256).map((b) => ({
      x: finite(b.x, -800, WORLD.width + 800),
      y: finite(b.y, -800, WORLD.height + 800),
      vx: finite(b.vx, -460, 460),
      vy: finite(b.vy, -460, 460),
      life: finite(b.life, 0, 1.5),
      damage: finite(b.damage, 0, g.stats.damage),
      radius: 5,
    }));
    g.motes = array(s.motes, 240).map((m) => ({
      ...position(m),
      value: finite(m.value, 1, 1e7, true),
      radius: finite(m.radius, 1, 10),
      life: finite(m.life, 0, g.rules.duration),
      ...(m.source === "dew" ? { source: "dew" } : {}),
    }));
    g.random = rng(count(s.randomState, 0xffffffff));
    g.events = [];
    g.status = s.status === "choosing" ? "choosing" : "paused";
    return g;
  } catch {
    return null;
  }
}
export function saveCheckpoint(game, storage, savedAt = Date.now()) {
  try {
    storage ??= globalThis.sessionStorage;
    const snapshot = captureCheckpoint(game, savedAt),
      json = JSON.stringify(snapshot);
    if (json.length > LIMIT) return { available: false, snapshot: null };
    storage.setItem(KEY, json);
    return { available: true, snapshot };
  } catch {
    return { available: false, snapshot: null };
  }
}
export function clearCheckpoint(storage) {
  try {
    storage ??= globalThis.sessionStorage;
    storage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
export function loadCheckpoint(storage) {
  try {
    storage ??= globalThis.sessionStorage;
    const raw = storage.getItem(KEY);
    if (!raw) return { available: true, snapshot: null, invalid: false };
    let snapshot = null;
    if (raw.length <= LIMIT) {
      try {
        snapshot = JSON.parse(raw);
      } catch {}
    }
    if (!restoreCheckpoint(snapshot)) {
      return {
        available: clearCheckpoint(storage),
        snapshot: null,
        invalid: true,
      };
    }
    return { available: true, snapshot, invalid: false };
  } catch {
    return { available: false, snapshot: null, invalid: false };
  }
}
