import { defineConfig, devices } from "@playwright/test";

/**
 * E2E for the two flows that matter most for the pitch:
 *   1. check a message → get a verdict (no login)
 *   2. complete a lesson → earn XP
 * Expects the ASP.NET backend on :5199 and `npm run dev` on :3100.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Existing flows start with the cookie choice already made ("reject all"), so the banner does not
    // cover controls. compliance.spec.ts resets this to test the banner itself.
    storageState: "tests/e2e/consent-state.json",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: "npm run dev -- -p 3100",
        url: "http://localhost:3100",
        timeout: 90_000,
        reuseExistingServer: true,
        // Test double for the analytics provider: lets compliance.spec.ts prove the consent gate works.
        env: { NEXT_PUBLIC_ANALYTICS_SRC: "/_e2e/analytics-stub.js" },
      },
});
