import { createUnitTestConfig } from "@expressthat-auth/test-config/vitest";

export default createUnitTestConfig({
  test: {
    exclude: ["test/worker.test.ts"],
    include: ["test/password.test.ts"],
    testTimeout: 10_000,
  },
});
