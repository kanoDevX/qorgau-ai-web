import { expect, test } from "@playwright/test";

/** IA 2.0 (§5.2): five sections, SOS always visible, notifications as a drawer, retired URLs redirect. */

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.request.post("/api/session", { data: { mode: "demo", account: "self", onboardingRole: "self" } });
}

test("main navigation has exactly the five sections, each reachable", async ({ page }, info) => {
  await signIn(page);
  await page.goto("/check");
  const nav = page.getByRole("navigation", { name: "Основная навигация" }).filter({ visible: true }).first();
  const links = nav.getByRole("link");
  await expect(links).toHaveText(["Проверить", "Главная", "Карта угроз", "Учиться", "Семья"]);
  for (const [name, url] of [
    ["Семья", /\/family$/],
    ["Карта угроз", /\/radar$/],
    ["Главная", /\/dashboard$/],
  ] as const) {
    await nav.getByRole("link", { name }).click();
    await expect(page).toHaveURL(url);
    await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
  }
  void info;
});

test("SOS is visible on every app screen", async ({ page }) => {
  await signIn(page);
  for (const route of ["/check", "/dashboard", "/radar", "/learn", "/family", "/settings"]) {
    await page.goto(route);
    await expect(page.getByRole("link", { name: /Меня обманули|SOS/ }).filter({ visible: true }).first()).toBeVisible();
  }
});

test("bell opens the notifications drawer and Esc closes it", async ({ page }) => {
  await signIn(page);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /^Уведомления/ }).filter({ visible: true }).first().click();
  const drawer = page.getByRole("dialog", { name: "Уведомления" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("combobox", { name: /регион/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});

test("profile menu leads to privacy settings", async ({ page }) => {
  await signIn(page);
  await page.goto("/check");
  await page.getByRole("button", { name: "Профиль и настройки" }).click();
  await page.getByRole("link", { name: "Приватность и данные" }).click();
  await expect(page).toHaveURL(/\/settings\/privacy$/);
});

test("retired URLs redirect to their new home", async ({ page }) => {
  await signIn(page);
  await page.goto("/guardian");
  await expect(page).toHaveURL(/\/family$/);
  await page.goto("/graph");
  await expect(page).toHaveURL(/\/radar\?tab=network$/);
  await expect(page.getByRole("tab", { name: "Сети мошенников" })).toHaveAttribute("aria-selected", "true");
  await page.goto("/notifications");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("threat map: network tab offers a text alternative to the graph (§3.13)", async ({ page }) => {
  await signIn(page);
  await page.goto("/radar?tab=network");
  await page.getByRole("button", { name: "+7 701 000 00 01" }).click();
  await expect(page.locator("summary", { hasText: "Узлы графа списком" })).toBeVisible({ timeout: 20_000 });
});

test("landing shows the live feed and FAQ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Что сейчас происходит" })).toBeVisible();
  const faq = page.getByRole("button", { name: "Это бесплатно?" });
  await faq.click();
  await expect(page.getByText(/Для граждан проверка сообщений, обучение и защита семьи бесплатны/)).toBeVisible();
});

test("no screen scrolls horizontally (desktop and phone width)", async ({ page }) => {
  test.setTimeout(120_000);
  await signIn(page);
  const offenders: string[] = [];
  for (const route of ["/", "/check", "/check?mode=call", "/check?mode=transfer", "/dashboard", "/radar", "/radar?tab=network", "/learn", "/family", "/golden-hour", "/settings", "/settings/privacy", "/pricing", "/about", "/legal/cookies", "/register", "/onboarding", "/radar?tab=map", "/settings/notifications", "/open-data"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle").catch(() => {});
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    if (scroll > client + 1) offenders.push(`${route}: ${scroll} > ${client}`);
  }
  expect(offenders).toEqual([]);
});
