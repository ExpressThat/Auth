import { createUnitTestConfig } from "@expressthat-auth/test-config/vitest";

export default createUnitTestConfig({
  test: {
    include: ["test/password.test.ts"],
    testTimeout: 10_000,
  },
});
