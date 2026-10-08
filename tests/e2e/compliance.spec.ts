import { expect, test, type Page } from "@playwright/test";

/**
 * Compliance & trust flows (docs/COMPLIANCE.md). Each test names the §3 item it proves.
 * The banner tests start from an empty cookie jar; the others reuse the project default
 * (consent already decided) so the banner does not cover the UI under test.
 */

const fresh = { storageState: { cookies: [], origins: [] } };

/** A throwaway account, so tests that change account state never race on the shared demo user. */
async function signInFresh(page: Page) {
  await page.goto("/");
  const res = await page.request.post("/api/session", {
    data: {
      mode: "register",
      email: `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.kz`,
      displayName: "E2E",
      track: "General",
      password: "Correct-horse-battery",
      acceptedPolicy: true,
      onboardingRole: "self",
    },
  });
  expect(res.ok()).toBeTruthy();
}

async function signIn(page: Page) {
  await page.goto("/");
  const res = await page.request.post("/api/session", {
    data: { mode: "demo", account: "self", onboardingRole: "self" },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe("cookie consent banner (§3.5)", () => {
  test.use(fresh);

  test("reject all → analytics never loads and the choice is remembered", async ({ page, context }) => {
    await page.goto("/");
    const banner = page.getByTestId("cookie-banner");
    await expect(banner).toBeVisible();

    // Before any choice nothing optional is loaded.
    expect(await page.evaluate(() => (window as unknown as { __qorgauAnalyticsLoaded?: boolean }).__qorgauAnalyticsLoaded)).toBeUndefined();

    await banner.getByRole("button", { name: /Отклонить все/ }).click();
    await expect(banner).toBeHidden();

    const consent = (await context.cookies()).find((c) => c.name === "qorgau_consent");
    expect(consent?.value).toBe("v1.0.0");

    await page.reload();
    await expect(page.getByTestId("cookie-banner")).toBeHidden();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { __qorgauAnalyticsLoaded?: boolean }).__qorgauAnalyticsLoaded)).toBeUndefined();
    expect(await page.locator("script[data-qorgau-analytics]").count()).toBe(0);
  });

  test("accept all → analytics loads only after the click", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator("script[data-qorgau-analytics]").count()).toBe(0);
    await page.getByTestId("cookie-banner").getByRole("button", { name: /Принять все/ }).click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __qorgauAnalyticsLoaded?: boolean }).__qorgauAnalyticsLoaded))
      .toBe(true);
  });

  test("accept and reject carry equal visual weight (no dark pattern)", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByTestId("cookie-banner");
    const reject = banner.getByRole("button", { name: /Отклонить все/ });
    const accept = banner.getByRole("button", { name: /Принять все/ });
    expect(await reject.getAttribute("class")).toBe(await accept.getAttribute("class"));
    const [rb, ab] = [await reject.boundingBox(), await accept.boundingBox()];
    expect(Math.abs((rb?.height ?? 0) - (ab?.height ?? 0))).toBeLessThan(1);
  });
});

test("footer → cookie settings reopens the choice (§3.5, §3.16)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("button", { name: /Настройки cookie/ }).click();
  await expect(page.getByRole("dialog", { name: /Настройки cookie/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("legal pages exist in all locales with a version date (§3.1–3.4)", async ({ page, context, baseURL }) => {
  for (const doc of ["privacy", "terms", "cookies", "refund"]) {
    await page.goto(`/legal/${doc}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Редакция от \d{4}-\d{2}-\d{2}/)).toBeVisible();
  }
  await expect(page.locator("table")).toHaveCount(0); // refund has no table
  await page.goto("/legal/cookies");
  await expect(page.getByRole("cell", { name: "qorgau_consent" })).toBeVisible();

  await context.addCookies([{ name: "qorgau_locale", value: "en", url: baseURL! }]);
  for (const doc of ["privacy", "terms", "cookies", "refund"]) {
    await page.goto(`/legal/${doc}`);
    const text = await page.locator("main").innerText();
    expect(text.split("\n").filter((l) => /[А-Яа-яЁё]/.test(l)), `${doc} has Russian in EN`).toEqual([]);
  }
  await context.addCookies([{ name: "qorgau_locale", value: "kk", url: baseURL! }]);
  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Құпиялылық саясаты");
});

test("privacy policy discloses the transfer to Google Gemini (§3.1)", async ({ page }) => {
  await page.goto("/legal/privacy");
  await expect(page.getByText(/Google Gemini/).first()).toBeVisible();
  await expect(page.getByText(/трансграничная передача/)).toBeVisible();
});

test("register refuses without the (unticked) consent checkbox — UI and server (§3.6)", async ({ page }) => {
  await page.goto("/register");
  const box = page.getByRole("checkbox");
  await expect(box).not.toBeChecked();
  await page.getByLabel("E-mail").fill(`e2e-${Date.now()}@example.kz`);
  await page.getByLabel("Как к вам обращаться").fill("E2E");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Нужно ваше согласие" })).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);

  // The server rejects it too, even if the UI is bypassed.
  const res = await page.request.post("/api/session", {
    data: { mode: "register", email: `e2e-raw-${Date.now()}@example.kz`, displayName: "Raw", track: "General", password: "Correct-horse-battery", acceptedPolicy: false },
  });
  expect(res.status()).toBe(400);
});

test("register with consent creates an account and records it server-side (§3.6, P1)", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("E-mail").fill(`e2e-ok-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.kz`);
  await page.getByLabel("Пароль", { exact: true }).fill("Correct-horse-battery");
  await page.getByLabel("Повторите пароль").fill("Correct-horse-battery");
  await page.getByLabel("Как к вам обращаться").fill("E2E");
  await page.getByRole("checkbox", { name: /Политику конфиденциальности/ }).check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/check/, { timeout: 20_000 });

  const consents = await page.request.get("/backend/api/v1/me/consents");
  expect(consents.ok()).toBeTruthy();
  const body = (await consents.json()) as { policyUpToDate: boolean };
  expect(body.policyUpToDate).toBe(true);
});

test("consents in /settings/privacy are stored on the server and survive reload (P1)", async ({ page }) => {
  await signInFresh(page);
  await page.goto("/settings/privacy");
  const sw = page.getByRole("switch", { name: "Cookie аналитики" });
  await expect(sw).toBeVisible();
  const before = (await sw.getAttribute("aria-checked")) === "true";
  await sw.click();
  await expect(page.getByRole("status").filter({ hasText: "Сохранено" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("switch", { name: "Cookie аналитики" })).toHaveAttribute("aria-checked", String(!before));

  // restore
  await page.getByRole("switch", { name: "Cookie аналитики" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Сохранено" })).toBeVisible();
});

test("account deletion is ≤2 clicks from /settings, with grace period and cancel (§3.9, §3.20)", async ({ page }) => {
  await signInFresh(page);
  await page.goto("/settings");
  await page.getByRole("link", { name: "Приватность и данные" }).click(); // click 1
  await page.getByLabel(/Для подтверждения введите слово/).fill("УДАЛИТЬ");
  await page.getByRole("button", { name: "Запланировать удаление" }).click(); // click 2
  await expect(page.getByTestId("deletion-pending")).toContainText("Удаление запланировано");

  await page.getByRole("button", { name: "Отменить удаление" }).click();
  await expect(page.getByRole("button", { name: "Запланировать удаление" })).toBeVisible();
});

test("data export returns the caller's data as JSON (§3.20)", async ({ page }) => {
  await signIn(page);
  const res = await page.request.post("/backend/api/v1/me/export");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { format: string; profile: { email: string }; consents: unknown[] };
  expect(body.format).toBe("qorgauai-export/v1");
  expect(body.profile.email).toContain("@");
  expect(Array.isArray(body.consents)).toBe(true);
});

test("check works without registration (§3.9)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("textbox").first()).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("pricing is public, from the API, with VAT and overage rules (§3.10)", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: "Стандарт" })).toBeVisible();
  await expect(page.getByText("НДС").first()).toBeVisible();
  await expect(page.getByText(/При превышении/).first()).toBeVisible();
  await expect(page.getByText(/Предварительные тарифы/)).toBeVisible();
});

test("partner portal has no fake payment button or invented figures (P3)", async ({ page }) => {
  await signIn(page);
  await page.goto("/partner");
  await expect(page.getByRole("heading", { name: "Портал для партнёров" })).toBeVisible();
  await expect(page.getByText(/Оплатить/)).toHaveCount(0);
  await expect(page.getByText("14 436")).toHaveCount(0);
});

test("landing statistics carry a source and date (§3.12, P2)", async ({ page }) => {
  await page.goto("/");
  const figure = page.locator("figure").first();
  await expect(figure).toContainText("FBI IC3");
  await expect(figure).toContainText("2025-04");
  await expect(page.getByText("96%")).toHaveCount(0);
});

test("report form needs an explicit, unticked publish consent (§3.6)", async ({ page }) => {
  await signIn(page);
  await page.goto("/radar");
  await page.getByRole("button", { name: /Сообщить о мошеннике/ }).first().click();
  const box = page.getByRole("checkbox", { name: /публикацию обезличенной жалобы/ });
  await expect(box).not.toBeChecked();
});

test("expired access token is refreshed transparently and the refresh token rotates (§4.1)", async ({ page, context }) => {
  await signIn(page);
  const before = (await context.cookies()).find((c) => c.name === "qorgau_refresh")?.value;
  expect(before).toBeTruthy();

  // Simulate the short-lived access cookie expiring.
  await context.clearCookies({ name: "qorgau_jwt" });
  const res = await page.request.get("/backend/api/v1/me/consents");
  expect(res.status()).toBe(200);

  const after = (await context.cookies()).find((c) => c.name === "qorgau_refresh")?.value;
  expect(after).toBeTruthy();
  expect(after).not.toBe(before);

  await page.goto("/settings/privacy");
  await expect(page.getByText("это устройство")).toBeVisible();
});

test("parallel requests after the access token expires share one rotation (no false reuse detection)", async ({ page, context }) => {
  await signIn(page);
  await context.clearCookies({ name: "qorgau_jwt" });
  const results = await Promise.all(Array.from({ length: 6 }, () => page.request.get("/backend/api/v1/me/consents")));
  expect(results.map((r) => r.status())).toEqual([200, 200, 200, 200, 200, 200]);

  // The session survived: it is still listed as this device.
  await page.goto("/settings/privacy");
  await expect(page.getByText("это устройство")).toBeVisible();
});

test("sign-out revokes the session server-side (§4.1)", async ({ page, context }) => {
  await signIn(page);
  const refresh = (await context.cookies()).find((c) => c.name === "qorgau_refresh")!.value;
  await page.request.delete("/api/session");
  const replay = await page.request.post("/backend/api/v1/auth/refresh", { data: { refreshToken: refresh } });
  expect(replay.status()).toBe(401);
});
