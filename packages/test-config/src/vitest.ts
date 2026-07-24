import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

const DEFAULT_CONFIG = defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ["src/**/*.d.ts", "src/**/generated/**"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        100: true,
        perFile: true,
      },
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
  return mergeConfig(DEFAULT_CONFIG, defineConfig(overrides));
}
