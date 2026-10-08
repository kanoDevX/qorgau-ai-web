import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { cookies } from "next/headers";
import { UID_COOKIE } from "@/lib/auth/cookies";
import { ArrowRight, Lock, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Ornament } from "@/components/brand/ornament";
import { OmniCheck } from "@/components/check/omni-check";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocaleSwitcher, ThemeToggle } from "@/components/layout/theme-controls";
import { getFact } from "@/config/facts";
import { Faq } from "@/components/landing/faq";
import { LiveThreatFeed } from "@/components/landing/live-feed";
import { ThreatMap } from "@/components/radar/threat-map";
import { TrendsList } from "@/components/radar/trends-list";

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const signedIn = Boolean((await cookies()).get(UID_COOKIE)?.value);
  // Statistics render only when they have a verified source + date (src/config/facts.ts, §3.12).
  const worldLosses = getFact("worldLosses");
  const formatted = worldLosses
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(worldLosses.value))
    : null;

  const how = [
    { icon: ScrollText, title: t("how1Title"), body: t("how1Body") },
    { icon: ShieldCheck, title: t("how2Title"), body: t("how2Body") },
    { icon: Lock, title: t("how3Title"), body: t("how3Body") },
  ];

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LocaleSwitcher />
          {signedIn ? (
            <Button asChild variant="soft" size="sm" className="ml-1">
              <Link href="/check">{t("openApp")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="ml-1">
                <Link href="/login">{t("signIn")}</Link>
              </Button>
              <Button asChild variant="soft" size="sm">
                <Link href="/onboarding">{tc("checkNow")}</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden">
          <div className="bg-grid pointer-events-none absolute inset-0 h-[560px]" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-10 md:px-8 md:pt-16">
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,540px)]">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  <span className="size-1.5 rounded-full bg-[var(--risk-safe)]" aria-hidden />
                  {t("heroBadge")}
                </span>
                <h1 className="mt-4 text-balance text-[length:var(--text-display)] text-[var(--text)]">
                  {t("heroTitle")}
                </h1>
                <p className="mt-4 text-pretty text-base leading-relaxed text-[var(--text-muted)] md:text-lg">
                  {t("heroSub")}
                </p>

                {worldLosses && formatted && (
                  <figure className="mt-8 max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-2xl font-bold tracking-tight text-[var(--text)]">
                      {t("statWorldValue", { value: formatted })}
                    </p>
                    <figcaption className="mt-1 text-xs leading-snug text-[var(--text-muted)]">
                      {t("statWorldLabel")}. {t("source")}:{" "}
                      {worldLosses.sourceUrl ? (
                        <a
                          href={worldLosses.sourceUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                          className="text-[var(--brand)] underline underline-offset-2"
                        >
                          {worldLosses.sourceName}
                        </a>
                      ) : (
                        worldLosses.sourceName
                      )}
                      , {t("asOf")} {worldLosses.asOf}.
                    </figcaption>
                  </figure>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/onboarding">
                      {t("ctaPrimary")} <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg">
                    <Link href="#how">{t("ctaSecondary")}</Link>
                  </Button>
                </div>
              </div>

              {/* Live check — no sign-up. The fastest "wow". */}
              <div className="lg:sticky lg:top-8">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 shadow-[var(--shadow-pop)] backdrop-blur md:p-5">
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                    <ShieldCheck className="size-4 text-[var(--brand)]" aria-hidden /> {t("ctaPrimary")}
                  </p>
                  <OmniCheck compact />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Signature: қошқар мүйіз band marks the line between "check" and "how it works". */}
        <Ornament className="mt-4" />

        <section className="border-y border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-center text-xs text-[var(--text-muted)] md:px-8">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5" aria-hidden /> {t("trustStrip")}
            </span>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">{t("howTitle")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {how.map((c) => (
              <div key={c.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <c.icon className="size-5 text-[var(--brand)]" aria-hidden />
                <h3 className="mt-3 font-semibold text-[var(--text)]">{c.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 md:px-8 lg:grid-cols-2">
          <ThreatMap compact />
          <TrendsList days={7} limit={3} />
        </section>

        <section className="mx-auto mt-8 max-w-6xl px-4 md:px-8">
          <LiveThreatFeed />
        </section>

        <Faq />
      </main>

      <SiteFooter />
    </div>
  );
}
