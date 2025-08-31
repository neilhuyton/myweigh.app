import { test, expect } from "@playwright/test";

type Goal = {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: string | null;
};

const headers = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Credentials": "true",
  "Cache-Control": "no-cache",
};

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

      await page.route(
        "http://localhost:8888/.netlify/functions/trpc/login**",
        async (route) => {
          if (route.request().method() === "POST") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              headers,
              body: JSON.stringify([
                {
                  id: 0,
                  result: {
                    data: {
                      id: "test-user-id",
                      email: "testuser@example.com",
                      token: "mock-token",
                      refreshToken: "mock-refresh-token",
                    },
                  },
                },
              ]),
            });
          } else {
            await route.continue();
          }
        }
      );

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

      await page.route(
        "http://localhost:8888/.netlify/functions/trpc/**",
        async (route) => {
          const url = route.request().url();
          const method = route.request().method();
          const headers = await route.request().allHeaders();
          const body = await route.request().postData();

          const urlObj = new URL(url);
          const queries =
            urlObj.pathname.split("/trpc/")[1]?.split("?")[0]?.split(",") || [];

          if (method !== "POST") {
            await route.continue();
            return;
          }

          const auth = headers["authorization"];
          if (auth !== "Bearer mock-token") {
            return await route.fulfill(unauthorizedResponse(queries.join(",")));
          }

          const responseBody = queries.map((query, index) => {
            if (query === "weight.getCurrentGoal") {
              const currentGoal = goals.find((g) => !g.reachedAt) || null;
              return {
                id: index,
                result: {
                  data: currentGoal
                    ? {
                        id: currentGoal.id,
                        goalWeightKg: currentGoal.goalWeightKg,
                        goalSetAt: currentGoal.goalSetAt,
                      }
                    : null,
                },
              };
            } else if (query === "weight.getGoals") {
              return {
                id: index,
                result: { data: goals },
              };
            } else if (query === "weight.setGoal") {
              const input = JSON.parse(body || "{}")[index];
              if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
                return badRequestResponse(
                  "weight.setGoal",
                  "Goal weight must be a positive number"
                );
              }
              const newGoal: Goal = {
                id: "goal-" + Math.random().toString(36).substr(2, 9),
                goalWeightKg: input.goalWeightKg,
                goalSetAt: new Date().toISOString(),
                reachedAt: null,
              };
              goals.push(newGoal);
              return {
                id: index,
                result: {
                  data: {
                    id: newGoal.id,
                    goalWeightKg: newGoal.goalWeightKg,
                    goalSetAt: newGoal.goalSetAt,
                  },
                },
              };
            } else if (query === "weight.updateGoal") {
              const input = JSON.parse(body || "{}")[index];
              if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
                return badRequestResponse(
                  "weight.updateGoal",
                  "Goal weight must be a positive number"
                );
              }
              const goal = goals.find(
                (g) => g.id === input.goalId && !g.reachedAt
              );
              if (!goal) {
                return {
                  id: index,
                  error: {
                    message: "Goal not found",
                    code: -32001,
                    data: {
                      code: "NOT_FOUND",
                      httpStatus: 404,
                      path: "weight.updateGoal",
                    },
                  },
                };
              }
              goal.goalWeightKg = input.goalWeightKg;
              return {
                id: index,
                result: {
                  data: {
                    id: goal.id,
                    goalWeightKg: goal.goalWeightKg,
                    goalSetAt: goal.goalSetAt,
                  },
                },
              };
            } else if (query === "weight.create") {
              const input = JSON.parse(body || "{}")[index];
              if (!input?.weightKg || input.weightKg <= 0) {
                return badRequestResponse(
                  "weight.create",
                  "Weight must be a positive number"
                );
              }
              const newWeight = {
                id: "weight-" + Math.random().toString(36).substr(2, 9),
                weightKg: input.weightKg,
                createdAt: new Date().toISOString(),
              };
              const currentGoal = goals.find((g) => !g.reachedAt);
              if (currentGoal && input.weightKg <= currentGoal.goalWeightKg) {
                currentGoal.reachedAt = new Date().toISOString();
              }
              return {
                id: index,
                result: { data: newWeight },
              };
            } else if (query === "weight.getWeights") {
              return {
                id: index,
                result: { data: [] },
              };
            }
            return {
              id: index,
              error: {
                message: `Unknown query: ${query}`,
                code: -32601,
                data: {
                  code: "METHOD_NOT_FOUND",
                  httpStatus: 404,
                  path: query,
                },
              },
            };
          });

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers,
            body: JSON.stringify(responseBody),
          });
        }
      );

      await page.getByRole("link", { name: "Goals" }).click();
      await expect(
        page.getByRole("heading", {
          name: "Weight Goal",
          exact: true,
          level: 1,
        })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("heading", {
          name: "Past Weight Goals",
          exact: true,
          level: 2,
        })
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("No weight goals found")).toBeVisible({
        timeout: 10000,
      });

      await page.getByPlaceholder("Enter your goal weight (kg)").fill("60");
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes("trpc/weight.setGoal") && resp.status() === 200,
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
      await expect(page.getByRole("button", { name: "Set Goal" })).toBeVisible({
        timeout: 5000,
      });

      await page.goto("/weight");
      await page.getByPlaceholder("Enter your weight (kg)").fill("55");
      await page.route(
        "http://localhost:8888/.netlify/functions/trpc/weight.getWeights**",
        async (route) => {
          if (route.request().method() !== "POST")
            return await route.continue();
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers,
            body: JSON.stringify([
              {
                result: {
                  data: [
                    {
                      weightKg: 55,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                },
              },
            ]),
          });
        }
      );
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes("trpc/weight.create") && resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole("button", { name: "Submit Weight" }).click(),
      ]);
      await expect(page.getByTestId("confetti")).toBeVisible({ timeout: 7000 });

      await page.getByRole("link", { name: "Goals" }).click();
      await expect(page.getByRole("button", { name: "Set Goal" })).toBeVisible({
        timeout: 5000,
      });

      await page.getByPlaceholder("Enter your goal weight (kg)").fill("50");
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes("trpc/weight.setGoal") && resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole("button", { name: "Set Goal" }).click(),
      ]);
      await expect(page.getByText("Goal set successfully!")).toBeVisible({
        timeout: 20000,
      });
      await expect(page.getByText(/Current Goal: 50 kg \(Set on/)).toBeVisible({
        timeout: 20000,
      });
      await expect(page.getByRole("button", { name: "Set Goal" })).toBeVisible({
        timeout: 5000,
      });

      await page.reload();
      await page.waitForResponse(
        (resp) => resp.url().includes("trpc/weight.getGoals") && resp.status() === 200,
        { timeout: 10000 }
      );
      await expect(
        page.locator("table td").filter({ hasText: "50" })
      ).toBeVisible({ timeout: 10000 });

      await page.getByPlaceholder("Enter your goal weight (kg)").fill("55");
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes("trpc/weight.updateGoal") && resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole("button", { name: "Set Goal" }).click(),
      ]);
      await expect(page.getByText("Goal updated successfully!")).toBeVisible({
        timeout: 20000,
      });
      await expect(page.getByText(/Current Goal: 55 kg \(Set on/)).toBeVisible({
        timeout: 20000,
      });
      await expect(page.getByRole("button", { name: "Set Goal" })).toBeVisible({
        timeout: 5000,
      });
    });

    test("should display error for invalid goal weight", async ({ page }) => {
      await page.route("**/trpc/weight.getCurrentGoal**", async (route) => {
        if (route.request().method() !== "GET") return await route.continue();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers,
          body: JSON.stringify([{ result: { data: null } }]),
        });
      });

      await page.route("**/trpc/weight.getGoals**", async (route) => {
        if (route.request().method() !== "GET") return await route.continue();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers,
          body: JSON.stringify([{ result: { data: [] } }]),
        });
      });

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

      await page.getByRole("link", { name: "Goals" }).click();
      await expect(
        page.getByRole("heading", {
          name: "Weight Goal",
          exact: true,
          level: 1,
        })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("heading", {
          name: "Past Weight Goals",
          exact: true,

          level: 2,
        })
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
      await page.goto("/");
      await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
      await expect(page.getByPlaceholder("m@example.com")).toBeVisible({
        timeout: 5000,
      });
    });
  });
});