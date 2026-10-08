"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ConnState } from "@/lib/signalr";

const DOT: Record<ConnState, string> = {
  connecting: "bg-[var(--warning)]",
  connected: "bg-[var(--risk-safe)]",
  reconnecting: "bg-[var(--warning)]",
  offline: "bg-[var(--text-subtle)]",
};

export function ConnectionStatus({
  state,
  className,
  compact = false,
}: {
  state: ConnState;
  className?: string;
  /** Dot only (label kept for screen readers) — for the cramped mobile header. */
  compact?: boolean;
}) {
  const t = useTranslations("common");
  const label = state === "connected" ? t("connected") : state === "offline" ? t("offline") : t("reconnecting");
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]", className)}
      aria-live="polite"
      title={state === "offline" ? t("offlineHint") : label}
    >
      <span className="relative flex size-2">
        {state === "connected" && (
          <span className="absolute inline-flex size-full animate-[pulse-ring_2s_ease-out_infinite] rounded-full bg-[var(--risk-safe)] opacity-60" />
        )}
        <span className={cn("relative inline-flex size-2 rounded-full", DOT[state])} />
      </span>
      <span className={compact ? "sr-only" : undefined}>{label}</span>
    </span>
  );
}
