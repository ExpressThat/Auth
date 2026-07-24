import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

const DEFAULT_CONFIG = defineConfig({
  expect: {
    timeout: 5_000,
  },
  forbidOnly: true,
  fullyParallel: true,
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  retries: 0,
  testDir: "e2e",
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm exec tsx e2e/server.ts",
    reuseExistingServer: false,
    timeout: 30_000,
    url: "http://127.0.0.1:4173/health",
  },
});

export function createBrowserTestConfig(
  overrides: PlaywrightTestConfig = {},
): PlaywrightTestConfig {
  return defineConfig(DEFAULT_CONFIG, overrides);
}
