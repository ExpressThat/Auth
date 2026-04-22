import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Hello from Solid";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4176/" },
  webServer: {
    command: "pnpm --filter example-solid build && pnpm --filter example-solid preview",
    url: "http://localhost:4176/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects
});
