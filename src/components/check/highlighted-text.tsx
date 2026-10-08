import { useTranslations } from "next-intl";

interface Span {
  start: number;
  end: number;
  signalCode: string;
}

/**
 * The user's own message with the dangerous phrases marked (§5.3, explainability à la Norton
 * Genie). Offsets come from the backend heuristics; overlapping or out-of-range spans are ignored.
 * Each mark carries a screen-reader suffix, so the meaning is not conveyed by colour alone.
 */
export function HighlightedText({ text, highlights }: { text: string; highlights: readonly Span[] }) {
  const t = useTranslations("check");
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  [...highlights]
    .filter((h) => h.start >= 0 && h.end <= text.length && h.end > h.start)
    .sort((a, b) => a.start - b.start)
    .forEach((h, i) => {
      if (h.start < cursor) return;
      if (h.start > cursor) parts.push(text.slice(cursor, h.start));
      parts.push(
        <mark
          key={i}
          className="rounded-[3px] bg-[var(--risk-danger-bg)] px-0.5 text-[var(--risk-danger-fg)] underline decoration-[var(--risk-danger)] decoration-2 underline-offset-2"
        >
          {text.slice(h.start, h.end)}
          <span className="sr-only"> ({t("suspiciousPhrase")})</span>
        </mark>,
      );
      cursor = h.end;
    });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <figure className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <figcaption className="mb-2 text-sm font-semibold text-[var(--text)]">{t("highlightTitle")}</figcaption>
      <blockquote className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-muted)]">{parts}</blockquote>
    </figure>
  );
}
