import { describe, expect, it } from "vitest";
import { createUnitTestConfig } from "../src/vitest.js";

describe("shared Vitest configuration", () => {
  it("enforces deterministic defaults and complete per-file coverage", () => {
    const config = createUnitTestConfig();

    expect(config.test).toMatchObject({
      clearMocks: true,
      include: ["test/**/*.test.{ts,tsx}"],
      mockReset: true,
      passWithNoTests: false,
      restoreMocks: true,
      sequence: { concurrent: false },
    });
    expect(config.test?.coverage).toMatchObject({
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      thresholds: { 100: true, perFile: true },
    });
  });

  it("merges package-specific overrides without dropping safety defaults", () => {
    const config = createUnitTestConfig({
      test: {
        include: ["custom/**/*.test.ts"],
        testTimeout: 1_000,
      },
    });

    expect(config.test?.include).toEqual(["test/**/*.test.{ts,tsx}", "custom/**/*.test.ts"]);
    expect(config.test?.testTimeout).toBe(1_000);
    expect(config.test?.restoreMocks).toBe(true);
  });
});
