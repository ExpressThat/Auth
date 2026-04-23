import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Hello from Qwik";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4178/" },
  webServer: {
    command: "pnpm --filter example-qwik build && pnpm --filter example-qwik preview",
    url: "http://localhost:4178/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects,
});
