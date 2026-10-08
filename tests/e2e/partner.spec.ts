import { expect, test, type Page } from "@playwright/test";

/** Э7: partner cabinet (§4.6) — onboarding, keys (test/live, rotate, revoke), sandbox calls, usage, webhooks, billing. */

async function registerAndOpenCabinet(page: Page) {
  await page.goto("/");
  const res = await page.request.post("/api/session", {
    data: {
      mode: "register",
      email: `partner-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.kz`,
      displayName: "Partner E2E",
      track: "Entrepreneur",
      password: "Correct-horse-battery",
      acceptedPolicy: true,
      onboardingRole: "partner",
    },
  });
  expect(res.ok()).toBeTruthy();
  await page.goto("/partner");
  await page.getByLabel("Название организации").fill("ТОО Тест");
  await page.getByRole("button", { name: "Создать кабинет" }).click();
  const key = await page.getByTestId("secret-value").textContent();
  expect(key).toMatch(/^pk_test_[0-9a-f]{32}$/);
  return key!;
}

test("self-serve signup shows the sandbox key once; live keys wait for a contract", async ({ page }) => {
  await registerAndOpenCabinet(page);
  await page.getByRole("button", { name: "Я сохранил(а) ключ" }).click();
  await expect(page.getByTestId("secret-reveal")).toHaveCount(0);

  await page.getByRole("link", { name: "Ключи" }).click();
  await expect(page.getByTestId("partner-key")).toHaveCount(1);
  await expect(page.getByTestId("partner-key")).toContainText("Песочница");
  await expect(page.getByRole("button", { name: "Создать боевой ключ" })).toBeDisabled();
  await expect(page.getByText("Боевые ключи откроются после подписания договора.")).toBeVisible();
});

test("rotate keeps the old key for 24 h; revoke stops it", async ({ page }) => {
  await registerAndOpenCabinet(page);
  await page.goto("/partner/keys");
  await page.getByLabel("Подпись ключа").fill("CI");
  await page.getByRole("button", { name: "Создать ключ песочницы" }).click();
  await expect(page.getByTestId("secret-value")).toHaveText(/^pk_test_/);
  await page.getByRole("button", { name: "Я сохранил(а) ключ" }).click();
  await expect(page.getByTestId("partner-key")).toHaveCount(2);

  const ci = page.getByTestId("partner-key").filter({ hasText: "CI" });
  page.once("dialog", (d) => d.accept());
  await ci.getByRole("button", { name: /^Перевыпустить/ }).click();
  await expect(page.getByTestId("secret-value")).toHaveText(/^pk_test_/);
  await expect(page.getByTestId("partner-key")).toHaveCount(3);
  await expect(page.getByTestId("partner-key").filter({ hasText: "Истекает" })).toHaveCount(1);

  const expiring = page.getByTestId("partner-key").filter({ hasText: "Истекает" });
  page.once("dialog", (d) => d.accept());
  await expiring.getByRole("button", { name: /^Отозвать/ }).click();
  await expect(page.getByTestId("partner-key").filter({ hasText: "Отозван" })).toHaveCount(1);
});

test("docs playground: a sandbox key gets deterministic test answers and shows in usage", async ({ page }) => {
  const key = await registerAndOpenCabinet(page);
  await page.goto("/partner/docs");
  await expect(page.getByTestId("sandbox-triggers")).toContainText("test_high");
  await page.getByLabel("API-ключ").fill(key);
  await page.getByRole("button", { name: "Проверить получателя" }).click();
  await expect(page.locator("pre").filter({ hasText: '"sandbox": true' })).toContainText('"riskScore": 92');

  await page.goto("/partner/usage");
  await expect(page.getByTestId("usage-period")).toBeVisible();
  await page.locator("summary", { hasText: "Таблица запросов по дням" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("webhooks refuse private addresses", async ({ page }) => {
  await registerAndOpenCabinet(page);
  await page.goto("/partner/webhooks");
  await page.getByLabel("Адрес (https)").fill("https://localhost/hook");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "private or local network" })).toBeVisible();
});

test("billing: plans come from the API, a statement downloads as PDF", async ({ page }) => {
  await registerAndOpenCabinet(page);
  await page.goto("/partner/billing");
  await expect(page.getByTestId("plan-sandbox")).toContainText("Текущий");
  await page.getByTestId("plan-payg").getByRole("button", { name: "Выбрать" }).click();
  await expect(page.getByTestId("plan-payg")).toContainText("Текущий");

  const row = page.getByTestId("statement-row").first();
  await expect(row).toBeVisible();
  const href = await row.getByRole("link").getAttribute("href");
  const pdf = await page.request.get(href!);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
});

test("demo partner role lands in the cabinet with a live-approved account", async ({ page }) => {
  await page.goto("/");
  await page.request.post("/api/session", { data: { mode: "demo", account: "partner", onboardingRole: "partner" } });
  await page.goto("/partner");
  await expect(page.getByText("Открыт", { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.goto("/partner/keys");
  await expect(page.getByRole("button", { name: "Создать боевой ключ" })).toBeEnabled();
});
