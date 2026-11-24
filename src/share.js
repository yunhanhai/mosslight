import {
  KEEPERS,
  MODES,
  UPGRADES,
  chinaDay,
  dailyChallenge,
  scoreFor,
  timeText,
} from "./core.js";

export function parseRunLink(search, today = chinaDay()) {
  const params = new URLSearchParams(search);
  if (params.has("daily")) {
    const challenge = dailyChallenge(params.get("daily"));
    return challenge && challenge.day <= today
      ? { mode: "daily", challengeDate: challenge.day }
      : null;
  }
  if (!params.has("seed")) return null;
  const seedText = params.get("seed"),
    mode = params.get("mode"),
    keeper = params.get("keeper");
  if (
    !/^\d{1,10}$/.test(seedText || "") ||
    Number(seedText) > 0xffffffff ||
    !["night", "practice"].includes(mode) ||
    !Object.hasOwn(KEEPERS, keeper)
  )
    return null;
  return { mode, keeper, seed: Number(seedText) };
}
export function runLink(game) {
  const url = new URL("https://yunhanhai.github.io/mosslight/");
  if (game.mode === "daily") url.searchParams.set("daily", game.challengeDate);
  else {
    url.searchParams.set("mode", game.mode);
    url.searchParams.set("keeper", game.keeper);
    url.searchParams.set("seed", String(game.seed));
  }
  return url.href;
}
export function runShareText(game, version) {
  const outcome =
    game.status === "won"
      ? "迎来黎明"
      : game.endReason === "abandoned"
        ? "主动结束"
        : "微光暂歇";
  const build =
    UPGRADES.filter((u) => game.build[u.id])
      .map((u) => `${u.name} ${game.build[u.id]}`)
      .join(" / ") || "初始能力";
  return [
    `苔光守夜 v${version} · ${game.mode === "daily" ? `${game.challengeDate} 每日守望` : MODES[game.mode].label}`,
    `${KEEPERS[game.keeper].name} · ${outcome} · ${scoreFor(game)} 微光 · ${timeText(game.elapsed)} · Lv. ${game.level}`,
    `驱散 ${game.kills} · 冲刺 ${game.metrics.dashes} 次 · ${build}`,
    `种子 ${game.seed} · ${game.bossDefeated ? "已驱散巨蛾" : "未驱散巨蛾"}`,
    "同种子复用随机起点；操作、视口和版本会影响进程。",
    runLink(game),
  ].join("\n");
}
