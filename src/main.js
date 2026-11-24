import {
  Game,
  KEEPERS,
  UPGRADES,
  clamp,
  timeText,
  scoreFor,
  xpFor,
  upgradePreview,
  upgradeHint,
  MODES,
  dailyChallenge,
} from "./core.js";
import { Renderer } from "./renderer.js";
import { loadRecord, saveRecord, blankRecord, completeRun } from "./storage.js";
import {
  buildOverview,
  buildText,
  guidePanel,
  settingsPanel,
  journalPanel,
  keeperPanel,
  runDetails,
  dailyPanel,
  sharePanel,
} from "./panels.js";
import { Audio } from "./audio.js";
import { edgeIndicator, cameraTarget } from "./view.js";
import {
  loadCheckpoint,
  saveCheckpoint,
  restoreCheckpoint,
  clearCheckpoint,
} from "./checkpoint.js";
import { parseRunLink, runShareText } from "./share.js";
const VERSION = "1.6.0";

// Keep touch controls stable on hybrid devices, including after a mouse click.
document.documentElement.classList.toggle(
  "touch-device",
  navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches,
);

const elements = new Map();
const $ = (id) => {
  if (!elements.has(id)) elements.set(id, document.getElementById(id));
  return elements.get(id);
};
const text = (id, value) => {
  const node = $(id),
    next = String(value);
  if (node.textContent !== next) node.textContent = next;
};
const fill = (id, percentage) => {
  const next = `${Number(clamp(percentage, 0, 100).toFixed(1))}%`;
  if ($(id).style.width !== next) $(id).style.width = next;
};
const attr = (id, name, value) => {
  const node = $(id),
    next = String(value);
  if (node.getAttribute(name) !== next) node.setAttribute(name, next);
};
const canvas = $("game"),
  renderer = new Renderer(canvas),
  audio = new Audio();
let loaded;
try {
  loaded = loadRecord();
} catch {
  loaded = {
    record: blankRecord(),
    available: false,
  };
}
const record = loaded.record;
const recovered = loadCheckpoint();
let checkpoint = recovered.snapshot,
  checkpointAvailable = recovered.available,
  lastCheckpoint = performance.now();
audio.enabled = record.sound;
audio.volume = record.volume;
let storageAvailable = loaded.available,
  game = null,
  screen = "menu",
  lastFrame = performance.now(),
  previousFocus = null,
  previousScroll = 0,
  panelStack = [],
  replacement = null,
  sharedRun = parseRunLink(location.search),
  dailyShown = dailyChallenge(),
  copyBusy = false,
  resultBest = { score: false, time: false },
  toastUntil = 0,
  lastSaved = null,
  pointerId = null,
  gamepad = { x: 0, y: 0 };
let accumulator = 0,
  lastHUD = 0,
  lastRender = 0,
  lastRenderedScreen = "",
  visualTime = 0,
  renderDirty = true;
let stickCenter = null;
const keys = new Set();
const preview = new Game({ seed: 84 });
preview.player.x = 1130;
preview.player.y = 785;
preview.enemies = [
  {
    id: 1,
    type: "mite",
    x: 1285,
    y: 820,
    radius: 12,
    hp: 20,
    maxHp: 20,
    phase: 0,
    hit: 0,
  },
  {
    id: 2,
    type: "beetle",
    x: 1325,
    y: 725,
    radius: 19,
    hp: 50,
    maxHp: 50,
    phase: 1,
    hit: 0,
  },
  {
    id: 3,
    type: "wisp",
    x: 1025,
    y: 664,
    radius: 9,
    hp: 15,
    maxHp: 15,
    phase: 2,
    hit: 0,
  },
];
preview.motes = [
  { x: 1185, y: 744, radius: 4 },
  { x: 1240, y: 868, radius: 4 },
  { x: 1082, y: 844, radius: 4 },
  { x: 1364, y: 794, radius: 4 },
];
export const getSession = () => ({
  game,
  screen,
  record,
  view: renderer.getView(),
  effects: { reduced: renderer.reduced, active: renderer.effects.length },
});
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const phases = [
  "露水初降",
  "苔叶轻响",
  "虫影渐近",
  "夜色正浓",
  "微光不灭",
  "黎明将至",
];

function records() {
  $("record-score").textContent = record.score.toLocaleString("zh-CN");
  $("record-wins").textContent = record.wins;
  $("record-time").textContent = timeText(record.bestTime);
  $("storage-warning").hidden = storageAvailable;
  $("local-note").hidden = !storageAvailable;
}
function keeperUI() {
  const k = KEEPERS[record.keeper];
  text("keeper-name", k.name);
  text("keeper-summary", k.summary);
  attr("keeper-icon", "href", `#i-${k.icon}`);
  preview.keeper = record.keeper;
  preview.stats.orbit = k.stats.orbit || 0;
  renderDirty = true;
}
function dailyUI() {
  const daily = dailyChallenge(),
    result = record.dailies.find((d) => d.day === daily.day);
  text(
    "daily-note",
    `${daily.day} · ${KEEPERS[daily.keeper].name}${result ? ` · 最高 ${result.score.toLocaleString("zh-CN")}` : " · 同种子守望"}`,
  );
  $("shared-wrap").hidden = !sharedRun;
  document.body.classList.toggle("has-shared-run", !!sharedRun);
  if (sharedRun) {
    const c =
      sharedRun.mode === "daily"
        ? dailyChallenge(sharedRun.challengeDate)
        : sharedRun;
    text(
      "shared-description",
      sharedRun.mode === "daily"
        ? `${c.day} 每日守望 · ${KEEPERS[c.keeper].name}`
        : `${MODES[c.mode].label} · ${KEEPERS[c.keeper].name} · 种子 ${c.seed}`,
    );
  }
  if (screen === "daily" && dailyShown.day !== daily.day) {
    dailyShown = daily;
    renderPanel("daily");
  }
}
function scheduleDailyRefresh() {
  const dayMs = 86400000;
  setTimeout(
    () => {
      dailyUI();
      scheduleDailyRefresh();
    },
    dayMs - ((Date.now() + 8 * 3600000) % dayMs) + 30,
  );
}
function checkpointUI() {
  $("continue-wrap").hidden = !checkpoint;
  document.body.classList.toggle("has-checkpoint", !!checkpoint);
  if (!checkpoint) return;
  const s = checkpoint.state;
  text(
    "continue-description",
    `${KEEPERS[s.keeper].name} · ${s.mode === "daily" ? `${s.challengeDate} 每日守望` : MODES[s.mode].label} ${timeText(s.elapsed)} · Lv. ${s.level}${s.status === "choosing" ? " · 等待选择能力" : ""}`,
  );
}
function checkpointNote() {
  const node = $("dialog").querySelector("[data-checkpoint-note]");
  if (!node) return;
  node.textContent = checkpointAvailable
    ? "进度已在此标签页暂存；刷新可继续，关闭后不保证保留。"
    : "浏览器未允许暂存本局；请保持此页面打开，刷新会丢失进度。";
}
function persistCheckpoint() {
  if (!game || !["playing", "paused", "choosing"].includes(game.status))
    return false;
  const result = saveCheckpoint(game);
  checkpointAvailable = result.available;
  if (result.snapshot) {
    checkpoint = result.snapshot;
  }
  lastCheckpoint = performance.now();
  checkpointNote();
  return result.available;
}
function removeCheckpoint() {
  checkpoint = null;
  checkpointAvailable = clearCheckpoint();
  checkpointUI();
}
function save() {
  storageAvailable = saveRecord(record);
  records();
  dailyUI();
  const note = $("dialog").querySelector("[data-save-status]");
  if (note)
    note.textContent = storageAvailable
      ? "设置已保存在这台设备上"
      : "设置本次有效；浏览器未允许保存，刷新后会恢复默认";
}
function applyPreferences() {
  const touch =
    record.controls === "touch" ||
    (record.controls === "auto" &&
      (navigator.maxTouchPoints > 0 ||
        matchMedia("(pointer: coarse)").matches));
  document.documentElement.classList.toggle("touch-device", touch);
  document.documentElement.classList.toggle(
    "reduced-effects",
    record.effects === "reduced",
  );
  audio.volume = record.volume;
  renderer.setEffects(record.effects);
  resetInput();
  syncViewport();
}
function soundUI() {
  $("sound-icon").setAttribute("href", audio.enabled ? "#i-sound" : "#i-muted");
  $("sound-button").setAttribute(
    "aria-label",
    audio.enabled ? "关闭音效" : "开启音效",
  );
  $("sound-button").setAttribute("aria-pressed", String(audio.enabled));
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  toastUntil = performance.now() + 3000;
}
function resetInput() {
  keys.clear();
  if (pointerId !== null && $("joystick").hasPointerCapture(pointerId))
    $("joystick").releasePointerCapture(pointerId);
  pointerId = null;
  stickCenter = null;
  accumulator = 0;
  gamepad = { x: 0, y: 0 };
  $("joystick-knob").style.transform = "translate(0px,0px)";
  $("joystick").style.transform = "";
  $("joystick").classList.remove("dragging");
}
function hideDialog() {
  const restore = previousFocus;
  $("overlay").hidden = true;
  previousFocus = null;
  if (screen === "menu")
    window.scrollTo({ top: previousScroll, behavior: "instant" });
  if (restore?.isConnected) restore.focus({ preventScroll: true });
}
function dialog(html) {
  $("toast").classList.remove("visible");
  toastUntil = 0;
  if ($("overlay").hidden) {
    previousFocus = document.activeElement;
    previousScroll = window.scrollY;
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  $("dialog").innerHTML = html;
  $("overlay").hidden = false;
  $("dialog").scrollTop = 0;
  resetInput();
  requestAnimationFrame(() =>
    ($("dialog").querySelector("button,input,summary") || $("dialog")).focus({
      preventScroll: true,
    }),
  );
}
function showGameUI(visible) {
  document.body.classList.toggle("in-game", visible);
  for (const id of ["hud", "bottom-hud", "touch-controls"])
    $(id).hidden = !visible;
  $("menu-panel").hidden = visible;
  if (!visible) $("boss-hud").hidden = true;
}
function start(options = {}) {
  if (checkpoint && !game && !options.replace) {
    replacement = {
      options: {
        mode: options.mode,
        keeper: options.keeper,
        seed: options.seed,
        challengeDate: options.challengeDate,
      },
      from: screen,
    };
    screen = "replace";
    dialog(
      `<h2 id="dialog-title">开始新的守望？</h2><p class="intro">上一局的进度还在。开始新局会替换暂存，已完成的成绩保留。</p><div class="dialog-actions"><button class="start-button" data-action="cancel-new">保留上一局</button><button class="secondary-button" data-action="new-run">替换并开始</button></div>`,
    );
    return;
  }
  removeCheckpoint();
  replacement = null;
  audio.unlock();
  soundUI();
  game = new Game({
    mode:
      options.mode ||
      document.querySelector('input[name="mode"]:checked').value,
    seed: options.seed,
    keeper: options.keeper || record.keeper,
    challengeDate: options.challengeDate,
  });
  const modeOption = document.querySelector(
    `input[name="mode"][value="${game.mode}"]`,
  );
  if (modeOption) modeOption.checked = true;
  sharedRun = null;
  dailyUI();
  panelStack = [];
  screen = "playing";
  renderer.effects = [];
  renderer.hurtTime = 0;
  lastSaved = null;
  resetInput();
  hideDialog();
  showGameUI(true);
  syncViewport();
  game.seedDew();
  lastFrame = performance.now();
  lastHUD = 0;
  updateBuild();
  canvas.focus({ preventScroll: true });
  toast("拾起身边的金色露光，选择第一份能力");
  updateHUD(true);
  persistCheckpoint();
}
function cancelReplacement() {
  screen = replacement?.from || "menu";
  replacement = null;
  if (panels.has(screen)) renderPanel(screen);
  else hideDialog();
}
function continueRun() {
  if (!checkpoint) return;
  const restored = restoreCheckpoint(checkpoint);
  if (!restored) {
    removeCheckpoint();
    toast("上一局的进度无法读取，可以重新出发。");
    return;
  }
  audio.unlock();
  soundUI();
  game = restored;
  const modeOption = document.querySelector(
    `input[name="mode"][value="${game.mode}"]`,
  );
  if (modeOption) modeOption.checked = true;
  panelStack = [];
  lastSaved = null;
  renderer.effects = [];
  renderer.hurtTime = 0;
  showGameUI(true);
  syncViewport();
  const view = renderer.getView();
  const target = cameraTarget(game.player, view.width, view.height, view.scale);
  renderer.camera = { x: target.x, y: target.y };
  resetInput();
  lastFrame = performance.now();
  lastHUD = 0;
  renderDirty = true;
  updateBuild();
  updateHUD(true);
  if (game.status === "choosing") showUpgrade();
  else {
    screen = "paused";
    showPause();
  }
}
function saveAndMenu() {
  if (!persistCheckpoint()) {
    toast("本局暂存失败，请保持页面打开，或结束并结算。");
    return;
  }
  menu();
}
function menu() {
  panelStack = [];
  game = null;
  screen = "menu";
  $("toast").classList.remove("visible");
  toastUntil = 0;
  resetInput();
  hideDialog();
  showGameUI(false);
  dailyUI();
  checkpointUI();
  $("start-button").focus({ preventScroll: true });
}
function pause() {
  if (screen !== "playing" || !game) return;
  game.pause();
  screen = "paused";
  resetInput();
  persistCheckpoint();
  showPause();
}
function resume() {
  if (!game || game.status !== "paused") return;
  game.resume();
  screen = "playing";
  hideDialog();
  resetInput();
  lastFrame = performance.now();
  canvas.focus({ preventScroll: true });
}
function showPause() {
  dialog(
    `<h2 id="dialog-title">在苔叶间歇一会儿</h2><p class="intro">花园已经暂停，微光会等你回来。</p><button class="start-button" data-action="resume">继续守夜</button>${buildOverview(game)}<div class="panel-links"><button data-action="guide">花园图鉴</button><button data-action="settings">游戏设置</button><button data-action="journal">守夜足迹</button><button data-action="save-menu">暂存并回到花园</button><button data-action="abandon">结束本局</button></div><p class="result-build">P 或 Esc 继续 · 当前 ${timeText(game.elapsed)}</p><p class="panel-note" data-checkpoint-note></p>`,
  );
  checkpointNote();
}
function showAbandon() {
  dialog(
    `<h2 id="dialog-title">结束这次守望？</h2><p class="intro">本局将按当前成绩结算，可以随时重新出发。</p><div class="dialog-actions"><button class="start-button" data-action="resume">继续守夜</button><button class="secondary-button" data-action="finish">结束并结算</button></div>`,
  );
}
function showUpgrade() {
  screen = "choosing";
  persistCheckpoint();
  dialog(
    `<h2 id="dialog-title">微光，又长大了一点</h2><p class="intro">升至 Lv. ${game.level} · 选择一份花园的馈赠</p><div class="upgrade-grid">${game.choices
      .map((id, i) => {
        const u = UPGRADES.find((u) => u.id === id),
          level = (game.build[id] || 0) + 1;
        return `<button class="upgrade-card" data-upgrade="${id}">${icon(u.icon)}<strong>${u.name}</strong><small>Lv. ${level} / ${u.max}</small><p>${u.desc}</p><span class="upgrade-effect">${upgradePreview(id, game)}</span><span class="upgrade-hint">${upgradeHint(id, game)}</span><span class="card-shortcut">按 ${i + 1} 选择</span></button>`;
      })
      .join(
        "",
      )}</div><div class="upgrade-actions"><button class="secondary-button" data-action="reroll" ${game.canReroll() ? "" : "disabled"}>${game.rerolls === 0 ? "本局换选已用完" : game.canReroll() ? "换一组 · 剩余 1 次" : "没有其他可选能力"}</button><span>每局一次，已获得的能力保留</span></div><div class="panel-links"><button data-action="guide">查看属性与图鉴</button><button data-action="settings">游戏设置</button></div>`,
  );
}
function choose(id) {
  if (!game?.choose(id)) return;
  persistCheckpoint();
  updateBuild();
  if (game.status === "choosing") showUpgrade();
  else {
    screen = "playing";
    hideDialog();
    resetInput();
    canvas.focus({ preventScroll: true });
  }
}
function updateBuild() {
  if (!game) return;
  $("equipped").innerHTML = Object.entries(game.build)
    .map(
      ([id, n]) =>
        `<span title="${UPGRADES.find((u) => u.id === id).desc}">${UPGRADES.find((u) => u.id === id).name} ${n}</span>`,
    )
    .join("");
}
function showResult() {
  const won = game.status === "won",
    daily = game.mode === "daily",
    practice = game.mode === "practice",
    score = scoreFor(game);
  screen = "result";
  resetInput();
  if (lastSaved !== game) {
    lastSaved = game;
    removeCheckpoint();
    const completed = completeRun(record, game);
    Object.assign(record, completed.record);
    resultBest = completed.best;
    save();
  }
  const title = won
    ? practice
      ? "初次守望，完成了"
      : daily
        ? "这一日，也守到了黎明"
        : "天亮了，花园还在"
    : "把微光留给下一次";
  const description = won
    ? game.bossDefeated
      ? "你驱散了巨蛾，也迎来了清晨。"
      : "你守住了这一夜，每一点微光都没有白费。"
    : "休整一下，换一种生长的方式再出发。";
  const build = buildText(game.build, game.keeper);
  dialog(
    `<div class="result-symbol">${icon(won ? "leaf" : "spark")}</div><h2 id="dialog-title">${title}</h2><p class="intro">${description}</p>${resultBest.score || resultBest.time || resultBest.daily ? `<p class="new-best" role="status">${[resultBest.score && "最高微光新纪录", resultBest.time && "最久守望新纪录", resultBest.daily && "本机当日微光新纪录"].filter(Boolean).join(" · ")}</p>` : ""}<div class="result-stats"><div><b>${score.toLocaleString("zh-CN")}</b><span>本局微光</span></div><div><b>${timeText(game.elapsed)}</b><span>守望时间</span></div><div><b>${game.kills}</b><span>驱散虫影</span></div></div><p class="result-build">${build}</p><p class="result-build">${KEEPERS[game.keeper].name} · Lv. ${game.level} · ${game.bossDefeated ? "已驱散巨蛾" : "未驱散巨蛾"} · 种子 ${game.seed}</p>${practice ? '<p class="result-build">练习局已记入足迹，不影响正式纪录</p>' : daily ? `<p class="result-build">${game.challengeDate} 每日守望 · 单独记录，不影响正式纪录</p>` : ""}<div class="dialog-actions"><button class="start-button" data-action="restart">再守一夜</button><button class="secondary-button" data-action="retry">同种子重试</button><button class="secondary-button" data-action="menu">回到花园</button></div>${runDetails(game)}<div class="panel-links"><button data-action="share">复制对局摘要</button><button data-action="journal">查看守夜足迹</button><button data-action="guide">花园图鉴</button></div><p class="panel-note">同种子重试会保留守夜人、模式与随机起点，操作和视口会影响后续进程。</p>`,
  );
}
function help() {
  openPanel("help");
}
function renderHelp() {
  dialog(
    `<h2 id="dialog-title">做一晚花园的守夜人</h2><p class="intro">移动躲开虫影，萤火会自动照亮最近的敌人。</p><div class="help-content"><p><b>收集，再生长</b><br>拾起敌人留下的金色微光。升级后，从三种能力中选择一种，组合出这一局的成长路线。不合适时可换一组，每局一次，不消耗经验。</p><p><b>留一点风给自己</b><br><span class="help-keyboard">WASD / 方向键移动，空格冲刺。</span>触屏可拖动左下摇杆，也可在画面左半侧拖动。点右侧按钮冲刺，可短暂免伤并推开身边的虫影；冷却后可再次使用。</p><p><b>守到黎明</b><br>标准守夜 3 分钟，练习 90 秒。虫群会逐渐变密，最后会出现噬光巨蛾；巨蛾会先显示粉色路线，再向该方向俯冲；看到蓄力后横向躲开；画面外的巨蛾会用边缘箭头提示方向。存活到天亮即可获胜，击败巨蛾会掉落大量微光。</p><p class="help-warning">P / Esc 暂停或继续；数字键 1–3 选能力。切换窗口会自动暂停。声音可在右上角开启；记录仅保存在本机，练习局不计入正式记录。</p></div><button class="start-button" data-action="close-help">我知道了</button>`,
  );
}
const panels = new Set([
  "help",
  "guide",
  "settings",
  "journal",
  "keeper",
  "daily",
  "share",
]);
function renderPanel(kind) {
  if (kind === "daily") dialog(dailyPanel(dailyShown, record));
  if (kind === "share" && game && ["won", "lost"].includes(game.status))
    dialog(sharePanel(runShareText(game, VERSION)));
  if (kind === "keeper") dialog(keeperPanel(record.keeper));
  if (kind === "help") renderHelp();
  if (kind === "guide") dialog(guidePanel(game));
  if (kind === "settings") dialog(settingsPanel(record, storageAvailable));
  if (kind === "journal")
    dialog(
      journalPanel(record, !game || ["won", "lost"].includes(game.status)),
    );
}
function openPanel(kind) {
  if (screen === kind) return;
  if (screen === "playing") game.pause();
  persistCheckpoint();
  const prior = panelStack.indexOf(kind);
  if (prior >= 0) panelStack = panelStack.slice(0, prior);
  else panelStack.push(screen);
  screen = kind;
  renderPanel(kind);
}
async function copyShare() {
  if (copyBusy) return;
  const area = $("dialog").querySelector("#share-text"),
    status = $("dialog").querySelector("[data-copy-status]");
  if (!area || !status) return;
  copyBusy = true;
  try {
    if (!navigator.clipboard?.writeText) throw Error("Clipboard unavailable");
    await navigator.clipboard.writeText(area.value);
    if (status.isConnected) status.textContent = "已复制，可以自行粘贴分享。";
  } catch {
    if (area.isConnected) {
      area.focus();
      area.select();
    }
    if (status.isConnected)
      status.textContent =
        "浏览器未允许复制；已选中摘要，可长按复制或使用 Ctrl+C。";
  } finally {
    copyBusy = false;
  }
}
function closePanel() {
  const from = panelStack.pop() || "menu";
  if (panels.has(from)) {
    screen = from;
    renderPanel(from);
  } else if (from === "playing") {
    game.resume();
    screen = "playing";
    hideDialog();
    canvas.focus({ preventScroll: true });
  } else if (from === "paused") {
    screen = "paused";
    showPause();
  } else if (from === "choosing") {
    showUpgrade();
  } else if (from === "result") {
    showResult();
  } else {
    screen = "menu";
    hideDialog();
  }
}
function updateHUD(force = false, now = performance.now()) {
  if (!game) return;
  if (!force && now - lastHUD < 80) return;
  lastHUD = now;
  const p = game.player,
    s = game.stats;
  fill("hp-fill", (p.hp / s.maxHp) * 100);
  text("hp-text", Math.ceil(p.hp));
  text("level-text", `Lv. ${game.level}`);
  fill("xp-fill", (game.xp / xpFor(game.level)) * 100);
  text("xp-text", `${game.xp}/${xpFor(game.level)}`);
  text("timer", timeText(Math.ceil(game.rules.duration - game.elapsed)));
  text(
    "phase-text",
    phases[Math.min(5, Math.floor((game.elapsed / game.rules.duration) * 6))],
  );
  text("kill-text", game.kills);
  fill("dash-fill", (1 - p.dashRemaining / s.dashCooldown) * 100);
  text(
    "dash-text",
    p.dashRemaining > 0
      ? `冲刺 ${p.dashRemaining.toFixed(1)}s`
      : "空格 · 冲刺就绪",
  );
  text(
    "dash-label",
    p.dashRemaining > 0 ? `${p.dashRemaining.toFixed(1)}s` : "冲刺",
  );
  const cooling = p.dashRemaining > 0;
  if ($("dash-button").disabled !== cooling)
    $("dash-button").disabled = cooling;
  $("hud-left").classList.toggle("low-health", p.hp / s.maxHp <= 0.3);
  const boss = game.enemies.find((e) => e.type === "boss");
  if ($("boss-hud").hidden !== !boss) $("boss-hud").hidden = !boss;
  if (boss) {
    fill("boss-fill", (boss.hp / boss.maxHp) * 100);
    const v = renderer.getView();
    text(
      "boss-name",
      boss.windup > 0
        ? "噬光巨蛾 · 即将俯冲"
        : edgeIndicator(boss, v.camera, v.width, v.height, v.scale)
          ? "噬光巨蛾 · 画面外"
          : "噬光巨蛾",
    );
  }
  attr(
    "hud",
    "aria-label",
    `剩余 ${timeText(Math.ceil(game.rules.duration - game.elapsed))}，生命 ${Math.ceil(p.hp)}/${s.maxHp}，等级 ${game.level}，经验 ${game.xp}/${xpFor(game.level)}`,
  );
}

$("start-button").addEventListener("click", start);
$("continue-button").addEventListener("click", continueRun);
$("daily-button").addEventListener("click", () => {
  dailyShown = dailyChallenge();
  openPanel("daily");
});
$("shared-button").addEventListener("click", () => {
  if (sharedRun) start(sharedRun);
});
$("keeper-button").addEventListener("click", () => openPanel("keeper"));
$("help-button").addEventListener("click", help);
$("guide-button").addEventListener("click", () => openPanel("guide"));
$("settings-button").addEventListener("click", () => openPanel("settings"));
$("journal-button").addEventListener("click", () => openPanel("journal"));
$("pause-button").addEventListener("click", pause);
$("sound-button").addEventListener("click", () => {
  audio.enabled = !audio.enabled;
  audio.unlock();
  record.sound = audio.enabled;
  save();
  soundUI();
  const checkbox = $("dialog").querySelector('[data-setting="sound"]');
  if (checkbox) checkbox.checked = audio.enabled;
  if (audio.enabled) audio.play("collect");
});
$("fullscreen-button").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $("garden").requestFullscreen();
  } catch {
    toast("浏览器未允许全屏，可使用 F11");
  }
});
$("dialog").addEventListener("click", (e) => {
  const replay = e.target.closest("[data-replay]");
  if (
    replay &&
    !replay.disabled &&
    (!game || ["won", "lost"].includes(game.status))
  ) {
    const run = record.history[Number(replay.dataset.replay)];
    if (run)
      start({
        mode: run.mode,
        seed: run.seed,
        keeper: run.keeper,
        challengeDate: run.challengeDate,
      });
    return;
  }
  const upgrade = e.target.closest("[data-upgrade]");
  if (upgrade) {
    choose(upgrade.dataset.upgrade);
    return;
  }
  const action = e.target.closest("[data-action]")?.dataset.action;
  const actions = {
    "save-menu": saveAndMenu,
    "new-run": () => start({ ...replacement?.options, replace: true }),
    "cancel-new": cancelReplacement,
    "start-daily": () =>
      start({ mode: "daily", challengeDate: dailyShown.day }),
    share: () => openPanel("share"),
    "copy-share": copyShare,
    reroll: () => {
      if (game?.reroll()) showUpgrade();
    },
    resume,
    abandon: showAbandon,
    finish: () => {
      game.status = "lost";
      game.endReason = "abandoned";
      game.emit("end");
      showResult();
    },
    restart: () =>
      start({
        mode: game.mode,
        keeper: game.keeper,
        challengeDate: game.challengeDate,
      }),
    retry: () =>
      start({
        mode: game.mode,
        seed: game.seed,
        keeper: game.keeper,
        challengeDate: game.challengeDate,
      }),
    menu,
    guide: () => openPanel("guide"),
    settings: () => openPanel("settings"),
    journal: () => openPanel("journal"),
    "close-panel": closePanel,
    "close-help": closePanel,
  };
  if (actions[action]) actions[action]();
});
$("dialog").addEventListener("input", (e) => {
  const node = e.target,
    setting = node.dataset.setting;
  if (!setting) return;
  if (setting === "keeper") {
    if (!Object.hasOwn(KEEPERS, node.value)) return;
    record.keeper = node.value;
    keeperUI();
  } else if (setting === "sound") {
    audio.enabled = node.checked;
    audio.unlock();
    record.sound = audio.enabled;
    node.checked = audio.enabled;
    soundUI();
    if (audio.enabled) audio.play("collect");
  } else if (setting === "volume") {
    record.volume = clamp(Number(node.value) / 100, 0, 1);
    audio.volume = record.volume;
    $("dialog").querySelector("#volume-value").textContent =
      `${Math.round(record.volume * 100)}%`;
  } else if (["effects", "controls"].includes(setting)) {
    record[setting] = node.value;
    applyPreferences();
  }
  save();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && !$("overlay").hidden) {
    const focusable = [
      ...$("dialog").querySelectorAll(
        "button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),summary",
      ),
    ].filter((node) => node.getClientRects().length);
    if (focusable.length) {
      const first = focusable[0],
        last = focusable.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !$("dialog").contains(document.activeElement))
      ) {
        last.focus();
        e.preventDefault();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !$("dialog").contains(document.activeElement))
      ) {
        first.focus();
        e.preventDefault();
      }
    }
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (
    screen === "playing" &&
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
  )
    e.preventDefault();
  if (e.repeat) return;
  if (key === "escape" || key === "p") {
    if (screen === "playing") pause();
    else if (screen === "paused") resume();
    else if (screen === "replace") cancelReplacement();
    else if (panels.has(screen)) closePanel();
    return;
  }
  if (screen === "choosing" && ["1", "2", "3"].includes(key)) {
    choose(game.choices[Number(key) - 1]);
    return;
  }
  if (screen === "playing") {
    keys.add(key);
    if (key === " ") {
      triggerDash();
    }
  }
});
document.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  resetInput();
  if (screen === "playing") pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && screen === "playing") pause();
  if (document.hidden) persistCheckpoint();
  else dailyUI();
  accumulator = 0;
  lastFrame = performance.now();
  renderDirty = true;
});
window.addEventListener("pagehide", () => {
  if (screen === "playing") pause();
  else persistCheckpoint();
});
window.addEventListener("pageshow", () => {
  resetInput();
  lastFrame = performance.now();
  renderDirty = true;
});
window.addEventListener("focus", dailyUI);
$("dash-button").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  triggerDash();
});
$("dash-button").addEventListener("click", (e) => {
  // Pointer presses fire immediately; detail 0 is keyboard / assistive activation.
  if (e.detail === 0) triggerDash();
});
function triggerDash() {
  if (screen === "playing")
    game.dash({
      x:
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
        gamepad.x,
      y:
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
        (keys.has("w") || keys.has("arrowup") ? 1 : 0) +
        gamepad.y,
    });
}
const joystick = $("joystick");
function joystickMove(e) {
  if (e.pointerId !== pointerId || !stickCenter) return;
  const max = 32,
    dx = e.clientX - stickCenter.x,
    dy = e.clientY - stickCenter.y,
    len = Math.hypot(dx, dy),
    scale = len > max ? max / len : 1;
  const deadZone = len < 5;
  gamepad = {
    x: deadZone ? 0 : (dx * scale) / max,
    y: deadZone ? 0 : (dy * scale) / max,
  };
  $("joystick-knob").style.transform =
    `translate(${dx * scale}px,${dy * scale}px)`;
}
function beginJoystick(e, floating = false) {
  if (
    screen !== "playing" ||
    pointerId !== null ||
    !document.documentElement.classList.contains("touch-device")
  )
    return;
  e.preventDefault();
  const r = joystick.getBoundingClientRect();
  if (floating) {
    const stage = $("garden").getBoundingClientRect();
    const x = clamp(
        e.clientX,
        stage.left + 65,
        stage.left + stage.width * 0.5 - 10,
      ),
      y = clamp(e.clientY, stage.top + 150, stage.bottom - 65);
    joystick.style.transform = `translate(${x - r.left - r.width / 2}px,${y - r.top - r.height / 2}px)`;
    stickCenter = { x, y };
  } else stickCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  pointerId = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  joystick.classList.add("dragging");
  joystickMove(e);
}
joystick.addEventListener("pointerdown", (e) => beginJoystick(e));
canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  if (
    e.pointerType === "touch" &&
    e.clientX < r.left + r.width * 0.5 &&
    e.clientY > r.top + 120
  )
    beginJoystick(e, true);
});
joystick.addEventListener("pointermove", joystickMove);
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  joystick.addEventListener(name, (e) => {
    if (e.pointerId === pointerId) {
      pointerId = null;
      stickCenter = null;
      gamepad = { x: 0, y: 0 };
      $("joystick-knob").style.transform = "translate(0px,0px)";
      joystick.style.transform = "";
      joystick.classList.remove("dragging");
    }
  });
function syncViewport() {
  const oldWidth = renderer.width,
    oldHeight = renderer.height;
  renderer.resize();
  if (renderer.width !== oldWidth || renderer.height !== oldHeight)
    resetInput();
  if (game)
    game.setViewport(
      renderer.width / renderer.scale,
      renderer.height / renderer.scale,
    );
  renderDirty = true;
}
new ResizeObserver(syncViewport).observe($("garden"));
matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
  "change",
  applyPreferences,
);
applyPreferences();
keeperUI();
dailyUI();
scheduleDailyRefresh();
checkpointUI();
records();
soundUI();
if (recovered.invalid)
  toast("上一局的暂存无法读取，已清理；已完成的成绩保留。");
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (game) {
    if (screen === "playing") {
      let x =
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
        gamepad.x;
      let y =
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
        (keys.has("w") || keys.has("arrowup") ? 1 : 0) +
        gamepad.y;
      accumulator += dt;
      while (accumulator >= 1 / 60 && game.status === "playing") {
        game.update(1 / 60, { x, y });
        accumulator -= 1 / 60;
      }
      if (game.status === "choosing") showUpgrade();
      else if (["won", "lost"].includes(game.status)) showResult();
      if (screen === "playing" && now - lastCheckpoint >= 4000)
        persistCheckpoint();
    }
    for (const e of game.events.splice(0)) {
      renderer.event(e);
      audio.play(e.type === "end" && game.status === "lost" ? "loss" : e.type);
      if (e.type === "boss") toast("噬光巨蛾出现了，保持移动");
      if (e.type === "bossDown") toast("巨蛾散去，微光正在回到花园");
      if (e.type === "bossWarn" && e.first)
        toast("巨蛾正在蓄力，离开粉色俯冲路线");
      if (e.type === "wave")
        toast(
          [
            "",
            "风穿过草叶，虫影渐近",
            "新的虫影出现了",
            "夜已过半，别停下脚步",
            "黎明在前方",
            "再坚持一小会儿",
          ][e.wave] || "黎明快到了",
        );
    }
    updateHUD(false, now);
  }
  const animated = screen === "playing" || screen === "menu";
  if (
    !document.hidden &&
    (renderDirty ||
      lastRenderedScreen !== screen ||
      (animated &&
        (screen === "playing" ||
          now - lastRender >= 1000 / (navigator.maxTouchPoints > 0 ? 20 : 30))))
  ) {
    const drawDt = Math.min((now - lastRender) / 1000, 0.1);
    if (animated) visualTime += drawDt;
    renderer.draw(game || preview, animated ? drawDt : 0, visualTime, !game);
    lastRender = now;
    lastRenderedScreen = screen;
    renderDirty = false;
  }
  if (toastUntil && now > toastUntil) {
    $("toast").classList.remove("visible");
    toastUntil = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
