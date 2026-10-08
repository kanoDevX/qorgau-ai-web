import { useTranslations } from "next-intl";
import { business, isPlaceholder } from "@/config/business";

/**
 * Data request for people who are not registered (§3.20). Without e-mail infrastructure we cannot
 * verify identity automatically, so the honest flow is: write to the data-protection contact from the
 * address in question; they confirm by reply before anything is deleted.
 */
export function DataRequestView() {
  const t = useTranslations("dataRequest");
  const hasEmail = !isPlaceholder(business.dpoEmail);
  const subject = encodeURIComponent(t("mailSubject"));
  const body = encodeURIComponent(t("mailBody"));

  return (
    <article>
      <h1 className="text-[length:var(--text-title)] text-[var(--text)]">{t("title")}</h1>
      <p className="mt-4 text-[var(--text-muted)]">{t("lead")}</p>
      <ol className="mt-6 list-decimal space-y-2 pl-5 text-[var(--text-muted)]">
        <li>{t("step1")}</li>
        <li>{t("step2")}</li>
        <li>{t("step3")}</li>
      </ol>
      {hasEmail ? (
        <a
          className="mt-6 inline-flex h-12 items-center rounded-lg bg-[var(--brand-solid)] px-6 font-semibold text-[var(--brand-fg)] hover:bg-[var(--brand-solid-hover)]"
          href={`mailto:${business.dpoEmail}?subject=${subject}&body=${body}`}
        >
          {t("write")}
        </a>
      ) : (
        <p role="note" className="mt-6 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-3 text-sm text-[var(--text-muted)]">
          {t("noContact")}
        </p>
      )}
    </article>
  );
}
