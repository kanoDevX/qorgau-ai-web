import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** Sign-in with a password: sign-up, sign-in/out, no account enumeration, lockout, reset by e-mail, change, remember-me. */

const PASSWORD = "Correct-horse-battery";
const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.kz`;

async function registerViaApi(page: Page, email: string, password = PASSWORD) {
  await page.goto("/");
  const res = await page.request.post("/api/session", {
    data: { mode: "register", email, displayName: "Auth E2E", track: "General", password, acceptedPolicy: true, onboardingRole: "self" },
  });
  expect(res.ok()).toBeTruthy();
  await page.request.delete("/api/session"); // start signed out
}

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
}

/** Dev API writes e-mails as .eml files (FileEmailSender). Finds the newest one sent to `email`. */
function latestMailTo(email: string): string | null {
  // Playwright runs from the QorgauAIWeb folder; the API project sits next to it.
  const roots = ["Release", "Debug"].map((c) => join(process.cwd(), "..", "QorgauAI", "QorgauAI.Api", "bin", c, "net10.0", "App_Data", "outbox"));
  const files = roots
    .filter((d) => existsSync(d))
    .flatMap((d) => readdirSync(d).map((f) => join(d, f)))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  for (const f of files.slice(0, 50)) {
    const text = readFileSync(f, "utf8");
    if (text.includes(`To: ${email}`)) return text;
  }
  return null;
}

test("sign up with a password, sign out, sign back in from the header", async ({ page }) => {
  const email = uniqueEmail("signup");
  await page.goto("/register");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill("qwerty1234");
  await expect(page.getByTestId("password-strength")).toContainText("слабый");
  await page.getByLabel("Пароль", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Повторите пароль").fill(PASSWORD);
  await page.getByLabel("Как к вам обращаться").fill("Auth");
  await page.getByRole("checkbox", { name: /Политику конфиденциальности/ }).check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/check$/, { timeout: 20_000 });

  await page.request.delete("/api/session");
  await page.goto("/learn");
  await page.getByTestId("header-sign-in").click();
  await expect(page).toHaveURL(/\/login\?next=%2Flearn/);
  await signIn(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/learn$/, { timeout: 20_000 });
  await expect(page.getByTestId("header-sign-in")).toHaveCount(0);
});

test("wrong password and unknown e-mail get the same answer", async ({ page }) => {
  const email = uniqueEmail("enum");
  await registerViaApi(page, email);
  await page.goto("/login");
  await signIn(page, email, "Wrong-horse-battery");
  const wrong = await page.getByRole("alert").filter({ hasText: /Неверный/ }).textContent();
  await page.goto("/login");
  await signIn(page, uniqueEmail("nobody"), "Wrong-horse-battery");
  const unknown = await page.getByRole("alert").filter({ hasText: /Неверный/ }).textContent();
  expect(unknown).toBe(wrong);
});

test("five wrong passwords lock the account, and the right one is refused while locked", async ({ page }) => {
  const email = uniqueEmail("lock");
  await registerViaApi(page, email);
  for (let i = 0; i < 5; i++) {
    const res = await page.request.post("/api/session", { data: { mode: "login", email, password: `nope-nope-${i}` } });
    expect([401, 429]).toContain(res.status());
  }
  await page.goto("/login");
  await signIn(page, email, PASSWORD);
  await expect(page.getByRole("alert").filter({ hasText: /Слишком много неудачных попыток/ })).toBeVisible();
});

test("forgot password: the e-mailed link sets a new password once, then sign-in works", async ({ page }) => {
  const email = uniqueEmail("reset");
  await registerViaApi(page, email);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("link", { name: "Забыли пароль?" }).click();
  await expect(page.getByLabel("E-mail")).toHaveValue(email);
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(page.getByTestId("forgot-sent")).toBeVisible();

  let mail: string | null = null;
  await expect.poll(() => (mail = latestMailTo(email)) !== null, { timeout: 15_000 }).toBe(true);
  const link = /http:\/\/[^\s]+\/reset-password\?token=[A-Za-z0-9_%-]+/.exec(mail!)![0];
  const resetPath = link.slice(link.indexOf("/reset-password"));

  await page.goto(resetPath);
  await expect(page).toHaveURL(/\/reset-password$/); // the token is taken out of the address bar
  await page.getByLabel("Новый пароль").fill("Brand-new-passphrase");
  await page.getByLabel("Повторите пароль").fill("Brand-new-passphrase");
  await page.getByRole("button", { name: "Сохранить пароль" }).click();
  await expect(page.getByTestId("reset-done")).toBeVisible();

  // The same link doesn't work twice.
  await page.goto(resetPath);
  await page.getByLabel("Новый пароль").fill("Another-new-passphrase");
  await page.getByLabel("Повторите пароль").fill("Another-new-passphrase");
  await page.getByRole("button", { name: "Сохранить пароль" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "недействительна" })).toBeVisible();

  await page.goto("/login");
  await signIn(page, email, "Brand-new-passphrase");
  await expect(page).toHaveURL(/\/check$/, { timeout: 20_000 });
});

test("forgot password for an unknown e-mail looks exactly the same", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("E-mail").fill(uniqueEmail("ghost"));
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(page.getByTestId("forgot-sent")).toBeVisible();
});

test("change password in Privacy settings needs the current one", async ({ page }) => {
  const email = uniqueEmail("change");
  await registerViaApi(page, email);
  await page.goto("/login");
  await signIn(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/check$/, { timeout: 20_000 });

  await page.goto("/settings/privacy");
  const form = page.getByTestId("change-password");
  await form.getByLabel("Текущий пароль").fill("Wrong-horse-battery");
  await form.getByLabel("Новый пароль").fill("Fresh-river-evening");
  await form.getByLabel("Повторите пароль").fill("Fresh-river-evening");
  await form.getByRole("button", { name: "Сменить пароль" }).click();
  await expect(form.getByRole("alert").first()).toContainText("Текущий пароль указан неверно");

  await form.getByLabel("Текущий пароль").fill(PASSWORD);
  await form.getByRole("button", { name: "Сменить пароль" }).click();
  await expect(form).toContainText("Пароль изменён");

  await page.request.delete("/api/session");
  await page.goto("/login");
  await signIn(page, email, "Fresh-river-evening");
  await expect(page).toHaveURL(/\/check$/, { timeout: 20_000 });
});

test("'keep me signed in' off makes the session end with the browser", async ({ page, context }) => {
  const email = uniqueEmail("remember");
  await registerViaApi(page, email);
  await page.goto("/login");
  await page.getByLabel("Запомнить меня на этом устройстве").uncheck();
  await signIn(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/check$/, { timeout: 20_000 });
  const refresh = (await context.cookies()).find((c) => c.name === "qorgau_refresh");
  expect(refresh?.expires).toBe(-1); // a browser-session cookie
});

test("the next parameter can't send people to another site", async ({ page }) => {
  const email = uniqueEmail("redirect");
  await registerViaApi(page, email);
  await page.goto("/login?next=//evil.example/steal");
  await signIn(page, email, PASSWORD);
  await expect(page).toHaveURL(/localhost:3100\/check$/, { timeout: 20_000 });
});

test("guests see a way to sign in: landing header and pages that need an account", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
  await page.goto("/family");
  await expect(page.getByTestId("sign-in-prompt")).toBeVisible();
});
