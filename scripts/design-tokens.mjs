#!/usr/bin/env node
/**
 * Design-token checker (§3.14, §5.1).
 * Parses src/app/globals.css, resolves var() and color-mix(in srgb, …) per mode, then checks:
 *   - WCAG 2.2 contrast: text pairs ≥ 4.5:1, UI/icon pairs ≥ 3:1 — dark, light, high-contrast dark/light;
 *   - risk-band separation under deuteranopia / protanopia (Machado et al. 2009, severity 1.0):
 *     adjacent bands must stay ≥ 15 ΔE (CIE76) apart, so the scale never relies on hue alone.
 * Writes a markdown report and exits 1 on any failure.
 *
 *   node scripts/design-tokens.mjs [--out ../QorgauAI/docs/design/contrast.md]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");

/* ---------- parsing ---------- */

function block(selectorStart) {
  const i = css.indexOf(selectorStart);
  if (i < 0) throw new Error(`selector not found: ${selectorStart}`);
  const open = css.indexOf("{", i);
  const close = css.indexOf("}", open);
  const body = css.slice(open + 1, close);
  const vars = {};
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const dark = block(":root,\n.dark {");
const light = block(".light {");
export const MODES = {
  dark,
  light,
  "hc-dark": { ...dark, ...block('html[data-contrast="more"].dark') },
  "hc-light": { ...light, ...block('html[data-contrast="more"].light') },
};

const hexToRgb = (h) => {
  const s = h.replace("#", "");
  const full = s.length === 3 ? [...s].map((c) => c + c).join("") : s;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const rgbToHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export function resolve(vars, value, depth = 0) {
  if (depth > 10) throw new Error(`cycle resolving ${value}`);
  value = value.trim();
  const v = value.match(/^var\(--([\w-]+)\)$/);
  if (v) return resolve(vars, vars[v[1]], depth + 1);
  const mix = value.match(/^color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+)\)$/);
  if (mix) {
    const a = hexToRgb(resolve(vars, mix[1], depth + 1));
    const b = hexToRgb(resolve(vars, mix[3], depth + 1));
    const p = Number(mix[2]) / 100;
    return rgbToHex(a.map((x, i) => x * p + b[i] * (1 - p)));
  }
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value.slice(0, 7).toLowerCase();
  throw new Error(`cannot resolve "${value}"`);
}

/* ---------- colour science ---------- */

const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear RGB.
const CVD = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
};
const unlin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const simulate = (hex, m) => {
  const l = hexToRgb(hex).map(lin);
  return m.map((row) => Math.min(255, Math.max(0, unlin(Math.max(0, row[0] * l[0] + row[1] * l[1] + row[2] * l[2])))));
};
const toLab = (rgb) => {
  const [r, g, b] = rgb.map(lin);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
};
const deltaE = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));

/* ---------- rules ---------- */

const SURFACES = ["bg", "bg-elevated", "surface", "surface-2"];
const BANDS = ["safe", "low", "caution", "danger", "critical"];

export function checks() {
  const rows = [];
  for (const [mode, vars] of Object.entries(MODES)) {
    const c = (name) => resolve(vars, `var(--${name})`);
    const add = (fg, bg, min, kind) =>
      rows.push({ mode, fg, bg, kind, min, ratio: contrast(c(fg), c(bg)), fgHex: c(fg), bgHex: c(bg) });

    for (const s of SURFACES) {
      for (const t of ["text", "text-muted", "text-subtle", "brand", "gold"]) add(t, s, 4.5, "text");
      add("border-strong", s, 3, "ui");
      add("ring", s, 3, "ui");
    }
    add("brand-fg", "brand-solid", 4.5, "text");
    add("brand-fg", "brand-solid-hover", 4.5, "text");
    add("brand", "brand-soft", 4.5, "text");
    add("danger-fg", "danger-solid", 4.5, "text");
    add("danger-fg", "danger-solid-hover", 4.5, "text");
    for (const band of BANDS) {
      add(`risk-${band}-fg`, `risk-${band}-bg`, 4.5, "text");
      add(`risk-${band}-fg`, "surface", 4.5, "text");
      add(`risk-${band}`, "bg", 3, "ui");
      add(`risk-${band}`, "surface", 3, "ui");
    }
  }
  return rows;
}

export function cvdChecks() {
  const out = [];
  for (const mode of ["dark", "light"]) {
    const vars = MODES[mode];
    const hexes = BANDS.map((b) => resolve(vars, `var(--risk-${b})`));
    for (const [name, m] of Object.entries(CVD)) {
      for (let i = 0; i < hexes.length - 1; i++) {
        const d = deltaE(toLab(simulate(hexes[i], m)), toLab(simulate(hexes[i + 1], m)));
        out.push({ mode, cvd: name, pair: `${BANDS[i]} → ${BANDS[i + 1]}`, deltaE: d, ok: d >= 15 });
      }
    }
  }
  return out;
}

/* ---------- report ---------- */

function report() {
  const rows = checks();
  const cvd = cvdChecks();
  const failures = rows.filter((r) => r.ratio < r.min);
  const cvdFail = cvd.filter((r) => !r.ok);

  let md = `# Colour contrast (generated)\n\nGenerated by \`QorgauAIWeb/scripts/design-tokens.mjs\` from \`src/app/globals.css\`. Do not edit by hand.\n\n`;
  md += `- Pairs checked: **${rows.length}** across dark, light, high-contrast dark and light. Failures: **${failures.length}**.\n`;
  md += `- Thresholds: text ≥ 4.5:1, UI/icons ≥ 3:1 (WCAG 2.2 AA 1.4.3 / 1.4.11).\n`;
  md += `- Risk bands under colour-vision deficiency (Machado 2009, severity 1.0): adjacent bands ≥ 15 ΔE. Failures: **${cvdFail.length}**.\n`;
  md += `- Risk colour is never the only signal: every badge also carries an icon and a text label.\n\n`;
  for (const mode of Object.keys(MODES)) {
    md += `## ${mode}\n\n| Foreground | Background | Ratio | Needs | Result |\n|---|---|---|---|---|\n`;
    for (const r of rows.filter((x) => x.mode === mode)) {
      md += `| \`--${r.fg}\` ${r.fgHex} | \`--${r.bg}\` ${r.bgHex} | ${r.ratio.toFixed(2)} | ${r.min} | ${r.ratio >= r.min ? "pass" : "**FAIL**"} |\n`;
    }
    md += "\n";
  }
  md += `## Risk scale under colour-vision deficiency\n\n| Mode | Simulation | Adjacent bands | ΔE | Result |\n|---|---|---|---|---|\n`;
  for (const r of cvd) md += `| ${r.mode} | ${r.cvd} | ${r.pair} | ${r.deltaE.toFixed(1)} | ${r.ok ? "pass" : "**FAIL**"} |\n`;
  return { md, failures, cvdFail };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const outArg = process.argv.indexOf("--out");
  const out = outArg > 0 ? process.argv[outArg + 1] : path.join(root, "../QorgauAI/docs/design/contrast.md");
  const { md, failures, cvdFail } = report();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, md);
  for (const f of failures) console.error(`FAIL ${f.mode}: --${f.fg} on --${f.bg} = ${f.ratio.toFixed(2)} (needs ${f.min})`);
  for (const f of cvdFail) console.error(`FAIL ${f.mode} ${f.cvd}: ${f.pair} ΔE ${f.deltaE.toFixed(1)}`);
  console.log(`${failures.length + cvdFail.length === 0 ? "OK" : "FAILED"} — report: ${out}`);
  process.exit(failures.length + cvdFail.length === 0 ? 0 : 1);
}
