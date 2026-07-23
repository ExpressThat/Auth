import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/password.test.ts"],
    testTimeout: 10_000,
  },
});
