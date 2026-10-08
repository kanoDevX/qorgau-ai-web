import { expect, test } from "@playwright/test";

/**
 * Regression guard for hard-coded Russian: switch to English and make sure the app chrome and
 * system copy of the core screens contain no Cyrillic. User-generated content is excluded: report
 * narratives by not checking the community feed, leaderboard names by the allow-list below.
 */
const USER_NAMES = /^(Айгуль|Берік)$/;
const SCREENS = ["/", "/check", "/dashboard", "/radar?tab=network", "/learn", "/family", "/golden-hour", "/settings", "/settings/privacy", "/check?mode=call", "/check?mode=transfer", "/pricing", "/legal/privacy", "/radar?tab=map", "/radar?tab=trends", "/settings/notifications", "/open-data", "/verify/QAI-000000-NOPE", "/partner/docs", "/login", "/forgot-password"];

test("core screens are fully translated in English", async ({ page, context, baseURL }) => {
  test.setTimeout(180_000); // ~20 screens, each compiled on first visit by the dev server
  await context.addCookies([{ name: "qorgau_locale", value: "en", url: baseURL! }]);
  await page.goto("/");
  await page.request.post("/api/session", { data: { mode: "demo", account: "self", onboardingRole: "self" } });

  const leaks: string[] = [];
  for (const route of SCREENS) {
    await page.goto(route);
    await page.waitForLoadState("networkidle").catch(() => {});
    const text = await page.locator("body").innerText();
    const cyr = text
      .split("\n")
      .filter((l) => /[А-Яа-яЁё]/.test(l) && !/Русский|Қазақша/.test(l) && !USER_NAMES.test(l.trim()));
    for (const l of cyr) leaks.push(`${route}: ${l.trim().slice(0, 100)}`);
  }
  expect(leaks, "untranslated Russian strings in the English UI").toEqual([]);
});
