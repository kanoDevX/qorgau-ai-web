import { CreditCard, Fingerprint, Globe, Mail, MessageCircle, Phone, Landmark, Wallet } from "lucide-react";

/** Node kinds map to design tokens (globals.css → --graph-*), never to hex values. */
export const NODE_KIND_META: Record<string, { color: string; icon: typeof Phone }> = {
  PhoneNumber: { color: "var(--graph-phone)", icon: Phone },
  Iban: { color: "var(--graph-iban)", icon: Landmark },
  CardNumber: { color: "var(--graph-card)", icon: CreditCard },
  Domain: { color: "var(--graph-domain)", icon: Globe },
  DeviceFingerprint: { color: "var(--graph-device)", icon: Fingerprint },
  CryptoWallet: { color: "var(--graph-crypto)", icon: Wallet },
  MessengerHandle: { color: "var(--graph-messenger)", icon: MessageCircle },
  Email: { color: "var(--graph-email)", icon: Mail },
};

export const CONFIRMED_FRAUD_COLOR = "var(--risk-critical)";

export function nodeColor(kind: string, confirmedFraud: boolean): string {
  if (confirmedFraud) return CONFIRMED_FRAUD_COLOR;
  return NODE_KIND_META[kind]?.color ?? "var(--graph-email)";
}

/**
 * Canvas cannot read CSS variables, so resolve "var(--x)" against the current theme at draw time.
 * Cheap: getComputedStyle is cached by the browser between style recalculations.
 */
export function resolveColor(value: string): string {
  const m = value.match(/^var((--[w-]+))$/);
  if (!m?.[1] || typeof document === "undefined") return value;
  return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || value;
}
