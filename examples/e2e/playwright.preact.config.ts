import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Hello from Preact";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4177/" },
  webServer: {
    command: "pnpm --filter example-preact build && pnpm --filter example-preact preview",
    url: "http://localhost:4177/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects
});
