"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ClipboardPaste, CreditCard, Globe, Hash, Landmark, MessageSquareText, Paperclip, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/primitives";
import { DisputePanel } from "@/components/risk/dispute-panel";
import { VerdictCard } from "@/components/risk/verdict-card";
import { LayerProgress } from "./layer-progress";
import { LookupResult } from "./lookup-result";
import { UrlFindings } from "./url-findings";
import { api, ApiError, toApiError, uploadMultipart } from "@/lib/api/client";
import type { Assessment, QrScan, Reputation, UrlScan } from "@/lib/api/hooks";
import { streamCheck, type LayerEvent } from "@/lib/api/stream-check";
import { recordCheck } from "@/lib/history";
import { detectInput, type InputKind } from "@/lib/input-detect";
import { cn } from "@/lib/utils";

const SAMPLE: Record<string, string> = {
  ru: "Здравствуйте! Это служба безопасности банка. По вашей карте зафиксирована подозрительная операция на 250 000 тенге. Чтобы отменить перевод, срочно назовите код из СМС. Никому не сообщайте этот код, иначе счёт заблокируют.",
  kk: "Сәлеметсіз бе! Бұл банк қауіпсіздік қызметі. Картаңызбен күдікті операция тіркелді. Аударымды тоқтату үшін СМС кодын жедел айтыңыз. Кодты ешкімге айтпаңыз.",
  en: "Hello! This is the bank security department. A suspicious 250,000 KZT transaction was flagged on your card. To cancel it, tell me the SMS code now. Do not share this code with anyone or your account will be blocked.",
};

const KIND_ICON: Record<Exclude<InputKind, "empty">, typeof Globe> = {
  text: MessageSquareText,
  url: Globe,
  phone: Hash,
  iban: Landmark,
  card: CreditCard,
};

type Outcome =
  | { type: "assessment"; assessment: Assessment; text?: string; url?: UrlScan; qr?: QrScan }
  | { type: "lookup"; reputation: Reputation };

/**
 * Omni-input (§5.2): one field for a message, a link, a phone number or an IBAN, plus an attachment
 * for a screenshot, a QR photo or a call recording. The type is detected as the user types and the
 * input is routed to the matching check. Messages stream real layer progress (SSE).
 */
export function OmniCheck({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("check");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [text, setText] = useState("");

  // Web Share Target (manifest): "Share → QorgauAI" lands on /check?title=&text=&url=. Prefill only —
  // nothing is sent until the person presses the button. Read once, then clean the URL.
  useEffect(() => {
    if (compact) return;
    const q = new URLSearchParams(window.location.search);
    const shared = [q.get("title"), q.get("text"), q.get("url")].filter(Boolean).join("\n").slice(0, 20_000);
    if (!shared) return;
    setText(shared);
    q.delete("title"); q.delete("text"); q.delete("url");
    const rest = q.toString();
    window.history.replaceState(null, "", window.location.pathname + (rest ? "?" + rest : ""));
  }, [compact]);
  const [busy, setBusy] = useState(false);
  const [layers, setLayers] = useState<LayerEvent[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [canPaste, setCanPaste] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const detected = useMemo(() => detectInput(text), [text]);

  useEffect(() => {
    setCanPaste(typeof navigator !== "undefined" && !!navigator.clipboard?.readText);
  }, []);

  function remember(a: Assessment, medium: "text" | "image" | "audio") {
    recordCheck({ id: a.assessmentId, at: new Date().toISOString(), score: a.riskScore, band: a.riskBand, category: a.category, medium });
  }

  async function run() {
    if (detected.kind === "empty" || detected.kind === "card" || busy) return;
    setBusy(true);
    setError(null);
    setLayers([]);
    try {
      if (detected.kind === "url") {
        const res = await api.POST("/api/v1/scam-check/url", { body: { url: detected.value, languageCode: locale } });
        if (!res.data) throw new ApiError(res.response.status, undefined, t("errors.url"));
        remember(res.data.assessment, "text");
        setOutcome({ type: "assessment", assessment: res.data.assessment, url: res.data });
      } else if (detected.kind === "phone" || detected.kind === "iban") {
        const res = await api.GET("/api/v1/lookup/{phoneOrIban}", { params: { path: { phoneOrIban: detected.value } } });
        if (!res.data) throw new ApiError(res.response.status, undefined, t("errors.lookup"));
        setOutcome({ type: "lookup", reputation: res.data });
      } else {
        const a = await streamCheck({ text, languageCode: locale, onLayer: (e) => setLayers((l) => [...l, e]) });
        remember(a, "text");
        setOutcome({ type: "assessment", assessment: a, text });
      }
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function runFile(file: File) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setLayers([]);
    const form = () => {
      const f = new FormData();
      f.append("file", file);
      f.append("language", locale);
      return f;
    };
    try {
      if (file.type.startsWith("audio/")) {
        const a = await uploadMultipart<Assessment>("/api/v1/scam-check/audio", form());
        remember(a, "audio");
        setOutcome({ type: "assessment", assessment: a });
        return;
      }
      // A photo may be a QR code (cheap, no AI) — try that first, otherwise treat it as a screenshot.
      try {
        const qr = await uploadMultipart<QrScan>("/api/v1/scam-check/qr", form());
        remember(qr.assessment, "image");
        setOutcome({ type: "assessment", assessment: qr.assessment, qr, url: qr.url ?? undefined });
        return;
      } catch (e) {
        if (!(e instanceof ApiError) || e.code !== "qr.not_found") throw e;
      }
      const a = await uploadMultipart<Assessment>("/api/v1/scam-check/image", form());
      remember(a, "image");
      setOutcome({ type: "assessment", assessment: a });
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function reset() {
    setOutcome(null);
    setText("");
    setDisputeOpen(false);
    setError(null);
  }

  const KindIcon = detected.kind === "empty" ? null : KIND_ICON[detected.kind];

  return (
    <div className={cn("w-full", compact ? "max-w-xl" : "max-w-2xl")}>
      <AnimatePresence mode="wait">
        {outcome ? (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {outcome.type === "lookup" ? (
              <>
                <LookupResult data={outcome.reputation} />
                <Button variant="outline" onClick={reset}>
                  {t("checkAnother")}
                </Button>
              </>
            ) : (
              <>
                <VerdictCard
                  assessment={outcome.assessment}
                  submittedText={outcome.text}
                  onCheckAnother={reset}
                  onDispute={() => setDisputeOpen((o) => !o)}
                >
                  {outcome.qr && (
                    <p className="mb-3 break-all rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text-muted)]">
                      {t("qrContent")}: <span className="font-id text-[var(--text)]">{outcome.qr.content}</span>
                    </p>
                  )}
                  {outcome.url && <UrlFindings scan={outcome.url} />}
                </VerdictCard>
                {disputeOpen && <DisputePanel assessmentId={outcome.assessment.assessmentId} onClose={() => setDisputeOpen(false)} />}
              </>
            )}
          </motion.div>
        ) : busy ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"
          >
            <LayerProgress events={layers} />
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-1 shadow-[var(--shadow-card)]">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void run();
                }}
                placeholder={t("omniPlaceholder")}
                className="min-h-[128px] border-0 bg-transparent focus-visible:ring-0"
                aria-label={t("title")}
                aria-describedby="omni-kind"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                  >
                    <Paperclip className="size-3.5" aria-hidden /> {t("attach")}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/ogg,audio/webm"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void runFile(f);
                    }}
                  />
                  {canPaste && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const clip = await navigator.clipboard.readText();
                          if (clip.trim()) setText(clip);
                        } catch {
                          /* permission denied — manual paste still works */
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                    >
                      <ClipboardPaste className="size-3.5" aria-hidden /> {t("paste")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setText(SAMPLE[locale] ?? SAMPLE.ru!)}
                    className="px-2 py-1.5 text-xs text-[var(--text-subtle)] underline-offset-2 hover:text-[var(--text-muted)] hover:underline"
                  >
                    {t("tryExample")}
                  </button>
                </div>
                <Button size={compact ? "md" : "lg"} onClick={() => void run()} disabled={detected.kind === "empty" || detected.kind === "card"}>
                  {t("analyze")}
                </Button>
              </div>
            </div>

            <p id="omni-kind" aria-live="polite" className="mt-2 flex min-h-5 items-center gap-1.5 text-xs text-[var(--text-muted)]">
              {KindIcon && <KindIcon className="size-3.5" aria-hidden />}
              {detected.kind !== "empty" && (
                <span className={detected.kind === "card" ? "font-medium text-[var(--risk-danger-fg)]" : undefined}>
                  {t(`kind.${detected.kind}` as never)}
                </span>
              )}
            </p>

            <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--text-subtle)]">
              <Sparkles className="size-3" aria-hidden /> {tc("poweredNote")}
            </p>
            {error && (
              <p role="alert" className="mt-2 text-center text-sm text-[var(--risk-danger-fg)]">
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
