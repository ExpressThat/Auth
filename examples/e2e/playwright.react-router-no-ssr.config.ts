import { defineConfig } from "@playwright/test";
import { baseProjects } from "./base.config";

process.env.EXAMPLE_LABEL = "Click Me";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:4178/" },
  webServer: {
    command:
      "pnpm --filter @expressthat-auth/example-react-router-no-ssr build && pnpm --filter @expressthat-auth/example-react-router-no-ssr preview",
    url: "http://localhost:4178/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: baseProjects,
});
