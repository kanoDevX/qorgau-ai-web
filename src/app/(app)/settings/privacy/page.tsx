"use client";

import { ChangePasswordCard } from "@/components/auth/change-password-card";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Cookie, Download, MonitorSmartphone, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Skeleton, Switch } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/page-header";
import { CookieSettingsButton } from "@/components/layout/cookie-consent";
import {
  useCancelDeletion,
  useDeletionStatus,
  useExportMyData,
  useMyConsents,
  useMySessions,
  useRequestDeletion,
  useRevokeSession,
  useSetConsent,
  type ConsentScopeName,
} from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";

export default function PrivacySettingsPage() {
  const t = useTranslations("privacy");
  const { isAuthenticated } = useSession();

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="max-w-2xl space-y-5">
        {!isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("needSignInTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-[var(--text-muted)]">{t("needSignIn")}</p>
              <Button asChild>
                <Link href="/login?next=%2Fsettings%2Fprivacy">{t("signIn")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <ConsentsCard />
            <ChangePasswordCard />
            <SessionsCard />
            <ExportCard />
            <DeleteCard />
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="size-4 text-[var(--brand)]" aria-hidden /> {t("cookiesTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">{t("cookiesLead")}</p>
            <CookieSettingsButton className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">
              {t("cookiesOpen")}
            </CookieSettingsButton>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ConsentsCard() {
  const t = useTranslations("privacy");
  const consents = useMyConsents();
  const setConsent = useSetConsent();
  const [notice, setNotice] = useState<string | null>(null);

  async function toggle(scope: ConsentScopeName, granted: boolean) {
    setNotice(null);
    try {
      await setConsent.mutateAsync({ scope, granted });
      setNotice(t("saved"));
    } catch {
      setNotice(t("saveError"));
    }
  }

  const data = consents.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-[var(--brand)]" aria-hidden /> {t("consentsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {consents.isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
        {data && (
          <>
            <p className="text-xs text-[var(--text-subtle)]">
              {t("policyVersion", { version: data.currentPolicyVersion })} ·{" "}
              <Link href="/legal/privacy" className="text-[var(--brand)] underline underline-offset-2">
                {t("policyRead")}
              </Link>
            </p>
            {!data.policyUpToDate && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--risk-caution)] bg-[var(--risk-caution-bg)] p-3 text-sm text-[var(--risk-caution-fg)]"
              >
                <span>{t("policyOutdated")}</span>
                <Button size="sm" onClick={() => toggle("DataProcessing", true)}>
                  {t("policyAccept")}
                </Button>
              </div>
            )}
            {data.consents.map((c) => (
              <div key={c.scope} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {t(`scope.${c.scope}` as never)}
                    {c.required && (
                      <span className="ml-2 rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[11px] font-normal text-[var(--text-muted)]">
                        {t("required")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{t(`scopeHint.${c.scope}` as never)}</p>
                </div>
                <Switch
                  checked={c.granted}
                  disabled={c.required || setConsent.isPending}
                  onCheckedChange={(v) => toggle(c.scope, v)}
                  aria-label={t(`scope.${c.scope}` as never)}
                />
              </div>
            ))}
            <p role="status" aria-live="polite" className="min-h-4 text-xs text-[var(--text-muted)]">
              {notice}
            </p>
          </>
        )}
        {consents.isError && <p className="text-sm text-[var(--risk-danger-fg)]">{toApiError(consents.error).message}</p>}
      </CardContent>
    </Card>
  );
}

function ExportCard() {
  const t = useTranslations("privacy");
  const exporter = useExportMyData();

  async function download() {
    const data = await exporter.mutateAsync();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qorgauai-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-4 text-[var(--brand)]" aria-hidden /> {t("exportTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">{t("exportLead")}</p>
        <Button variant="outline" onClick={download} disabled={exporter.isPending}>
          {exporter.isPending ? t("exporting") : t("exportBtn")}
        </Button>
        {exporter.isError && <p className="text-sm text-[var(--risk-danger-fg)]">{toApiError(exporter.error).message}</p>}
      </CardContent>
    </Card>
  );
}

function DeleteCard() {
  const t = useTranslations("privacy");
  const locale = useLocale();
  const status = useDeletionStatus();
  const request = useRequestDeletion();
  const cancel = useCancelDeletion();
  const [typed, setTyped] = useState("");
  const word = t("deleteWord");
  const scheduled = status.data?.pending ? status.data.scheduledForUtc : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="size-4 text-[var(--risk-danger-fg)]" aria-hidden /> {t("deleteTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">{t("deleteLead")}</p>
        {scheduled ? (
          <div className="space-y-3" data-testid="deletion-pending">
            <p role="status" className="text-sm font-medium text-[var(--risk-caution-fg)]">
              {t("deletePending", { date: new Date(scheduled).toLocaleDateString(locale, { dateStyle: "long" }) })}
            </p>
            <Button variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              {t("deleteCancel")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm text-[var(--text-muted)]" htmlFor="delete-confirm">
              {t("deleteConfirm", { word })}
            </label>
            <Input id="delete-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            <Button
              variant="danger"
              disabled={typed.trim().toUpperCase() !== word || request.isPending}
              onClick={() => request.mutate()}
            >
              {t("deleteBtn")}
            </Button>
          </div>
        )}
        {(request.isError || cancel.isError) && (
          <p className="text-sm text-[var(--risk-danger-fg)]">{toApiError(request.error ?? cancel.error).message}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SessionsCard() {
  const t = useTranslations("privacy");
  const locale = useLocale();
  const sessions = useMySessions();
  const revoke = useRevokeSession();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorSmartphone className="size-4 text-[var(--brand)]" aria-hidden /> {t("sessionsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">{t("sessionsLead")}</p>
        {sessions.isLoading && <Skeleton className="h-16 w-full rounded-xl" />}
        <ul className="divide-y divide-[var(--border)]">
          {sessions.data?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {s.device ?? t("unknownDevice")}
                  {s.isCurrent && (
                    <span className="ml-2 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] text-[var(--brand)]">
                      {t("thisDevice")}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {t("lastActive", { date: new Date(s.lastActiveUtc).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) })}
                </p>
              </div>
              {!s.isCurrent && (
                <Button variant="outline" size="sm" onClick={() => revoke.mutate(s.id)} disabled={revoke.isPending}>
                  {t("signOutDevice")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
