/**
 * Client-side mirror of the API's PasswordPolicy (QorgauAI.Application/Users/Passwords.cs) — for instant feedback
 * only; the server is the authority. NIST SP 800-63B style: length over composition rules.
 */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

const COMMON = new Set(
  [
    "1234567890", "12345678910", "0123456789", "1111111111", "0000000000", "1234512345", "9876543210",
    "qwertyuiop", "qwerty1234", "qwerty12345", "1q2w3e4r5t", "1qaz2wsx3edc", "asdfghjkl1", "zxcvbnm123",
    "password12", "password123", "password1!", "passw0rd12", "iloveyou12", "letmein123", "welcome123",
    "admin12345", "abc1234567", "123qweasdzxc", "qwe123qwe123", "aaaaaaaaaa", "princess12", "football12",
    "йцукенгшщз", "йцукен1234", "пароль1234", "пароль12345", "qorgau1234", "qorgauai123", "kazakhstan1",
    "almaty1234", "astana2024", "astana2025", "kaspi12345",
  ].map((p) => p.toLowerCase()),
);

export type PasswordRules = { length: boolean; notCommon: boolean; notEmail: boolean };
export type Strength = "weak" | "fair" | "good" | "strong";

export function passwordRules(password: string, email?: string | null): PasswordRules {
  const local = email?.split("@")[0] ?? "";
  return {
    length: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
    notCommon: !COMMON.has(password.toLowerCase()) && new Set(password).size > 2,
    notEmail: local.length < 4 || !password.toLowerCase().includes(local.toLowerCase()),
  };
}

export function passwordAcceptable(password: string, email?: string | null): boolean {
  const r = passwordRules(password, email);
  return r.length && r.notCommon && r.notEmail;
}

/** A rough guide for the meter: length matters most, variety helps, rule failures cap it at "weak". */
export function passwordStrength(password: string, email?: string | null): Strength {
  if (!passwordAcceptable(password, email)) return "weak";
  const classes = [/[a-zа-яәғқңөұүһі]/u, /[A-ZА-ЯӘҒҚҢӨҰҮҺІ]/u, /\d/, /[^\p{L}\d]/u].filter((re) => re.test(password)).length;
  const words = password.trim().split(/\s+/).length;
  const score = password.length + classes * 2 + (words >= 3 ? 6 : 0);
  if (score >= 26) return "strong";
  if (score >= 18) return "good";
  return "fair";
}
