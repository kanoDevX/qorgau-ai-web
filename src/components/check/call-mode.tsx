"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { KeyRound, Landmark, MessageSquareWarning, PhoneOff, Timer, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { LookupResult } from "./lookup-result";
import { api } from "@/lib/api/client";
import type { Reputation } from "@/lib/api/hooks";
import { detectInput } from "@/lib/input-detect";

const PROMPTS = [
  { key: "safeWord", icon: KeyRound },
  { key: "code", icon: MessageSquareWarning },
  { key: "bank", icon: Landmark },
  { key: "money", icon: Wallet },
] as const;

/**
 * "Someone is calling me right now" (§5.3, Truecaller-style in-call help). Big, one-tap prompts the
 * user can follow while still on the line, a timer (scammers work by keeping you talking), and a
 * caller-number check after hanging up. Works without an account.
 */
export function CallMode() {
  const t = useTranslations("callMode");
  const [seconds, setSeconds] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [hungUp, setHungUp] = useState(false);
  const [number, setNumber] = useState("");
  const [rep, setRep] = useState<Reputation | null>(null);
  const [lookupError, setLookupError] = useState(false);

  useEffect(() => {
    if (hungUp) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [hungUp]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  async function lookup() {
    const d = detectInput(number);
    if (d.kind !== "phone") {
      setLookupError(true);
      return;
    }
    setLookupError(false);
    const res = await api.GET("/api/v1/lookup/{phoneOrIban}", { params: { path: { phoneOrIban: d.value } } });
    if (res.data) setRep(res.data);
  }

  return (
    <section aria-labelledby="call-mode-title" className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="call-mode-title" className="text-[length:var(--text-heading)] font-semibold text-[var(--text)]">
          {t("title")}
        </h2>
        {!hungUp && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3 py-1 font-id text-sm text-[var(--text)]" aria-label={t("timerLabel", { time: `${mm}:${ss}` })}>
            <Timer className="size-4 text-[var(--brand)]" aria-hidden /> {mm}:{ss}
          </span>
        )}
      </div>

      {!hungUp ? (
        <>
          <p className="text-[var(--text-muted)]">{t("lead")}</p>
          <ul className="space-y-2">
            {PROMPTS.map(({ key, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  aria-expanded={open === key}
                  onClick={() => setOpen((o) => (o === key ? null : key))}
                  className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-left text-base font-medium text-[var(--text)] hover:border-[var(--brand)]"
                >
                  <Icon className="size-6 shrink-0 text-[var(--brand)]" aria-hidden />
                  {t(`prompt.${key}.q`)}
                </button>
                <AnimatePresence>
                  {open === key && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden px-4 pt-2 text-[15px] leading-relaxed text-[var(--text)]"
                    >
                      {t(`prompt.${key}.a`)}
                      {key === "safeWord" && (
                        <Link href="/family" className="ml-1 text-[var(--brand)] underline underline-offset-2">
                          {t("safeWordLink")}
                        </Link>
                      )}
                    </motion.p>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
          <Button variant="danger" size="xl" className="w-full" onClick={() => setHungUp(true)}>
            <PhoneOff className="size-5" aria-hidden /> {t("hungUp")}
          </Button>
          <p className="text-sm text-[var(--text-muted)]">{t("hangUpHint")}</p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="font-semibold text-[var(--text)]">{t("afterTitle")}</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] text-[var(--text-muted)]">
              <li>{t("after1")}</li>
              <li>{t("after2")}</li>
              <li>
                {t("after3")}{" "}
                <Link href="/golden-hour" className="text-[var(--brand)] underline underline-offset-2">
                  {t("goldenHourLink")}
                </Link>
              </li>
            </ol>
          </div>

          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup();
            }}
          >
            <label htmlFor="caller-number" className="text-sm font-medium text-[var(--text)]">
              {t("checkNumber")}
            </label>
            <div className="flex gap-2">
              <Input id="caller-number" inputMode="tel" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+7 7__ ___ __ __" className="h-12 font-id text-base" />
              <Button type="submit" size="lg">
                {t("check")}
              </Button>
            </div>
            {lookupError && <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">{t("notPhone")}</p>}
          </form>
          {rep && <LookupResult data={rep} />}
        </div>
      )}
    </section>
  );
}
