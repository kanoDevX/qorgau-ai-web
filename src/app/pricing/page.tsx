import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocaleSwitcher, ThemeToggle } from "@/components/layout/theme-controls";
import type { Ok } from "@/lib/api/client";

type Plan = Ok<"/api/v1/pricing", "get">[number];

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5199";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return { title: t("title") };
}

async function loadPlans(): Promise<Plan[] | null> {
  try {
    const res = await fetch(new URL("/api/v1/pricing", API_ORIGIN), { next: { revalidate: 300 } });
    return res.ok ? ((await res.json()) as Plan[]) : null;
  } catch {
    return null;
  }
}

/** §3.10: every tariff, price, VAT status, limit and overage rule — from the database, nothing hard-coded. */
export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const locale = await getLocale();
  const plans = await loadPlans();
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "KZT", maximumFractionDigits: 2 });
  const num = new Intl.NumberFormat(locale);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" aria-label="QorgauAI"><Logo /></Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 md:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          <ArrowLeft className="size-4" aria-hidden /> {t("back")}
        </Link>
        <h1 className="text-[length:var(--text-title)] text-[var(--text)]">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-[var(--text-muted)]">{t("lead")}</p>

        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--risk-safe)] bg-[var(--risk-safe-bg)] px-3 py-1 text-sm font-medium text-[var(--risk-safe-fg)]">
          <Check className="size-4" aria-hidden /> {t("citizensFree")}
        </p>

        {!plans && (
          <p role="alert" className="mt-8 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
            {t("unavailable")}
          </p>
        )}

        {plans && plans.some((p) => p.isDraft) && (
          <p role="note" className="mt-6 rounded-xl border border-[var(--risk-caution)] bg-[var(--risk-caution-bg)] p-3 text-sm text-[var(--risk-caution-fg)]">
            {t("draftNote")}
          </p>
        )}

        {plans && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <section key={p.code} aria-labelledby={`plan-${p.code}`} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h2 id={`plan-${p.code}`} className="text-lg font-semibold text-[var(--text)]">
                  {t(`plans.${p.code}` as never)}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{t(`plansDesc.${p.code}` as never)}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row k={t("perRequest")} v={money.format(p.pricePerRequestTenge)} />
                  <Row k={t("included")} v={p.includedRequests > 0 ? num.format(p.includedRequests) : "—"} />
                  <Row k={t("packPrice")} v={p.packPriceTenge > 0 ? money.format(p.packPriceTenge) : "—"} />
                  <Row k={t("vat")} v={p.vatIncluded ? t("vatIncluded") : t("vatExcluded")} />
                  <Row k={t("rateLimit")} v={t("perMinute", { count: p.perMinuteLimit })} />
                  <Row k={t("overage")} v={p.overage === "Block" ? t("overageBlock") : t("overagePay")} />
                </dl>
              </section>
            ))}
          </div>
        )}

        <p className="mt-8 text-sm text-[var(--text-muted)]">
          {t("refundNote")}{" "}
          <Link href="/legal/refund" className="text-[var(--brand)] underline underline-offset-2">
            {t("refundLink")}
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0">
      <dt className="text-[var(--text-muted)]">{k}</dt>
      <dd className="text-right font-medium text-[var(--text)]">{v}</dd>
    </div>
  );
}
