"use client";

import { OPEN_NOTIFICATIONS_EVENT } from "@/components/layout/notifications-drawer";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  GraduationCap,
  History,
  KeyRound,
  LifeBuoy,
  ScanSearch,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/risk/risk-badge";
import { useResilienceScore } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { useCheckHistory, useFlag } from "@/lib/history";
import { SCAM_CATEGORY_LABELS, type RiskBand } from "@/lib/risk";
import { useSharedFraudAlerts, type FraudAlert } from "@/lib/signalr";
import type { Locale } from "@/lib/i18n/config";
import { cn, formatRelative } from "@/lib/utils";

interface Step {
  key: "check" | "lesson" | "safeWord" | "sosPlan";
  done: boolean;
  href: string;
  icon: LucideIcon;
}

/**
 * "Protection profile" — rebuilt around next-best-actions. The old screen showed the user's
 * resilience on the fraud RISK gauge (a 40 rendered amber as "Elevated risk") next to a
 * hard-coded "better than 72% of users" claim. Now the level is a transparent, actionable
 * checklist: every point comes from a step the user can see and complete.
 */
export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tn = useTranslations("nav");
  const locale = useLocale() as Locale;
  const { userId } = useSession();
  const resilience = useResilienceScore(userId);
  const history = useCheckHistory();
  const { alerts } = useSharedFraudAlerts();
  const safeWordSet = useFlag("safeWord");
  const sosPlanSeen = useFlag("sosPlan");

  const steps: Step[] = [
    { key: "check", done: history.items.length > 0, href: "/check", icon: ScanSearch },
    { key: "lesson", done: (resilience.data?.totalPoints ?? 0) > 0, href: "/learn", icon: GraduationCap },
    { key: "safeWord", done: safeWordSet, href: "/family", icon: KeyRound },
    { key: "sosPlan", done: sosPlanSeen, href: "/golden-hour", icon: LifeBuoy },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const level = Math.round((doneCount / steps.length) * 100);
  const next = steps.find((s) => !s.done);
  const levelName = level >= 100 ? t("levelMax") : level >= 50 ? t("levelGood") : t("levelBasic");

  return (
    <>
      <PageHeader title={tn("home")} lead={t("lead")} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Protection level + next best action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--risk-safe)]" aria-hidden /> {t("levelTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProtectionRing value={history.ready ? level : 0} label={levelName} caption={t("stepsDone", { done: doneCount, total: steps.length })} />

            {next ? (
              <Button asChild className="w-full">
                <Link href={next.href}>
                  <next.icon className="size-4" aria-hidden /> {t(`step.${next.key}.cta`)}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ) : (
              <p className="rounded-lg bg-[var(--risk-safe-bg)] p-3 text-center text-sm text-[var(--risk-safe-fg)]">{t("allDone")}</p>
            )}

            <ol className="space-y-1.5">
              {steps.map((s) => (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border",
                        s.done
                          ? "border-[var(--risk-safe)] bg-[var(--risk-safe-bg)] text-[var(--risk-safe-fg)]"
                          : "border-[var(--border-strong)] text-[var(--text-subtle)]",
                      )}
                    >
                      {s.done ? <Check className="size-3.5" aria-hidden /> : <s.icon className="size-3.5" aria-hidden />}
                    </span>
                    <span className={cn("flex-1", s.done ? "text-[var(--text-muted)] line-through decoration-[var(--border-strong)]" : "text-[var(--text)]")}>
                      {t(`step.${s.key}.title`)}
                    </span>
                    <span className="sr-only">{s.done ? t("done") : t("todo")}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {/* Recent checks (on-device, no message text) */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="size-4 text-[var(--brand)]" aria-hidden /> {t("historyTitle")}
              </CardTitle>
              {history.items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={history.clear}>
                  {t("clearHistory")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {history.items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <p className="max-w-sm text-sm text-[var(--text-muted)]">{t("historyEmpty")}</p>
                  <Button asChild variant="soft" size="sm">
                    <Link href="/check">
                      <ScanSearch className="size-4" aria-hidden /> {tn("check")}
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {history.items.slice(0, 6).map((h) => (
                    <li key={h.id} className="flex items-center gap-3 py-2.5">
                      <RiskBadge band={h.band as RiskBand} size="sm" />
                      <span className="flex-1 truncate text-sm text-[var(--text)]">
                        {SCAM_CATEGORY_LABELS[h.category]?.[locale] ?? t("noScam")}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--text-subtle)]">{formatRelative(h.at, locale)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11px] text-[var(--text-subtle)]">{t("historyPrivacy")}</p>
            </CardContent>
          </Card>

          {/* Live alerts */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-4 text-[var(--brand)]" aria-hidden /> {tn("notifications")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.dispatchEvent(new CustomEvent(OPEN_NOTIFICATIONS_EVENT))}
              >
                {t("allAlerts")} <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--text-muted)]">{t("alertsEmpty")}</p>
              ) : (
                <ul className="space-y-2" aria-live="polite">
                  {alerts.slice(0, 4).map((a) => (
                    <li key={a.id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                      <span className="flex-1 font-medium text-[var(--text)]">{alertLabel(a, t)}</span>
                      <span className="text-xs text-[var(--text-subtle)]">{formatRelative(a.at, locale)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function alertLabel(a: FraudAlert, t: ReturnType<typeof useTranslations<"dashboard">>) {
  return a.kind === "regionalSpike" ? t("alert.spike") : a.kind === "clusterDetected" ? t("alert.cluster") : t("alert.highRisk");
}

/** Positive-scale ring (protection ↑ = good) — deliberately NOT the red/amber risk gauge. */
function ProtectionRing({ value, label, caption }: { value: number; label: string; caption: string }) {
  const reduce = useReducedMotion();
  const size = 168;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${value}%`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--risk-safe)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (c * value) / 100 }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
          <span className="text-4xl font-bold tabular-nums text-[var(--text)]">{value}%</span>
          <span className="text-xs font-semibold text-[var(--risk-safe-fg)]">{label}</span>
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)]">{caption}</p>
    </div>
  );
}
