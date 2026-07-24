import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";
import { createUnitTestConfig } from "./vitest.ts";

const COMPONENT_DEFAULTS = defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    setupFiles: ["@expressthat-auth/test-config/setup-dom"],
  },
});

export function createComponentTestConfig(overrides: ViteUserConfig = {}): ViteUserConfig {
  return mergeConfig(createUnitTestConfig(COMPONENT_DEFAULTS), defineConfig(overrides));
}
