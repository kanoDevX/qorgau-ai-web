"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Skeleton } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/logo";
import { useVerifyCertificate } from "@/lib/api/hooks";
import type { Locale } from "@/lib/i18n/config";

/** Public certificate check (QR target): signature + expiry, the holder's chosen name and the course — nothing else. */
export function CertificateCheck({ serial }: { serial: string }) {
  const t = useTranslations("verify");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [input, setInput] = useState(serial);
  const result = useVerifyCertificate(serial, locale);
  const r = result.data;
  const date = (v: string | null) => (v ? format.dateTime(new Date(v), { dateStyle: "long" }) : "—");

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <Logo className="mb-8" />
      <h1 className="text-[length:var(--text-title)] text-[var(--text)]">{t("title")}</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{t("lead")}</p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const s = input.trim().toUpperCase();
          if (s) router.push(`/verify/${encodeURIComponent(s)}`);
        }}
      >
        <label htmlFor="verify-serial" className="sr-only">
          {t("serial")}
        </label>
        <Input id="verify-serial" value={input} onChange={(e) => setInput(e.target.value)} placeholder="QAI-202610-…" className="font-mono" />
        <Button type="submit">{t("check")}</Button>
      </form>

      <div role="status" aria-live="polite" className="mt-6">
        {serial && result.isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
        {r && r.valid && (
          <div className="rounded-xl border border-[var(--risk-safe)] bg-[var(--risk-safe-bg)] p-4" data-testid="verify-valid">
            <p className="flex items-center gap-2 font-semibold text-[var(--risk-safe-fg)]">
              <BadgeCheck className="size-5" aria-hidden /> {t("valid")}
            </p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-[var(--text-muted)]">{t("holder")}</dt>
              <dd className="font-medium text-[var(--text)]">{r.holderName}</dd>
              <dt className="text-[var(--text-muted)]">{t("course")}</dt>
              <dd className="text-[var(--text)]">{r.courseTitle}</dd>
              <dt className="text-[var(--text-muted)]">{t("issued")}</dt>
              <dd className="text-[var(--text)]">{date(r.issuedOnUtc)}</dd>
              <dt className="text-[var(--text-muted)]">{t("expires")}</dt>
              <dd className="text-[var(--text)]">{date(r.expiresOnUtc)}</dd>
            </dl>
          </div>
        )}
        {r && !r.valid && (
          <p className="flex items-center gap-2 rounded-xl border border-[var(--risk-danger)] bg-[var(--risk-danger-bg)] p-4 font-medium text-[var(--risk-danger-fg)]" data-testid="verify-invalid">
            <ShieldX className="size-5 shrink-0" aria-hidden /> {t(`reason.${r.reason}` as never)}
          </p>
        )}
      </div>
      <p className="mt-6 text-xs text-[var(--text-subtle)]">{t("note")}</p>
    </main>
  );
}
