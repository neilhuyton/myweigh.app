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

  test("should navigate to correct routes when dashboard card buttons are clicked", async ({ page }) => {
    // Mock the tRPC login request
    await page.route("**/trpc/login**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true",
          },
          body: JSON.stringify([
            {
              id: 0,
              result: {
                data: {
                  id: "test-user-id",
                  email: "testuser@example.com",
                },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock the tRPC weight.getWeights and weight.getGoal requests
    await page.route("**/trpc/weight.getWeights,weight.getGoal**", async (route) => {
      if (route.request().method() === "GET") {
        const headers = await route.request().allHeaders();
        if (headers["authorization"] !== "Bearer test-user-id") {
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "http://localhost:5173",
              "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify([
              {
                id: 0,
                error: {
                  message: "Unauthorized: User must be logged in",
                  code: -32001,
                  data: {
                    code: "UNAUTHORIZED",
                    httpStatus: 401,
                    path: "weight.getWeights",
                  },
                },
              },
              {
                id: 1,
                error: {
                  message: "Unauthorized: User must be logged in",
                  code: -32001,
                  data: {
                    code: "UNAUTHORIZED",
                    httpStatus: 401,
                    path: "weight.getGoal",
                  },
                },
              },
            ]),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "http://localhost:5173",
              "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify([
              {
                result: {
                  data: [
                    {
                      id: "1",
                      weightKg: 70.5,
                      note: "Morning weigh-in",
                      createdAt: "2025-08-20T10:00:00Z",
                      userId: "test-user-id",
                    },
                  ],
                },
              },
              {
                result: {
                  data: { goalWeightKg: 65.0 },
                },
              },
            ]),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Navigate to the login page and log in
    await page.goto("/login");
    await expect(page.getByPlaceholder("m@example.com")).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder("m@example.com").fill("testuser@example.com");
    await page.getByPlaceholder("Enter your password").fill("password123");

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("trpc/login") && resp.status() === 200,
        { timeout: 20000 }
      ),
      page.getByRole("button", { name: "Login" }).click(),
    ]);

    // Wait for notifications to disappear to avoid interference
    await page
      .getByLabel("Notifications alt+T")
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {
        // Ignore if no notifications are present
      });

    // Verify dashboard is displayed
    await expect(page.getByText("Weight Tracker Dashboard")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("current-weight-card")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("goal-weight-card")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("weight-change-card")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("recent-measurement-card")).toBeVisible({ timeout: 10000 });

    // Test navigation for current-weight-card-button
    await page.getByTestId("current-weight-card-button").click();
    await expect(page).toHaveURL(/.*\/weight/, { timeout: 10000 });
    await page.goto("/"); // Navigate back to Home
    await expect(page.getByTestId("goal-weight-card-button")).toBeVisible({ timeout: 10000 });

    // Test navigation for goal-weight-card-button
    await page.getByTestId("goal-weight-card-button").click();
    await expect(page).toHaveURL(/.*\/weight-goal/, { timeout: 10000 });
    await page.goto("/"); // Navigate back to Home
    await expect(page.getByTestId("weight-change-card-button")).toBeVisible({ timeout: 10000 });

    // Test navigation for weight-change-card-button
    await page.getByTestId("weight-change-card-button").click();
    await expect(page).toHaveURL(/.*\/weight-chart/, { timeout: 10000 });
    await page.goto("/"); // Navigate back to Home
    await expect(page.getByTestId("recent-measurement-card-button")).toBeVisible({ timeout: 10000 });

    // Test navigation for recent-measurement-card-button
    await page.getByTestId("recent-measurement-card-button").click();
    await expect(page).toHaveURL(/.*\/weights/, { timeout: 10000 });
  });

  test("should display profile icon when logged in and navigate to profile", async ({ page }) => {
    // Mock the tRPC login request
    await page.route("**/trpc/login**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true",
          },
          body: JSON.stringify([
            {
              id: 0,
              result: {
                data: {
                  id: "test-user-id",
                  email: "testuser@example.com",
                },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to the login page and log in
    await page.goto("/login");
    await expect(page.getByPlaceholder("m@example.com")).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder("m@example.com").fill("testuser@example.com");
    await page.getByPlaceholder("Enter your password").fill("password123");

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("trpc/login") && resp.status() === 200,
        { timeout: 20000 }
      ),
      page.getByRole("button", { name: "Login" }).click(),
    ]);

    // Wait for notifications to disappear
    await page
      .getByLabel("Notifications alt+T")
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});

    // Verify profile icon is visible
    await expect(page.getByTestId("profile-icon")).toBeVisible({ timeout: 10000 });

    // Click profile icon and verify navigation
    await page.getByTestId("profile-icon").click();
    await expect(page).toHaveURL(/.*\/profile/, { timeout: 10000 });

    // Verify profile page content
    await expect(page.getByText("User Profile")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("This is your profile page.")).toBeVisible({ timeout: 10000 });
  });

  test("should not display profile icon when not logged in", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/login");
    await expect(page.getByPlaceholder("m@example.com")).toBeVisible({ timeout: 5000 });

    // Verify profile icon is not visible
    await expect(page.getByTestId("profile-icon")).not.toBeVisible({ timeout: 5000 });
  });
});