import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Click Me";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4174/" },
  webServer: {
    command:
      "pnpm --filter @expressthat-auth/example-vue build && pnpm --filter @expressthat-auth/example-vue preview",
    url: "http://localhost:4174/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects,
});
