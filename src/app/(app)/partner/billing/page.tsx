"use client";

import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { ApiErrorLine, usePartner } from "@/components/partner/partner-common";
import { partnerInvoicePdfUrl, useChoosePartnerPlan, usePartnerInvoices, usePricingPlans } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

/** Plans come from the database (§3.10) — the page never hard-codes an amount. */
export default function PartnerBillingPage() {
  const t = useTranslations("partner.billing");
  const tp = useTranslations("pricing");
  const format = useFormatter();
  const locale = useLocale();
  const account = usePartner();
  const plans = usePricingPlans();
  const choose = useChoosePartnerPlan();
  const invoices = usePartnerInvoices();
  const money = (v: number) => `${format.number(v, { maximumFractionDigits: 2 })} ₸`;

  return (
    <div className="space-y-6">
      <section aria-labelledby="plans-title" className="space-y-3">
        <h2 id="plans-title" className="text-sm font-semibold text-[var(--text)]">{t("title")}</h2>
        {plans.data?.some((p) => p.isDraft) && <p className="text-xs text-[var(--risk-caution-fg)]">{tp("draftNote")}</p>}
        {plans.isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
        <div className="grid gap-3 md:grid-cols-3">
          {plans.data?.map((p) => {
            const current = p.code === account.planCode;
            return (
              <Card key={p.code} className={cn("flex flex-col gap-2 p-4", current && "border-[var(--brand)]")} data-testid={`plan-${p.code}`}>
                <p className="flex items-center justify-between font-semibold text-[var(--text)]">
                  {tp(`plans.${p.code}` as never)}
                  {current && <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] text-[var(--brand)]">{t("current")}</span>}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{tp(`plansDesc.${p.code}` as never)}</p>
                <dl className="space-y-0.5 text-xs">
                  <div className="flex justify-between gap-2"><dt className="text-[var(--text-muted)]">{tp("perRequest")}</dt><dd className="tabular-nums">{money(p.pricePerRequestTenge)}</dd></div>
                  {p.includedRequests > 0 && <div className="flex justify-between gap-2"><dt className="text-[var(--text-muted)]">{tp("included")}</dt><dd className="tabular-nums">{format.number(p.includedRequests)}</dd></div>}
                  {p.packPriceTenge > 0 && <div className="flex justify-between gap-2"><dt className="text-[var(--text-muted)]">{tp("packPrice")}</dt><dd className="tabular-nums">{money(p.packPriceTenge)}</dd></div>}
                  <div className="flex justify-between gap-2"><dt className="text-[var(--text-muted)]">{tp("vat")}</dt><dd>{p.vatIncluded ? tp("vatIncluded") : tp("vatExcluded")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--text-muted)]">{tp("rateLimit")}</dt><dd>{tp("perMinute", { count: p.perMinuteLimit })}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--text-muted)]">{tp("overage")}</dt><dd className="text-right">{p.overage === "Block" ? tp("overageBlock") : tp("overagePay")}</dd></div>
                </dl>
                {!current && (
                  <Button size="sm" variant="outline" className="mt-auto" disabled={choose.isPending} onClick={() => choose.mutate(p.code)}>
                    {t("choose")}
                  </Button>
                )}
                {current && <p className="mt-auto flex items-center gap-1 text-xs text-[var(--brand)]"><Check className="size-3.5" aria-hidden /> {t("current")}</p>}
              </Card>
            );
          })}
        </div>
        <ApiErrorLine error={choose.error} />
        <p className="text-xs text-[var(--text-muted)]">
          {tp("refundNote")}{" "}
          <Link href="/legal/refund" className="text-[var(--brand)] underline underline-offset-2">{tp("refundLink")}</Link>.
        </p>
      </section>

      <section aria-labelledby="statements-title" className="space-y-2">
        <h2 id="statements-title" className="text-sm font-semibold text-[var(--text)]">{t("statements")}</h2>
        <p className="text-xs text-[var(--text-muted)]">{t("statementsLead")}</p>
        {invoices.isLoading && <Skeleton className="h-20 w-full rounded-xl" />}
        {invoices.data?.length === 0 && <p className="text-sm text-[var(--text-subtle)]">{t("empty")}</p>}
        {!!invoices.data?.length && (
          <div className="max-w-full overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)]">
                  <th scope="col" className="px-3 py-2 font-medium">{t("period")}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t("calls")}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t("amount")}</th>
                  <th scope="col" className="px-3 py-2 font-medium"><span className="sr-only">{t("pdf")}</span></th>
                </tr>
              </thead>
              <tbody>
                {invoices.data.map((i) => (
                  <tr key={i.period} className="border-t border-[var(--border)]" data-testid="statement-row">
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      {i.period} {i.isOpen && <span className="text-xs text-[var(--text-muted)]">({t("open")})</span>}
                    </th>
                    <td className="px-3 py-2 tabular-nums">{format.number(i.calls)}</td>
                    <td className="px-3 py-2 tabular-nums">{format.number(i.amountTenge, { maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right">
                      <a href={partnerInvoicePdfUrl(i.period, locale)} download className="inline-flex items-center gap-1 text-[var(--brand)] underline underline-offset-2">
                        <Download className="size-3.5" aria-hidden /> {t("pdf")}
                        <span className="sr-only"> {i.period}</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
