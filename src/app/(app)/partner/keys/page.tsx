"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Lock, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Skeleton } from "@/components/ui/primitives";
import { ApiErrorLine, IssuedKeyReveal, usePartner } from "@/components/partner/partner-common";
import { useCreatePartnerKey, usePartnerKeys, useRevokePartnerKey, useRotatePartnerKey, type IssuedKey } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

export default function PartnerKeysPage() {
  const t = useTranslations("partner.keys");
  const format = useFormatter();
  const account = usePartner();
  const keys = usePartnerKeys();
  const create = useCreatePartnerKey();
  const rotate = useRotatePartnerKey();
  const revoke = useRevokePartnerKey();
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<IssuedKey | null>(null);
  const when = (v: string) => format.dateTime(new Date(v), { dateStyle: "medium", timeStyle: "short" });

  const issue = (live: boolean) =>
    create.mutate({ live, label: label.trim() || null }, { onSuccess: (k) => { setIssued(k); setLabel(""); } });

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm text-[var(--text-muted)]">{t("lead")}</p>

      {issued && <IssuedKeyReveal issued={issued} onDone={() => setIssued(null)} />}

      <Card className="space-y-3 p-4">
        <label htmlFor="key-label" className="block text-sm font-medium text-[var(--text)]">{t("label")}</label>
        <Input id="key-label" value={label} maxLength={64} onChange={(e) => setLabel(e.target.value)} placeholder={t("labelPlaceholder")} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={create.isPending} onClick={() => issue(false)}>
            {t("createSandbox")}
          </Button>
          <Button disabled={create.isPending || !account.liveAccessApproved} onClick={() => issue(true)} aria-describedby={account.liveAccessApproved ? undefined : "live-locked"}>
            {!account.liveAccessApproved && <Lock aria-hidden />} {t("createLive")}
          </Button>
        </div>
        {!account.liveAccessApproved && <p id="live-locked" className="text-xs text-[var(--text-muted)]">{t("liveLocked")}</p>}
        <ApiErrorLine error={create.error ?? rotate.error ?? revoke.error} />
      </Card>

      <h2 className="text-sm font-semibold text-[var(--text)]">{t("title")}</h2>
      {keys.isLoading && <Skeleton className="h-24 w-full rounded-xl" />}
      {keys.data?.length === 0 && <p className="text-sm text-[var(--text-subtle)]">{t("empty")}</p>}
      <ul className="space-y-3">
        {keys.data?.map((k) => {
          const active = k.status === "Active";
          const usable = active || k.status === "Expiring";
          return (
            <li key={k.id} data-testid="partner-key">
              <Card className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 p-4", !usable && "opacity-80")}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-sm text-[var(--text)]">{k.prefix}…</code>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        k.live ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-[var(--surface-2)] text-[var(--text-muted)]",
                      )}
                    >
                      {k.live ? t("env.live") : t("env.sandbox")}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{t(`status.${k.status}` as never)}</span>
                  </p>
                  {k.label && <p className="text-sm text-[var(--text)]">{k.label}</p>}
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("lastUsed")}: {k.lastUsedUtc ? when(k.lastUsedUtc) : t("never")} · {t("calls", { calls: format.number(k.periodCalls), quota: format.number(k.monthlyQuota) })}
                  </p>
                  {k.expiresOnUtc && <p className="text-xs text-[var(--risk-caution-fg)]">{t("expires", { date: when(k.expiresOnUtc) })}</p>}
                </div>
                {usable && (
                  <div className="flex gap-2">
                    {active && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rotate.isPending}
                      aria-label={`${t("rotate")}: ${k.prefix}`}
                      onClick={() => window.confirm(t("rotateConfirm")) && rotate.mutate(k.id, { onSuccess: setIssued })}
                    >
                      <RefreshCw aria-hidden /> {t("rotate")}
                    </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={revoke.isPending}
                      aria-label={`${t("revoke")}: ${k.prefix}`}
                      onClick={() => window.confirm(t("revokeConfirm", { prefix: k.prefix })) && revoke.mutate(k.id)}
                    >
                      <Trash2 aria-hidden /> {t("revoke")}
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
