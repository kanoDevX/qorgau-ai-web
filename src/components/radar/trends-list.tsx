"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/primitives";
import { useScamPatterns, useTrends } from "@/lib/api/hooks";
import { SCAM_CATEGORY_LABELS } from "@/lib/risk";
import type { Locale } from "@/lib/i18n/config";

/** "Schemes of the week" (§5.3): most-reported schemes and how they changed vs the previous period. */
export function TrendsList({ days = 7, limit = 6, withAdvice = true }: { days?: number; limit?: number; withAdvice?: boolean }) {
  const t = useTranslations("trends");
  const locale = useLocale() as Locale;
  const trends = useTrends(days);
  const patterns = useScamPatterns(locale);
  const byCode = new Map((patterns.data ?? []).map((p) => [p.code, p]));
  const rows = (trends.data ?? []).slice(0, limit);

  return (
    <section aria-labelledby="trends-title" className="space-y-3">
      <h2 id="trends-title" className="text-[length:var(--text-heading)] font-semibold text-[var(--text)]">
        {t("title")}
      </h2>
      {trends.isLoading && <Skeleton className="h-32 w-full rounded-[var(--radius-xl)]" />}
      {trends.isError && <p className="text-sm text-[var(--text-muted)]">{t("unavailable")}</p>}
      {trends.data && rows.length === 0 && <p className="text-sm text-[var(--text-muted)]">{t("empty")}</p>}
      <ol className="space-y-2">
        {rows.map((r, i) => {
          const change = r.changePercent;
          const Icon = change == null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
          const pattern = r.patternCode ? byCode.get(r.patternCode) : undefined;
          return (
            <li key={r.category} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-[var(--text)]">
                  <span className="mr-2 text-[var(--text-subtle)]">{i + 1}.</span>
                  {SCAM_CATEGORY_LABELS[r.category]?.[locale] ?? r.category}
                </p>
                <p className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                  {t("reports", { count: r.count ?? 0 })}
                  <span
                    className="inline-flex items-center gap-0.5 font-medium"
                    style={{ color: change && change > 0 ? "var(--risk-danger-fg)" : "var(--text-muted)" }}
                  >
                    <Icon className="size-4" aria-hidden />
                    {change == null ? t("new") : t("change", { change: `${change > 0 ? "+" : ""}${change}` })}
                  </span>
                </p>
              </div>
              {withAdvice && pattern && (
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                  {pattern.whatToDo?.[0]}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
