"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, Loader2, Network, ShieldCheck, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Switch, Textarea } from "@/components/ui/primitives";
import { RiskGauge } from "@/components/risk/risk-gauge";
import { RiskBadge } from "@/components/risk/risk-badge";
import { useSecondOpinion, type SecondOpinion } from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { IDENTIFIER_KINDS } from "@/lib/kz";
import { bandForScore, type RiskBand } from "@/lib/risk";
import type { Locale } from "@/lib/i18n/config";

type Phase = "questions" | "form" | "pause" | "safe" | "sent" | "cancelled";

/** Revolut-style scam-intervention questions: any "yes" forces a pause before paying. */
const QUESTIONS = ["rushed", "secret", "securityCall", "returns", "safeAccount"] as const;
const FORCED_PAUSE_SECONDS = 15;

/**
 * "I am about to send money" (§5.3): first a few honest questions, then a recipient check
 * (POST /payments/second-opinion), then — if anything looks wrong — a pause with a countdown before
 * the user may continue. Formerly the /second-opinion screen.
 */
export function TransferCheck() {
  const t = useTranslations("secondOpinion");
  const locale = useLocale() as Locale;
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>({});
  const yes = QUESTIONS.filter((q) => answers[q] === true);

  const [recipient, setRecipient] = useState("");
  const [kind, setKind] = useState<string>("PhoneNumber");
  const [amount, setAmount] = useState("");
  const [firstTransfer, setFirstTransfer] = useState(true);
  const [conversation, setConversation] = useState("");
  const [phase, setPhase] = useState<Phase>("questions");

  const secondOpinion = useSecondOpinion();
  const result = secondOpinion.data;

  function submit() {
    if (!recipient.trim()) return;
    secondOpinion.mutate(
      {
        recipientIdentifier: recipient.trim(),
        recipientIdentifierKind: kind,
        amountTenge: amount ? Number(amount) : null,
        isFirstTransferToRecipient: firstTransfer,
        recentConversation: conversation.trim() || null,
      },
      { onSuccess: (r) => setPhase(r.shouldPause || yes.length > 0 ? "pause" : "safe") },
    );
  }

  function restart() {
    setPhase("questions");
    setAnswers({});
    secondOpinion.reset();
    setRecipient("");
    setAmount("");
    setFirstTransfer(true);
    setConversation("");
  }

  return (
    <>
      <div className="max-w-xl">
        <AnimatePresence mode="wait">
          {phase === "questions" && (
            <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="space-y-4 p-5">
                <div>
                  <h2 className="text-[length:var(--text-heading)] font-semibold text-[var(--text)]">{t("questionsTitle")}</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{t("questionsLead")}</p>
                </div>
                {QUESTIONS.map((q) => (
                  <fieldset key={q} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                    <legend className="px-1 text-[15px] font-medium text-[var(--text)]">{t(`q.${q}`)}</legend>
                    <div className="mt-2 flex gap-2">
                      {([true, false] as const).map((v) => (
                        <label
                          key={String(v)}
                          className={cn(
                            "flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border text-sm font-medium",
                            answers[q] === v
                              ? v
                                ? "border-[var(--risk-danger)] bg-[var(--risk-danger-bg)] text-[var(--risk-danger-fg)]"
                                : "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                              : "border-[var(--border-strong)] text-[var(--text-muted)]",
                          )}
                        >
                          <input
                            type="radio"
                            name={`q-${q}`}
                            className="sr-only"
                            checked={answers[q] === v}
                            onChange={() => setAnswers((a) => ({ ...a, [q]: v }))}
                          />
                          {v ? t("yes") : t("no")}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                {yes.length > 0 && (
                  <p role="status" className="rounded-[var(--radius-md)] bg-[var(--risk-danger-bg)] p-3 text-sm font-medium text-[var(--risk-danger-fg)]">
                    {t("questionsWarning", { count: yes.length })}
                  </p>
                )}
                <Button size="lg" className="w-full" onClick={() => setPhase("form")} disabled={QUESTIONS.some((q) => answers[q] === undefined)}>
                  {t("questionsNext")} <ArrowRight className="size-4" aria-hidden />
                </Button>
              </Card>
            </motion.div>
          )}

          {phase === "form" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="space-y-4 p-5">
                <Field label={t("recipient")}>
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={t("recipientPlaceholder")}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("recipientKind")}>
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                      className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text)]"
                    >
                      {IDENTIFIER_KINDS.map((k) => (
                        <option key={k.value} value={k.value}>
                          {locale === "en" ? k.en : k.ru}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("amount")}>
                    <Input
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="150000"
                    />
                  </Field>
                </div>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
                  <span className="text-sm text-[var(--text)]">{t("firstTransfer")}</span>
                  <Switch checked={firstTransfer} onCheckedChange={setFirstTransfer} />
                </label>

                <Field label={t("conversation")}>
                  <Textarea
                    value={conversation}
                    onChange={(e) => setConversation(e.target.value)}
                    placeholder={t("conversationPlaceholder")}
                    className="min-h-[96px]"
                  />
                </Field>

                <Button size="lg" className="w-full" onClick={submit} disabled={!recipient.trim() || secondOpinion.isPending}>
                  {secondOpinion.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {t("checking")}
                    </>
                  ) : (
                    <>
                      {t("pay")} <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>

                {secondOpinion.isError && (
                  <p className="text-center text-xs text-[var(--risk-danger-fg)]">
                    {toApiError(secondOpinion.error).message}
                  </p>
                )}
                <p className="text-center text-[11px] text-[var(--text-subtle)]">{t("demoNote")}</p>
              </Card>
            </motion.div>
          )}

          {phase === "pause" && result && (
            <PauseCard
              key="pause"
              result={result}
              userSignals={yes.map((q) => t(`q.${q}`))}
              minCoolDown={yes.length > 0 ? FORCED_PAUSE_SECONDS : 0}
              onProceed={() => setPhase("sent")}
              onCancel={() => setPhase("cancelled")}
            />
          )}

          {phase === "safe" && result && (
            <motion.div key="safe" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="space-y-3 border-[var(--risk-safe)] p-6" style={{ background: "var(--risk-safe-bg)" }}>
                <p className="flex items-center gap-2 text-lg font-bold text-[var(--risk-safe-fg)]">
                  <ShieldCheck className="size-5" /> {t("safeTitle")}
                </p>
                <p className="text-sm text-[var(--text-muted)]">{result.reason || t("safeBody")}</p>
                <div className="flex gap-2 pt-1">
                  <Button onClick={() => setPhase("sent")}>{t("pay")}</Button>
                  <Button variant="ghost" onClick={restart}>
                    {t("restart")}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {(phase === "sent" || phase === "cancelled") && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="space-y-3 p-6 text-center">
                <p className="text-sm text-[var(--text)]">
                  {phase === "sent" ? t("sent") : t("cancelled")}
                </p>
                <Button variant="outline" onClick={restart}>
                  {t("restart")}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function PauseCard({
  result,
  userSignals,
  minCoolDown,
  onProceed,
  onCancel,
}: {
  result: SecondOpinion;
  userSignals: string[];
  minCoolDown: number;
  onProceed: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("secondOpinion");
  const coolDown = Math.max(result.coolDownSeconds ?? 0, minCoolDown);
  const [left, setLeft] = useState(coolDown);

  useEffect(() => {
    // Anchor to wall-clock so the countdown can't drift over a 2–5 min cool-down.
    const endsAt = Date.now() + coolDown * 1000;
    let id: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0 && id) clearInterval(id);
    };
    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [coolDown]);

  const band = useMemo<RiskBand>(
    () => (result.recipientRiskBand as RiskBand | undefined) ?? bandForScore(result.recipientRiskScore ?? 0),
    [result],
  );
  const indicators = [...userSignals, ...(result.pressureIndicators ?? [])];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="overflow-hidden border-[var(--risk-danger)]">
        <div className="flex flex-col items-center gap-3 p-6 text-center" style={{ background: "var(--risk-danger-bg)" }}>
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--danger-solid)] text-[var(--danger-fg)]">
            <Timer className="size-6" />
          </div>
          <p className="text-xl font-bold text-[var(--risk-danger-fg)]">{t("pauseTitle")}</p>
          <p className="text-sm text-[var(--text)]">{result.shouldPause ? result.reason : t("pauseBecauseAnswers")}</p>
          {left > 0 && (
            <p className="text-xs text-[var(--text-subtle)]">
              {t("coolDown")}{" "}
              <span className="font-bold tabular-nums text-[var(--text)]">
                {left}
                {t("seconds")}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-[var(--border)] p-5">
          <RiskGauge score={result.recipientRiskScore ?? 0} size={104} />
          <div className="space-y-1.5">
            <p className="text-xs text-[var(--text-subtle)]">{t("recipientRisk")}</p>
            <RiskBadge band={band} size="lg" />
            {result.recipientInKnownFraudCluster && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--risk-danger-fg)]">
                <Network className="size-3.5" /> {t("inCluster")}
              </p>
            )}
          </div>
        </div>

        {indicators.length > 0 && (
          <div className="border-t border-[var(--border)] p-5">
            <p className="mb-2 text-sm font-semibold text-[var(--text)]">{t("pressureTitle")}</p>
            <ul className="space-y-1.5">
              {indicators.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--risk-danger)]" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-[var(--border)] p-5 sm:flex-row-reverse">
          <Button variant="danger" className="flex-1" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onProceed} disabled={left > 0}>
            {left > 0 ? `${t("proceedAfter")} ${left}${t("seconds")}` : t("proceed")}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
      {children}
    </label>
  );
}
