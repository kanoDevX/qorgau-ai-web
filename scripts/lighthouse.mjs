// Lighthouse (mobile) for pages of a running PRODUCTION server (`npm run build && npm start -- -p 3100`):
//   npm run lighthouse -- check pricing
// Paths are given without a leading slash (Git Bash rewrites "/x" into a Windows path).
// Uses the Chrome installed on the machine; set CHROME_PATH to override.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [base = "http://localhost:3100", ...paths] = process.argv.slice(2).filter((a) => a.startsWith("http") || !a.startsWith("--"));
const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) throw new Error("Chrome not found — set CHROME_PATH");

const dir = mkdtempSync(join(tmpdir(), "lh-"));
const rows = [];
for (const raw of paths.length ? paths : [""]) {
  const path = "/" + raw.replace(/^\/+/, "");
  const out = join(dir, `r${rows.length}.json`);
  try {
    execFileSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["--yes", "lighthouse@12", base + path, "--only-categories=performance,accessibility,best-practices,seo", "--form-factor=mobile",
        "--chrome-flags=--headless=new --no-sandbox", "--output=json", `--output-path=${out}`, "--quiet"],
      { stdio: "ignore", shell: process.platform === "win32", env: { ...process.env, CHROME_PATH: chrome }, timeout: 240_000 },
    );
    const r = JSON.parse(readFileSync(out, "utf8"));
    const s = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const m = r.audits.metrics.details.items[0];
    rows.push({
      path, perf: s.performance, a11y: s.accessibility, bp: s["best-practices"], seo: s.seo,
      "LCP sim": r.audits["largest-contentful-paint"].displayValue, "LCP observed": `${(m.observedLargestContentfulPaint / 1000).toFixed(1)} s`,
      TBT: r.audits["total-blocking-time"].displayValue, CLS: r.audits["cumulative-layout-shift"].displayValue,
    });
  } catch (e) {
    rows.push({ path, error: String(e.message).slice(0, 80) });
  }
}
console.table(rows);
