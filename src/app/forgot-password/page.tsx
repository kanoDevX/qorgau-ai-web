"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { AuthCard } from "@/components/auth/auth-card";

function ForgotForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState(useSearchParams().get("email") ?? "");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    const res = await fetch("/backend/api/v1/auth/password/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), language: locale }),
    }).catch(() => null);
    // The API answers 202 whether or not the account exists, so the page can't be used to probe e-mails.
    setState(res && (res.status === 202 || res.ok) ? "sent" : "error");
  }

  return (
    <AuthCard title={t("forgotTitle")} lead={state === "sent" ? undefined : t("forgotLead")}>
      {state === "sent" ? (
        <div role="status" className="flex gap-3 rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] p-4 text-sm text-[var(--text)]" data-testid="forgot-sent">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-[var(--brand)]" aria-hidden />
          <p>{t("forgotDone")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="forgot-email" className="text-sm font-medium text-[var(--text)]">
              {t("email")}
            </label>
            <Input id="forgot-email" type="email" inputMode="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
          {state === "error" && (
            <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">
              {t("unreachable")}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={state === "sending" || !email.trim()}>
            {state === "sending" ? t("sending") : t("sendLink")}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[var(--brand)] underline underline-offset-2">
          {t("backToSignIn")}
        </Link>
      </p>
    </AuthCard>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}
