"use client";

/*
 * Living documentation of design system 2.0 "Calm Shield". Developer-only (404 in production, see
 * layout.tsx), so it is English-only and not part of the i18n surface. Contrast numbers are computed
 * live from the current theme, the same formula as scripts/design-tokens.mjs.
 */
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Ornament } from "@/components/brand/ornament";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Progress, Skeleton, Switch } from "@/components/ui/primitives";
import { RiskGauge } from "@/components/risk/risk-gauge";
import { RiskBadge } from "@/components/risk/risk-badge";
import type { RiskBand } from "@/lib/risk";

const BANDS: RiskBand[] = ["Minimal", "Low", "Elevated", "High", "Critical"];
const RISK = ["safe", "low", "caution", "danger", "critical"];
const SURFACES = ["bg", "bg-elevated", "surface", "surface-2", "surface-3"];
const PAIRS: [string, string, number][] = [
  ["text", "surface", 4.5],
  ["text-muted", "surface", 4.5],
  ["text-subtle", "surface-2", 4.5],
  ["brand", "surface-2", 4.5],
  ["brand-fg", "brand-solid", 4.5],
  ["danger-fg", "danger-solid", 4.5],
  ["gold", "bg", 4.5],
  ["border-strong", "surface", 3],
  ["ring", "bg", 3],
  ...RISK.map((r) => [`risk-${r}-fg`, `risk-${r}-bg`, 4.5] as [string, string, number]),
  ...RISK.map((r) => [`risk-${r}`, "surface", 3] as [string, string, number]),
];

function toRgb(css: string): number[] | null {
  const hex = css.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex?.[1]) return [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16));
  const rgb = css.match(/rgba?\(([^)]+)\)/);
  if (rgb?.[1]) return rgb[1].split(/[ ,/]+/).slice(0, 3).map(Number);
  return null;
}
function luminance([r, g, b]: number[]): number {
  const f = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
}
/** Resolves any CSS colour (incl. color-mix) by letting the browser paint it. */
function computed(token: string): number[] | null {
  const probe = document.createElement("span");
  probe.style.color = `var(--${token})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return toRgb(value);
}

export default function DesignSystemPage() {
  const { resolvedTheme } = useTheme();
  const [rows, setRows] = useState<{ fg: string; bg: string; ratio: number; min: number }[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setRows(
        PAIRS.map(([fg, bg, min]) => {
          const a = computed(fg);
          const b = computed(bg);
          const ratio = a && b ? (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05) : 0;
          return { fg, bg, ratio, min };
        }),
      );
    }, 50);
    return () => window.clearTimeout(id);
  }, [resolvedTheme]);

  return (
    <>
      <h1 className="text-[length:var(--text-title)] text-[var(--text)]">Calm Shield · design system 2.0</h1>
      <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
        Steppe-night surfaces, flag-sky accent, sun gold for achievements. Tokens live in <code>globals.css</code>; components
        never use hex. Switch theme, high contrast or large text in Settings and this page re-measures itself.
      </p>
      <Ornament className="mt-6" />

      <div className="mt-8 space-y-10">
        <Section title="Typography">
          <div className="space-y-3">
            <p className="font-display text-[length:var(--text-display)] leading-tight text-[var(--text)]">Қорғау · Защита · Shield</p>
            <p className="text-[length:var(--text-title)] font-semibold text-[var(--text)]">Title — Inter 600, fluid clamp()</p>
            <p className="text-[length:var(--text-heading)] font-semibold text-[var(--text)]">Heading — Inter 600</p>
            <p className="max-w-prose text-[var(--text-muted)]">
              Body — Inter with single-storey a and open digits. Kazakh check: ә ғ қ ң ө ұ ү һ і Ә Ғ Қ Ң Ө Ұ Ү Һ І.
            </p>
            <p className="font-id text-[var(--text)]">KZ86 125K ZT50 0410 0100 · +7 701 000 00 01</p>
          </div>
        </Section>

        <Section title="Surfaces">
          <div className="flex flex-wrap gap-3">
            {SURFACES.map((tok) => (
              <Swatch key={tok} token={tok} />
            ))}
            <Swatch token="brand" />
            <Swatch token="brand-solid" />
            <Swatch token="gold" />
            <Swatch token="danger-solid" />
          </div>
        </Section>

        <Section title="Risk scale (lightness + hue, checked under deuteranopia/protanopia)">
          <div className="flex flex-wrap gap-3">
            {RISK.map((r) => (
              <Swatch key={r} token={`risk-${r}`} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {BANDS.map((b) => (
              <RiskBadge key={b} band={b} size="lg" />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-6">
            {[8, 32, 55, 74, 96].map((s) => (
              <RiskGauge key={s} score={s} size={120} />
            ))}
          </div>
        </Section>

        <Section title={`Live contrast (${resolvedTheme ?? "dark"})`}>
          <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--border)]" tabIndex={0} role="region" aria-label="Contrast table">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--text-muted)]">
                <tr>
                  <th scope="col" className="px-3 py-2">Foreground</th>
                  <th scope="col" className="px-3 py-2">Background</th>
                  <th scope="col" className="px-3 py-2">Ratio</th>
                  <th scope="col" className="px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.fg + r.bg} className="border-t border-[var(--border)]">
                    <td className="px-3 py-1.5 font-id text-xs">--{r.fg}</td>
                    <td className="px-3 py-1.5 font-id text-xs">--{r.bg}</td>
                    <td className="px-3 py-1.5">{r.ratio.toFixed(2)}</td>
                    <td className="px-3 py-1.5">{r.ratio >= r.min ? `pass (≥${r.min})` : `FAIL (<${r.min})`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Ornament">
          <div className="space-y-3 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <Ornament />
            <Ornament tone="gold" size={40} />
          </div>
        </Section>

        <Section title="Controls">
          <div className="flex flex-wrap items-center gap-3">
            {(["primary", "soft", "outline", "ghost", "danger", "link"] as const).map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
            <Button disabled>disabled</Button>
          </div>
          <div className="mt-4 grid max-w-md gap-3">
            <Input placeholder="Input" aria-label="Example input" />
            <Progress value={62} />
            <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
              <Switch defaultChecked aria-label="Example switch" /> Switch
            </label>
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
          </div>
        </Section>

        <Section title="Card">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Explainability first</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--text-muted)]">
              A risk score is never a bare number: it always comes with the reasons.
            </CardContent>
          </Card>
        </Section>
      </div>
    </>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="w-24 text-center">
      <div className="h-12 rounded-[var(--radius-md)] border border-[var(--border)]" style={{ background: `var(--${token})` }} />
      <span className="mt-1 block font-id text-[11px] text-[var(--text-subtle)]">--{token}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-[var(--text)]">{title}</h2>
      {children}
    </section>
  );
}
