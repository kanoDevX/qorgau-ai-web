"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  Map as MapIcon,
  MapPin,
  Network,
  Radar,
  ShieldPlus,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { NetworkExplorer } from "@/components/graph/network-explorer";
import { PageHeader } from "@/components/layout/page-header";
import { ReportForm } from "@/components/radar/report-form";
import { ThreatMap } from "@/components/radar/threat-map";
import { TrendsList } from "@/components/radar/trends-list";
import { useSession } from "@/lib/auth/session";
import {
  useRecentReports,
  useVoteOnReport,
  type RecentReport,
} from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { KZ_REGIONS } from "@/lib/kz";
import { SCAM_CATEGORY_LABELS, riskVisual } from "@/lib/risk";
import { formatRelative, formatTenge } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export default function RadarPage() {
  const t = useTranslations("radar");
  const locale = useLocale() as Locale;
  const [region, setRegion] = useState<string | undefined>();
  const params = useSearchParams();
  const deepLinkReport = params.get("report") === "1";
  const deepLinkCategory = params.get("category") ?? undefined;
  const feed = useRecentReports(region);
  const router = useRouter();
  const pathname = usePathname();
  const TABS = ["feed", "map", "trends", "network"] as const;
  const rawTab = params.get("tab");
  const tab = (TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as (typeof TABS)[number])
    : "feed";
  const setTab = (v: string) =>
    router.replace(v === "feed" ? pathname : `${pathname}?tab=${v}`, {
      scroll: false,
    });

  const byRegion = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of feed.data ?? []) {
      if (r.regionCode) map.set(r.regionCode, (map.get(r.regionCode) ?? 0) + 1);
    }
    return map;
  }, [feed.data]);

  const maxRegion = Math.max(1, ...byRegion.values());

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t("title")} lead={t("lead")} />
        <ReportForm
          defaultOpen={deepLinkReport}
          defaultCategory={deepLinkCategory}
          trigger={
            <Button className="shrink-0">
              <ShieldPlus className="size-4" /> {t("submit")}
            </Button>
          }
        />
      </div>

      {/* Threat map = community reports + fraud networks (absorbs the former /graph screen, §5.2). */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="feed">
            <Radar className="size-3.5" aria-hidden /> {t("tabFeed")}
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapIcon className="size-3.5" aria-hidden /> {t("tabMap")}
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="size-3.5" aria-hidden /> {t("tabTrends")}
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="size-3.5" aria-hidden /> {t("tabNetwork")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="max-w-3xl">
          <ThreatMap
            onSelectRegion={(code) => {
              setRegion(code);
              setTab("feed");
            }}
          />
        </TabsContent>

        <TabsContent value="trends" className="max-w-3xl">
          <TrendsList days={7} />
        </TabsContent>

        <TabsContent value="network">
          <NetworkExplorer />
        </TabsContent>

        <TabsContent value="feed">
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            {/* Feed */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Chip active={!region} onClick={() => setRegion(undefined)}>
                  {t("allKz")}
                </Chip>
                {KZ_REGIONS.slice(0, 8).map((r) => (
                  <Chip
                    key={r.code}
                    active={region === r.code}
                    onClick={() => setRegion(r.code)}
                  >
                    {locale === "en" ? r.en : r.ru}
                    {byRegion.get(r.code) ? (
                      <span className="ml-1 text-[10px] text-[var(--text-subtle)]">
                        {byRegion.get(r.code)}
                      </span>
                    ) : null}
                  </Chip>
                ))}
              </div>

              {feed.isLoading &&
                [0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}

              {feed.data?.length === 0 && (
                <Card className="flex flex-col items-center gap-3 p-10 text-center">
                  <Radar className="size-8 text-[var(--text-subtle)]" />
                  <p className="max-w-sm text-sm text-[var(--text-muted)]">
                    {t("emptyRegion")}
                  </p>
                  <ReportForm
                    trigger={
                      <Button variant="soft" size="sm">
                        {t("submit")}
                      </Button>
                    }
                  />
                </Card>
              )}

              {feed.data?.map((r, i) => (
                <ReportRow key={r.reportId} report={r} index={i} />
              ))}
            </div>

            {/* Region heat + stats */}
            <aside className="space-y-4">
              <Card className="p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <MapPin className="size-4 text-[var(--brand)]" aria-hidden />{" "}
                  {t("byRegion")}
                </p>
                <div className="mt-3 space-y-2">
                  {[...byRegion.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([code, count]) => {
                      const reg = KZ_REGIONS.find((r) => r.code === code);
                      return (
                        <button
                          key={code}
                          onClick={() => setRegion(code)}
                          className="flex w-full items-center gap-2 text-left text-xs"
                        >
                          <span className="w-24 shrink-0 truncate text-[var(--text-muted)]">
                            {locale === "en" ? reg?.en : reg?.ru}
                          </span>
                          <span
                            className="h-2 rounded-full bg-[var(--risk-caution)]"
                            style={{
                              width: `${(count / maxRegion) * 100}%`,
                              minWidth: 6,
                            }}
                          />
                          <span className="tabular-nums text-[var(--text-subtle)]">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  {byRegion.size === 0 && (
                    <p className="text-xs text-[var(--text-subtle)]">
                      {t("noData")}
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-4 text-xs text-[var(--text-muted)]">
                <p className="flex items-center gap-2 font-medium text-[var(--text)]">
                  <Users className="size-4" aria-hidden /> {t("trustTitle")}
                </p>
                <p className="mt-1.5">{t("trustBody")}</p>
              </Card>
            </aside>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function ReportRow({ report, index }: { report: RecentReport; index: number }) {
  const t = useTranslations("radar");
  const locale = useLocale() as Locale;
  const cat =
    SCAM_CATEGORY_LABELS[report.category ?? "Unknown"]?.[locale] ??
    report.category;
  const corr = report.corroborationCount ?? 0;
  const trust = Math.min(100, corr * 30 + 20);
  const v = riskVisual(trust);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-xs text-[var(--text)]">
                {report.identifierMasked}
              </code>
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                {cat}
              </span>
              {report.regionCode && (
                <span className="text-[11px] text-[var(--text-subtle)]">
                  {KZ_REGIONS.find((r) => r.code === report.regionCode)?.[
                    locale === "en" ? "en" : "ru"
                  ] ?? report.regionCode}
                </span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm text-[var(--text-muted)]">
              {report.narrative}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: v.bg, color: v.fg }}
            >
              {corr} {t("corroborated")}
            </span>
            <p className="mt-1 text-[11px] text-[var(--text-subtle)]">
              {formatRelative(report.createdOnUtc ?? new Date().toISOString())}
            </p>
          </div>
        </div>
        {!!report.claimedLossTenge && (
          <p className="mt-2 text-xs text-[var(--risk-danger-fg)]">
            {t("loss", { amount: formatTenge(report.claimedLossTenge) })}
          </p>
        )}
        <ReportVotes report={report} />
      </Card>
    </motion.div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]",
      )}
    >
      {children}
    </button>
  );
}

/** "Was this useful?" (§4.3). Votes feed the moderation queue; you can't vote on your own report. */
function ReportVotes({ report }: { report: RecentReport }) {
  const t = useTranslations("radar");
  const { isAuthenticated } = useSession();
  const vote = useVoteOnReport();
  const [voted, setVoted] = useState<boolean | null>(null);
  const helpful = (report.helpfulVotes ?? 0) + (voted === true ? 1 : 0);
  const notHelpful = (report.notHelpfulVotes ?? 0) + (voted === false ? 1 : 0);

  function cast(value: boolean) {
    vote.mutate(
      { reportId: report.reportId, helpful: value },
      { onSuccess: () => setVoted(value) },
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3 text-xs">
      <span className="text-[var(--text-muted)]">{t("useful")}</span>
      <button
        type="button"
        disabled={!isAuthenticated || vote.isPending || voted !== null}
        aria-pressed={voted === true}
        onClick={() => cast(true)}
        className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[var(--border-strong)] px-2.5 text-[var(--text)] disabled:opacity-60"
      >
        <ThumbsUp className="size-3.5" aria-hidden /> {t("yesUseful")}{" "}
        <span className="tabular-nums">{helpful}</span>
      </button>
      <button
        type="button"
        disabled={!isAuthenticated || vote.isPending || voted !== null}
        aria-pressed={voted === false}
        onClick={() => cast(false)}
        className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[var(--border-strong)] px-2.5 text-[var(--text)] disabled:opacity-60"
      >
        <ThumbsDown className="size-3.5" aria-hidden /> {t("doubtful")}{" "}
        <span className="tabular-nums">{notHelpful}</span>
      </button>
      {!isAuthenticated && (
        <span className="text-[var(--text-subtle)]">{t("signInToVote")}</span>
      )}
      {voted !== null && (
        <span role="status" className="text-[var(--text-muted)]">
          {t("thanksVote")}
        </span>
      )}
      {vote.isError && (
        <span role="alert" className="text-[var(--risk-danger-fg)]">
          {toApiError(vote.error).message}
        </span>
      )}
    </div>
  );
}
