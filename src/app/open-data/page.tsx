import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocaleSwitcher, ThemeToggle } from "@/components/layout/theme-controls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("openData");
  return { title: t("title") };
}

/** Open Data (§4.3): what the public dataset contains, its licence and its privacy protections. */
export default async function OpenDataPage() {
  const t = await getTranslations("openData");
  const api = "/backend/api/v1/open-data/reports";

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
        <p className="mt-3 text-[var(--text-muted)]">{t("lead")}</p>

        <h2 className="mt-8 text-xl font-semibold text-[var(--text)]">{t("whatTitle")}</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[var(--text-muted)]">
          <li>{t("what1")}</li>
          <li>{t("what2")}</li>
          <li>{t("what3")}</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-[var(--text)]">{t("privacyTitle")}</h2>
        <p className="mt-2 text-[var(--text-muted)]">{t("privacy")}</p>

        <h2 className="mt-8 text-xl font-semibold text-[var(--text)]">{t("downloadTitle")}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href={`${api}?format=csv`} className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-solid)] px-4 font-semibold text-[var(--brand-fg)] hover:bg-[var(--brand-solid-hover)]">
            <Download className="size-4" aria-hidden /> {t("csv")}
          </a>
          <a href={api} className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] px-4 font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">
            {t("json")}
          </a>
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{t("params")}</p>
        <p className="mt-6 text-sm text-[var(--text-subtle)]">{t("license")}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
