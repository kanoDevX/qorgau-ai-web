"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Bot, Check, Flame, Lock, Star, Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress, Skeleton } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/page-header";
import { LessonDialog } from "@/components/learn/lesson-dialog";
import {
  useCourseDetail,
  useCourses,
  useMyProfile,
  useRecordProgress,
  useResilienceScore,
} from "@/lib/api/hooks";
import { Certificates, FindSigns, RegionLeague, SimulationTrainer, TodayQuests } from "@/components/learn/learning-plus";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export default function LearnPage() {
  const t = useTranslations("learn");
  const locale = useLocale() as Locale;
  const { userId } = useSession();

  const courses = useCourses(locale);
  const [courseId, setCourseId] = useState<string | undefined>();
  const activeCourse = courseId ?? courses.data?.[0]?.id;
  const detail = useCourseDetail(activeCourse, locale);
  const resilience = useResilienceScore(userId);
  const profile = useMyProfile(!!userId);
  const progress = useRecordProgress(activeCourse ?? "");

  const [openLesson, setOpenLesson] = useState<string | null>(null);

  const lessons = detail.data?.lessons ?? [];
  // Completion comes from the server (per signed-in user), so it survives a reload.
  const completed = new Set(lessons.filter((l) => l.completed).map((l) => l.id));
  const lessonTitle = (l: (typeof lessons)[number]) =>
    locale === "en" ? l.titleEn : locale === "kk" ? l.titleKz : l.titleRu;
  const doneCount = completed.size;
  const points = resilience.data?.totalPoints ?? doneCount * 20;
  const streak = resilience.data?.bestStreakDays ?? 0;
  const level = Math.floor(points / 100) + 1;
  const levelProgress = points % 100;

  const currentLesson = lessons.find((l) => l.id === openLesson) ?? null;

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />

      {/* Top gamification strip */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
            <Star className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold tabular-nums text-[var(--text)]">
              {points} <span className="text-xs font-normal text-[var(--text-muted)]">{t("xp")}</span>
            </p>
            <Progress value={levelProgress} className="mt-1 h-1.5 w-28" label={t("levelProgress")} />
          </div>
          <span className="ml-auto rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
            {t("league")} {level}
          </span>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--risk-caution-bg)] text-[var(--risk-caution-fg)]">
            <Flame className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold tabular-nums text-[var(--text)]">
              {t("streakDays", { count: streak })}
            </p>
            <p className="text-[11px] text-[var(--text-subtle)]">{streak > 0 ? t("streakWarn") : ""}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--risk-safe-bg)] text-[var(--risk-safe-fg)]">
            <Trophy className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {doneCount}/{lessons.length} {t("completed").toLowerCase()}
            </p>
            <p className="text-[11px] text-[var(--text-subtle)]">
              {resilience.data
                ? t("resiliencePct", { pct: Math.round((resilience.data.resilienceRatio ?? 0) * 100) })
                : "—"}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Learning path */}
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {courses.isLoading && <Skeleton className="h-8 w-40" />}
            {courses.data?.map((c) => (
              <button
                key={c.id}
                onClick={() => setCourseId(c.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeCourse === c.id
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]",
                )}
              >
                {locale === "en" ? c.titleEn : locale === "kk" ? c.titleKz : c.titleRu}
              </button>
            ))}
          </div>

          <ol className="relative space-y-3 pl-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
            {detail.isLoading &&
              [0, 1, 2].map((i) => (
                <li key={i}>
                  <Skeleton className="h-16 w-full rounded-xl" />
                </li>
              ))}
            {lessons.map((lesson, i) => {
              const isDone = completed.has(lesson.id!);
              const isLocked = i > 0 && !completed.has(lessons[i - 1]!.id!);
              return (
                <motion.li
                  key={lesson.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <span
                    className={cn(
                      "absolute -left-8 top-3 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                      isDone
                        ? "border-[var(--risk-safe)] bg-[var(--risk-safe-bg)] text-[var(--risk-safe-fg)]"
                        : isLocked
                          ? "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-subtle)]"
                          : "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]",
                    )}
                  >
                    {isDone ? <Check className="size-4" /> : isLocked ? <Lock className="size-3.5" /> : i + 1}
                  </span>
                  <Card
                    className={cn(
                      "flex items-center justify-between gap-3 p-4 transition-opacity",
                      isLocked && "border-dashed bg-[var(--bg-elevated)] shadow-none",
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{lessonTitle(lesson)}</p>
                      <p className="text-xs text-[var(--text-subtle)]">
                        {lesson.estimatedMinutes} {t("minutes")} ·{" "}
                        {lesson.format ? t(`format.${lesson.format}` as never) : ""}
                        {isLocked && <span className="sr-only"> — {t("locked")}</span>}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isDone ? "outline" : "primary"}
                      disabled={isLocked}
                      onClick={() => setOpenLesson(lesson.id!)}
                    >
                      {isDone ? t("completed") : t("startLesson")}
                    </Button>
                  </Card>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* Leaderboard + companion */}
        <aside className="space-y-4">
          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <Bot className="size-4 text-[var(--brand)]" /> {t("companion")}
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              {t("companionTip")}
            </p>
            <p className="mt-2 text-[10px] text-[var(--text-subtle)]">{t("companionNote")}</p>
          </Card>

          <TodayQuests enabled={!!userId} />
          <Certificates courseId={activeCourse} courseComplete={lessons.length > 0 && doneCount === lessons.length} />
          <RegionLeague key={profile.data?.homeRegionCode ?? "none"} homeRegion={profile.data?.homeRegionCode} />
        </aside>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <SimulationTrainer />
        <FindSigns />
      </div>

      <LessonDialog
        lesson={currentLesson}
        open={!!openLesson}
        onOpenChange={(o) => !o && setOpenLesson(null)}
        onComplete={(answer) => progress.mutateAsync(answer)}
      />
    </>
  );
}
