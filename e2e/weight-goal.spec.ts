// e2e/weight-goal.spec.ts
import { test, expect } from "@playwright/test";

// Define Goal type
type Goal = {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: string | null;
};

// Utility for common headers
const headers = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Credentials": "true",
  "Cache-Control": "no-cache",
};

// Utility for unauthorized response
const unauthorizedResponse = (path: string) => ({
  status: 401,
  contentType: "application/json",
  headers,
  body: JSON.stringify([
    {
      id: 0,
      error: {
        message: "Unauthorized: User must be logged in",
        code: -32001,
        data: { code: "UNAUTHORIZED", httpStatus: 401, path },
      },
    },
  ]),
});

// Utility for bad request response
const badRequestResponse = (path: string, message: string) => ({
  status: 400,
  contentType: "application/json",
  headers,
  body: JSON.stringify([
    {
      id: 0,
      error: {
        message,
        code: -32001,
        data: { code: "BAD_REQUEST", httpStatus: 400, path },
      },
    },
  ]),
});

test.describe("Weight Goal Functionality", () => {
  test.describe("Authenticated", () => {
    test.beforeEach(async ({ page }) => {
      // Mock login
      await page.route("**/trpc/login**", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers,
            body: JSON.stringify([
              {
                id: 0,
                result: {
                  data: { id: "test-user-id", email: "testuser@example.com" },
                },
              },
            ]),
          });
        } else {
          await route.continue();
        }
      });

      // Log in
      await page.goto("/login");
      await expect(page.getByPlaceholder("m@example.com")).toBeVisible({
        timeout: 5000,
      });
      await page.getByPlaceholder("m@example.com").fill("testuser@example.com");
      await page.getByPlaceholder("Enter your password").fill("password123");
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes("trpc/login") && resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole("button", { name: "Login" }).click(),
      ]);
      await page
        .getByLabel("Notifications alt+T")
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(() => {});
    });

    test("should set, edit, and display weight goal", async ({ page }) => {
      const goals: Goal[] = [];

      // Mock weight.getCurrentGoal
      await page.route("**/trpc/weight.getCurrentGoal**", async (route) => {
        if (route.request().method() !== "GET") return await route.continue();
        const auth = (await route.request().allHeaders())["authorization"];
        if (auth !== "Bearer test-user-id") {
          return await route.fulfill(
            unauthorizedResponse("weight.getCurrentGoal")
          );
        }
        const currentGoal = goals.find((g) => !g.reachedAt) || null;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers,
          body: JSON.stringify([
            {
              result: {
                data: currentGoal
                  ? {
                      id: currentGoal.id,
                      goalWeightKg: currentGoal.goalWeightKg,
                      goalSetAt: currentGoal.goalSetAt,
                    }
                  : null,
              },
            },
          ]),
        });
      });

      // Mock weight.getGoals (broadened URL pattern)
      await page.route("**/trpc/weight.getGoals**", async (route) => {
        if (route.request().method() !== "GET") return await route.continue();
        const auth = (await route.request().allHeaders())["authorization"];
        if (auth !== "Bearer test-user-id") {
          return await route.fulfill(unauthorizedResponse("weight.getGoals"));
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers,
          body: JSON.stringify([{ result: { data: goals } }]),
        });
      });

      // Mock weight.setGoal
      await page.route("**/trpc/weight.setGoal**", async (route) => {
        if (route.request().method() !== "POST") return await route.continue();
        const auth = (await route.request().allHeaders())["authorization"];
        const body = await route.request().postData();
        if (auth !== "Bearer test-user-id") {
          return await route.fulfill(unauthorizedResponse("weight.setGoal"));
        }
        const input = JSON.parse(body || "{}")[0];
        if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
          return await route.fulfill(
            badRequestResponse(
              "weight.setGoal",
              "Goal weight must be a positive number"
            )
          );
        }
        if (goals.find((g) => !g.reachedAt)) {
          return await route.fulfill(
            badRequestResponse(
              "weight.setGoal",
              "Cannot set a new goal until the current goal is reached or edited"
            )
          );
        }
        const newGoal: Goal = {
          id: "goal-" + Math.random().toString(36).substr(2, 9),
          goalWeightKg: input.goalWeightKg,
          goalSetAt: new Date().toISOString(),
          reachedAt: null,
        };
        goals.push(newGoal);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers,
          body: JSON.stringify([
            {
              id: 0,
              result: {
                data: {
                  id: newGoal.id,
                  goalWeightKg: newGoal.goalWeightKg,
                  goalSetAt: newGoal.goalSetAt,
                },
              },
            },
          ]),
        });
      });

      // Mock weight.updateGoal
      await page.route("**/trpc/weight.updateGoal**", async (route) => {
        if (route.request().method() !== "POST") return await route.continue();
        const auth = (await route.request().allHeaders())["authorization"];
        const body = await route.request().postData();
        if (auth !== "Bearer test-user-id") {
          return await route.fulfill(unauthorizedResponse("weight.updateGoal"));
        }
        const input = JSON.parse(body || "{}")[0];
        if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
          return await route.fulfill(
            badRequestResponse(
              "weight.updateGoal",
              "Goal weight must be a positive number"
            )
          );
        }
        const goal = goals.find((g) => g.id === input.goalId && !g.reachedAt);
        if (!goal) {
          return await route.fulfill({
            status: 404,
            contentType: "application/json",
            headers,
            body: JSON.stringify([
              {
                id: 0,
                error: {
                  message: "Goal not found",
                  code: -32001,
                  data: {
                    code: "NOT_FOUND",
                    httpStatus: 404,
                    path: "weight.updateGoal",
                  },
                },
              },
            ]),
          });
        }
        goal.goalWeightKg = input.goalWeightKg;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers,
          body: JSON.stringify([
            {
              id: 0,
              result: {
                data: {
                  id: goal.id,
                  goalWeightKg: goal.goalWeightKg,
                  goalSetAt: goal.goalSetAt,
                },
              },
            },
          ]),
        });
      });

      // Navigate to goals page
      await page.getByRole("link", { name: "Goals" }).click();
      await expect(
        page.getByRole("heading", { name: "Set Weight Goal" })
      ).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("No weight goals found")).toBeVisible({
        timeout: 5000,
      });

      // Set goal
      await page.getByPlaceholder("Enter your goal weight (kg)").fill("60");
      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("trpc/weight.setGoal") && resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole("button", { name: "Set Goal" }).click(),
      ]);
      await expect(page.getByText("Goal set successfully!")).toBeVisible({
        timeout: 20000,
      });
      await expect(page.getByText(/Current Goal: 60 kg \(Set on/)).toBeVisible({
        timeout: 20000,
      });

      // Reload to trigger useGoalList refetch
      await page.reload();
      await page.waitForResponse(
        (resp) =>
          resp.url().includes("trpc/weight.getGoals") && resp.status() === 200,
        { timeout: 10000 }
      );
      await expect(
        page.locator("table td").filter({ hasText: "60" })
      ).toBeVisible({ timeout: 10000 });

      // Update goal (assumes edit mode enabled in UI)
      await page.getByPlaceholder("Enter your goal weight (kg)").fill("65");
      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("trpc/weight.updateGoal") &&
            resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole("button", { name: "Update Goal" }).click(),
      ]);

      if (!(await page.url()).includes("/weight-goal")) {
        await page.getByRole("link", { name: "Goals" }).click();
      }
      await expect(page.getByText("Goal updated successfully!")).toBeVisible({
        timeout: 20000,
      });
      await expect(page.getByText(/Current Goal: 65 kg \(Set on/)).toBeVisible({
        timeout: 20000,
      });
    });

    test("should display error for invalid goal weight", async ({ page }) => {
      // Mock weight.getCurrentGoal
      await page.route("**/trpc/weight.getCurrentGoal**", async (route) => {
        if (route.request().method() !== "GET") return await route.continue();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers,
          body: JSON.stringify([{ result: { data: null } }]),
        });
      });

      // Mock weight.getGoals
      await page.route("**/trpc/weight.getGoals**", async (route) => {
        if (route.request().method() !== "GET") return await route.continue();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers,
          body: JSON.stringify([{ result: { data: [] } }]),
        });
      });

      // Mock weight.setGoal for invalid input
      await page.route("**/trpc/weight.setGoal**", async (route) => {
        if (route.request().method() !== "POST") return await route.continue();
        const auth = (await route.request().allHeaders())["authorization"];
        const body = await route.request().postData();
        if (auth !== "Bearer test-user-id") {
          return await route.fulfill(unauthorizedResponse("weight.setGoal"));
        }
        const input = JSON.parse(body || "{}")[0];
        if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
          return await route.fulfill(
            badRequestResponse(
              "weight.setGoal",
              "Goal weight must be a positive number"
            )
          );
        }
      });

      // Test invalid input
      await page.getByRole("link", { name: "Goals" }).click();
      await expect(
        page.getByRole("heading", { name: "Set Weight Goal" })
      ).toBeVisible({ timeout: 5000 });
      await page.getByPlaceholder("Enter your goal weight (kg)").fill("0");
      await page.getByRole("button", { name: "Set Goal" }).click();
      await expect(
        page.getByText("Goal weight must be a positive number")
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Unauthenticated", () => {
    test("should redirect to login when not logged in", async ({ page }) => {
      await page.goto("/logout");
      await page.route("**/trpc/weight.getCurrentGoal**", async (route) => {
        if (route.request().method() !== "GET") return await route.continue();
        await route.fulfill(unauthorizedResponse("weight.getCurrentGoal"));
      });
      await page.route("**/trpc/weight.getGoals**", async (route) => {
        if (route.request().method() !== "GET") return await route.continue();
        await route.fulfill(unauthorizedResponse("weight.getGoals"));
      });
      await page.goto("/weight-goal");
      await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
      await expect(page.getByPlaceholder("m@example.com")).toBeVisible({
        timeout: 5000,
      });
    });
  });
});
