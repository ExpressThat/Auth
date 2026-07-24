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
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        perFile: true,
        statements: 100,
      },
    });
  });

  it("merges package-specific overrides without dropping safety defaults", () => {
    const config = createUnitTestConfig({
      test: {
        coverage: {
          exclude: ["src/security-critical.ts"],
          thresholds: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
          },
        },
        include: ["custom/**/*.test.ts"],
        testTimeout: 1_000,
      },
    });

    expect(config.test?.include).toEqual(["test/**/*.test.{ts,tsx}", "custom/**/*.test.ts"]);
    expect(config.test?.testTimeout).toBe(1_000);
    expect(config.test?.restoreMocks).toBe(true);
    expect(config.test?.coverage?.exclude).toEqual([
      "src/**/*.d.ts",
      "src/**/generated/**",
      "src/**/vendor/**",
    ]);
    expect(config.test?.coverage?.thresholds).toEqual({
      branches: 100,
      functions: 100,
      lines: 100,
      perFile: true,
      statements: 100,
    });
  });
});
