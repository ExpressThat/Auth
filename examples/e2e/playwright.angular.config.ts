import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Hello from Angular";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4179/" },
  webServer: {
    command: "pnpm --filter example-angular build && pnpm --filter example-angular preview",
    url: "http://localhost:4179/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects
});
