import { expect, test } from "@playwright/test";

const frameworks = [
  { name: "React", url: "http://localhost:4173/", label: "Hello from React" },
  { name: "Vue", url: "http://localhost:4174/", label: "Hello from Vue" },
  { name: "Svelte", url: "http://localhost:4175/", label: "Hello from Svelte" },
  { name: "Solid", url: "http://localhost:4176/", label: "Hello from Solid" },
  { name: "Preact", url: "http://localhost:4177/", label: "Hello from Preact" },
  { name: "Qwik", url: "http://localhost:4178/", label: "Hello from Qwik" },
  { name: "Angular", url: "http://localhost:4179/", label: "Hello from Angular" },
];

for (const { name, url, label } of frameworks) {
  test.describe(`${name} example`, () => {
    test("page loads and button is rendered correctly", async ({ page }) => {
      await page.goto(url);

      const button = page.locator('button[type="button"]');
      await expect(button).toBeVisible();
      await expect(button).toContainText(label);
      await expect(button).toHaveClass(/btn/);
      await expect(button).toHaveClass(/btn--primary/);
    });
  });
}
