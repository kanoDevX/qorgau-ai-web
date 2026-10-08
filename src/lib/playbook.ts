/**
 * Maps a verdict to the "what to do right now" playbook shown under it (§5.3). Five playbooks cover
 * every category; safe verdicts get their own calm one. Texts live in messages → check.playbook.*.
 */
export type Playbook = "call" | "link" | "relative" | "money" | "generic" | "safe";

const BY_CATEGORY: Record<string, Playbook> = {
  BankImpersonationCall: "call",
  DeepfakeImpersonation: "call",
  IdentityTheftLoan: "call",
  PhishingLink: "link",
  MessengerAccountTakeover: "relative",
  RomanceScam: "relative",
  InvestmentScam: "money",
  JobOfferScam: "money",
  MoneyMuleRecruitment: "money",
  MarketplacePrepayment: "money",
  BusinessEmailCompromise: "money",
};

export function playbookFor(band: string, category: string): Playbook {
  if (band === "Minimal" || band === "Low") return "safe";
  return BY_CATEGORY[category] ?? "generic";
}
