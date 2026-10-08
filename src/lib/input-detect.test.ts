import { describe, expect, it } from "vitest";
import { detectInput, isLuhn } from "./input-detect";

describe("omni-input detection", () => {
  it.each([
    ["+7 701 000 00 01", "+77010000001"],
    ["8 (701) 000-00-01", "+77010000001"],
    ["87010000001", "+77010000001"],
    ["7010000001", "+77010000001"],
  ])("phone %s → %s", (raw, value) => {
    expect(detectInput(raw)).toEqual({ kind: "phone", value });
  });

  it.each([
    ["KZ86125KZT5004100100", "KZ86125KZT5004100100"],
    ["kz86 125k zt50 0410 0100", "KZ86125KZT5004100100"],
    ["DE89370400440532013000", "DE89370400440532013000"],
  ])("IBAN %s", (raw, value) => {
    expect(detectInput(raw)).toEqual({ kind: "iban", value });
  });

  it.each(["kaspi.kz", "https://bit.ly/3abc", "kaspi-secure-login.com/pay?id=1", "http://egov-kz-pay.org", "қорғау.қаз"])(
    "url %s",
    (raw) => {
      expect(detectInput(raw).kind).toBe("url");
    },
  );

  it("refuses card numbers and never returns their digits", () => {
    expect(detectInput("4111 1111 1111 1111")).toEqual({ kind: "card", value: "" });
    expect(detectInput("5500-0000-0000-0004")).toEqual({ kind: "card", value: "" });
  });

  it.each([
    "Это служба безопасности банка. Перейдите по ссылке kaspi-secure.com",
    "Мама, срочно переведи 5000 на +77010000001",
    "hello",
    "1.2.3",
  ])("message %s", (raw) => {
    expect(detectInput(raw).kind).toBe("text");
  });

  it("empty input", () => {
    expect(detectInput("   ").kind).toBe("empty");
  });

  it("luhn", () => {
    expect(isLuhn("4111111111111111")).toBe(true);
    expect(isLuhn("4111111111111112")).toBe(false);
  });
});
