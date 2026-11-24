import {
  UPGRADES,
  MODES,
  KEEPERS,
  scoreFor,
  clamp,
  dailyChallenge,
} from "./core.js";

const KEY = "mosslight:v1";
export const HISTORY_LIMIT = 8;
export const blankRecord = () => ({
  score: 0,
  wins: 0,
  bestTime: 0,
  runs: 0,
  sound: false,
  volume: 0.65,
  effects: "auto",
  controls: "auto",
  keeper: "lantern",
  history: [],
  dailies: [],
});
const number = (n, fallback = 0, max = Number.MAX_SAFE_INTEGER) =>
  Number.isFinite(n) ? clamp(n, 0, max) : fallback;
function cleanRun(run) {
  if (
    !run ||
    !Object.hasOwn(MODES, run.mode) ||
    !["won", "lost", "abandoned"].includes(run.outcome) ||
    !Number.isFinite(run.seed) ||
    !Number.isFinite(run.endedAt)
  )
    return null;
  const daily = run.mode === "daily" ? dailyChallenge(run.challengeDate) : null;
  if (
    run.mode === "daily" &&
    (!daily || daily.seed !== run.seed || daily.keeper !== run.keeper)
  )
    return null;
  const build = {};
  for (const u of UPGRADES) {
    const level = Math.floor(number(run.build?.[u.id], 0, u.max));
    if (level) build[u.id] = level;
  }
  return {
    mode: run.mode,
    challengeDate: daily?.day || null,
    keeper: Object.hasOwn(KEEPERS, run.keeper) ? run.keeper : "lantern",
    outcome: run.outcome,
    seed: run.seed >>> 0,
    endedAt: Math.floor(number(run.endedAt, 0, 8640000000000000)),
    score: Math.floor(number(run.score)),
    elapsed: number(run.elapsed, 0, MODES[run.mode].duration),
    kills: Math.floor(number(run.kills)),
    level: Math.max(1, Math.floor(number(run.level, 1, 1000))),
    bossDefeated: run.bossDefeated === true,
    build,
    metrics:
      run.metrics && typeof run.metrics === "object"
        ? {
            damageDealt: number(run.metrics.damageDealt),
            damageTaken: number(run.metrics.damageTaken),
            dashes: Math.floor(number(run.metrics.dashes)),
            healed: number(run.metrics.healed),
          }
        : null,
  };
}
function cleanDaily(value) {
  const challenge = value && dailyChallenge(value.day);
  if (!challenge) return null;
  return {
    day: challenge.day,
    keeper: challenge.keeper,
    score: Math.floor(number(value.score)),
    bestTime: number(value.bestTime, 0, 180),
    runs: Math.floor(number(value.runs)),
    wins: Math.min(
      Math.floor(number(value.wins)),
      Math.floor(number(value.runs)),
    ),
  };
}
export function loadRecord(storage) {
  try {
    storage ??= globalThis.localStorage;
    const v = JSON.parse(storage.getItem(KEY) || "null");
    const record = blankRecord();
    if (!v || typeof v !== "object") return { record, available: true };
    for (const k of ["score", "wins", "bestTime", "runs"])
      record[k] = Math.floor(number(v[k]));
    record.sound = v.sound === true;
    record.bestTime = Math.min(180, record.bestTime);
    record.volume = number(v.volume, 0.65, 1);
    if (Object.hasOwn(KEEPERS, v.keeper)) record.keeper = v.keeper;
    if (["auto", "reduced"].includes(v.effects)) record.effects = v.effects;
    if (["auto", "keyboard", "touch"].includes(v.controls))
      record.controls = v.controls;
    if (Array.isArray(v.history))
      record.history = v.history
        .slice(0, HISTORY_LIMIT)
        .map(cleanRun)
        .filter(Boolean);
    if (Array.isArray(v.dailies)) {
      const seen = new Set();
      record.dailies = v.dailies
        .slice(0, 14)
        .map(cleanDaily)
        .filter((item) => {
          if (!item || seen.has(item.day)) return false;
          seen.add(item.day);
          return true;
        });
    }
    return { record, available: true };
  } catch {
    return { record: blankRecord(), available: false };
  }
}
export function completeRun(record, game, endedAt = Date.now()) {
  const score = scoreFor(game),
    formal = game.mode === "night";
  const best = {
    score: formal && score > record.score,
    time: formal && Math.floor(game.elapsed) > record.bestTime,
  };
  const previousDaily =
    game.mode === "daily"
      ? record.dailies.find((d) => d.day === game.challengeDate)
      : null;
  const run = cleanRun({
    mode: game.mode,
    challengeDate: game.challengeDate,
    keeper: game.keeper,
    seed: game.seed,
    endedAt,
    outcome: game.endReason === "abandoned" ? "abandoned" : game.status,
    score,
    elapsed: game.elapsed,
    kills: game.kills,
    level: game.level,
    bossDefeated: game.bossDefeated,
    build: game.build,
    metrics: game.metrics,
  });
  if (!run) throw new Error("Only completed runs can be recorded");
  let dailies = record.dailies;
  if (game.mode === "daily") {
    const daily = {
      day: game.challengeDate,
      keeper: game.keeper,
      score: Math.max(previousDaily?.score || 0, score),
      bestTime: Math.max(previousDaily?.bestTime || 0, game.elapsed),
      runs: (previousDaily?.runs || 0) + 1,
      wins: (previousDaily?.wins || 0) + (game.status === "won" ? 1 : 0),
    };
    dailies = [
      daily,
      ...record.dailies.filter((d) => d.day !== game.challengeDate),
    ]
      .sort((a, b) => b.day.localeCompare(a.day))
      .slice(0, 14);
    best.daily = score > (previousDaily?.score || 0);
  }
  return {
    record: {
      ...record,
      runs: record.runs + (formal ? 1 : 0),
      wins: record.wins + (formal && game.status === "won" ? 1 : 0),
      score: formal ? Math.max(record.score, score) : record.score,
      bestTime: formal
        ? Math.max(record.bestTime, Math.floor(game.elapsed))
        : record.bestTime,
      history: [run, ...record.history].slice(0, HISTORY_LIMIT),
      dailies,
    },
    best,
  };
}
export function saveRecord(record, storage) {
  try {
    storage ??= globalThis.localStorage;
    storage.setItem(KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}
