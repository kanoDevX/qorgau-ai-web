"use client";

import { useLocale, useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordField, passwordErrorMessage } from "@/components/auth/password-field";
import { useMyProfile } from "@/lib/api/hooks";
import { api, toApiError } from "@/lib/api/client";
import { passwordAcceptable } from "@/lib/password";

/**
 * Change the password (current one required — re-authentication), or set a first password for accounts created
 * before passwords existed. Other devices are signed out by the API; this one stays signed in.
 */
export function ChangePasswordCard() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const profile = useMyProfile();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!profile.data) return null;
  const hasPassword = profile.data.hasPassword;
  const email = profile.data.email;
  const canSubmit = (!hasPassword || current.length > 0) && passwordAcceptable(next, email) && next === confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setCurrentError(null);
    setDone(false);
    const res = await api.POST("/api/v1/me/password", {
      body: { currentPassword: hasPassword ? current : null, newPassword: next, language: locale },
    });
    setBusy(false);
    if (res.response.ok) {
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      profile.refetch();
      return;
    }
    const code = (res.error as { code?: string } | undefined)?.code;
    if (code === "password.current_wrong") setCurrentError(t("error.current_wrong"));
    else setError(passwordErrorMessage(t, code) ?? toApiError(res.error).message);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4 text-[var(--brand)]" aria-hidden /> {t("changeTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate data-testid="change-password">
          <p className="text-sm text-[var(--text-muted)]">{hasPassword ? t("changeLead") : t("setLead")}</p>
          {hasPassword && (
            <PasswordField id="pw-current" label={t("currentPassword")} value={current} onChange={setCurrent} autoComplete="current-password" error={currentError} required />
          )}
          <PasswordField id="pw-new" label={t("newPassword")} value={next} onChange={setNext} autoComplete="new-password" email={email} showStrength required />
          <PasswordField
            id="pw-confirm"
            label={t("confirmPassword")}
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            error={confirm && confirm !== next ? t("mismatch") : null}
            required
          />
          <div aria-live="polite">
            {done && <p className="text-sm text-[var(--risk-safe-fg)]">{t("changed")}</p>}
            {error && (
              <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" disabled={busy || !canSubmit}>
            {hasPassword ? t("changeSubmit") : t("setSubmit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
