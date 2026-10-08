import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

/**
 * Runtime + accessibility sweep over every screen: console errors, uncaught page errors,
 * failed network requests and WCAG 2.2 A/AA violations (axe-core). Writes a JSON report to
 * test-results/audit-<project>-<theme>.json and fails on console/uncaught errors or serious/critical
 * a11y issues, in both the dark and light theme.
 */
const ROUTES = [
  "/",
  "/onboarding",
  "/check",
  "/dashboard",
  "/learn",
  "/family",
  "/radar",
  "/check?mode=call",
  "/check?mode=transfer",
  "/golden-hour",
  "/partner",
  "/partner/usage",
  "/partner/keys",
  "/partner/webhooks",
  "/partner/billing",
  "/partner/docs",
  "/settings",
  "/settings/privacy",
  "/register",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/about",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/legal/refund",
  "/legal/data-request",
  "/radar?tab=map",
  "/radar?tab=trends",
  "/settings/notifications",
  "/open-data",
  "/unsubscribe?token=x",
  "/verify",
  "/verify/QAI-000000-NOPE",
];

interface RouteReport {
  route: string;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  a11y: { id: string; impact: string | null | undefined; help: string; nodes: number; sample: string }[];
  loadMs: number;
}

async function signIn(page: Page) {
  await page.goto("/");
  const res = await page.request.post("/api/session", {
    data: { mode: "demo", account: "self", onboardingRole: "self" },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe.configure({ mode: "serial" });

for (const theme of ["dark", "light"] as const) {
test(`runtime + a11y sweep over all screens (signed in, ${theme})`, async ({ page }, info) => {
  test.setTimeout(240_000);
  await page.addInitScript((t) => window.localStorage.setItem("theme", t), theme);
  // No transitions: axe must measure final colours, not a frame mid theme/hover transition.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page);

  const reports: RouteReport[] = [];

  for (const route of ROUTES) {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    const onConsole = (m: import("@playwright/test").ConsoleMessage) => {
      if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300));
    };
    const onPageError = (e: Error) => pageErrors.push(e.message.slice(0, 300));
    const onResponse = (r: import("@playwright/test").Response) => {
      if (r.status() >= 400 && !r.url().includes("_next/webpack-hmr")) {
        failedRequests.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, "")}`);
      }
    };
    const onRequestFailed = (r: import("@playwright/test").Request) => {
      const err = r.failure()?.errorText ?? "";
      if (!err.includes("ERR_ABORTED")) failedRequests.push(`FAILED ${r.method()} ${r.url()} ${err}`);
    };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    page.on("response", onResponse);
    page.on("requestfailed", onRequestFailed);

    const t0 = Date.now();
    await page.goto(route, { waitUntil: "load" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const loadMs = Date.now() - t0;

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .exclude("canvas")
      .analyze();

    reports.push({
      route,
      consoleErrors,
      pageErrors,
      failedRequests,
      loadMs,
      a11y: axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        sample: v.nodes[0]?.target.join(" ").slice(0, 160) ?? "",
      })),
    });

    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
    page.off("requestfailed", onRequestFailed);
  }

  mkdirSync("test-results", { recursive: true });
  writeFileSync(`test-results/audit-${info.project.name}-${theme}.json`, JSON.stringify(reports, null, 2));

  const uncaught = reports.flatMap((r) => r.pageErrors.map((e) => `${r.route}: ${e}`));
  const serious = reports.flatMap((r) =>
    r.a11y.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${r.route}: ${v.id} (${v.nodes})`),
  );
  const consoleErrs = reports.flatMap((r) => r.consoleErrors.map((e) => `${r.route}: ${e.split("\n")[0]}`));
  expect(uncaught, "uncaught page errors").toEqual([]);
  expect(consoleErrs, "console errors (incl. hydration mismatches)").toEqual([]);
  expect(serious, "serious/critical WCAG violations").toEqual([]);
});
}
