import { expect, test, type Page } from "@playwright/test";

/** Э6: family circle (§4.4), age consent (§3.17), learning 2.0 and certificates (§4.5). */

async function register(page: Page, name: string, track = "General") {
  await page.goto("/");
  const res = await page.request.post("/api/session", {
    data: {
      mode: "register",
      email: `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.kz`,
      displayName: name,
      track,
      password: "Correct-horse-battery",
      acceptedPolicy: true,
      onboardingRole: "self",
    },
  });
  expect(res.ok()).toBeTruthy();
}

test("guardian invites by link; a parent joins as protected only with explicit consent", async ({ page, browser }) => {
  await register(page, "Берік");
  await page.goto("/family");
  await expect(page.getByRole("heading", { name: "Вы пока не в семейном круге" })).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Название семьи").fill("Семья E2E");
  await page.getByRole("button", { name: "Создать семью" }).click();

  await page.getByRole("button", { name: "Создать приглашение" }).click();
  await expect(page.getByRole("img", { name: "QR-код приглашения в семью" })).toBeVisible();
  const link = await page.getByTestId("invite-link").inputValue();
  expect(link).toMatch(/\/family\?join=[0-9a-f-]{36}\.[A-Z0-9]{8}$/);

  const ctx = await browser.newContext({ storageState: "tests/e2e/consent-state.json" });
  const grandma = await ctx.newPage();
  await register(grandma, "Айгуль", "Retiree");
  await grandma.goto(new URL(link).pathname + new URL(link).search);
  await expect(grandma.getByLabel("Ссылка-приглашение")).toHaveValue(/join=|\./);
  await grandma.getByRole("radio", { name: /Под защитой/ }).check();
  const join = grandma.getByRole("button", { name: "Присоединиться" });
  await expect(join).toBeDisabled();
  await grandma.getByRole("checkbox", { name: /разрешаю опекунам/ }).check();
  await join.click();
  await expect(grandma.getByTestId("family-member")).toHaveCount(2);
  await ctx.close();

  await page.reload();
  const member = page.getByTestId("family-member").filter({ hasText: "Айгуль" });
  await expect(member).toContainText("Под защитой");
  await expect(member).toContainText("Уровень риска: Низкий");
});

test("SOS asks for confirmation and reports the result", async ({ page }) => {
  await register(page, "SOS");
  await page.goto("/family");
  await page.getByLabel("Название семьи").fill("SOS");
  await page.getByRole("button", { name: "Создать семью" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "SOS — нужна помощь" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Сигнал/ })).toBeVisible();
});

test("registration: student track works and an under-18 birth date shows the limited-mode notice", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("E-mail").fill(`teen-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.kz`);
  await page.getByLabel("Пароль", { exact: true }).fill("Correct-horse-battery");
  await page.getByLabel("Повторите пароль").fill("Correct-horse-battery");
  await page.getByLabel("Как к вам обращаться").fill("Teen");
  await page.getByLabel("Для кого вы").selectOption("StudentFreelancer");
  const year = new Date().getFullYear() - 14;
  await page.getByLabel("Год рождения").selectOption(String(year));
  await page.getByLabel("Месяц рождения").selectOption("1");
  await expect(page.getByTestId("minor-notice")).toBeVisible();
  await page.getByLabel("Регион (необязательно)").selectOption("ATY");
  await page.getByRole("checkbox", { name: /Политику конфиденциальности/ }).check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/check$/, { timeout: 20_000 });

  await page.goto("/settings");
  await expect(page.getByTestId("limited-mode")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel("Регион", { exact: true })).toHaveValue("ATY");
});

test("learn: daily quests, find-the-signs exercise, trainer needs consent", async ({ page }) => {
  await register(page, "Learner");
  await page.goto("/learn");
  await expect(page.getByTestId("quest-lesson")).toBeVisible({ timeout: 20_000 });

  const find = page.getByTestId("find-signs");
  for (const phrase of ["Ваша карта заблокирована", "В течение 30 минут", "kaspi-bank-secure.example"]) {
    await find.getByRole("button", { name: phrase }).click();
  }
  await expect(find).toContainText("Вы нашли все признаки");

  await page.getByTestId("sim-trainer").getByRole("button", { name: "Показать сообщение" }).click();
  await expect(page.getByRole("link", { name: "Открыть настройки приватности" })).toBeVisible();
});

test("a finished course gives a certificate that the public page verifies", async ({ page }) => {
  await register(page, "Әсел Қуанышқызы", "Teen");
  const courses = await (await page.request.get("/backend/api/v1/courses?lang=ru")).json();
  const teen = courses.find((c: { slug: string }) => c.slug === "online-safety-teen");
  const detail = await (await page.request.get(`/backend/api/v1/courses/${teen.id}?lang=ru`)).json();
  for (const lesson of detail.lessons) {
    const r = await page.request.post(`/backend/api/v1/courses/${teen.id}/progress`, { data: { lessonId: lesson.id, selectedOptionIndex: 1 } });
    expect(r.ok()).toBeTruthy();
  }

  await page.goto("/learn");
  await page.getByRole("button", { name: "Безопасность в сети для подростков" }).click();
  await page.getByTestId("certificates").getByRole("button", { name: "Получить сертификат" }).click();
  await expect(page.getByTestId("certificates").getByRole("link", { name: "Скачать PDF" })).toBeVisible();

  await page.getByTestId("certificates").getByRole("link", { name: "Страница проверки" }).click();
  await expect(page.getByTestId("verify-valid")).toContainText("Әсел Қуанышқызы");
});

test("verify page rejects an unknown serial", async ({ page }) => {
  await page.goto("/verify/QAI-000000-NOPE");
  await expect(page.getByTestId("verify-invalid")).toContainText("не найден");
});
