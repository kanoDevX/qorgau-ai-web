"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { ApiErrorLine } from "@/components/partner/partner-common";
import { usePartnerUsage } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

/**
 * Usage per day: a stacked bar chart (live vs sandbox) drawn with CSS — no chart library — plus the
 * same numbers as a table for screen readers and keyboard users (§3.13).
 */
export default function PartnerUsagePage() {
  const t = useTranslations("partner.usage");
  const format = useFormatter();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const usage = usePartnerUsage(days);
  const d = usage.data;
  const max = Math.max(1, ...(d?.days.map((x) => x.liveCalls + x.sandboxCalls) ?? [1]));
  const date = (v: string) => format.dateTime(new Date(v), { day: "numeric", month: "short" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("range")}>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={days === r}
            onClick={() => setDays(r)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              days === r ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--text-muted)]",
            )}
          >
            {t("days", { count: r })}
          </button>
        ))}
      </div>

      <ApiErrorLine error={usage.error} />
      {usage.isLoading && <Skeleton className="h-56 w-full rounded-xl" />}

      {d && (
        <>
          <dl className="grid gap-3 sm:grid-cols-4">
            {[
              [t("live"), format.number(d.liveCalls)],
              [t("sandbox"), format.number(d.sandboxCalls)],
              [t("highRisk"), format.number(d.highRiskCalls)],
              [t("billable"), `${format.number(d.billableTenge, { maximumFractionDigits: 2 })} ₸`],
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[var(--text)]">{value}</dd>
              </Card>
            ))}
          </dl>

          <p className="text-sm text-[var(--text-muted)]" data-testid="usage-period">
            {d.planIncludedRequests > 0
              ? t("period", { used: format.number(d.periodLiveCalls), quota: format.number(d.planIncludedRequests) })
              : t("periodNoPack", { used: format.number(d.periodLiveCalls) })}
          </p>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">{t("title")}</h2>
            <div className="flex h-44 items-end gap-[2px]" role="img" aria-label={t("chartLabel")}>
              {d.days.map((x) => {
                const total = x.liveCalls + x.sandboxCalls;
                return (
                  <div key={x.day} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${date(x.day)}: ${x.liveCalls} / ${x.sandboxCalls}`}>
                    <div className="w-full rounded-t-sm bg-[var(--text-subtle)]" style={{ height: `${(x.sandboxCalls / max) * 100}%` }} />
                    <div className="w-full bg-[var(--brand-solid)]" style={{ height: `${(x.liveCalls / max) * 100}%`, minHeight: total > 0 && x.liveCalls > 0 ? 2 : 0 }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-[var(--text-subtle)]">
              <span>{date(d.days[0]!.day)}</span>
              <span>{date(d.days[d.days.length - 1]!.day)}</span>
            </div>
            <p className="mt-2 flex gap-4 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--brand-solid)]" aria-hidden /> {t("live")}</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--text-subtle)]" aria-hidden /> {t("sandbox")}</span>
            </p>
          </Card>

          <details className="rounded-xl border border-[var(--border)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--text)]">{t("tableCaption")}</summary>
            <div className="mt-3 max-w-full overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{t("tableCaption")}</caption>
                <thead>
                  <tr className="text-left text-xs text-[var(--text-muted)]">
                    <th scope="col" className="py-1 pr-3 font-medium">{t("date")}</th>
                    <th scope="col" className="py-1 pr-3 font-medium">{t("live")}</th>
                    <th scope="col" className="py-1 pr-3 font-medium">{t("sandbox")}</th>
                    <th scope="col" className="py-1 pr-3 font-medium">{t("highRisk")}</th>
                    <th scope="col" className="py-1 font-medium">{t("billable")}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[...d.days].reverse().map((x) => (
                    <tr key={x.day} className="border-t border-[var(--border)]">
                      <th scope="row" className="py-1 pr-3 text-left font-normal text-[var(--text-muted)]">{date(x.day)}</th>
                      <td className="py-1 pr-3">{x.liveCalls}</td>
                      <td className="py-1 pr-3">{x.sandboxCalls}</td>
                      <td className="py-1 pr-3">{x.highRiskCalls}</td>
                      <td className="py-1">{format.number(x.billableTenge, { maximumFractionDigits: 2 })} ₸</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
