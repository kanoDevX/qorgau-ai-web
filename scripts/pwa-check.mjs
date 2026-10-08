// Production smoke test for the PWA + CSP (run against `next start`):
//   node scripts/pwa-check.mjs http://localhost:3200
// Checks: no CSP violations / console errors on key pages, the service worker installs, and
// /golden-hour plus /offline open with the network switched off.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3200";
const state = JSON.parse(readFileSync(new URL("../tests/e2e/consent-state.json", import.meta.url), "utf8"));

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: state });
const page = await context.newPage();
const problems = [];
page.on("console", (m) => {
  if (m.type() === "error" || /Content Security Policy|violat/i.test(m.text())) problems.push(`console: ${m.text().slice(0, 200)}`);
});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

for (const path of ["/", "/check", "/golden-hour", "/pricing", "/offline", "/partner/docs"]) {
  await page.goto(base + path, { waitUntil: "networkidle" });
}

// Wait for the service worker to take control, then let it finish warming the cache.
await page.goto(base + "/golden-hour", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
});
await page.waitForTimeout(3000);
const cached = await page.evaluate(async () => (await (await caches.open("qorgau-v1")).keys()).map((r) => new URL(r.url).pathname));
console.log("cached entries:", cached.length, cached.filter((p) => !p.startsWith("/_next")).join(", "));

// Errors after this point (failed fetches) are expected offline, so report CSP/console problems now.
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "no CSP violations or console errors (online)");
problems.length = 0;
await context.setOffline(true);
for (const path of ["/golden-hour", "/offline", "/check"]) {
  const res = await page.goto(base + path, { waitUntil: "domcontentloaded" }).catch((e) => ({ failed: e.message }));
  const body = await page.locator("body").innerText().catch(() => "");
  console.log(`offline ${path}:`, res && res.failed ? "FAILED" : "ok", "|", body.replace(/\s+/g, " ").slice(0, 90));
}
await context.setOffline(false);

await browser.close();
