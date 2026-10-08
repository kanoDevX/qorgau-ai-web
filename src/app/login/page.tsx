"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordField } from "@/components/auth/password-field";
import { safeNext } from "@/lib/auth/redirect";

function LoginForm() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "login", email: email.trim(), password, remember }),
    }).catch(() => null);

    if (res?.ok) {
      // Full navigation so every part of the app re-reads the new session.
      window.location.assign(next);
      return;
    }

    setBusy(false);
    const problem = (await res?.json().catch(() => ({}))) as { code?: string; retryAfterSeconds?: number } | undefined;
    if (!res || res.status === 503 || problem?.code === "backend.unreachable") setError(t("unreachable"));
    else if (problem?.code === "auth.locked") setError(t("locked", { minutes: Math.max(1, Math.ceil((problem.retryAfterSeconds ?? 900) / 60)) }));
    else if (res.status === 429) setError(t("rateLimited"));
    else if (res.status === 401) setError(t("invalid"));
    else setError(t("failed"));
    setPassword("");
  }

  return (
    <AuthCard title={t("signInTitle")} lead={t("signInLead")}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="text-sm font-medium text-[var(--text)]">
            {t("email")}
          </label>
          <Input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <PasswordField id="login-password" label={t("password")} value={password} onChange={setPassword} autoComplete="current-password" required />
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-[var(--text)]">
            <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={remember} onChange={(e) => setRemember(e.target.checked)} aria-describedby="remember-hint" />
            {t("remember")}
          </label>
          <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="shrink-0 text-[var(--brand)] underline underline-offset-2">
            {t("forgot")}
          </Link>
        </div>
        <p id="remember-hint" className="text-xs text-[var(--text-subtle)]">
          {t("rememberHint")}
        </p>
        <div aria-live="assertive">
          {error && (
            <p role="alert" className="rounded-lg bg-[var(--risk-danger-bg)] p-3 text-sm text-[var(--risk-danger-fg)]">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy || !email.trim() || !password}>
          {busy ? t("signingIn") : t("signIn")}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-[var(--text-muted)]">
          {t("noAccount")}{" "}
          <Link href={`/register${next !== "/check" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-[var(--brand)] underline underline-offset-2">
            {t("createAccount")}
          </Link>
        </p>
        <p>
          <Link href="/onboarding" className="text-[var(--text-muted)] underline underline-offset-2">
            {t("tryDemo")}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
