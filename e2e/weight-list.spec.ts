// e2e/weight-list.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Weight List Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Set up window.confirm mock at browser context level
    await page.context().addInitScript(() => {
      window.confirm = () => true;
    });
  });

  test("should display weight measurements when logged in", async ({ page }) => {
    // Mock the tRPC login request
    await page.route("**/trpc/login*", async (route) => {
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

    // Mock the tRPC weight.getWeights request with a single item
    await page.route("**/trpc/weight.getWeights*", async (route) => {
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
                    },
                  ],
                },
              },
            ]),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Navigate to the home page and log in
    await page.goto("/");
    await expect(
      page.getByPlaceholder("Enter your email for login")
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByPlaceholder("Enter your email for login")
      .fill("testuser@example.com");
    await page
      .getByPlaceholder("Enter your password for login")
      .fill("password123");

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("trpc/login") && resp.status() === 200,
        { timeout: 30000 }
      ),
      page.getByRole("button", { name: "Login" }).click(),
    ]);

    await expect(page.getByText("Login successful!")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({
      timeout: 20000,
    });

    // Navigate to the weights list
    await page.getByRole("link", { name: "Weights" }).click();
    await expect(
      page.getByRole("heading", { name: "Weight Measurements" })
    ).toBeVisible({ timeout: 5000 });

    // Verify the weight table is displayed with a single item
    await expect(page.getByRole("table")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Weight (kg)")).toBeVisible();
    await expect(page.getByText("Note")).toBeVisible();
    await expect(page.getByText("Date")).toBeVisible();
    await expect(page.getByText("70.5")).toBeVisible();
    await expect(page.getByText("Morning weigh-in")).toBeVisible();
    await expect(page.getByText(/20\/08\/2025/)).toBeVisible();
  });

  test("should redirect to home when not logged in", async ({ page }) => {
    // Mock the tRPC weight.getWeights request to return unauthorized
    await page.route("**/trpc/weight.getWeights*", async (route) => {
      if (route.request().method() === "GET") {
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
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate directly to the weights page
    await page.goto("/weights");

    // Verify redirect to home
    await expect(
      page.getByPlaceholder("Enter your email for login")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("heading", { name: "Weight Measurements" })
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("should delete a weight measurement when delete button is clicked", async ({ page }) => {
    // Mock state for weights to simulate deletion
    let weights = [
      {
        id: "1",
        weightKg: 70.5,
        note: "Morning weigh-in",
        createdAt: "2025-08-20T10:00:00Z",
      },
    ];

    // Mock the tRPC login request
    await page.route("**/trpc/login*", async (route) => {
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

    // Mock the tRPC weight.getWeights request
    await page.route("**/trpc/weight.getWeights*", async (route) => {
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
                result: { data: weights },
              },
            ]),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Mock the tRPC weight.delete request
    await page.route("**/trpc/weight.delete*", async (route) => {
      if (route.request().method() === "POST") {
        weights = []; // Simulate deletion
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
                data: { id: "1" },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to the home page and log in
    await page.goto("/");
    await expect(
      page.getByPlaceholder("Enter your email for login")
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByPlaceholder("Enter your email for login")
      .fill("testuser@example.com");
    await page
      .getByPlaceholder("Enter your password for login")
      .fill("password123");

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("trpc/login") && resp.status() === 200,
        { timeout: 30000 }
      ),
      page.getByRole("button", { name: "Login" }).click(),
    ]);

    await expect(page.getByText("Login successful!")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({
      timeout: 20000,
    });

    // Navigate to the weights list
    await page.getByRole("link", { name: "Weights" }).click();
    await expect(
      page.getByRole("heading", { name: "Weight Measurements" })
    ).toBeVisible({ timeout: 5000 });

    // Verify initial weight (single item)
    await expect(page.getByText("70.5")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Morning weigh-in")).toBeVisible();
    await expect(page.getByText(/20\/08\/2025/)).toBeVisible();

    // Debug: Log DOM state and button attributes removed
    await page.evaluate(() => {
      // Removed console logs
    });

    // Select the delete button for the single weight
    const deleteButton = page.getByRole("button", {
      name: "Delete weight measurement from 20/08/2025",
    });
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await expect(deleteButton).toBeEnabled({ timeout: 5000 });

    // Debug: Verify window.confirm mock before click removed
    await page.evaluate(() => {
      // Removed console log
    });

    // Click and wait for responses
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("trpc/weight.delete?batch=1") &&
          resp.status() === 200,
        { timeout: 30000 }
      ),
      page.waitForResponse(
        (resp) =>
          resp.url().includes("trpc/weight.getWeights") && resp.status() === 200,
        { timeout: 30000 }
      ),
      deleteButton.click(),
    ]);

    // Debug: Log DOM state after clicking removed
    await page.evaluate(() => {
      // Removed console log
    });

    // Verify the weight is removed and empty state is shown
    await expect(page.getByText("70.5")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Morning weigh-in")).not.toBeVisible();
    await expect(page.getByText(/20\/08\/2025/)).not.toBeVisible();
    await expect(page.getByText("No weight measurements found")).toBeVisible({
      timeout: 5000,
    });
  });
});