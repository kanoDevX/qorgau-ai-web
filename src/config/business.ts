/**
 * Single source of truth for legal / business details shown in the footer, /about and the legal pages.
 *
 * TODO(owner): replace every `{{...}}` placeholder with the real value before public launch.
 * Do NOT invent registration data — placeholders render visibly as "to be filled in" so nobody
 * mistakes them for real details. Set `legalReviewed` to true only after a lawyer has approved
 * the texts in `src/content/legal.ts`.
 */
export const business = {
  legalName: "{{COMPANY_NAME}}",
  legalForm: "{{COMPANY_LEGAL_FORM}}", // e.g. ИП / ТОО
  bin: "{{COMPANY_BIN}}", // БИН / ИИН
  address: "{{COMPANY_ADDRESS}}",
  supportEmail: "{{SUPPORT_EMAIL}}",
  supportPhone: "{{SUPPORT_PHONE}}",
  dpoName: "{{DPO_NAME}}", // ответственный за персональные данные
  dpoEmail: "{{DPO_EMAIL}}",
  /** Date of the current legal texts — must match PolicyVersions.Privacy on the backend. */
  policyVersion: "2026-10-03",
  legalReviewed: false,
} as const;

export const isPlaceholder = (value: string) => value.startsWith("{{") && value.endsWith("}}");
