"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { usePartner } from "@/components/partner/partner-common";
import { AuditView } from "@/components/partner/playground";
import { usePartnerKeys, usePartnerUsage } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

/** Partner overview. P3: every figure comes from the API (usage, plan); nothing is invented. */
export default function PartnerOverviewPage() {
  const t = useTranslations("partner.overview");
  const tp = useTranslations("pricing.plans");
  const format = useFormatter();
  const account = usePartner();
  const usage = usePartnerUsage(30);
  const keys = usePartnerKeys();

  const anyCalls = (usage.data?.liveCalls ?? 0) + (usage.data?.sandboxCalls ?? 0) > 0;
  const steps = [
    { done: (keys.data?.some((k) => !k.live) ?? false), text: t("step1") },
    { done: anyCalls, text: t("step2") },
    { done: account.webhook.enabled, text: t("step3") },
    { done: account.liveAccessApproved, text: t("step4") },
  ];

  const stats = [
    { label: t("plan"), value: tp(account.planCode as never) },
    { label: t("liveAccess"), value: account.liveAccessApproved ? t("liveApproved") : t("livePending") },
    { label: t("monthCalls"), value: usage.data ? format.number(usage.data.periodLiveCalls) : null },
    { label: t("billable"), value: usage.data ? `${format.number(usage.data.billableTenge, { maximumFractionDigits: 2 })} ₸` : null },
    { label: t("highRisk"), value: usage.data ? format.number(usage.data.highRiskCalls) : null },
  ];

  return (
    <div className="space-y-6">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <dt className="text-xs text-[var(--text-muted)]">{s.label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-[var(--text)]">{s.value ?? <Skeleton className="h-6 w-16" />}</dd>
          </Card>
        ))}
      </dl>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-[var(--text)]">{t("stepsTitle")}</h2>
        <ol className="mt-3 space-y-2">
          {steps.map((s) => (
            <li key={s.text} className="flex items-start gap-2 text-sm">
              {s.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--risk-safe-fg)]" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-[var(--text-subtle)]" aria-hidden />
              )}
              <span className={cn(s.done ? "text-[var(--text-muted)]" : "text-[var(--text)]")}>{s.text}</span>
            </li>
          ))}
        </ol>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/partner/docs">{t("openDocs")}</Link>
        </Button>
      </Card>

      <AuditView />
    </div>
  );
}
