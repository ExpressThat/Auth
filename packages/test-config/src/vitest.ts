import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

const APPROVED_COVERAGE_EXCLUSIONS = ["src/**/*.d.ts", "src/**/generated/**", "src/**/vendor/**"];
const REQUIRED_COVERAGE_THRESHOLDS = {
  branches: 100,
  functions: 100,
  lines: 100,
  perFile: true,
  statements: 100,
};

const DEFAULT_CONFIG = defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: APPROVED_COVERAGE_EXCLUSIONS,
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: REQUIRED_COVERAGE_THRESHOLDS,
    },
    include: ["test/**/*.test.{ts,tsx}"],
    mockReset: true,
    passWithNoTests: false,
    restoreMocks: true,
    sequence: {
      concurrent: false,
    },
  },
});

export function createUnitTestConfig(overrides: ViteUserConfig = {}): ViteUserConfig {
  const configured = mergeConfig(DEFAULT_CONFIG, defineConfig(overrides));
  const { test } = configured;

  return defineConfig({
    ...configured,
    test: {
      ...test,
      coverage: {
        ...test?.coverage,
        exclude: APPROVED_COVERAGE_EXCLUSIONS,
        thresholds: REQUIRED_COVERAGE_THRESHOLDS,
      },
    },
  });
}
