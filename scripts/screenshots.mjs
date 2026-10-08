// Screenshots of the key screens for docs/redesign/CHANGELOG.md: desktop dark, desktop light, mobile dark.
//   node scripts/screenshots.mjs http://localhost:3100 ../QorgauAI/docs/redesign/screenshots
// Needs the API on :5199 (demo accounts) and a running web server.
import { chromium, devices } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2] ?? "http://localhost:3100";
const outDir = process.argv[3] ?? "docs/redesign/screenshots";
mkdirSync(outDir, { recursive: true });
const consent = JSON.parse(readFileSync(new URL("../tests/e2e/consent-state.json", import.meta.url), "utf8"));

const SCREENS = [
  { name: "landing", path: "/", account: null },
  { name: "check", path: "/check", account: "self" },
  { name: "radar-map", path: "/radar?tab=map", account: "self" },
  { name: "family", path: "/family", account: "guardian" },
  { name: "learn", path: "/learn", account: "self" },
  { name: "partner-overview", path: "/partner", account: "partner" },
  { name: "pricing", path: "/pricing", account: null },
];
const VARIANTS = [
  { suffix: "dark", theme: "dark", context: { viewport: { width: 1280, height: 800 } } },
  { suffix: "light", theme: "light", context: { viewport: { width: 1280, height: 800 } } },
  { suffix: "mobile-dark", theme: "dark", context: { ...devices["Pixel 7"] } },
];

const browser = await chromium.launch();
for (const v of VARIANTS) {
  for (const s of SCREENS) {
    const context = await browser.newContext({ ...v.context, storageState: consent, colorScheme: v.theme, reducedMotion: "reduce" });
    await context.addInitScript((t) => localStorage.setItem("theme", t), v.theme);
    const page = await context.newPage();
    await page.goto(base + "/");
    if (s.account) await page.request.post(base + "/api/session", { data: { mode: "demo", account: s.account, onboardingRole: s.account === "partner" ? "partner" : "self" } });
    await page.goto(base + s.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(outDir, `${s.name}-${v.suffix}.png`) });
    await context.close();
  }
}
await browser.close();
console.log("screenshots written to", outDir);
