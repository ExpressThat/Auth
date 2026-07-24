import { createUnitTestConfig } from "@expressthat-auth/test-config/vitest";

export default createUnitTestConfig({
  test: {
    exclude: ["test/worker.test.ts"],
    include: ["test/app.test.ts"],
  },
});
