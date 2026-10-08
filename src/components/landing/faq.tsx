"use client";

import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/primitives";

const QUESTIONS = ["free", "data", "accuracy", "scammed", "family", "business"] as const;

/** Plain answers to the questions people ask before trusting a security tool with a message. */
export function Faq() {
  const t = useTranslations("faq");
  return (
    <section aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h2 id="faq-title" className="text-[length:var(--text-heading)] font-semibold text-[var(--text)]">
        {t("title")}
      </h2>
      <Accordion type="single" collapsible className="mt-4">
        {QUESTIONS.map((q) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger className="text-base">{t(`${q}.q`)}</AccordionTrigger>
            <AccordionContent className="max-w-prose leading-relaxed">{t(`${q}.a`)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
