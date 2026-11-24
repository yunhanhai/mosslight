import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
const arg = (key, fallback) =>
  process.argv.includes(key)
    ? process.argv[process.argv.indexOf(key) + 1]
    : fallback;
const url = arg("--url", "http://127.0.0.1:4174/"),
  output = arg("--out", ".impeccable/review/runtime-verification.json");
const { version: expected } = JSON.parse(
  await readFile("package.json", "utf8"),
);
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch(
    existsSync(edge) ? { executablePath: edge } : {},
  ),
  results = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1280, height: 900 },
      hasTouch: mobile,
      isMobile: mobile,
      reducedMotion: "reduce",
    });
    const page = await context.newPage(),
      errors = [],
      scripts = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("requestfailed", (r) =>
      errors.push(`${r.failure()?.errorText} ${r.url()}`),
    );
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
      if (/\.js(?:\?|$)/.test(r.url())) scripts.push(r.url());
    });
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await page.goto(url, { timeout: 45000 });
        break;
      } catch (e) {
        if (attempt === 2) throw e;
      }
    }
    await page.evaluate(() => document.fonts.ready);
    const version = await page.evaluate(
      async () =>
        (await (await fetch("version.json?check=" + Date.now())).json())
          .version,
    );
    if (version !== expected)
      throw Error(`Expected ${expected}, received ${version}`);
    await page.locator("#settings-button").click();
    await page.locator("#setting-volume").fill("25");
    await page.locator('input[value="reduced"]').check();
    await page.getByRole("button", { name: "完成", exact: true }).click();
    const settingsSaved = await page.evaluate(() => {
      const r = JSON.parse(localStorage.getItem("mosslight:v1"));
      return (
        r.volume === 0.25 &&
        r.effects === "reduced" &&
        document.documentElement.classList.contains("reduced-effects")
      );
    });
    await page.locator("#guide-button").click();
    const guideComplete = (await page.locator("details").count()) === 12;
    await page.getByRole("button", { name: "返回", exact: true }).click();
    await page.locator("#keeper-button").click();
    await page.locator('input[value="leaf"]').check();
    await page.getByRole("button", { name: "完成选择", exact: true }).click();
    const keeperSelected =
      (await page.locator("#keeper-name").textContent()) === "护叶";
    await page.locator("#start-button").click();
    const started = await page.locator("#hud").isVisible(),
      touchVisible = !mobile || (await page.locator("#joystick").isVisible());
    const keeperApplied = await page.evaluate(async () => {
      const { game } = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession();
      game.motes = [];
      game.addXp(13);
      return (
        game.keeper === "leaf" &&
        game.stats.orbit === 6 &&
        game.player.hp === 110
      );
    });
    await page.locator(".upgrade-card").first().waitFor();
    const choices = await page.locator(".upgrade-card").count();
    await page.locator('[data-action="reroll"]').click();
    const rerollUsed = await page
      .locator('[data-action="reroll"]')
      .isDisabled();
    const upgradeHints = (await page.locator(".upgrade-hint").count()) === 3;
    const beforeRecovery = await page.evaluate(async () => {
      const g = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession().game;
      return {
        elapsed: g.elapsed,
        choices: [...g.choices],
        rerolls: g.rerolls,
      };
    });
    await page.reload();
    await page.locator("#continue-button").click();
    await page.locator(".upgrade-card").first().waitFor();
    const checkpointRecovered = await page.evaluate(async (before) => {
      const g = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession().game;
      return (
        g.status === "choosing" &&
        g.elapsed === before.elapsed &&
        g.rerolls === before.rerolls &&
        JSON.stringify(g.choices) === JSON.stringify(before.choices) &&
        g.keeper === "leaf"
      );
    }, beforeRecovery);
    await page.locator(".upgrade-card").first().click();
    await page.locator("#pause-button").click();
    const paused = await page
      .getByRole("button", { name: "继续守夜" })
      .isVisible();
    const buildStats = (await page.locator(".build-stats > div").count()) === 8;
    await page.getByRole("button", { name: "继续守夜" }).click();
    await page.evaluate(async () => {
      const { game } = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession();
      game.player.x = 25;
      game.player.y = 25;
      game.enemies = [];
      game.motes = [];
      game.spawnTimer = 10000;
    });
    await page.waitForFunction(async () => {
      const { game, view: v } = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession();
      return (
        (game.player.y - v.camera.y) * v.scale > 115 &&
        (game.player.x - v.camera.x) * v.scale > 65
      );
    });
    await page.evaluate(async () => {
      const { game } = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession();
      game.bossSpawned = true;
      const b = game.spawn("boss");
      b.x = 1970;
      b.y = 1470;
      b.chargeCooldown = 10000;
    });
    await page.locator("#boss-name").filter({ hasText: "画面外" }).waitFor();
    const seed = await page.evaluate(async () => {
      const g = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession().game;
      g.elapsed = g.rules.duration - 0.01;
      return g.seed;
    });
    await page.getByRole("button", { name: "再守一夜", exact: true }).waitFor();
    await page.getByText("这一夜的战斗明细", { exact: true }).click();
    const combatDetails =
      (await page.locator(".combat-stats > div").count()) === 5;
    await page
      .getByRole("button", { name: "查看守夜足迹", exact: true })
      .click();
    const historyRecorded = (await page.locator(".run-list li").count()) === 1;
    await page.getByRole("button", { name: "返回", exact: true }).click();
    await page.getByRole("button", { name: "同种子重试", exact: true }).click();
    const sameSeedRetry = await page.evaluate(async (seed) => {
      const s = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession();
      return (
        s.game.seed === seed &&
        s.game.keeper === "leaf" &&
        s.game.elapsed < 3 &&
        s.record.history.length === 1 &&
        s.record.wins === 1
      );
    }, seed);
    await page.locator("#pause-button").click();
    await page.getByRole("button", { name: "结束本局", exact: true }).click();
    await page.getByRole("button", { name: "结束并结算", exact: true }).click();
    await page.getByRole("button", { name: "回到花园", exact: true }).click();
    await page.locator("#daily-button").click();
    await page
      .getByRole("button", { name: "开始今日守望", exact: true })
      .click();
    const dailyStart = await page.evaluate(async () => {
      const g = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession().game;
      return {
        mode: g.mode,
        day: g.challengeDate,
        seed: g.seed,
        keeper: g.keeper,
      };
    });
    await page.locator("#pause-button").click();
    await page.reload();
    await page.locator("#continue-button").click();
    const dailyRecovered = await page.evaluate(async (before) => {
      const g = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession().game;
      return (
        g.mode === "daily" &&
        g.challengeDate === before.day &&
        g.seed === before.seed &&
        g.keeper === before.keeper
      );
    }, dailyStart);
    await page.getByRole("button", { name: "结束本局", exact: true }).click();
    await page.getByRole("button", { name: "结束并结算", exact: true }).click();
    const dailySeparate = await page.evaluate(async () => {
      const r = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession().record;
      return (
        r.runs === 2 &&
        r.wins === 1 &&
        r.dailies.length === 1 &&
        r.dailies[0].runs === 1
      );
    });
    await page
      .getByRole("button", { name: "复制对局摘要", exact: true })
      .click();
    const summaryText = await page.locator("#share-text").inputValue();
    const shareSummary =
      summaryText.includes(`v${expected}`) &&
      summaryText.includes("daily=" + dailyStart.day);
    const sharedURL = summaryText.split("\n").at(-1);
    await page.goto(url + new URL(sharedURL).search);
    await page.locator("#shared-button").click();
    const sharedChallenge = await page.evaluate(async (before) => {
      const g = (
        await import(document.querySelector('script[type="module"]').src)
      ).getSession().game;
      return (
        g.mode === "daily" &&
        g.challengeDate === before.day &&
        g.seed === before.seed &&
        g.keeper === before.keeper
      );
    }, dailyStart);
    results.push({
      device: mobile ? "mobile" : "desktop",
      http: response.status(),
      version,
      started,
      touchVisible,
      choices,
      rerollUsed,
      paused,
      cornerClear: true,
      bossDirection: true,
      settingsSaved,
      guideComplete,
      buildStats,
      historyRecorded,
      sameSeedRetry,
      keeperSelected,
      keeperApplied,
      combatDetails,
      upgradeHints,
      checkpointRecovered,
      dailyRecovered,
      dailySeparate,
      shareSummary,
      sharedChallenge,
      allModulesVersioned:
        scripts.length >= 9 &&
        scripts.every((s) => s.includes("?v=" + expected)),
      errors,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  JSON.stringify(
    { checkedAt: new Date().toISOString(), url, results },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(results, null, 2));
if (
  results.some(
    (r) =>
      r.http !== 200 ||
      !r.started ||
      !r.touchVisible ||
      r.choices !== 3 ||
      !r.rerollUsed ||
      !r.paused ||
      !r.settingsSaved ||
      !r.guideComplete ||
      !r.buildStats ||
      !r.historyRecorded ||
      !r.sameSeedRetry ||
      !r.keeperSelected ||
      !r.keeperApplied ||
      !r.combatDetails ||
      !r.upgradeHints ||
      !r.checkpointRecovered ||
      !r.dailyRecovered ||
      !r.dailySeparate ||
      !r.shareSummary ||
      !r.sharedChallenge ||
      !r.allModulesVersioned ||
      r.errors.length,
  )
)
  process.exitCode = 1;
