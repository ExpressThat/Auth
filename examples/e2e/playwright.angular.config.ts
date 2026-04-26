import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Click Me";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4179/" },
  webServer: {
    command:
      "pnpm --filter @expressthat-auth/example-angular build && pnpm --filter @expressthat-auth/example-angular preview",
    url: "http://localhost:4179/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects,
});
