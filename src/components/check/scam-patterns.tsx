"use client";

import { useLocale, useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Skeleton } from "@/components/ui/primitives";
import { useScamPatterns } from "@/lib/api/hooks";

/** Catalogue of common KZ schemes from GET /scam-patterns: how each one sounds and what to do. */
export function ScamPatterns({ limit, headingLevel = 2 }: { limit?: number; headingLevel?: 2 | 3 }) {
  const t = useTranslations("patterns");
  const locale = useLocale();
  const patterns = useScamPatterns(locale);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const list = limit ? (patterns.data ?? []).slice(0, limit) : (patterns.data ?? []);

  return (
    <section aria-labelledby="patterns-title">
      <Heading id="patterns-title" className="text-[length:var(--text-heading)] font-semibold text-[var(--text)]">
        {t("title")}
      </Heading>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{t("lead")}</p>
      {patterns.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-[var(--radius-xl)]" />}
      {patterns.isError && <p className="mt-4 text-sm text-[var(--text-muted)]">{t("unavailable")}</p>}
      <Accordion type="single" collapsible className="mt-3">
        {list.map((p) => (
          <AccordionItem key={p.code} value={p.code}>
            <AccordionTrigger className="text-base">{p.title}</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="leading-relaxed">{p.summary}</p>
              <blockquote className="rounded-[var(--radius-md)] border-l-4 border-[var(--risk-danger)] bg-[var(--surface-2)] p-3 text-sm italic text-[var(--text)]">
                <span className="sr-only">{t("example")}: </span>
                {p.exampleMessage}
              </blockquote>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{t("signs")}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {p.signs?.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{t("whatToDo")}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {p.whatToDo?.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
