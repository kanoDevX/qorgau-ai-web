import { expect, test } from "@playwright/test";

const COERCIVE_CHAT =
  "Это служба безопасности банка. Срочно! Немедленно переведите все деньги на безопасный счёт. " +
  "Никому не говорите, это секрет. Действуйте прямо сейчас, счёт заблокируют.";

test.describe("Second opinion before a transfer", () => {
  test("a coercive chat about a new payee forces a cool-down pause", async ({ page }) => {
    await page.goto("/check?mode=transfer");
    // Revolut-style questions first: answer "no" to all, so the pause below comes from the server.
    for (const group of await page.getByRole("group").all()) await group.getByText(/^нет$|^no$/i).click();
    await page.getByRole("button", { name: /проверить получателя|check the recipient/i }).click();

    await page.getByRole("textbox", { name: /получатель|recipient/i }).fill("+77080001122");
    await page
      .getByRole("textbox", { name: /переписка перед переводом|chat before the transfer/i })
      .fill(COERCIVE_CHAT);
    await page.getByRole("button", { name: /^перевести$|^send$/i }).click();

    // The pause interstitial: a "stop" headline + a recipient risk gauge + pressure signals.
    await expect(
      page.getByText(/стоп на несколько секунд|stop for a few seconds/i),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("img", { name: /risk score|оценка риска/i })).toBeVisible();
    await expect(
      page.getByText(/признаки давления|pressure signals/i),
    ).toBeVisible();

    // "Cancel transfer" is the primary action; "send anyway" is gated behind the countdown.
    await expect(page.getByRole("button", { name: /отменить перевод|cancel transfer/i })).toBeEnabled();
    await expect(
      page.getByRole("button", { name: /можно будет перевести|you can send in/i }),
    ).toBeDisabled();

    await page.getByRole("button", { name: /отменить перевод|cancel transfer/i }).click();
    await expect(page.getByText(/перевод отменён|transfer cancelled/i)).toBeVisible();
  });
});
