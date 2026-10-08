import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * §3.13–3.15 — keyboard-only use, skip link, shortcuts, and axe in the extra display modes
 * (high contrast, senior/large text). The theme × screen matrix lives in audit.spec.ts.
 */

const PHISHING_TEXT =
  "Это служба безопасности банка. По вашей карте подозрительная операция. Срочно назовите код из СМС и никому не говорите.";

async function tabUntil(page: Page, predicate: () => Promise<boolean>, max = 40) {
  for (let i = 0; i < max; i++) {
    if (await predicate()) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("focus never reached the target");
}

test("skip link is the first stop and jumps to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Перейти к содержимому" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("a full check can be done with the keyboard only", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const textarea = page.getByRole("textbox", { name: /проверка сообщения/i }).first();
  await tabUntil(page, () => textarea.evaluate((el) => el === document.activeElement));
  await page.keyboard.type(PHISHING_TEXT);

  const submit = page.getByRole("button", { name: /^проверить$/i }).first();
  await tabUntil(page, () => submit.evaluate((el) => el === document.activeElement));
  // The focus ring must be visible on the control the user is about to press.
  const outline = await submit.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("img", { name: /оценка риска/i })).toBeVisible({ timeout: 60_000 });
});

test("? opens the shortcut cheat sheet and Esc closes it; G then C navigates", async ({ page }) => {
  await page.goto("/");
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Shift+Slash");
  const dialog = page.getByRole("dialog", { name: "Горячие клавиши" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.keyboard.press("g");
  await page.keyboard.press("c");
  await expect(page).toHaveURL(/\/check$/);
});

test("shortcuts do not fire while typing", async ({ page }) => {
  await page.goto("/");
  const textarea = page.getByRole("textbox", { name: /проверка сообщения/i }).first();
  await textarea.click();
  await page.keyboard.type("?gc");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(textarea).toHaveValue("?gc");
});

for (const mode of [
  { name: "high contrast (dark)", cookies: [{ name: "qorgau_contrast", value: "more" }], theme: "dark" },
  { name: "high contrast (light)", cookies: [{ name: "qorgau_contrast", value: "more" }], theme: "light" },
  { name: "senior large text", cookies: [{ name: "qorgau_density", value: "comfortable" }], theme: "dark" },
]) {
  test(`axe: no serious/critical issues in ${mode.name}`, async ({ page, context, baseURL }) => {
    test.setTimeout(120_000);
    await context.addCookies(mode.cookies.map((c) => ({ ...c, url: baseURL! })));
    await page.addInitScript((t) => window.localStorage.setItem("theme", t), mode.theme);
    await page.goto("/");
    await page.request.post("/api/session", { data: { mode: "demo", account: "self", onboardingRole: "self" } });

    const problems: string[] = [];
    for (const route of ["/", "/check", "/settings", "/settings/privacy", "/legal/privacy", "/pricing"]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle").catch(() => {});
      const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("canvas").analyze();
      for (const v of res.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) {
        problems.push(`${route}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(" ")}`);
      }
    }
    expect(problems).toEqual([]);
  });
}

test("senior mode gives 56px touch targets", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "qorgau_density", value: "comfortable", url: baseURL! }]);
  await page.goto("/");
  const box = await page.getByRole("button", { name: /^проверить$/i }).first().boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(56);
});

test("high-contrast toggle in settings applies immediately and persists", async ({ page }) => {
  await page.goto("/settings");
  const sw = page.getByRole("switch", { name: "Высокая контрастность" });
  await sw.click();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");
});
