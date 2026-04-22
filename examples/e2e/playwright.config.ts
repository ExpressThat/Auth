import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  webServer: [
    {
      command: "pnpm --filter example-react build && pnpm --filter example-react preview",
      url: "http://localhost:4173/",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter example-vue build && pnpm --filter example-vue preview",
      url: "http://localhost:4174/",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter example-svelte build && pnpm --filter example-svelte preview",
      url: "http://localhost:4175/",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter example-solid build && pnpm --filter example-solid preview",
      url: "http://localhost:4176/",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter example-preact build && pnpm --filter example-preact preview",
      url: "http://localhost:4177/",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter example-qwik build && pnpm --filter example-qwik preview",
      url: "http://localhost:4178/",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter example-angular build && pnpm --filter example-angular preview",
      url: "http://localhost:4179/",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    // Desktop browsers
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },

    // Mobile
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "mobile-safari-landscape", use: { ...devices["iPhone 13 landscape"] } },

    // Tablet
    { name: "tablet-ipad", use: { ...devices["iPad Pro 11"] } },
    { name: "tablet-ipad-landscape", use: { ...devices["iPad Pro 11 landscape"] } },
    { name: "tablet-galaxy", use: { ...devices["Galaxy Tab S4"] } },
    { name: "tablet-galaxy-landscape", use: { ...devices["Galaxy Tab S4 landscape"] } },
  ],
});
