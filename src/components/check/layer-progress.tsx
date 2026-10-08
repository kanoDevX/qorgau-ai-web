"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2, Minus } from "lucide-react";
import type { LayerEvent, LayerName } from "@/lib/api/stream-check";
import { cn } from "@/lib/utils";

const ORDER: LayerName[] = ["Heuristics", "GeminiMultimodal", "CommunityReputation"];

/**
 * Progress of the real pipeline, driven by server-sent events (§4.2): a layer is marked done only
 * when the backend says it finished. The first layer still waiting is shown as running.
 */
export function LayerProgress({ events }: { events: LayerEvent[] }) {
  const t = useTranslations("check.layers");
  const done = new Map(events.map((e) => [e.layer, e]));
  const runningIndex = ORDER.findIndex((l) => !done.has(l));

  return (
    <ol className="mx-auto max-w-sm space-y-3 py-6" aria-live="polite">
      {ORDER.map((layer, i) => {
        const ev = done.get(layer);
        const state = ev ? (ev.available ? "done" : "skipped") : i === runningIndex ? "running" : "pending";
        return (
          <li key={layer} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border",
                state === "done" && "border-[var(--risk-safe)] bg-[var(--risk-safe-bg)]",
                state === "skipped" && "border-[var(--risk-caution)] bg-[var(--risk-caution-bg)]",
                (state === "running" || state === "pending") && "border-[var(--border-strong)] bg-[var(--surface-2)]",
              )}
              aria-hidden
            >
              {state === "done" && <Check className="size-4 text-[var(--risk-safe-fg)]" />}
              {state === "skipped" && <Minus className="size-4 text-[var(--risk-caution-fg)]" />}
              {state === "running" && <Loader2 className="size-4 animate-spin text-[var(--brand)]" />}
              {state === "pending" && <span className="size-1.5 rounded-full bg-[var(--text-subtle)]" />}
            </span>
            <span className={state === "pending" ? "text-[var(--text-subtle)]" : "text-[var(--text)]"}>
              {t(layer)}
              <span className="sr-only"> — {t(`state.${state}`)}</span>
            </span>
            {state === "skipped" && <span className="text-xs text-[var(--risk-caution-fg)]">{t("state.skipped")}</span>}
          </li>
        );
      })}
    </ol>
  );
}
