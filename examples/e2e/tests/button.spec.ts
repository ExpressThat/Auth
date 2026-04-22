import { expect, test } from "@playwright/test";

test("button is rendered correctly", async ({ page }) => {
  await page.goto("/");

  const button = page.locator('button[type="button"]');
  await expect(button).toBeVisible();
  const label = process.env.EXAMPLE_LABEL;
  if (!label) throw new Error("EXAMPLE_LABEL env var is not set — check your Playwright config");
  await expect(button).toContainText(label);
  await expect(button).toHaveClass(/btn/);
  await expect(button).toHaveClass(/btn--primary/);
});
