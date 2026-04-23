import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Hello from Vue";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4174/" },
  webServer: {
    command: "pnpm --filter example-vue build && pnpm --filter example-vue preview",
    url: "http://localhost:4174/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects,
});
