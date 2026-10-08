"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Share2, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RiskGauge } from "@/components/risk/risk-gauge";
import type { Reputation } from "@/lib/api/hooks";
import { SCAM_CATEGORY_LABELS } from "@/lib/risk";
import type { Locale } from "@/lib/i18n/config";
import { cn, formatRelative } from "@/lib/utils";

/** Community reputation of a phone number or IBAN (the former /lookup screen, now part of Check). */
const VERDICT_META: Record<string, { icon: typeof ShieldCheck; token: "safe" | "caution" | "danger" }> = {
  confirmed_fraud: { icon: ShieldAlert, token: "danger" },
  high_risk: { icon: ShieldAlert, token: "danger" },
  suspicious: { icon: ShieldQuestion, token: "caution" },
  some_reports: { icon: ShieldQuestion, token: "caution" },
  no_reports: { icon: ShieldCheck, token: "safe" },
};

export function LookupResult({ data }: { data: Reputation }) {
  const t = useTranslations("lookup");
  const locale = useLocale() as Locale;
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const verdict = data.verdict ?? "no_reports";
  const meta = VERDICT_META[verdict] ?? VERDICT_META.no_reports!;
  const color = `var(--risk-${meta.token})`;
  const bg = `var(--risk-${meta.token}-bg)`;
  const fg = `var(--risk-${meta.token}-fg)`;
  const Icon = meta.icon;
  const score = data.communityRiskScore ?? (verdict === "no_reports" ? 0 : 50);

  const shareText = t("shareText", {
    id: data.identifierMasked,
    verdict: t(`verdict.${verdict}` as never),
    count: String(data.totalReports ?? 0),
  });

  async function share() {
    try {
      if (canShare) {
        await navigator.share({ title: "QorgauAI", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-4 p-5" style={{ background: `linear-gradient(180deg, ${bg}, transparent)` }}>
        <RiskGauge score={score} size={128} />
        <div className="min-w-0 flex-1">
          <p className="font-id text-sm text-[var(--text)]">{data.identifierMasked}</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold" style={{ color: fg }}>
            <Icon className="size-5" style={{ color }} aria-hidden />
            {t(`verdict.${verdict}` as never)}
          </p>
          <p className="text-xs text-[var(--text-subtle)]">{data.kind}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-[var(--border)] bg-[var(--border)] text-center sm:grid-cols-4">
        <Stat label={t("reports")} value={data.totalReports ?? 0} />
        <Stat label={t("reporters")} value={data.distinctReporters ?? 0} />
        <Stat
          label={t("lastReported")}
          value={data.lastReportedUtc ? formatRelative(data.lastReportedUtc, locale) : "—"}
          small
        />
        <Stat
          label={t("network")}
          value={data.isInFraudCluster ? t("yes") : t("no")}
          danger={!!data.isInFraudCluster}
        />
      </div>

      {data.dominantCategory && (
        <p className="border-t border-[var(--border)] px-5 py-3 text-sm text-[var(--text-muted)]">
          {t("mostReported")}{" "}
          <span className="text-[var(--text)]">
            {SCAM_CATEGORY_LABELS[data.dominantCategory]?.[locale] ?? data.dominantCategory}
          </span>
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4">
        <p className="text-[11px] text-[var(--text-subtle)]">{t("publicData")}</p>
        <Button variant="outline" size="sm" onClick={share}>
          {copied ? <Check className="size-3.5" /> : canShare ? <Share2 className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? t("copied") : t("share")}
        </Button>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  small,
  danger,
}: {
  label: string;
  value: string | number;
  small?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-[var(--surface)] px-3 py-3">
      <p
        className={cn(
          "font-bold tabular-nums",
          small ? "text-sm" : "text-xl",
          danger ? "text-[var(--risk-danger-fg)]" : "text-[var(--text)]",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--text-subtle)]">{label}</p>
    </div>
  );
}
