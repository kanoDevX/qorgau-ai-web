"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ScrollText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Skeleton } from "@/components/ui/primitives";
import { RiskBadge } from "@/components/risk/risk-badge";
import { useAuditLedger, usePartnerRiskCheck } from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { bandForScore } from "@/lib/risk";
import { cn } from "@/lib/utils";

// Development only: the seeded docs sandbox key (backend PartnerDemoSeeder). Never in production builds.
const DEV_SANDBOX_KEY = process.env.NODE_ENV !== "production" ? "pk_test_qorgaudemo0000000000000000" : "";

/* ---------- Checkout playground — how the widget looks inside a 3rd-party flow ---------- */

export function CheckoutPlayground() {
  const t = useTranslations("partner");
  const td = useTranslations("partner.docs");
  const locale = useLocale();
  const [apiKey, setApiKey] = useState(DEV_SANDBOX_KEY);
  const [identifier, setIdentifier] = useState("+77000000666");
  const [text, setText] = useState(t("sampleMessage"));
  const check = usePartnerRiskCheck(apiKey.trim());
  const r = check.data;
  const band = bandForScore(r?.riskScore ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-5">
        <p className="text-xs text-[var(--text-subtle)]">{t("mockStore")}</p>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="pg-key" className="text-xs text-[var(--text-muted)]">{td("apiKey")}</label>
            <Input id="pg-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="pk_test_…" className="mt-1 font-mono text-xs" autoComplete="off" spellCheck={false} />
          </div>
          <div>
            <label htmlFor="pg-recipient" className="text-xs text-[var(--text-muted)]">{t("recipient")}</label>
            <Input id="pg-recipient" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label htmlFor="pg-message" className="text-xs text-[var(--text-muted)]">{t("sellerMessage")}</label>
            <Input id="pg-message" value={text} onChange={(e) => setText(e.target.value)} className="mt-1" />
          </div>
          <Button
            className="w-full"
            disabled={check.isPending || !apiKey.trim()}
            onClick={() => check.mutate({ recipientIdentifier: identifier, text, languageCode: locale })}
          >
            {t("checkRecipient")}
          </Button>

          {r && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-xl border p-3 text-sm",
                band === "Critical" || band === "High"
                  ? "border-[var(--risk-danger)] bg-[var(--risk-danger-bg)] text-[var(--risk-danger-fg)]"
                  : "border-[var(--risk-caution)] bg-[var(--risk-caution-bg)] text-[var(--risk-caution-fg)]",
              )}
            >
              <p className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="size-4" aria-hidden /> {t("widgetTitle")}
              </p>
              <p className="mt-1">{r.redFlags?.slice(0, 2).join(" · ") || t("widgetFallback")}</p>
            </motion.div>
          )}
          {check.error && <p className="text-xs text-[var(--risk-danger-fg)]">{toApiError(check.error).message}</p>}
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">{t("apiResponse")}</p>
        {check.isPending && <Skeleton className="h-64 w-full rounded-xl" />}
        {r ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RiskBadge band={(r.riskBand ?? "Minimal") as never} size="lg" />
              <span className="text-sm text-[var(--text-muted)]">{r.category}</span>
              {r.degradedMode && (
                <span className="rounded-full border border-[var(--warning)] px-2 py-0.5 text-[11px] text-[var(--risk-caution-fg)]">
                  degraded
                </span>
              )}
            </div>
            {r.recipient && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs">
                <p className="text-[var(--text-muted)]">
                  {t("recipientSummary", {
                    masked: r.recipient.masked ?? "",
                    verdict: r.recipient.verdict ?? "",
                    reports: r.recipient.totalReports ?? 0,
                  })}
                  {r.recipient.inFraudCluster && ` · ${t("inCluster")}`}
                </p>
              </div>
            )}
            <pre className="max-h-64 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-[11px] leading-relaxed text-[var(--text-muted)]">
              {JSON.stringify(r, null, 2)}
            </pre>
          </div>
        ) : (
          <Card className="p-6 text-sm text-[var(--text-subtle)]">
            <code className="text-xs text-[var(--text-muted)]">
              POST /api/v1/partners/risk-check
              <br />
              X-Api-Key: {apiKey ? `${apiKey.slice(0, 16)}…` : "pk_test_…"}
            </code>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- Audit trail ---------- */

export function AuditView() {
  const t = useTranslations("partner");
  const ledger = useAuditLedger(true);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="size-4 text-[var(--brand)]" aria-hidden /> {t("auditTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--text-muted)]">{t("auditLead")}</p>
        {ledger.isLoading && <Skeleton className="mt-3 h-16 w-full rounded-xl" />}
        {ledger.data && (
          <div
            className={cn(
              "mt-3 flex items-center gap-3 rounded-xl border p-4",
              ledger.data.isIntact
                ? "border-[var(--risk-safe)] bg-[var(--risk-safe-bg)]"
                : "border-[var(--risk-critical)] bg-[var(--risk-critical-bg)]",
            )}
          >
            {ledger.data.isIntact ? (
              <ShieldCheck className="size-5 text-[var(--risk-safe-fg)]" aria-hidden />
            ) : (
              <ScrollText className="size-5 text-[var(--risk-critical-fg)]" aria-hidden />
            )}
            <div>
              <p
                className="font-semibold"
                style={{ color: ledger.data.isIntact ? "var(--risk-safe-fg)" : "var(--risk-critical-fg)" }}
              >
                {ledger.data.isIntact ? t("chainIntact") : t("chainBroken", { seq: ledger.data.firstBrokenSequence ?? 0 })}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{t("checked", { count: ledger.data.checkedEntries ?? 0 })}</p>
            </div>
          </div>
        )}
        {ledger.isError && <p role="alert" className="mt-3 text-xs text-[var(--risk-danger-fg)]">{toApiError(ledger.error).message}</p>}
      </CardContent>
    </Card>
  );
}
