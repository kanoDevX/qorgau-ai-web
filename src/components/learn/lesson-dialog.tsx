"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Check, PartyPopper, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/primitives";
import type { CourseDetail, LessonProgress } from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type Lesson = NonNullable<CourseDetail["lessons"]>[number];

export function LessonDialog({
  lesson,
  open,
  onOpenChange,
  onComplete,
}: {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Submits the learner's answer; the server grades it and returns the outcome. */
  onComplete: (answer: { lessonId: string; selectedOptionIndex: number | null }) => Promise<LessonProgress>;
}) {
  const t = useTranslations("learn");
  const locale = useLocale();
  const [phase, setPhase] = useState<"read" | "quiz" | "result">("read");
  const [pick, setPick] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<LessonProgress | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lesson) return null;
  const hasQuiz = !!lesson.checkQuestion && (lesson.checkOptions?.length ?? 0) > 0;
  const passed = outcome?.passed ?? false;
  const earned = outcome && !outcome.alreadyCompleted ? outcome.pointsAwarded : null;

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      setOutcome(await onComplete({ lessonId: lesson!.id!, selectedOptionIndex: hasQuiz ? pick : null }));
      setPhase("result");
    } catch (e) {
      // Never show fake points: if the progress didn't save, say so and let them retry.
      setError(toApiError(e, t("saveFailed")).status === 401 ? t("signInToSave") : t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPhase("read");
    setPick(null);
    setOutcome(null);
    setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? onOpenChange(o) : reset())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-sm data-[state=open]:animate-[rise_150ms_ease]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-pop)]">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-[var(--text)]">
              {locale === "en" ? lesson.titleEn : locale === "kk" ? lesson.titleKz : lesson.titleRu}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t("close")}
              className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <AnimatePresence mode="wait">
            {phase === "read" && (
              <motion.div key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">{lesson.bodyMarkdown}</p>
                <Button
                  className="mt-5 w-full"
                  disabled={submitting}
                  onClick={() => {
                    if (hasQuiz) setPhase("quiz");
                    else void finish();
                  }}
                >
                  {hasQuiz ? t("continue") : t("completed")}
                </Button>
              </motion.div>
            )}

            {phase === "quiz" && (
              <motion.div key="quiz" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="mt-4">
                <p className="text-sm font-medium text-[var(--text)]">{lesson.checkQuestion}</p>
                <div className="mt-3 space-y-2">
                  {lesson.checkOptions?.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={pick === i}
                      onClick={() => setPick(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                        pick === i
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--text)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]",
                      )}
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-xs">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
                <Button className="mt-5 w-full" disabled={pick === null || submitting} onClick={finish}>
                  {t("done")}
                </Button>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 flex flex-col items-center gap-3 py-4 text-center"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14 }}
                  className={cn(
                    "flex size-16 items-center justify-center rounded-full",
                    hasQuiz && !passed ? "bg-[var(--risk-caution-bg)]" : "bg-[var(--risk-safe-bg)]",
                  )}
                >
                  {hasQuiz && !passed ? (
                    <PartyPopper className="size-8 text-[var(--risk-caution-fg)]" />
                  ) : (
                    <Check className="size-8 text-[var(--risk-safe-fg)]" />
                  )}
                </motion.span>
                <p className="text-base font-semibold text-[var(--text)]">
                  {hasQuiz ? (passed ? t("quizCorrect") : t("quizWrong")) : t("completed")}
                </p>
                {earned !== null && (
                  <motion.p
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-lg font-bold text-[var(--brand)]"
                  >
                    {t("xpEarned", { xp: earned })}
                  </motion.p>
                )}
                {hasQuiz && !passed && outcome?.correctOptionIndex != null && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("fellForIt")} {lesson.checkOptions?.[outcome.correctOptionIndex]}
                  </p>
                )}
                {outcome?.alreadyCompleted && (
                  <p className="text-xs text-[var(--text-subtle)]">{t("alreadyCompleted")}</p>
                )}
                <Button variant="outline" className="mt-2" onClick={reset}>
                  {t("done")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <p role="alert" className="mt-3 text-center text-xs text-[var(--risk-danger-fg)]">
              {error}
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
