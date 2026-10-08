"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { useHeatmap } from "@/lib/api/hooks";
import { KZ_REGIONS, KZ_TILE_LABEL, KZ_TILES } from "@/lib/kz";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const PERIODS = [7, 30, 90] as const;

/**
 * Threat map of Kazakhstan as a tile cartogram (§5.3): 17 regions + 3 cities, one equal square each,
 * placed roughly where they are. Intensity is a single-hue ramp mixed into the surface colour (kept
 * ≤ 45 % so the label stays ≥ 4.5:1), every tile shows its number, and a table gives the same data.
 */
export function ThreatMap({ compact = false, onSelectRegion }: { compact?: boolean; onSelectRegion?: (code: string) => void }) {
  const t = useTranslations("threatMap");
  const locale = useLocale() as Locale;
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const heat = useHeatmap(days);
  const max = Math.max(1, ...(heat.data?.regions ?? []).map((r) => r.count ?? 0));
  const byCode = new Map((heat.data?.regions ?? []).map((r) => [r.regionCode, r.count ?? 0]));

  return (
    <section aria-labelledby="threat-map-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="threat-map-title" className="text-[length:var(--text-heading)] font-semibold text-[var(--text)]">
            {t("title")}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {heat.data ? t("lead", { total: heat.data.total ?? 0, days }) : t("loading")}
          </p>
        </div>
        {!compact && (
          <div role="group" aria-label={t("period")} className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={days === p}
                onClick={() => setDays(p)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  days === p ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--text-muted)]",
                )}
              >
                {t("days", { days: p })}
              </button>
            ))}
          </div>
        )}
      </div>

      {heat.isLoading && <Skeleton className="aspect-[6/4] w-full rounded-[var(--radius-xl)]" />}
      {heat.isError && <p className="text-sm text-[var(--text-muted)]">{t("unavailable")}</p>}

      {heat.data && (
        <>
          <div className="grid grid-cols-6 gap-1.5" aria-hidden={false}>
            {Object.entries(KZ_TILES).map(([code, [row, col]]) => {
              const count = byCode.get(code) ?? 0;
              const share = count === 0 ? 0 : 10 + Math.round((count / max) * 35);
              const name = KZ_REGIONS.find((r) => r.code === code)?.[locale] ?? code;
              const label = KZ_TILE_LABEL[code]?.[locale] ?? code;
              const Tile = onSelectRegion ? "button" : "div";
              return (
                <Tile
                  key={code}
                  {...(onSelectRegion ? { type: "button" as const, onClick: () => onSelectRegion(code) } : {})}
                  aria-label={t("tileLabel", { region: name, count })}
                  className={cn(
                    "flex aspect-square min-w-0 flex-col justify-between rounded-[var(--radius-md)] border border-[var(--border)] p-1.5 text-left",
                    onSelectRegion && "hover:border-[var(--brand)]",
                  )}
                  style={{
                    gridRow: row + 1,
                    gridColumn: col + 1,
                    background: `color-mix(in srgb, var(--risk-danger) ${share}%, var(--surface))`,
                  }}
                >
                  <span className={cn("truncate font-medium text-[var(--text)]", compact ? "text-[10px]" : "text-[11px] sm:text-xs")}>{label}</span>
                  <span className={cn("font-semibold tabular-nums text-[var(--text)]", compact ? "text-sm" : "text-base sm:text-lg")}>{count}</span>
                </Tile>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]" aria-hidden>
            <span>0</span>
            <span className="h-2 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, var(--surface), color-mix(in srgb, var(--risk-danger) 45%, var(--surface)))" }} />
            <span>{max}</span>
          </div>
          {(heat.data.withoutRegion ?? 0) > 0 && <p className="text-xs text-[var(--text-subtle)]">{t("withoutRegion", { count: heat.data.withoutRegion ?? 0 })}</p>}

          {!compact && (
            <details className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
              <summary className="cursor-pointer font-medium text-[var(--text)]">{t("asTable")}</summary>
              <table className="mt-2 w-full text-left">
                <caption className="sr-only">{t("asTable")}</caption>
                <thead className="text-xs text-[var(--text-muted)]">
                  <tr>
                    <th scope="col" className="py-1">{t("colRegion")}</th>
                    <th scope="col" className="py-1 text-right">{t("colReports")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...KZ_REGIONS]
                    .sort((a, b) => (byCode.get(b.code) ?? 0) - (byCode.get(a.code) ?? 0))
                    .map((r) => (
                      <tr key={r.code} className="border-t border-[var(--border)]">
                        <td className="py-1 text-[var(--text-muted)]">{r[locale]}</td>
                        <td className="py-1 text-right tabular-nums text-[var(--text)]">{byCode.get(r.code) ?? 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </details>
          )}
        </>
      )}
    </section>
  );
}
