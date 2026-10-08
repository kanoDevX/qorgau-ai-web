import { expect, test } from "@playwright/test";

/** Check 2.0 (§4.2, §5.2, §5.3, P9). Repeated texts hit the backend verdict cache, so Gemini quota is barely used. */

const box = (page: import("@playwright/test").Page) => page.getByRole("textbox", { name: /проверка сообщения/i }).first();
const submit = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /^проверить$/i }).first();

test("a look-alike link is unshortened-safe scanned and the impersonated brand is named", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/check");
  await box(page).fill("kaspi-secure-login.com/pay");
  await expect(page.getByText("Похоже на ссылку: проверим, куда она ведёт")).toBeVisible();
  await submit(page).click();

  await expect(page.getByTestId("verdict")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Что мы узнали о ссылке" })).toBeVisible();
  await expect(page.getByText(/использует название kaspi\.kz, но это чужой сайт/)).toBeVisible();
  await expect(page.getByText(/не открываем страницу и не запускаем её скрипты/)).toBeVisible();
});

test("a full card number is refused on the device and never sent", async ({ page }) => {
  let sent = false;
  page.on("request", (r) => {
    if (r.url().includes("4111")) sent = true;
  });
  await page.goto("/check");
  await box(page).fill("4111 1111 1111 1111");
  await expect(page.getByText(/Не вводите номер карты целиком/)).toBeVisible();
  await expect(submit(page)).toBeDisabled();
  expect(sent).toBe(false);
});

test("a message verdict leads with one line, three actions and the phrases marked in the text", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/check");
  await box(page).fill("Это служба безопасности банка. Срочно назовите код из СМС и никому не говорите.");
  await submit(page).click();

  const verdict = page.getByTestId("verdict");
  await expect(verdict).toBeVisible({ timeout: 60_000 });
  await expect(verdict.getByRole("heading", { level: 2 })).toHaveText(/мошенничеств/);
  await expect(verdict.getByRole("heading", { name: "Что сделать прямо сейчас" })).toBeVisible();
  await expect(verdict.locator("ol").first().locator("li")).toHaveCount(3);
  await expect(verdict.locator("mark").first()).toBeVisible();
  await expect(verdict.getByText("Опасные фразы в сообщении")).toBeVisible();
  await expect(page.getByRole("button", { name: "Поделиться предупреждением" })).toBeVisible();
});

test("P9: when the AI quota is exhausted the banner says why and when to retry (SSE falls back to POST)", async ({ page }) => {
  await page.route("**/scam-check/text/start", (r) => r.abort());
  await page.route("**/api/v1/scam-check/text", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        assessmentId: "00000000-0000-7000-8000-000000000001",
        riskScore: 72,
        riskBand: "High",
        category: "BankImpersonationCall",
        recommendedAction: "ContactBankImmediately",
        explanation: "Проверка правилами: просят код из СМС.",
        redFlags: ["Просят назвать код из СМС"],
        degradedMode: true,
        degradedReason: "QuotaExceeded",
        retryAfterSeconds: 120,
        latencyMs: 12,
        highlights: [{ start: 0, end: 6, signalCode: "heuristic.pressure.urgency" }],
        explainability: { ensembleWeightsJson: "{}", layers: [], signals: [] },
      }),
    }),
  );
  await page.goto("/check");
  await box(page).fill("Срочно назовите код");
  await submit(page).click();

  const banner = page.getByTestId("degraded-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("исчерпан лимит запросов");
  await expect(banner).toContainText("правилами и по базе жалоб");
  await expect(banner).toContainText("примерно через 2 мин");
  await expect(page.locator("mark").first()).toHaveText(/Срочно/);
});

test("“Someone is calling me”: prompts, a running timer and a caller check after hanging up", async ({ page }) => {
  await page.goto("/check?mode=call");
  await expect(page.getByRole("heading", { name: "Вам звонят прямо сейчас?" })).toBeVisible();
  await expect(page.getByText(/00:0[1-9]/)).toBeVisible({ timeout: 5_000 });

  const prompt = page.getByRole("button", { name: "Просят код из СМС?" });
  await prompt.click();
  await expect(prompt).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/Банк и госорганы никогда не просят код/)).toBeVisible();

  await page.getByRole("button", { name: "Я положил(а) трубку" }).click();
  await expect(page.getByText("Что сделать после звонка")).toBeVisible();
  await page.getByLabel("Номер, с которого звонили").fill("+7 701 000 00 01");
  await page.getByRole("button", { name: "Проверить", exact: true }).click();
  await expect(page.getByRole("img", { name: /оценка риска/i })).toBeVisible({ timeout: 20_000 });
});

test("“Before a transfer”: a single yes forces a pause even before the recipient check", async ({ page }) => {
  await page.goto("/check?mode=transfer");
  const groups = page.getByRole("group");
  await expect(groups).toHaveCount(5);
  await groups.nth(0).getByText("Да", { exact: true }).click();
  for (let i = 1; i < 5; i++) await groups.nth(i).getByText("Нет", { exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /признак мошенничества/ })).toBeVisible();
  await page.getByRole("button", { name: /проверить получателя/i }).click();
  await expect(page.getByRole("textbox", { name: /получатель/i })).toBeVisible();
});

test("the scheme catalogue comes from the API with signs and actions", async ({ page }) => {
  await page.goto("/check");
  const section = page.getByRole("region", { name: "Частые схемы мошенников" }).or(page.locator("section", { has: page.getByRole("heading", { name: "Частые схемы мошенников" }) }));
  await expect(section.first()).toBeVisible();
  const trigger = page.getByRole("button", { name: "Звонок «службы безопасности банка»" });
  await trigger.click();
  await expect(page.getByText("Признаки").first()).toBeVisible();
  await expect(page.getByText(/Перезвоните в банк по номеру на обороте карты/).first()).toBeVisible();
});

test("retired screens redirect into Check", async ({ page }) => {
  await page.goto("/lookup");
  await expect(page).toHaveURL(/\/check$/);
  await page.goto("/second-opinion");
  await expect(page).toHaveURL(/\/check\?mode=transfer$/);
});
