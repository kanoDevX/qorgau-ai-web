"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordField, passwordErrorMessage } from "@/components/auth/password-field";
import { passwordAcceptable } from "@/lib/password";

function ResetForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const params = useSearchParams();
  const [token] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Take the secret out of the address bar (and so out of history and screenshots) once it's in memory.
  useEffect(() => {
    if (token) window.history.replaceState(null, "", "/reset-password");
  }, [token]);

  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordAcceptable(password) || password !== confirm) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/backend/api/v1/auth/password/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword: password, language: locale }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setDone(true);
      return;
    }
    const problem = (await res?.json().catch(() => ({}))) as { code?: string } | undefined;
    setError(!res ? t("unreachable") : passwordErrorMessage(t, problem?.code) ?? t("failed"));
  }

  if (!token) {
    return (
      <AuthCard title={t("resetTitle")}>
        <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">
          {t("resetNoToken")}
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/forgot-password" className="text-[var(--brand)] underline underline-offset-2">
            {t("forgotTitle")}
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("resetTitle")} lead={done ? undefined : t("resetLead")}>
      {done ? (
        <div className="space-y-4">
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-[var(--risk-safe-fg)]" data-testid="reset-done">
            <CheckCircle2 className="size-5" aria-hidden /> {t("resetDone")}
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">{t("signIn")}</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <PasswordField id="reset-password" label={t("newPassword")} value={password} onChange={setPassword} autoComplete="new-password" showStrength required />
          <PasswordField
            id="reset-confirm"
            label={t("confirmPassword")}
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            error={mismatch ? t("mismatch") : null}
            required
          />
          {error && (
            <p role="alert" className="rounded-lg bg-[var(--risk-danger-bg)] p-3 text-sm text-[var(--risk-danger-fg)]">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy || !passwordAcceptable(password) || password !== confirm}>
            {t("savePassword")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
