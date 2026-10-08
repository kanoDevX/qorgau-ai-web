"use client";

import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Award, CheckCircle2, Circle, Download, ExternalLink, MessageSquareWarning, RotateCcw, Search, Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { FIND_SIGNS } from "@/content/find-signs";
import {
  certificatePdfUrl,
  useIssueCertificate,
  useLeaderboard,
  useMyCertificates,
  useRespondToSimulation,
  useStartSimulation,
  useTodayQuests,
} from "@/lib/api/hooks";
import { ApiError, toApiError } from "@/lib/api/client";
import { KZ_REGIONS } from "@/lib/kz";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function SectionTitle({ icon: Icon, children }: { icon: typeof Award; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
      <Icon className="size-4 text-[var(--brand)]" aria-hidden /> {children}
    </h2>
  );
}

export function TodayQuests({ enabled }: { enabled: boolean }) {
  const t = useTranslations("learn6");
  const today = useTodayQuests(enabled);
  const quests = today.data?.quests ?? [];
  const allDone = quests.length > 0 && quests.every((q) => q.done);

  return (
    <Card className="p-4">
      <SectionTitle icon={CheckCircle2}>{t("today")}</SectionTitle>
      {today.isLoading && <Skeleton className="h-20 w-full" />}
      <ul className="space-y-2">
        {quests.map((q) => (
          <li key={q.code} className="flex items-center gap-2 text-sm" data-testid={`quest-${q.code}`}>
            {q.done ? (
              <CheckCircle2 className="size-4 text-[var(--risk-safe-fg)]" aria-hidden />
            ) : (
              <Circle className="size-4 text-[var(--text-subtle)]" aria-hidden />
            )}
            <span className={cn(q.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]")}>
              {t(`quest.${q.code}` as never)}
            </span>
            <span className="sr-only">{q.done ? "✓" : ""}</span>
          </li>
        ))}
      </ul>
      {allDone && <p className="mt-2 text-xs text-[var(--risk-safe-fg)]">{t("allDone")}</p>}
    </Card>
  );
}

export function SimulationTrainer() {
  const t = useTranslations("learn6");
  const locale = useLocale() as Locale;
  const start = useStartSimulation(locale);
  const respond = useRespondToSimulation();
  const sim = start.data;
  const feedback = respond.data;
  const needsConsent = start.error instanceof ApiError && start.error.code === "consent.simulations";

  const next = () => {
    respond.reset();
    start.mutate();
  };

  return (
    <Card className="p-4" data-testid="sim-trainer">
      <SectionTitle icon={MessageSquareWarning}>{t("simTitle")}</SectionTitle>
      <p className="mb-3 text-sm text-[var(--text-muted)]">{t("simLead")}</p>

      {needsConsent ? (
        <div className="space-y-2 rounded-lg bg-[var(--surface-2)] p-3 text-sm text-[var(--text)]">
          <p>{t("simConsent")}</p>
          <Link href="/settings/privacy" className="text-[var(--brand)] underline underline-offset-2">
            {t("simOpenPrivacy")}
          </Link>
        </div>
      ) : !sim ? (
        <Button onClick={() => start.mutate()} disabled={start.isPending}>
          {t("simStart")}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] p-3">
            <p className="text-xs text-[var(--text-subtle)]">{t("simFrom", { sender: sim.sender })}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-[var(--text)]">{sim.message}</p>
          </div>
          {!feedback ? (
            <div className="flex flex-wrap gap-2">
              {(["Reported", "FellForIt", "Ignored"] as const).map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant={a === "Reported" ? "primary" : "outline"}
                  disabled={respond.isPending}
                  onClick={() => respond.mutate({ simulationId: sim.simulationId, action: a, lang: locale })}
                >
                  {t(`simAction.${a}`)}
                </Button>
              ))}
            </div>
          ) : (
            <div role="status" className="space-y-2 text-sm">
              <p className={cn("font-semibold", feedback.correct ? "text-[var(--risk-safe-fg)]" : "text-[var(--risk-caution-fg)]")}>
                {feedback.correct ? t("simCorrect") : t("simWrong")}
              </p>
              <p className="text-[var(--text-muted)]">{t("simTells")}</p>
              <ul className="list-disc space-y-1 pl-5 text-[var(--text)]">
                {feedback.tells.map((tell) => (
                  <li key={tell}>{tell}</li>
                ))}
              </ul>
              <Button size="sm" variant="soft" onClick={next}>
                {t("simNext")}
              </Button>
            </div>
          )}
        </div>
      )}
      {!needsConsent && (start.error || respond.error) && (
        <p role="alert" className="mt-2 text-sm text-[var(--risk-danger-fg)]">
          {toApiError(start.error ?? respond.error).message}
        </p>
      )}
    </Card>
  );
}

export function FindSigns() {
  const t = useTranslations("learn6");
  const locale = useLocale() as Locale;
  const data = FIND_SIGNS[locale];
  const total = data.segments.filter((s) => s.sign).length;
  const [found, setFound] = useState<Set<number>>(new Set());

  return (
    <Card className="p-4" data-testid="find-signs">
      <SectionTitle icon={Search}>{t("findTitle")}</SectionTitle>
      <p className="mb-3 text-sm text-[var(--text-muted)]">{t("findLead")}</p>
      <div className="rounded-xl bg-[var(--surface-2)] p-3 text-sm leading-7 text-[var(--text)]">
        <p className="mb-1 text-xs text-[var(--text-subtle)]">{data.sender}</p>
        {data.segments.map((s, i) =>
          s.sign ? (
            <button
              key={i}
              type="button"
              aria-pressed={found.has(i)}
              onClick={() => setFound((prev) => new Set(prev).add(i))}
              className={cn(
                "rounded px-0.5 underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--brand)]",
                found.has(i) && "bg-[var(--risk-danger-bg)] text-[var(--risk-danger-fg)] no-underline",
              )}
            >
              {s.text}
            </button>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]" aria-live="polite">
        {found.size === total ? t("findDone") : t("findFound", { found: found.size, total })}
      </p>
      {found.size > 0 && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--text)]">
          {[...found].sort((a, b) => a - b).map((i) => (
            <li key={i}>{data.segments[i]!.sign}</li>
          ))}
        </ol>
      )}
      {found.size === total && (
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => setFound(new Set())}>
          <RotateCcw /> {t("findReset")}
        </Button>
      )}
    </Card>
  );
}

export function Certificates({ courseId, courseComplete }: { courseId?: string; courseComplete: boolean }) {
  const t = useTranslations("learn6");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const certs = useMyCertificates(locale);
  const issue = useIssueCertificate(locale);
  const hasForCourse = certs.data?.some((c) => c.courseId === courseId);

  return (
    <Card className="p-4" data-testid="certificates">
      <SectionTitle icon={Award}>{t("certificates")}</SectionTitle>
      <p className="mb-3 text-xs text-[var(--text-muted)]">{t("certLead")}</p>
      {courseId && courseComplete && !hasForCourse && (
        <Button size="sm" className="mb-3 w-full" disabled={issue.isPending} onClick={() => issue.mutate(courseId)}>
          {t("issueCert")}
        </Button>
      )}
      {issue.data && <p role="status" className="mb-2 text-xs text-[var(--risk-safe-fg)]">{t("certIssued", { serial: issue.data.serial })}</p>}
      {issue.error && <p role="alert" className="mb-2 text-xs text-[var(--risk-danger-fg)]">{toApiError(issue.error).message}</p>}
      {certs.data?.length === 0 && <p className="text-xs text-[var(--text-subtle)]">{t("noCerts")}</p>}
      <ul className="space-y-3">
        {certs.data?.map((c) => (
          <li key={c.serial} className="rounded-lg border border-[var(--border)] p-3 text-sm">
            <p className="font-medium text-[var(--text)]">{c.courseTitle}</p>
            <p className="font-mono text-xs text-[var(--text-muted)]">{c.serial}</p>
            <p className="text-xs text-[var(--text-subtle)]">{format.dateTime(new Date(c.issuedOnUtc), { dateStyle: "medium" })}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <a href={certificatePdfUrl(c.serial, locale)} className="inline-flex items-center gap-1 text-[var(--brand)] underline underline-offset-2" download>
                <Download className="size-3.5" aria-hidden /> {t("downloadPdf")}
              </a>
              <Link href={`/verify/${encodeURIComponent(c.serial)}`} className="inline-flex items-center gap-1 text-[var(--brand)] underline underline-offset-2">
                <ExternalLink className="size-3.5" aria-hidden /> {t("verifyLink")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function RegionLeague({ homeRegion }: { homeRegion?: string | null }) {
  const t = useTranslations("learn6");
  const tl = useTranslations("learn");
  const locale = useLocale() as Locale;
  const [region, setRegion] = useState<string>(homeRegion ?? "");
  const board = useLeaderboard(region || null, 10);

  return (
    <Card className="p-4" data-testid="league">
      <SectionTitle icon={Trophy}>{t("leagueTitle")}</SectionTitle>
      <label className="sr-only" htmlFor="league-region">
        {t("leagueTitle")}
      </label>
      <select
        id="league-region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="mb-3 h-9 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-sm text-[var(--text)]"
      >
        <option value="">{t("leagueAll")}</option>
        {KZ_REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r[locale]}
          </option>
        ))}
      </select>
      {!homeRegion && <p className="mb-2 text-xs text-[var(--text-subtle)]">{t("leagueSetRegion")}</p>}
      <ol className="space-y-1.5">
        {board.isLoading &&
          [0, 1, 2].map((i) => (
            <li key={i}>
              <Skeleton className="h-7 w-full" />
            </li>
          ))}
        {board.data?.length === 0 && <li className="text-xs text-[var(--text-subtle)]">{t("leagueEmpty")}</li>}
        {board.data?.map((row) => (
          <li key={row.rank} className={cn("flex items-center gap-2 rounded px-1 text-sm", row.isMe && "bg-[var(--brand-soft)]")}>
            <span className="w-5 text-right text-xs tabular-nums text-[var(--text-subtle)]">{row.rank}</span>
            <span className="flex-1 truncate text-[var(--text-muted)]">
              {row.displayName ?? t("leagueHidden")}
              {row.isMe && ` · ${tl("you")}`}
            </span>
            <span className="tabular-nums text-[var(--text)]">{row.points}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[10px] text-[var(--text-subtle)]">{t("leagueNameNote")}</p>
    </Card>
  );
}
