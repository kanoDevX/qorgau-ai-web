import { expect, test } from "@playwright/test";

const PHISHING_TEXT =
  "This is the bank security department. A suspicious transaction was flagged. Tell me the SMS code now and do not tell anyone, or your account will be blocked.";

test.describe("Scam check → verdict (no login)", () => {
  test("landing hero returns an explainable verdict", async ({ page }) => {
    await page.goto("/");

    const textarea = page.getByRole("textbox", { name: /check a message|проверка сообщения/i }).first();
    await textarea.fill(PHISHING_TEXT);

    await page.getByRole("button", { name: /^check$|^проверить$|^tekseru$/i }).first().click();

    // The verdict card: a gauge with a numeric score + a recommended action.
    const scoreImg = page.getByRole("img", { name: /risk score|оценка риска/i });
    await expect(scoreImg).toBeVisible({ timeout: 40_000 });

    // A recommended-action label is shown alongside the score (never a bare number).
    await expect(page.getByText(/^what to do right now$|^что сделать прямо сейчас$/i)).toBeVisible();

    // Explainability accordion is present, then expand → per-layer breakdown appears.
    const whyTrigger = page.getByRole("button", { name: /why this score|почему такая оценка/i });
    await whyTrigger.scrollIntoViewIfNeeded();
    await whyTrigger.click();
    const panel = page.getByRole("region", { name: /why this score|почему такая оценка/i });
    await expect(panel.getByText(/rules & signals|правила и признаки/i)).toBeVisible();
    await expect(panel.getByText(/confidence|уверенность/i).first()).toBeVisible();
  });

  test("check page offers attaching a screenshot, QR photo or recording", async ({ page }) => {
    await page.goto("/check");
    await expect(page.getByRole("button", { name: /прикрепить файл|attach a file/i })).toBeVisible();
  });
});
