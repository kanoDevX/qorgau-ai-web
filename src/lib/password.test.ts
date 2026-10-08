import { describe, expect, it } from "vitest";
import { passwordAcceptable, passwordRules, passwordStrength } from "./password";

describe("password rules (mirror of the API policy)", () => {
  it("rejects short, common, repetitive and e-mail-based passwords", () => {
    expect(passwordRules("short").length).toBe(false);
    expect(passwordRules("qwerty1234").notCommon).toBe(false);
    expect(passwordRules("ЙЦУКЕН1234").notCommon).toBe(false);
    expect(passwordRules("aaaaaaaaaaaa").notCommon).toBe(false);
    expect(passwordRules("aigul.retiree-2026", "aigul.retiree@example.kz").notEmail).toBe(false);
  });

  it("accepts long passphrases in any of our languages", () => {
    expect(passwordAcceptable("тихий вечер у реки")).toBe(true);
    expect(passwordAcceptable("Қызыл алма 2026")).toBe(true);
    expect(passwordAcceptable("Correct-horse-battery")).toBe(true);
  });

  it("rates strength by length first", () => {
    expect(passwordStrength("qwerty1234")).toBe("weak");
    expect(passwordStrength("abcdefghij")).toBe("fair");
    expect(passwordStrength("Correct-horse-battery")).toBe("strong");
    expect(passwordStrength("тихий вечер у реки")).toBe("strong");
  });
});
