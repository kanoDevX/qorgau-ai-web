import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocaleSwitcher, ThemeToggle } from "@/components/layout/theme-controls";
import { legalUi } from "@/content/legal";
import type { Locale } from "@/lib/i18n/config";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
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
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="size-4" aria-hidden /> {legalUi[locale].back}
        </Link>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
