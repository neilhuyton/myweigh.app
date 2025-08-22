import { test, expect } from "@playwright/test";

test.describe("Weight Goal Functionality", () => {
  test.beforeEach(async ({ page }) => {
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

    // Navigate to the home page and log in
    await page.goto("/");
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

    // Wait for login confirmation
    await expect(page.getByTestId("login-message")).toBeVisible({ timeout: 20000 });

    // Wait for notifications to disappear to avoid interference
    await page.getByLabel("Notifications alt+T").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {
      // Ignore if no notifications are present
    });
  });

  test("should set and display weight goal when logged in", async ({ page }) => {
    // Mock the tRPC weight.getGoal request
    await page.route("**/trpc/weight.getGoal**", async (route) => {
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

    // Mock the tRPC weight.setGoal request
    await page.route("**/trpc/weight.setGoal**", async (route) => {
      if (route.request().method() === "POST") {
        const headers = await route.request().allHeaders();
        const body = await route.request().postData();
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
                    path: "weight.setGoal",
                  },
                },
              },
            ]),
          });
        } else {
          const input = JSON.parse(body || "{}")["0"];
          if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
            await route.fulfill({
              status: 400,
              contentType: "application/json",
              headers: {
                "Access-Control-Allow-Origin": "http://localhost:5173",
                "Access-Control-Allow-Credentials": "true",
              },
              body: JSON.stringify([
                {
                  id: 0,
                  error: {
                    message: "Goal weight must be a positive number",
                    code: -32001,
                    data: {
                      code: "BAD_REQUEST",
                      httpStatus: 400,
                      path: "weight.setGoal",
                    },
                  },
                },
              ]),
            });
          } else {
            // Update the getGoal mock to return the new goal
            await page.route("**/trpc/weight.getGoal**", async (route) => {
              if (route.request().method() === "GET") {
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
                        data: { goalWeightKg: input.goalWeightKg },
                      },
                    },
                  ]),
                });
              } else {
                await route.continue();
              }
            });
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
                    data: { goalWeightKg: input.goalWeightKg },
                  },
                },
              ]),
            });
          }
        }
      } else {
        await route.continue();
      }
    });

    // Navigate to the weight goal page
    await page.getByRole("link", { name: "Weight Goal" }).click();
    await expect(page.getByRole("heading", { name: "Set Weight Goal" })).toBeVisible({ timeout: 5000 });

    // Verify initial goal
    await expect(page.getByText("Current Goal: 65 kg")).toBeVisible({ timeout: 5000 });

    // Fill in the weight goal form
    await page.getByPlaceholder("Enter your goal weight (kg)").fill("60");
    await expect(page.getByPlaceholder("Enter your goal weight (kg)")).toHaveValue("60");

    // Submit the form
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("trpc/weight.setGoal") && resp.status() === 200,
        { timeout: 20000 }
      ),
      page.getByRole("button", { name: "Set Goal" }).click(),
    ]);

    // Verify success and updated goal
    await expect(page.getByText("Goal set successfully!")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Current Goal: 60 kg")).toBeVisible({ timeout: 20000 });
  });

  test("should redirect to home when not logged in", async ({ page }) => {
    // Mock the tRPC weight.getGoal request to return unauthorized
    await page.route("**/trpc/weight.getGoal**", async (route) => {
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
                  path: "weight.getGoal",
                },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate directly to the weight goal page
    await page.goto("/weight-goal");

    // Verify redirect to home
    await expect(page.getByPlaceholder("m@example.com")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Set Weight Goal" })).not.toBeVisible({ timeout: 5000 });
  });

  test("should display error message for invalid goal weight", async ({ page }) => {
    // Mock the tRPC weight.getGoal request
    await page.route("**/trpc/weight.getGoal**", async (route) => {
      if (route.request().method() === "GET") {
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
                data: { goalWeightKg: 65.0 },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock the tRPC weight.setGoal request for invalid input
    await page.route("**/trpc/weight.setGoal**", async (route) => {
      if (route.request().method() === "POST") {
        const headers = await route.request().allHeaders();
        const body = await route.request().postData();
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
                    path: "weight.setGoal",
                  },
                },
              },
            ]),
          });
        } else {
          const input = JSON.parse(body || "{}")["0"];
          if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
            await route.fulfill({
              status: 400,
              contentType: "application/json",
              headers: {
                "Access-Control-Allow-Origin": "http://localhost:5173",
                "Access-Control-Allow-Credentials": "true",
              },
              body: JSON.stringify([
                {
                  id: 0,
                  error: {
                    message: "Goal weight must be a positive number",
                    code: -32001,
                    data: {
                      code: "BAD_REQUEST",
                      httpStatus: 400,
                      path: "weight.setGoal",
                    },
                  },
                },
              ]),
            });
          }
        }
      } else {
        await route.continue();
      }
    });

    // Navigate to the weight goal page
    await page.getByRole("link", { name: "Weight Goal" }).click();
    await expect(page.getByRole("heading", { name: "Set Weight Goal" })).toBeVisible({ timeout: 5000 });

    // Fill in the weight goal form with invalid input
    await page.getByPlaceholder("Enter your goal weight (kg)").fill("0");
    await expect(page.getByPlaceholder("Enter your goal weight (kg)")).toHaveValue("0");

    // Submit the form
    await page.getByRole("button", { name: "Set Goal" }).click();

    // Verify error message
    await expect(page.getByText("Goal weight must be a positive number")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Goal set successfully!")).not.toBeVisible({ timeout: 5000 });
  });
});