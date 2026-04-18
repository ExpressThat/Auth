import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm build && pnpm preview",
    url: "http://localhost:4321/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env["CI"],
  },
  use: {
    baseURL: "http://localhost:4321/",
  },
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
