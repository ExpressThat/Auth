import { expect, test } from "@playwright/test";

type IsolatedFixtures = {
  tenantId: string;
};

export const isolatedTest = test.extend<IsolatedFixtures>({
  tenantId: async ({ browserName }, use, testInfo) => {
    const tenantId = ["tenant", browserName, testInfo.workerIndex.toString(), testInfo.testId]
      .join("-")
      .replaceAll(/[^a-zA-Z0-9-]/gu, "-");

    await use(tenantId);
  },
});

export { expect };
