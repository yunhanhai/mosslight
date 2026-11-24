import { test, expect } from "@playwright/test";
const model = (page) =>
  page.evaluate(async () => {
    const s = (await import("/src/main.js")).getSession(),
      g = s.game;
    return {
      mode: g?.mode,
      day: g?.challengeDate,
      seed: g?.seed,
      keeper: g?.keeper,
      elapsed: g?.elapsed,
      screen: s.screen,
      record: s.record,
    };
  });
test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
});
async function dailyStart(page) {
  await page.locator("#daily-button").click();
  await page.getByRole("button", { name: "开始今日守望", exact: true }).click();
}
test("daily fixes role and seed, stores separate results, and retries the same dated challenge", async ({
  page,
}) => {
  await dailyStart(page);
  const before = await model(page);
  expect(before.mode).toBe("daily");
  await page.evaluate(async () => {
    (await import("/src/main.js")).getSession().game.elapsed = 179.99;
  });
  await page.getByRole("button", { name: "再守一夜", exact: true }).waitFor();
  const ended = await model(page);
  expect(ended.record.wins).toBe(0);
  expect(ended.record.dailies[0].wins).toBe(1);
  await expect(page.locator("#dialog")).toContainText("本机当日微光新纪录");
  await page.getByRole("button", { name: "同种子重试", exact: true }).click();
  const retry = await model(page);
  expect([retry.day, retry.seed, retry.keeper]).toEqual([
    before.day,
    before.seed,
    before.keeper,
  ]);
});
test("daily progress survives refresh with its challenge date and frozen time", async ({
  page,
}) => {
  await dailyStart(page);
  await page.keyboard.press("p");
  const before = await model(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#continue-button").click();
  const restored = await model(page);
  expect(restored.day).toBe(before.day);
  expect(restored.elapsed).toBe(before.elapsed);
  expect(restored.screen).toBe("paused");
});
test("share copy writes only after a user click and the summary can fall back to manual copy", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.copies = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value) => window.copies.push(value) },
    });
  });
  await dailyStart(page);
  await page.keyboard.press("p");
  await page.getByRole("button", { name: "结束本局", exact: true }).click();
  await page.getByRole("button", { name: "结束并结算", exact: true }).click();
  await page.getByRole("button", { name: "复制对局摘要", exact: true }).click();
  expect(await page.evaluate(() => window.copies.length)).toBe(0);
  await page
    .getByRole("button", { name: "复制摘要与链接", exact: true })
    .click();
  await expect(page.locator("[data-copy-status]")).toContainText("已复制");
  expect(await page.evaluate(() => window.copies[0])).toContain("daily=");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("denied");
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "复制摘要与链接", exact: true })
    .click();
  await expect(page.locator("[data-copy-status]")).toContainText("未允许复制");
  await expect(page.locator("#share-text")).toBeFocused();
  const selected = await page
    .locator("#share-text")
    .evaluate((n) => n.selectionEnd - n.selectionStart === n.value.length);
  expect(selected).toBe(true);
});
test("a shared seed is offered without starting automatically and does not bypass pending-progress protection", async ({
  page,
}) => {
  await page.goto("/?mode=practice&keeper=wind&seed=123", {
    waitUntil: "domcontentloaded",
  });
  expect((await model(page)).screen).toBe("menu");
  await expect(page.locator("#shared-button")).toBeVisible();
  await page.locator("#shared-button").click();
  const started = await model(page);
  expect([started.mode, started.keeper, started.seed]).toEqual([
    "practice",
    "wind",
    123,
  ]);
  await page.keyboard.press("p");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#shared-button").click();
  await expect(
    page.getByRole("heading", { name: "开始新的守望？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "保留上一局", exact: true }).click();
  await page.locator("#continue-button").click();
  expect((await model(page)).seed).toBe(123);
});
test("past daily links retain their date and invalid future links are ignored", async ({
  page,
}) => {
  await page.goto("/?daily=2026-11-20", { waitUntil: "domcontentloaded" });
  await page.locator("#shared-button").click();
  expect((await model(page)).day).toBe("2026-11-20");
  await page.goto("/?daily=2099-11-24", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#shared-button")).toBeHidden();
  expect((await model(page)).screen).toBe("menu");
});
test("daily and shared panels fit compact phone and landscape viewports", async ({
  page,
}) => {
  for (const size of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.locator("#daily-button").click();
    const valid = await page
      .locator("#dialog")
      .evaluate(
        (n) =>
          n.scrollWidth <= n.clientWidth &&
          n.getBoundingClientRect().top >= 0 &&
          n.getBoundingClientRect().bottom <= innerHeight,
      );
    expect(valid).toBe(true);
    await page.getByRole("button", { name: "返回", exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("an open daily brief refreshes at Beijing midnight without changing a live run", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-23T15:59:59Z"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#daily-button").click();
  await expect(page.locator("#dialog .intro")).toContainText("2026-11-23");
  await page.clock.setFixedTime(new Date("2026-11-23T16:00:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator("#dialog .intro")).toContainText("2026-11-24");
  await page.getByRole("button", { name: "开始今日守望", exact: true }).click();
  const before = await model(page);
  await page.clock.setFixedTime(new Date("2026-11-24T16:00:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  expect((await model(page)).day).toBe(before.day);
});
test("shared entry and pending continuation remain reachable together on a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator("#start-button").click();
  await page.keyboard.press("p");
  await page
    .getByRole("button", { name: "暂存并回到花园", exact: true })
    .click();
  await page.goto("/?mode=practice&keeper=wind&seed=123", {
    waitUntil: "domcontentloaded",
  });
  for (const id of ["continue-button", "shared-button"]) {
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(568);
  }
  await page.locator("#shared-button").click();
  await page.getByRole("button", { name: "保留上一局", exact: true }).click();
  await page.locator("#continue-button").click();
  expect((await model(page)).mode).toBe("night");
});
