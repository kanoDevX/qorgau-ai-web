/**
 * Omni-input type detection (§5.2 "Check"): one field accepts a message, a link, a phone number or
 * an IBAN, and we route it to the right check. Pure and unit-tested (input-detect.test.ts).
 *
 * Card numbers are recognised only so we can *refuse* them: a full card number must never be sent
 * anywhere, and the reputation lookup works on the recipient's phone or IBAN instead.
 */
export type InputKind = "empty" | "text" | "url" | "phone" | "iban" | "card";

export interface DetectedInput {
  kind: InputKind;
  /** Canonical form used for the lookup / scan (e.g. +77010000001, KZ86125KZT5004100100). */
  value: string;
}

const PHONE_CHARS = /^[+\d\s().-]+$/;
const IBAN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
// A single "word" that looks like a host, optionally with scheme/path: kaspi.kz, https://bit.ly/x
const URL_LIKE = /^(?:https?:\/\/)?(?:[\p{L}\d-]+\.)+[\p{L}]{2,}(?::\d{2,5})?(?:[/?#]\S*)?$/iu;

export function detectInput(raw: string): DetectedInput {
  const text = raw.trim();
  if (!text) return { kind: "empty", value: "" };

  // Multi-line or long free text is always a message, even if it contains a link or number.
  const singleToken = !/\s/.test(text.replace(/[\s().-]+(?=\d)/g, ""));

  if (PHONE_CHARS.test(text)) {
    const digits = text.replace(/\D/g, "");
    if (isLuhn(digits) && digits.length >= 13 && digits.length <= 19 && !looksLikeKzPhone(digits)) {
      return { kind: "card", value: "" };
    }
    if (looksLikeKzPhone(digits)) {
      const national = digits.length === 11 ? digits.slice(1) : digits;
      return { kind: "phone", value: `+7${national}` };
    }
  }

  const compact = text.replace(/\s+/g, "").toUpperCase();
  if (IBAN.test(compact) && compact.length <= 34) return { kind: "iban", value: compact };

  if (singleToken && URL_LIKE.test(text) && !/^\d+(\.\d+)+$/.test(text)) {
    return { kind: "url", value: text };
  }

  return { kind: "text", value: text };
}

function looksLikeKzPhone(digits: string): boolean {
  // +7 7xx xxx xx xx (mobile) or +7 7xxx (city) — 11 digits starting with 7/8, or 10 digits starting with 7.
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8") && digits[1] === "7") return true;
  if (digits.length === 10 && digits[0] === "7") return true;
  return false;
}

/** Luhn checksum — tells a card number from other long digit strings. */
export function isLuhn(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}
