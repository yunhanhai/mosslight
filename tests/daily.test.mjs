import test from "node:test";
import assert from "node:assert/strict";
import { Game, dailyChallenge, chinaDay, KEEPERS } from "../src/core.js";
import { blankRecord, completeRun, loadRecord } from "../src/storage.js";
import { captureCheckpoint, restoreCheckpoint } from "../src/checkpoint.js";
import { parseRunLink, runLink, runShareText } from "../src/share.js";
const finish = (day) => {
  const g = new Game({ mode: "daily", challengeDate: day });
  g.elapsed = 180;
  g.status = "won";
  g.kills = 5;
  return g;
};
test("challenge date is fixed to Beijing midnight irrespective of local timezone", () => {
  assert.equal(chinaDay(Date.parse("2026-11-23T15:59:59Z")), "2026-11-23");
  assert.equal(chinaDay(Date.parse("2026-11-23T16:00:00Z")), "2026-11-24");
});
test("daily seed and keeper are deterministic and reject impossible dates", () => {
  assert.deepEqual(dailyChallenge("2026-11-24"), dailyChallenge("2026-11-24"));
  assert.deepEqual(dailyChallenge("2026-11-24"), {
    day: "2026-11-24",
    seed: 430556449,
    keeper: "lantern",
  });
  assert.notEqual(
    dailyChallenge("2026-11-24").seed,
    dailyChallenge("2026-11-25").seed,
  );
  assert.ok(Object.hasOwn(KEEPERS, dailyChallenge("2026-11-24").keeper));
  for (const day of ["bad", "2026-02-30", "2026-13-01", "constructor", null, 1])
    assert.equal(dailyChallenge(day), null);
  assert.ok(dailyChallenge("2028-02-29"));
});
test("daily construction fixes its keeper and seed while standard mode remains configurable", () => {
  const challenge = dailyChallenge("2026-11-24"),
    g = new Game({
      mode: "daily",
      challengeDate: challenge.day,
      seed: 3,
      keeper: "wind",
    });
  assert.equal(g.seed, challenge.seed);
  assert.equal(g.keeper, challenge.keeper);
  assert.equal(g.rules.duration, 180);
  const standard = new Game({ mode: "night", seed: 3, keeper: "wind" });
  assert.equal(standard.seed, 3);
  assert.equal(standard.keeper, "wind");
  assert.equal(standard.challengeDate, null);
});
test("daily combat uses the same rules and random progression as the matching standard run", () => {
  const daily = new Game({ mode: "daily", challengeDate: "2026-11-24" });
  const standard = new Game({
    mode: "night",
    seed: daily.seed,
    keeper: daily.keeper,
  });
  for (const g of [daily, standard]) g.seedDew();
  for (let i = 0; i < 2400; i++) {
    for (const g of [daily, standard]) {
      if (g.status === "choosing") g.choose(g.choices[0]);
      g.update(1 / 60, { x: Math.cos(i / 150), y: Math.sin(i / 150) });
    }
    assert.equal(daily.status, standard.status);
    if (["won", "lost"].includes(daily.status)) break;
  }
  for (const key of [
    "player",
    "enemies",
    "motes",
    "build",
    "metrics",
    "elapsed",
    "kills",
  ])
    assert.deepEqual(daily[key], standard[key]);
  assert.equal(daily.random(), standard.random());
});
test("daily runs update only their bounded local day records and retain ordinary history", () => {
  const record = {
    ...blankRecord(),
    score: 9999,
    wins: 3,
    bestTime: 180,
    runs: 7,
  };
  const g = finish("2026-11-24"),
    first = completeRun(record, g);
  assert.equal(first.record.score, record.score);
  assert.equal(first.record.runs, 7);
  assert.equal(first.record.wins, 3);
  assert.equal(first.record.dailies[0].wins, 1);
  assert.equal(first.best.daily, true);
  assert.equal(first.record.history[0].challengeDate, g.challengeDate);
  const second = completeRun(first.record, g);
  assert.equal(second.best.daily, false);
  assert.equal(second.record.dailies[0].runs, 2);
  let r = second.record;
  for (let i = 1; i <= 20; i++)
    r = completeRun(r, finish(`2026-11-${String(i).padStart(2, "0")}`)).record;
  assert.equal(r.dailies.length, 14);
  assert.equal(r.dailies[0].day, "2026-11-24");
  assert.deepEqual(loadRecord({ getItem: () => JSON.stringify(r) }).record, r);
});
test("old records migrate daily results additively and malformed challenges are discarded", () => {
  const run = completeRun(blankRecord(), finish("2026-11-24")).record
    .history[0];
  const result = loadRecord({
    getItem: () =>
      JSON.stringify({
        score: 500,
        history: [run, { ...run, keeper: "invalid" }],
        dailies: [
          { day: "2026-11-24", score: -1, wins: "bad" },
          { day: "2026-11-24", score: 999 },
          { day: "bad" },
        ],
      }),
  }).record;
  assert.equal(result.score, 500);
  assert.equal(result.history.length, 1);
  assert.equal(result.dailies.length, 1);
  assert.equal(result.dailies[0].score, 0);
  assert.deepEqual(
    loadRecord({ getItem: () => '{"score":120}' }).record.dailies,
    [],
  );
});
test("daily checkpoints retain an earlier date and cannot silently become today's challenge", () => {
  const g = new Game({ mode: "daily", challengeDate: "2026-11-20" });
  g.seedDew();
  g.update(0.05);
  const snapshot = captureCheckpoint(g),
    restored = restoreCheckpoint(snapshot);
  assert.equal(restored.challengeDate, "2026-11-20");
  assert.equal(restored.seed, g.seed);
  assert.equal(restored.status, "paused");
  snapshot.state.seed = (g.seed + 1) >>> 0;
  assert.equal(restoreCheckpoint(snapshot), null);
});
test("v1.5 standard snapshots remain compatible when challengeDate is absent", () => {
  const snapshot = captureCheckpoint(new Game({ seed: 42 }));
  delete snapshot.state.challengeDate;
  const restored = restoreCheckpoint(snapshot);
  assert.ok(restored);
  assert.equal(restored.mode, "night");
  assert.equal(restored.challengeDate, null);
});
test("share links round-trip known challenge parameters and reject untrusted values", () => {
  const g = new Game({ mode: "practice", seed: 0xffffffff, keeper: "leaf" });
  assert.deepEqual(parseRunLink(new URL(runLink(g)).search), {
    mode: "practice",
    seed: 0xffffffff,
    keeper: "leaf",
  });
  const daily = finish("2026-11-24");
  assert.deepEqual(parseRunLink(new URL(runLink(daily)).search, "2026-11-24"), {
    mode: "daily",
    challengeDate: "2026-11-24",
  });
  for (const query of [
    "?seed=-1&mode=night&keeper=leaf",
    "?seed=4294967296&mode=night&keeper=leaf",
    "?seed=1&mode=constructor&keeper=leaf",
    "?daily=2026-02-30",
    "?daily=2026-11-25",
    "?seed=1&mode=night&keeper=%3Cscript%3E",
  ])
    assert.equal(parseRunLink(query, "2026-11-24"), null);
  assert.equal(parseRunLink("?v=1.6.0"), null);
});
test("summary uses actual run data and contains only the public challenge parameters", () => {
  const g = finish("2026-11-24");
  g.build.power = 2;
  g.metrics.dashes = 3;
  const text = runShareText(g, "1.6.0");
  assert.match(text, /2026-11-24 每日守望/);
  assert.match(text, /冲刺 3 次/);
  assert.match(text, /炽热萤火 2/);
  assert.match(text, /daily=2026-11-24/);
  assert.doesNotMatch(text, /token|localStorage|sessionStorage/);
});
