import { expect, test } from "@playwright/test";

test("button is rendered correctly", async ({ page }) => {
  await page.goto("/");

  const webComponent = page.locator("ex-test-button");
  await expect(webComponent).toBeVisible();

  const button = webComponent.getByRole("button");
  await expect(button).toBeVisible();

  const label = process.env.EXAMPLE_LABEL;
  if (!label) throw new Error("EXAMPLE_LABEL env var is not set");
  await expect(button).toContainText(label);
  await expect(button).toHaveClass(/btn/);
  await expect(button).toHaveClass(/btn--primary/);
});
