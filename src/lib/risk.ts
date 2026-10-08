/**
 * The one place score -> band -> colour -> semantics is defined.
 * Every gauge, badge, chart series and graph node colour reads from here, so the
 * risk scale is identical across the whole product (dataviz discipline, explainability-first).
 * Mirrors the backend's RiskBand thresholds exactly.
 */

export type RiskBand = "Minimal" | "Low" | "Elevated" | "High" | "Critical";

export type RecommendedAction =
  | "Allow"
  | "Caution"
  | "DoNotEngage"
  | "BlockAndReport"
  | "ContactBankImmediately";

export interface RiskVisual {
  band: RiskBand;
  /** CSS variable token name, e.g. "risk-caution" */
  token: "risk-safe" | "risk-low" | "risk-caution" | "risk-danger" | "risk-critical";
  color: string; // var(--risk-*)
  bg: string; // var(--risk-*-bg)
  fg: string; // var(--risk-*-fg) — accessible text colour on --bg
}

export function bandForScore(score: number): RiskBand {
  const s = clampScore(score);
  if (s < 20) return "Minimal";
  if (s < 40) return "Low";
  if (s < 60) return "Elevated";
  if (s < 80) return "High";
  return "Critical";
}

const BY_BAND: Record<RiskBand, RiskVisual> = {
  Minimal: { band: "Minimal", token: "risk-safe", color: "var(--risk-safe)", bg: "var(--risk-safe-bg)", fg: "var(--risk-safe-fg)" },
  Low: { band: "Low", token: "risk-low", color: "var(--risk-low)", bg: "var(--risk-low-bg)", fg: "var(--risk-low-fg)" },
  Elevated: { band: "Elevated", token: "risk-caution", color: "var(--risk-caution)", bg: "var(--risk-caution-bg)", fg: "var(--risk-caution-fg)" },
  High: { band: "High", token: "risk-danger", color: "var(--risk-danger)", bg: "var(--risk-danger-bg)", fg: "var(--risk-danger-fg)" },
  Critical: { band: "Critical", token: "risk-critical", color: "var(--risk-critical)", bg: "var(--risk-critical-bg)", fg: "var(--risk-critical-fg)" },
};

export function riskVisual(input: number | RiskBand): RiskVisual {
  const band = typeof input === "number" ? bandForScore(input) : input;
  return BY_BAND[band];
}

export function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Sequential 0-100 scale for heatmaps / node fill — same hue family as the badges. */
export function riskGradient(score: number): string {
  return riskVisual(score).color;
}

export const SCAM_CATEGORY_LABELS: Record<string, { ru: string; en: string; kk: string }> = {
  Unknown: { ru: "Не определено", en: "Unknown", kk: "Белгісіз" },
  BankImpersonationCall: { ru: "Звонок «из банка»", en: "Bank impersonation call", kk: "«Банктен» қоңырау" },
  PhishingLink: { ru: "Фишинговая ссылка", en: "Phishing link", kk: "Фишинг сілтеме" },
  MessengerAccountTakeover: { ru: "Взлом мессенджера", en: "Messenger takeover", kk: "Мессенджерді бұзу" },
  InvestmentScam: { ru: "Фейковые инвестиции", en: "Investment scam", kk: "Жалған инвестиция" },
  MarketplacePrepayment: { ru: "Предоплата на объявлении", en: "Marketplace prepayment", kk: "Хабарландыруға алдын ала төлем" },
  IdentityTheftLoan: { ru: "Кредит на чужое имя", en: "Loan identity theft", kk: "Бөтеннің атына несие" },
  MoneyMuleRecruitment: { ru: "Вербовка дропа", en: "Money-mule recruitment", kk: "Дроп жалдау" },
  DeepfakeImpersonation: { ru: "Дипфейк голоса/видео", en: "Deepfake impersonation", kk: "Дипфейк дауыс/видео" },
  RomanceScam: { ru: "Романтический развод", en: "Romance scam", kk: "Романтикалық алаяқтық" },
  BusinessEmailCompromise: { ru: "Поддельные счета (BEC)", en: "Business email compromise", kk: "Жалған шот-фактура" },
  JobOfferScam: { ru: "Фейковая работа", en: "Fake job offer", kk: "Жалған жұмыс" },
  Other: { ru: "Другое", en: "Other", kk: "Басқа" },
};
