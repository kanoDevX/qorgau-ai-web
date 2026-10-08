import { expect, test } from "@playwright/test";

test.describe("Complete a lesson → earn XP", () => {
  test("a new learner answers correctly, earns XP, and progress survives a reload", async ({ page }) => {
    // A fresh account per run: progress is now persisted server-side, so the shared demo user
    // would already have every lesson completed after the first run.
    await page.goto("/");
    const res = await page.request.post("/api/session", {
      data: {
        mode: "register",
        email: `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.kz`,
        displayName: "E2E learner",
        track: "Retiree",
        password: "Correct-horse-battery",
        acceptedPolicy: true, // §3.6: the server refuses registration without explicit consent
        onboardingRole: "self",
      },
    });
    expect(res.ok()).toBeTruthy();

    await page.goto("/learn");

    // Only the first lesson is unlocked for a new learner.
    const startButtons = page.getByRole("button", { name: /start lesson|начать урок/i });
    await expect(startButtons.first()).toBeEnabled({ timeout: 15_000 });
    await startButtons.first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /continue|продолжить/i }).click();

    // The seeded bank-call lesson: option B ("hang up and call the bank back") is correct.
    await dialog.getByRole("button", { name: /перезвонить|call.*back/i }).click();
    await dialog.getByRole("button", { name: /^done$|^готово$/i }).first().click();

    // Graded server-side → full points.
    await expect(dialog.getByText(/верно|correct/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/\+\s*20\s*(XP|очков)/i)).toBeVisible();
    await dialog.getByRole("button", { name: /^done$|^готово$/i }).click();

    // Progress is persisted: after a reload the lesson stays completed and the next one unlocks.
    await page.reload();
    await expect(page.getByRole("button", { name: /^completed$|^пройдено$/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(startButtons.first()).toBeEnabled();
  });
});
