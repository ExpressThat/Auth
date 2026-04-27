import { expect, test } from "@playwright/test";

test("homepage renders with correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("ExpressThat Auth");
});

test("homepage has main heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "ExpressThat Auth" })).toBeVisible();
});
