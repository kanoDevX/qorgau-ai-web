import { expect, test, type Page } from "@playwright/test";

/** Community & intelligence (§4.3, §5.3): map, trends, votes, notification settings, unsubscribe, moderation, open data. */

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

async function signInDemo(page: Page, account: "self" | "reviewer") {
  await page.goto("/");
  await page.request.post("/api/session", { data: { mode: "demo", account, onboardingRole: "self" } });
}

test("threat map shows all 17 regions + 3 cities, with a table alternative; a tile filters the feed", async ({ page }) => {
  await signInDemo(page, "self");
  await page.goto("/radar?tab=map");
  const tiles = page.locator("section[aria-labelledby='threat-map-title'] .grid > button");
  await expect(tiles).toHaveCount(20);
  await expect(page.getByRole("button", { name: /^Атырауская обл\.:/ })).toBeVisible();

  await page.locator("summary", { hasText: "Таблица по регионам" }).click();
  await expect(page.getByRole("cell", { name: "Улытауская обл." })).toBeVisible();

  await page.getByRole("button", { name: /^Атырауская обл\.:/ }).click();
  await expect(page).toHaveURL(/\/radar$/);
});

test("trends tab lists the schemes of the week", async ({ page }) => {
  await page.goto("/radar?tab=trends");
  await expect(page.getByRole("heading", { name: "Схемы недели" })).toBeVisible();
});

test("a signed-in member can rate a report once", async ({ page }) => {
  await signInFresh(page);
  await page.goto("/radar");
  const yes = page.getByRole("button", { name: /^Да \d+$/ }).first();
  await expect(yes).toBeEnabled({ timeout: 20_000 });
  await yes.click();
  await expect(page.getByRole("status").filter({ hasText: "Спасибо за оценку" }).first()).toBeVisible();
  await expect(yes).toBeDisabled();
});

test("signed-out visitors see why they can't vote", async ({ page }) => {
  await page.goto("/radar");
  await expect(page.getByText("Войдите, чтобы оценить").first()).toBeVisible({ timeout: 20_000 });
});

test("notification preferences are stored on the server (§4.3)", async ({ page }) => {
  await signInFresh(page);
  await page.goto("/settings/notifications");
  await page.getByLabel("Регион").selectOption("ATY");
  await page.getByRole("switch", { name: "Еженедельный дайджест на e-mail" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Сохранено" })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Регион")).toHaveValue("ATY");
  await expect(page.getByRole("switch", { name: "Еженедельный дайджест на e-mail" })).toHaveAttribute("aria-checked", "true");
});

test("one-click unsubscribe endpoint rejects forged tokens; the page explains it (§3.18)", async ({ page }) => {
  const res = await page.request.post("/backend/api/v1/unsubscribe?token=forged.token");
  expect(res.status()).toBe(400);
  await page.goto("/unsubscribe?token=forged.token");
  await expect(page.getByText(/Ссылка недействительна/)).toBeVisible();
});

test("moderation is for reviewers only", async ({ page }) => {
  await signInDemo(page, "self");
  await page.goto("/admin/moderation");
  await expect(page.getByText("Этот раздел доступен только модераторам.")).toBeVisible();

  await signInDemo(page, "reviewer");
  await page.goto("/admin/moderation");
  await expect(page.getByRole("heading", { name: "Модерация жалоб" })).toBeVisible();
  await expect(page.getByText("Этот раздел доступен только модераторам.")).toHaveCount(0);
});

test("open data: public CSV with suppression and a licence", async ({ page }) => {
  await page.goto("/open-data");
  await expect(page.getByRole("heading", { name: "Открытые данные" })).toBeVisible();
  const csv = await page.request.get("/backend/api/v1/open-data/reports?format=csv");
  expect(csv.ok()).toBeTruthy();
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect((await csv.text()).split("\n")[0]).toBe("date,region,category,count,suppressed");
  const json = (await (await page.request.get("/backend/api/v1/open-data/reports")).json()) as { license: string; suppressionThreshold: number };
  expect(json.license).toBe("CC BY 4.0");
  expect(json.suppressionThreshold).toBe(5);
});

test("landing shows the threat map and schemes of the week", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Карта угроз Казахстана" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Схемы недели" })).toBeVisible();
});
