import { useTranslations } from "next-intl";
import Link from "next/link";
import { business, isPlaceholder } from "@/config/business";
import { cn } from "@/lib/utils";
import { CookieSettingsButton } from "./cookie-consent";

const linkClass =
  "text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

/** Business details + legal links on every public screen (§3.16). Placeholders are shown as such, never faked. */
export function SiteFooter({ className }: { className?: string }) {
  const t = useTranslations("footer");

  const details: [string, string][] = [
    [t("operator"), `${business.legalName}, ${business.legalForm}`],
    [t("bin"), business.bin],
    [t("address"), business.address],
    [t("email"), business.supportEmail],
    [t("phone"), business.supportPhone],
    [t("dpo"), `${business.dpoName}, ${business.dpoEmail}`],
  ];

  return (
    <footer className={cn("border-t border-[var(--border)] px-4 py-8 text-xs md:px-8", className)}>
      <div className="mx-auto max-w-6xl space-y-5">
        <nav aria-label={t("legalNav")} className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/legal/privacy" className={linkClass}>{t("privacy")}</Link>
          <Link href="/legal/terms" className={linkClass}>{t("terms")}</Link>
          <Link href="/legal/cookies" className={linkClass}>{t("cookies")}</Link>
          <Link href="/legal/refund" className={linkClass}>{t("refund")}</Link>
          <Link href="/legal/data-request" className={linkClass}>{t("dataRequest")}</Link>
          <Link href="/open-data" className={linkClass}>{t("openData")}</Link>
          <Link href="/about" className={linkClass}>{t("about")}</Link>
          <CookieSettingsButton className={linkClass}>{t("cookieSettings")}</CookieSettingsButton>
        </nav>

        <dl className="grid gap-x-8 gap-y-1.5 text-[var(--text-subtle)] sm:grid-cols-2 lg:grid-cols-3">
          {details.map(([k, v]) => (
            <div key={k} className="min-w-0 break-words">
              <dt className="inline text-[var(--text-muted)]">{k}: </dt>
              <dd className={cn("inline", v.includes("{{") && "italic")}>
                {v.includes("{{") ? t("placeholder") : v}
              </dd>
            </div>
          ))}
        </dl>

        {Object.values(business).some((v) => typeof v === "string" && isPlaceholder(v)) && (
          <p className="text-[var(--text-subtle)]">{t("todoNote")}</p>
        )}
        <p className="text-[var(--text-subtle)]">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}
