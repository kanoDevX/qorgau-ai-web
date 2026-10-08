"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Bell, Network, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/layout/connection-status";
import { KZ_REGIONS } from "@/lib/kz";
import { SCAM_CATEGORY_LABELS } from "@/lib/risk";
import type { Locale } from "@/lib/i18n/config";
import { useSharedFraudAlerts, type FraudAlert } from "@/lib/signalr";
import { cn, formatRelative } from "@/lib/utils";

export const OPEN_NOTIFICATIONS_EVENT = "qorgau:open-notifications";

const KIND_META: Record<FraudAlert["kind"], { icon: typeof Bell; label: "kindSpike" | "kindCluster" | "kindHighRisk"; token: string }> = {
  regionalSpike: { icon: TrendingUp, label: "kindSpike", token: "caution" },
  clusterDetected: { icon: Network, label: "kindCluster", token: "danger" },
  highRiskAssessment: { icon: AlertTriangle, label: "kindHighRisk", token: "critical" },
};

/**
 * Notification centre as a side drawer (§5.2: the bell opens a panel, not a separate screen).
 * The badge counts alerts that arrived since the drawer was last opened.
 */
export function NotificationsDrawer({ className }: { className?: string }) {
  const t = useTranslations("notifications");
  const tn = useTranslations("nav");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const [filter, setFilter] = useState<FraudAlert["kind"] | "all">("all");
  const { state, alerts, region, setRegion } = useSharedFraudAlerts();

  useEffect(() => {
    const openIt = () => setOpen(true);
    document.addEventListener(OPEN_NOTIFICATIONS_EVENT, openIt);
    return () => document.removeEventListener(OPEN_NOTIFICATIONS_EVENT, openIt);
  }, []);
  useEffect(() => {
    if (open) setSeen(alerts.length);
  }, [open, alerts.length]);

  const unread = Math.max(0, alerts.length - seen);
  const cat = (c: unknown) => (typeof c === "string" ? (SCAM_CATEGORY_LABELS[c]?.[locale] ?? c) : "—");
  const regionName = (c: unknown) =>
    typeof c === "string" ? (KZ_REGIONS.find((r) => r.code === c)?.[locale] ?? (c === "KZ" ? t("kazakhstan") : c)) : "—";
  const shown = alerts.filter((a) => filter === "all" || a.kind === filter);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={unread ? t("openWithCount", { count: unread }) : tn("notifications")}
        >
          <Bell className="size-4" aria-hidden />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-[var(--danger-solid)] px-1 text-[10px] font-semibold leading-4 text-[var(--danger-fg)]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-[var(--scrim)]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[61] flex w-[min(100vw,26rem)] flex-col border-l border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)] data-[state=open]:animate-[rise_180ms_ease]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
            <Dialog.Title className="text-lg font-semibold text-[var(--text)]">{tn("notifications")}</Dialog.Title>
            <div className="flex items-center gap-2">
              <ConnectionStatus state={state} compact />
              <Dialog.Close className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]" aria-label={t("close")}>
                <X className="size-4" aria-hidden />
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="sr-only">{t("drawerLead")}</Dialog.Description>

          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-4">
            <select
              aria-label={t("region")}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-9 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text)]"
            >
              {KZ_REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r[locale]}
                </option>
              ))}
            </select>
            {(["all", "regionalSpike", "clusterDetected", "highRiskAssessment"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  filter === k
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]",
                )}
              >
                {k === "all" ? t("all") : t(KIND_META[k].label)}
              </button>
            ))}
          </div>

          <div className="border-b border-[var(--border)] px-4 py-2">
            <Link href="/settings/notifications" onClick={() => setOpen(false)} className="text-sm text-[var(--brand)] underline-offset-2 hover:underline">
              {t("settingsLink")}
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {shown.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Bell className="size-8 text-[var(--text-subtle)]" aria-hidden />
                <p className="max-w-xs text-sm text-[var(--text-muted)]">{t("empty")}</p>
                <p className="max-w-xs text-xs text-[var(--text-subtle)]">{t("emptyHint")}</p>
              </div>
            ) : (
              <ul className="space-y-2" aria-live="polite">
                <AnimatePresence initial={false}>
                  {shown.map((a) => {
                    const meta = KIND_META[a.kind];
                    return (
                      <motion.li
                        key={a.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-3"
                      >
                        <span
                          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                          style={{ background: `var(--risk-${meta.token}-bg)`, color: `var(--risk-${meta.token}-fg)` }}
                        >
                          <meta.icon className="size-4" aria-hidden />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{t(meta.label)}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {a.kind === "regionalSpike" &&
                              t("spikeDetail", {
                                category: cat(a.payload.category),
                                region: regionName(a.payload.regionCode),
                                count: String(a.payload.reportsLastHour ?? "?"),
                                multiple: String(a.payload.multipleOfBaseline ?? "?"),
                              })}
                            {a.kind === "clusterDetected" &&
                              t("clusterDetail", { count: String(a.payload.nodeCount ?? "?"), region: regionName(a.payload.regionCode) })}
                            {a.kind === "highRiskAssessment" &&
                              t("highRiskDetail", { category: cat(a.payload.category), score: String(a.payload.score ?? "?") })}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-subtle)]">{formatRelative(a.at, locale)}</p>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
