"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Skeleton } from "@/components/ui/primitives";
import { ApiErrorLine, SecretReveal, usePartner } from "@/components/partner/partner-common";
import { useConfigureWebhook, useRemoveWebhook, useRotateWebhookSecret, useTestWebhook, useWebhookDeliveries } from "@/lib/api/hooks";

// next-intl keys can't contain dots, so event types map to message keys.
const EVENT_KEY: Record<string, string> = { "risk_check.high_risk": "high_risk", "quota.warning": "quota_warning" };

export default function PartnerWebhooksPage() {
  const t = useTranslations("partner.webhooks");
  const format = useFormatter();
  const account = usePartner();
  const configure = useConfigureWebhook();
  const rotate = useRotateWebhookSecret();
  const remove = useRemoveWebhook();
  const test = useTestWebhook();
  const deliveries = useWebhookDeliveries();
  const [url, setUrl] = useState(account.webhook.url ?? "");
  const [events, setEvents] = useState<string[]>(account.webhook.events.length ? [...account.webhook.events] : [...account.availableEvents]);
  const [secret, setSecret] = useState<string | null>(null);
  const when = (v: string) => format.dateTime(new Date(v), { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm text-[var(--text-muted)]">{t("lead")}</p>

      {secret && <SecretReveal title={t("secretTitle")} value={secret} note={t("secretOnce")} onDone={() => setSecret(null)} />}

      <Card className="p-4">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            configure.mutate({ url: url.trim(), events }, { onSuccess: (r) => r.secret && setSecret(r.secret) });
          }}
        >
          <label htmlFor="webhook-url" className="block text-sm font-medium text-[var(--text)]">{t("url")}</label>
          <Input id="webhook-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/qorgau/webhook" aria-describedby="webhook-url-hint" />
          <p id="webhook-url-hint" className="text-xs text-[var(--text-muted)]">{t("privateBlocked")}</p>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-[var(--text)]">{t("events")}</legend>
            {account.availableEvents.map((ev) => (
              <label key={ev} className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--brand)]"
                  checked={events.includes(ev)}
                  onChange={(e) => setEvents((prev) => (e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev)))}
                />
                <span>
                  {t(`event.${EVENT_KEY[ev] ?? ev}` as never)} <code className="text-xs text-[var(--text-muted)]">{ev}</code>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!url.trim() || configure.isPending}>{t("save")}</Button>
            {account.webhook.enabled && (
              <>
                <Button type="button" variant="outline" disabled={test.isPending} onClick={() => test.mutate()}>{t("test")}</Button>
                <Button type="button" variant="ghost" disabled={rotate.isPending} onClick={() => window.confirm(t("rotateConfirm")) && rotate.mutate(undefined, { onSuccess: (r) => r.secret && setSecret(r.secret) })}>
                  {t("rotateSecret")}
                </Button>
                <Button type="button" variant="ghost" disabled={remove.isPending} onClick={() => window.confirm(t("removeConfirm")) && remove.mutate(undefined)}>
                  {t("remove")}
                </Button>
              </>
            )}
          </div>
          <div aria-live="polite">
            {configure.isSuccess && !secret && <p className="text-sm text-[var(--risk-safe-fg)]">{t("saved")}</p>}
            {test.data && (
              <p className={test.data.success ? "text-sm text-[var(--risk-safe-fg)]" : "text-sm text-[var(--risk-danger-fg)]"} data-testid="webhook-test-result">
                {test.data.success ? t("testOk", { code: test.data.statusCode ?? 200, ms: test.data.durationMs }) : t("testFail", { error: test.data.error ?? "—" })}
              </p>
            )}
          </div>
          <ApiErrorLine error={configure.error ?? rotate.error ?? remove.error ?? test.error} />
        </form>
      </Card>

      <p className="text-xs text-[var(--text-muted)]">{t("retryNote")}</p>

      <section aria-labelledby="deliveries-title">
        <h2 id="deliveries-title" className="mb-2 text-sm font-semibold text-[var(--text)]">{t("deliveries")}</h2>
        {deliveries.isLoading && <Skeleton className="h-20 w-full rounded-xl" />}
        {deliveries.data?.length === 0 && <p className="text-sm text-[var(--text-subtle)]">{t("deliveriesEmpty")}</p>}
        {!!deliveries.data?.length && (
          <div className="max-w-full overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)]">
                  {(["event", "status", "attempts", "code", "created", "next"] as const).map((c) => (
                    <th key={c} scope="col" className="px-3 py-2 font-medium">{t(`col.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.data.map((d) => (
                  <tr key={d.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2"><code className="text-xs">{d.eventType}</code></td>
                    <td className="px-3 py-2">{t(`status.${d.status}` as never)}</td>
                    <td className="px-3 py-2 tabular-nums">{d.attempts}</td>
                    <td className="px-3 py-2 tabular-nums">{d.lastStatusCode ?? d.lastError ?? "—"}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{when(d.createdOnUtc)}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{d.nextAttemptUtc ? when(d.nextAttemptUtc) : "—"}</td>
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
