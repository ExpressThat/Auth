import { describe, expect, it } from "vitest";
import { createBrowserTestConfig } from "../src/playwright.js";

describe("shared Playwright configuration", () => {
  it("defines cross-browser projects, diagnostics, and deterministic startup", () => {
    const config = createBrowserTestConfig();

    expect(config.projects?.map((project) => project.name)).toEqual([
      "chromium",
      "firefox",
      "webkit",
    ]);
    expect(config.use).toMatchObject({
      baseURL: "http://127.0.0.1:4173",
      screenshot: "only-on-failure",
      trace: "retain-on-failure",
      video: "retain-on-failure",
    });
    expect(config.webServer).toEqual([
      expect.objectContaining({
        reuseExistingServer: false,
        url: "http://127.0.0.1:4173/health",
      }),
    ]);
  });

  it("merges suite-specific settings", () => {
    const config = createBrowserTestConfig({ retries: 2, testDir: "custom-e2e" });

    expect(config.retries).toBe(2);
    expect(config.testDir).toBe("custom-e2e");
    expect(config.fullyParallel).toBe(true);
  });
});
