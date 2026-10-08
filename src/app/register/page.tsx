"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/logo";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { PasswordField, passwordErrorMessage } from "@/components/auth/password-field";
import { passwordAcceptable } from "@/lib/password";
import { safeNext } from "@/lib/auth/redirect";
import { KZ_REGIONS } from "@/lib/kz";
import { isMinor } from "@/lib/age";
import type { Locale } from "@/lib/i18n/config";

// Values are the server LearnerTrack names (the old "Student" value made registration fail with 400).
const TRACKS = ["General", "Retiree", "Parent", "StudentFreelancer", "Entrepreneur", "Teen"] as const;
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => THIS_YEAR - 6 - i);

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const t = useTranslations("register");
  const ta = useTranslations("auth");
  const next = safeNext(useSearchParams().get("next"));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const tx = useTranslations("registerExtra");
  const tp = useTranslations("profile");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [region, setRegion] = useState("");
  const minor = isMinor(birthYear, birthMonth);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [track, setTrack] = useState<(typeof TRACKS)[number]>("General");
  const [accepted, setAccepted] = useState(false); // never pre-ticked (§3.6)
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setPasswordError(null);
    if (!accepted || !passwordAcceptable(password, email) || password !== confirm) return;
    setBusy(true);
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "register",
        email,
        displayName: name,
        track,
        password,
        acceptedPolicy: accepted,
        remember: true,
        onboardingRole: "self",
      }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      // Optional profile details go through the authenticated API once the session cookie exists.
      if ((birthYear && birthMonth) || region) {
        await fetch("/backend/api/v1/me", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            displayName: name,
            track,
            homeRegionCode: region || null,
            birthYear: birthYear && birthMonth ? birthYear : null,
            birthMonth: birthYear && birthMonth ? birthMonth : null,
          }),
        }).catch(() => null);
      }
      // Full navigation so the whole app picks up the new session.
      window.location.assign(next);
      return;
    }
    const problem = (await res?.json().catch(() => ({}))) as { code?: string } | undefined;
    const pw = passwordErrorMessage(ta, problem?.code);
    if (pw) setPasswordError(pw);
    else setError(!res ? ta("unreachable") : res.status === 409 || problem?.code === "user.email_taken" ? t("emailTaken") : t("failed"));
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 py-10">
      <main id="main" className="w-full max-w-md">
        <Logo className="mb-8" />
        <h1 className="text-[length:var(--text-title)] text-[var(--text)]">{t("title")}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{t("lead")}</p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="reg-email" className="text-sm font-medium text-[var(--text)]">{t("email")}</label>
            <Input id="reg-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
          <PasswordField
            id="reg-password"
            label={ta("password")}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            email={email}
            error={passwordError}
            showStrength
            required
          />
          <PasswordField
            id="reg-confirm"
            label={ta("confirmPassword")}
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            error={(touched || confirm) && confirm !== password ? ta("mismatch") : null}
            required
          />
          <div>
            <label htmlFor="reg-name" className="text-sm font-medium text-[var(--text)]">{t("name")}</label>
            <Input id="reg-name" required autoComplete="nickname" maxLength={128} value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label htmlFor="reg-track" className="text-sm font-medium text-[var(--text)]">{t("track")}</label>
            <select
              id="reg-track"
              value={track}
              onChange={(e) => setTrack(e.target.value as (typeof TRACKS)[number])}
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
            >
              {TRACKS.map((k) => (
                <option key={k} value={k}>
                  {t(`tracks.${k}`)}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-[var(--text)]">{tx("birth")}</legend>
            <p id="reg-birth-hint" className="text-xs text-[var(--text-muted)]">{tx("birthHint")}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <select
                aria-label={tp("birthYear")}
                aria-describedby="reg-birth-hint"
                value={birthYear ?? ""}
                onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              >
                <option value="">—</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                aria-label={tp("birthMonth")}
                aria-describedby="reg-birth-hint"
                value={birthMonth ?? ""}
                onChange={(e) => setBirthMonth(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              >
                <option value="">—</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {format.dateTime(new Date(2000, i, 1), { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            {minor && (
              <p role="status" className="mt-2 rounded-lg bg-[var(--risk-caution-bg)] p-2.5 text-xs text-[var(--risk-caution-fg)]" data-testid="minor-notice">
                {tx("minorNotice")}
              </p>
            )}
          </fieldset>
          <div>
            <label htmlFor="reg-region" className="text-sm font-medium text-[var(--text)]">{tx("region")}</label>
            <select id="reg-region" value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]">
              <option value="">—</option>
              {KZ_REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r[locale]}
                </option>
              ))}
            </select>
          </div>

          <ConsentCheckbox
            id="reg-consent"
            checked={accepted}
            onChange={setAccepted}
            invalid={touched && !accepted}
            error={t("mustConsent")}
            label={t("consent")}
            linkHref="/legal/privacy"
            linkLabel={t("readPolicy")}
          />

          {error && (
            <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {t("submit")}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <p className="text-[var(--text-muted)]">
            {ta("haveAccount")}{" "}
            <Link href={`/login${next !== "/check" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-[var(--brand)] underline underline-offset-2">
              {ta("signIn")}
            </Link>
          </p>
          <p>
            <Link href="/onboarding" className="text-[var(--text-muted)] underline underline-offset-2">
              {t("haveDemo")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
