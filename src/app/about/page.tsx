import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocaleSwitcher, ThemeToggle } from "@/components/layout/theme-controls";
import { business } from "@/config/business";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("title") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tf = await getTranslations("footer");

  const rows: [string, string][] = [
    [tf("operator"), `${business.legalName}, ${business.legalForm}`],
    [tf("bin"), business.bin],
    [tf("address"), business.address],
    [tf("email"), business.supportEmail],
    [tf("phone"), business.supportPhone],
    [tf("dpo"), `${business.dpoName}, ${business.dpoEmail}`],
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" aria-label="QorgauAI"><Logo /></Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 md:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          <ArrowLeft className="size-4" aria-hidden /> {t("back")}
        </Link>
        <h1 className="text-[length:var(--text-title)] text-[var(--text)]">{t("title")}</h1>
        <p className="mt-4 text-[var(--text-muted)]">{t("lead")}</p>

        <h2 className="mt-8 text-xl font-semibold text-[var(--text)]">{t("detailsTitle")}</h2>
        <dl className="mt-3 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
              <dt className="text-[var(--text-muted)]">{k}</dt>
              <dd className={v.includes("{{") ? "italic text-[var(--text-subtle)]" : "text-[var(--text)]"}>
                {v.includes("{{") ? tf("placeholder") : v}
              </dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-8 text-xl font-semibold text-[var(--text)]">{t("honestyTitle")}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[var(--text-muted)]">
          <li>{t("honesty1")}</li>
          <li>{t("honesty2")}</li>
          <li>{t("honesty3")}</li>
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
