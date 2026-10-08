import { expect, test } from "@playwright/test";

test.describe("Public lookup + community radar", () => {
  test("looking up a number returns a shareable reputation card", async ({ page }) => {
    await page.goto("/check");
    await page.getByRole("textbox", { name: /проверка сообщения|check a message/i }).fill("+7 701 000 00 01");
    await expect(page.getByText(/похоже на номер телефона/i)).toBeVisible();
    await page.getByRole("button", { name: /^проверить$|^check$/i }).first().click();

    // A verdict card with a gauge (never a bare number) + a share action.
    await expect(page.getByRole("img", { name: /risk score|оценка риска/i })).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/no reports found|жалоб не найдено|confirmed fraud|подтверждённое|suspicious|подозрения/i).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /share|поделиться/i })).toBeVisible();
  });

  test("the community radar opens the report form with client-side validation", async ({ page }) => {
    await page.goto("/radar");

    await page.getByRole("button", { name: /report a scammer|сообщить о мошеннике/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Submit empty → Zod validation messages appear, nothing is sent.
    await dialog.getByRole("button", { name: /^report a scammer$|^сообщить о мошеннике$/i }).click();
    await expect(dialog.getByText(/укажите номер|минимум|опишите/i).first()).toBeVisible();
  });
});
