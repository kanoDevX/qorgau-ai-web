"use client";

import { useTranslations } from "next-intl";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { type RiskBand, riskVisual } from "@/lib/risk";

const ICON: Record<RiskBand, typeof ShieldCheck> = {
  Minimal: ShieldCheck,
  Low: ShieldCheck,
  Elevated: ShieldQuestion,
  High: ShieldAlert,
  Critical: ShieldAlert,
};

export function RiskBadge({
  band,
  size = "md",
  className,
}: {
  band: RiskBand;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const t = useTranslations("risk.band");
  const v = riskVisual(band);
  const Icon = ICON[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3.5 py-1.5 text-sm",
        className,
      )}
      style={{ background: v.bg, color: v.fg, border: `1px solid ${v.color}` }}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3.5"} aria-hidden />
      {t(band)}
    </span>
  );
}
