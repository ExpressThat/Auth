import { expect, test } from "@playwright/test";

test("button is rendered correctly", async ({ page }) => {
  await page.goto("/");

  const webComponent = page.locator("ex-button");
  await expect(webComponent).toBeVisible();

  const button = webComponent.getByRole("button");
  await expect(button).toBeVisible();
  await expect(button).toContainText(process.env.EXAMPLE_LABEL ?? "");
  await expect(button).toHaveClass(/btn/);
  await expect(button).toHaveClass(/btn--primary/);
});
