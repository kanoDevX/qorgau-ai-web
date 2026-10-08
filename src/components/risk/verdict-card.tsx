"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, Check, ImageDown, Megaphone, Users, Waves } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/primitives";
import { DegradedBanner } from "@/components/check/degraded-banner";
import { HighlightedText } from "@/components/check/highlighted-text";
import { renderShareCard, shareCard } from "@/components/check/share-card";
import { RiskGauge } from "./risk-gauge";
import { RiskBadge } from "./risk-badge";
import { ExplainabilityPanel } from "./explainability";
import type { Assessment } from "@/lib/api/hooks";
import { playbookFor } from "@/lib/playbook";
import { riskVisual, SCAM_CATEGORY_LABELS, type RecommendedAction } from "@/lib/risk";
import type { Locale } from "@/lib/i18n/config";

/**
 * Verdict, Norton Genie / Scamio style (§5.3): a one-line conclusion, what to do right now (3 steps),
 * the dangerous phrases marked in the user's own text, then "why" by layer, then share / warn family /
 * report / dispute. Colour is never the only carrier of meaning: badge + icon + text.
 */
export function VerdictCard({
  assessment,
  submittedText,
  onCheckAnother,
  onDispute,
  children,
}: {
  assessment: Assessment;
  /** The checked message, for in-text highlighting. Never leaves the device again. */
  submittedText?: string;
  onCheckAnother?: () => void;
  onDispute?: () => void;
  /** Extra findings rendered under the headline (e.g. URL scan details). */
  children?: React.ReactNode;
}) {
  const t = useTranslations("check");
  const tr = useTranslations("risk");
  const locale = useLocale() as Locale;

  const score = assessment.riskScore ?? 0;
  const band = (assessment.riskBand ?? "Minimal") as Parameters<typeof RiskBadge>[0]["band"];
  const v = riskVisual(band);
  const action = (assessment.recommendedAction ?? "Allow") as RecommendedAction;
  const category = assessment.category ?? "Unknown";
  const catLabel = SCAM_CATEGORY_LABELS[category]?.[locale] ?? category;
  const risky = band === "Elevated" || band === "High" || band === "Critical";
  const playbook = playbookFor(band, category);
  const steps = [1, 2, 3].map((i) => t(`playbook.${playbook}.${i}` as never));
  const headline = t(`headline.${band}` as never);
  const [shared, setShared] = useState<"idle" | "text" | "image">("idle");

  // Text share: category + advice only, never the original message.
  async function warnFamily() {
    const text = t("warnText", { category: catLabel, action: tr(`action.${action}`) });
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "QorgauAI", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared("text");
        setTimeout(() => setShared("idle"), 2000);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }

  async function shareImage() {
    try {
      const blob = await renderShareCard({ headline, category: catLabel, steps, footer: t("shareCardFooter"), band });
      await shareCard(blob, t("warnText", { category: catLabel, action: tr(`action.${action}`) }));
      setShared("image");
      setTimeout(() => setShared("idle"), 2000);
    } catch {
      /* cancelled */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
      data-testid="verdict"
    >
      <DegradedBanner reason={assessment.degradedReason} retryAfterSeconds={assessment.retryAfterSeconds} />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center" style={{ background: `linear-gradient(180deg, ${v.bg}, transparent)` }}>
          <RiskGauge score={score} size={160} />
          <div className="flex-1 space-y-3">
            <h2 className="text-[length:var(--text-heading)] font-semibold leading-snug" style={{ color: v.fg }}>
              {headline}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge band={band} size="lg" />
              {risky && (
                <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">{catLabel}</span>
              )}
            </div>
            <p className="text-[15px] leading-relaxed text-[var(--text)]">{assessment.explanation || tr("noFlags")}</p>
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text)]">{t("doNow")}</h3>
          <ol className="mt-3 space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 rounded-[var(--radius-md)] border p-3" style={{ borderColor: v.color, background: v.bg }}>
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: v.color, color: "var(--bg)" }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium" style={{ color: v.fg }}>
                  {s}
                </span>
              </li>
            ))}
          </ol>

          {children && <div className="mt-5">{children}</div>}

          {submittedText && (assessment.highlights?.length ?? 0) > 0 && (
            <div className="mt-5">
              <HighlightedText text={submittedText} highlights={assessment.highlights ?? []} />
            </div>
          )}

          {assessment.redFlags && assessment.redFlags.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-[var(--text)]">{t("redFlags")}</p>
              <ul className="space-y-1.5">
                {assessment.redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" style={{ color: v.color }} aria-hidden />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.syntheticMedia && (
            <div className="mt-5 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <Waves className="size-4 text-[var(--brand)]" aria-hidden /> {t("syntheticMedia")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Progress
                  value={(assessment.syntheticMedia.probability ?? 0) * 100}
                  className="h-2"
                  indicatorColor={assessment.syntheticMedia.likelySynthetic ? "var(--risk-critical)" : "var(--risk-safe)"}
                />
                <span className="text-xs tabular-nums text-[var(--text-muted)]">{Math.round((assessment.syntheticMedia.probability ?? 0) * 100)}%</span>
              </div>
              {assessment.syntheticMedia.likelySynthetic && <p className="mt-2 text-xs text-[var(--risk-critical-fg)]">{t("syntheticLikely")}</p>}
            </div>
          )}
        </div>
      </Card>

      {/* Protective actions sit right under the verdict — before the optional deep explanation. */}
      {risky && (
        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="soft" onClick={shareImage}>
            {shared === "image" ? <Check className="size-4" aria-hidden /> : <ImageDown className="size-4" aria-hidden />}
            {t("shareCard")}
          </Button>
          <Button variant="outline" onClick={warnFamily}>
            {shared === "text" ? <Check className="size-4" aria-hidden /> : <Users className="size-4" aria-hidden />}
            {shared === "text" ? t("warnCopied") : t("warnFamily")}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/radar?report=1&category=${encodeURIComponent(category)}`}>
              <Megaphone className="size-4" aria-hidden /> {t("reportToRadar")}
            </Link>
          </Button>
        </div>
      )}

      <ExplainabilityPanel assessment={assessment} />

      <div className="flex flex-wrap items-center gap-3">
        {onCheckAnother && (
          <Button variant="outline" onClick={onCheckAnother}>
            {t("checkAnother")}
          </Button>
        )}
        {onDispute && (
          <Button variant="ghost" size="sm" onClick={onDispute}>
            {t("dispute")} <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
