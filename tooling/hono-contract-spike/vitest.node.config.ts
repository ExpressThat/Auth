import { createUnitTestConfig } from "@expressthat-auth/test-config/vitest";

export default createUnitTestConfig({
  test: {
    include: ["test/app.test.ts"],
  },
});
