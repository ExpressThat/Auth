import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Hello from Svelte";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4175/" },
  webServer: {
    command: "pnpm --filter example-svelte build && pnpm --filter example-svelte preview",
    url: "http://localhost:4175/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects,
});
