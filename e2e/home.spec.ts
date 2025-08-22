// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should render login form on home route", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByPlaceholder("m@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
    await expect(page.getByTestId("register-form")).not.toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: "Register" })).not.toBeVisible({
      timeout: 10000,
    });
  });
});