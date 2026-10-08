"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Check, PhoneCall, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { setFlag } from "@/lib/history";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { SCAM_CATEGORY_LABELS } from "@/lib/risk";
import { useGoldenHour } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export default function GoldenHourPage() {
  const t = useTranslations("goldenHour");
  const locale = useLocale() as Locale;
  const golden = useGoldenHour();
  const [category, setCategory] = useState("BankImpersonationCall");
  const [done, setDone] = useState<Set<number>>(new Set());
  // Offline fallback in the viewer's language — the golden hour must not depend on connectivity.
  const offlineSteps = (t.raw("offline") as { title: string; detail: string }[]).map((s, i) => ({
    ...s,
    timeCritical: i < 2,
  }));
  const contactList = t.raw("contactList") as string[];

  function pick(c: string) {
    setCategory(c);
    setDone(new Set());
    // One tap = a plan tailored to this scheme (AI when available, static otherwise).
    golden.mutate({ category: c, languageCode: locale });
  }
  useEffect(() => setFlag("sosPlan"), []);

  const steps = golden.data?.steps?.length
    ? golden.data.steps.map((s) => ({ title: s.title ?? "", detail: s.detail ?? "", timeCritical: !!s.timeCritical }))
    : offlineSteps;

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />

      <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
        <WifiOff className="size-3.5" /> {t("offlineNote")}
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {["BankImpersonationCall", "IdentityTheftLoan", "InvestmentScam", "MarketplacePrepayment"].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => pick(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              category === c
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]",
            )}
          >
            {SCAM_CATEGORY_LABELS[c]?.[locale] ?? c}
          </button>
        ))}
        {golden.isPending && (
          <span className="inline-flex items-center px-2 text-xs text-[var(--text-subtle)]" role="status">
            {t("refresh")}…
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <ol className="space-y-3">
          {steps.map((s, i) => {
            const isDone = done.has(i);
            return (
              <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={cn("flex items-start gap-4 p-4", isDone && "border-[var(--risk-safe)] bg-[var(--bg-elevated)]")}>
                  <button
                    type="button"
                    aria-pressed={isDone}
                    onClick={() => setDone((d) => { const n = new Set(d); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                      isDone
                        ? "border-[var(--risk-safe)] bg-[var(--risk-safe-bg)] text-[var(--risk-safe-fg)]"
                        : "border-[var(--brand)] text-[var(--brand)]",
                    )}
                    aria-label={t("markStep", { n: i + 1 })}
                  >
                    {isDone ? <Check className="size-4" /> : i + 1}
                  </button>
                  <div>
                    <p className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                      {s.title}
                      {s.timeCritical && (
                        <span className="rounded-full bg-[var(--risk-critical-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--risk-critical-fg)]">
                          {t("timeCritical")}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{s.detail}</p>
                  </div>
                </Card>
              </motion.li>
            );
          })}
        </ol>

        <aside>
          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <PhoneCall className="size-4 text-[var(--brand)]" /> {t("contacts")}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-muted)]">
              {(golden.data?.emergencyContactsKz ?? contactList).map((c, i) => {
                // A panicking victim on a phone should tap to call, not copy digits by hand.
                const phone = /^\s*(\d{3,4})\b/.exec(c)?.[1];
                return (
                  <li key={i}>
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--text)] hover:border-[var(--brand)]"
                      >
                        <PhoneCall className="size-3.5 shrink-0 text-[var(--brand)]" aria-hidden />
                        <span>{c}</span>
                      </a>
                    ) : (
                      <span className="block px-3 py-1">• {c}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
