"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { clampScore, riskVisual } from "@/lib/risk";
import { cn } from "@/lib/utils";

/**
 * A 240° arc gauge. The score is NEVER shown as a bare number — it always sits inside this
 * gauge with its band label and (optionally) a percentile subtitle, per the explainability-first
 * principle. One risk colour scale, shared with badges and charts.
 */
export function RiskGauge({
  score,
  size = 200,
  subtitle,
  className,
}: {
  score: number;
  size?: number;
  subtitle?: string;
  className?: string;
}) {
  const t = useTranslations("risk");
  const reduce = useReducedMotion();
  const value = clampScore(score);
  const v = riskVisual(value);

  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 150;
  const sweep = 240;
  const circ = 2 * Math.PI * r;
  const arcLen = (sweep / 360) * circ;
  const dash = (value / 100) * arcLen;

  const polar = (angle: number) => {
    const a = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const p0 = polar(startAngle);
  const p1 = polar(startAngle + sweep);
  const largeArc = sweep > 180 ? 1 : 0;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)} style={{ width: size }}>
      <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.82}`} role="img"
        aria-label={`${t("score")}: ${value} ${t("outOf")}, ${t(`band.${v.band}`)}`}>
        <path
          d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`}
          fill="none"
          stroke={v.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          initial={reduce ? false : { strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${v.color}55)` }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
        <motion.span
          key={value}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color: v.fg }}
        >
          {value}
        </motion.span>
        <span className="text-[11px] font-medium text-[var(--text-subtle)]">
          {t("outOf")}
        </span>
      </div>
      <div className="mt-1 text-center">
        <span className="text-sm font-semibold" style={{ color: v.fg }}>
          {t(`band.${v.band}`)}
        </span>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}
