"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Radar } from "lucide-react";
import { Skeleton } from "@/components/ui/primitives";
import { useRecentReports } from "@/lib/api/hooks";
import { KZ_REGIONS } from "@/lib/kz";
import { SCAM_CATEGORY_LABELS } from "@/lib/risk";
import type { Locale } from "@/lib/i18n/config";
import { formatRelative } from "@/lib/utils";

/**
 * Anonymous live threat feed for the landing page: the public, masked community-report feed
 * (no reporter identity, identifiers masked server-side), refreshed every 30 s.
 */
export function LiveThreatFeed() {
  const t = useTranslations("landing");
  const locale = useLocale() as Locale;
  const feed = useRecentReports();
  const rows = (feed.data ?? []).slice(0, 5);

  return (
    <section aria-labelledby="live-feed-title" className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="live-feed-title" className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
          <Radar className="size-5 text-[var(--brand)]" aria-hidden /> {t("feedTitle")}
        </h2>
        <Link href="/radar" className="text-sm text-[var(--brand)] underline-offset-2 hover:underline">
          {t("feedAll")}
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{t("feedLead")}</p>

      <ul className="mt-4 divide-y divide-[var(--border)]" aria-live="polite">
        {feed.isLoading && [0, 1, 2].map((i) => <li key={i} className="py-3"><Skeleton className="h-10 w-full rounded-[var(--radius-md)]" /></li>)}
        {feed.isError && <li className="py-3 text-sm text-[var(--text-muted)]">{t("feedUnavailable")}</li>}
        {!feed.isLoading && !feed.isError && rows.length === 0 && <li className="py-3 text-sm text-[var(--text-muted)]">{t("feedEmpty")}</li>}
        {rows.map((r) => (
          <li key={r.reportId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-[var(--text)]">
                {SCAM_CATEGORY_LABELS[r.category ?? "Unknown"]?.[locale] ?? r.category}
              </span>
              <span className="font-id text-xs text-[var(--text-muted)]">{r.identifierMasked}</span>
            </span>
            <span className="text-xs text-[var(--text-subtle)]">
              {r.regionCode ? `${KZ_REGIONS.find((x) => x.code === r.regionCode)?.[locale] ?? r.regionCode}, ` : ""}
              {formatRelative(r.createdOnUtc ?? new Date().toISOString(), locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
