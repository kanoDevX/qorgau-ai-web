import { useTranslations } from "next-intl";
import { ArrowDown, BadgeCheck, Globe, ShieldAlert } from "lucide-react";
import type { UrlScan } from "@/lib/api/hooks";

/** What the link scanner found: where the link really leads, and whether it imitates a KZ brand. */
export function UrlFindings({ scan }: { scan: UrlScan }) {
  const t = useTranslations("check.url");
  const hosts = scan.redirectHosts ?? [];

  return (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4" aria-labelledby="url-findings">
      <h3 id="url-findings" className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Globe className="size-4 text-[var(--brand)]" aria-hidden /> {t("title")}
      </h3>

      {scan.officialBrand && (
        <p className="flex items-center gap-2 text-sm text-[var(--risk-safe-fg)]">
          <BadgeCheck className="size-4" aria-hidden /> {t("official", { host: scan.finalHost })}
        </p>
      )}

      {scan.impersonatedDomain && (
        <p className="flex items-start gap-2 text-sm font-medium text-[var(--risk-danger-fg)]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t(`impersonation.${scan.impersonationKind ?? "Typosquat"}` as never, { real: scan.impersonatedDomain, host: scan.finalHost })}
        </p>
      )}

      {hosts.length > 1 && (
        <div>
          <p className="text-xs text-[var(--text-muted)]">{t("chain")}</p>
          <ol className="mt-1 space-y-0.5">
            {hosts.map((h, i) => (
              <li key={`${h}-${i}`} className="font-id text-xs text-[var(--text)]">
                {i > 0 && <ArrowDown className="mr-1 inline size-3 text-[var(--text-subtle)]" aria-hidden />}
                {h}
              </li>
            ))}
          </ol>
        </div>
      )}

      <ul className="space-y-1 text-xs text-[var(--text-muted)]">
        {scan.isShortener && <li>{t("shortener")}</li>}
        {(scan.isPunycode || scan.mixedScript) && <li>{t("idn")}</li>}
        {scan.unreachable && <li>{t("unreachable")}</li>}
        {scan.blocked && <li>{t("blocked")}</li>}
      </ul>
      <p className="text-[11px] text-[var(--text-subtle)]">{t("safeNote")}</p>
    </section>
  );
}
