import AxeBuilder from "@axe-core/playwright";
import { expect, isolatedTest } from "./fixtures.js";

isolatedTest(
  "uses isolated data and captures an accessible browser journey",
  async ({ page, tenantId }, testInfo) => {
    await page.goto(`/?tenant=${encodeURIComponent(tenantId)}`);

    await expect(page.getByRole("heading", { name: "Auth browser harness" })).toBeVisible();
    await expect(page.getByText(`Isolated tenant: ${tenantId}`)).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("status")).toHaveText(`Ready for ${tenantId}`);

    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    await testInfo.attach("accessibility-results", {
      body: JSON.stringify(scan, null, 2),
      contentType: "application/json",
    });

    expect(scan.violations).toEqual([]);
  },
);
