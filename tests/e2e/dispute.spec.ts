import { expect, test } from "@playwright/test";

const PHISHING_TEXT =
  "This is the bank security department. A suspicious transaction was flagged. Tell me the SMS code now " +
  "and do not tell anyone, or your account will be blocked.";

test.describe("Dispute a verdict (Explainable-AI / human-in-the-loop)", () => {
  test("signed-in user can flag a verdict as wrong and it routes to review", async ({ page }) => {
    // Onboard → seeded demo sign-in.
    await page.goto("/onboarding");
    await page.getByRole("button", { name: /myself|себя/i }).click();
    await page.getByRole("button", { name: /continue|продолжить/i }).click();
    await page.waitForURL(/\/check/);

    await page.getByRole("textbox", { name: /check a message|проверка сообщения/i }).first().fill(PHISHING_TEXT);
    await page.getByRole("button", { name: /^check$|^проверить$/i }).first().click();
    await expect(page.getByRole("img", { name: /risk score|оценка риска/i })).toBeVisible({ timeout: 40_000 });

    // Open the dispute panel from the verdict card.
    await page.getByRole("button", { name: /think this verdict is wrong|считаю оценку ошибочной/i }).click();

    const reason = page.getByRole("textbox", { name: /report a wrong verdict|сообщить об ошибке/i });
    await expect(reason).toBeVisible();
    await reason.fill("This is a genuine message from my bank, confirmed by calling 505.");
    await page.getByRole("button", { name: /send for review|отправить на проверку/i }).click();

    await expect(page.getByText(/sent for human review|отправлена на проверку человеку/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
