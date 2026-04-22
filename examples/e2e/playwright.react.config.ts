import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Hello from React";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4173/" },
  webServer: {
    command: "pnpm --filter example-react build && pnpm --filter example-react preview",
    url: "http://localhost:4173/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects
});
