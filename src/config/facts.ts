/**
 * Every statistic shown on the site lives here with its source and "as of" date (§3.12).
 * Only entries with `verified: true` are rendered. Unverified entries are kept as TODOs so the owner
 * can confirm the figure against the primary source before it appears publicly.
 */
export interface Fact {
  id: string;
  /** Display value, language-neutral (digits + unit symbols only). */
  value: string;
  sourceName: string;
  sourceUrl?: string;
  asOf: string;
  verified: boolean;
  /** For unverified facts: where to look. */
  todo?: string;
}

export const FACTS: Fact[] = [
  {
    id: "worldLosses",
    value: "16.6",
    sourceName: "FBI IC3, Internet Crime Report 2024",
    sourceUrl: "https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf",
    asOf: "2025-04",
    verified: true,
    todo: "Owner: re-check the figure against the PDF before launch (losses reported in the USA, not worldwide).",
  },
  {
    id: "kzCrimeShare",
    value: "—",
    sourceName: "Комитет по правовой статистике и специальным учётам ГП РК",
    asOf: "{{DATE}}",
    verified: false,
    todo: "Find the current share of internet fraud in registered crimes; write value + date.",
  },
];

export const getFact = (id: string) => FACTS.find((f) => f.id === id && f.verified);
