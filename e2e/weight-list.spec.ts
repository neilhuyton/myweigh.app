import { test, expect } from "@playwright/test";

type Weight = {
  id: string;
  userId: string;
  weightKg: number;
  note: string;
  createdAt: string;
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

test.describe("Weight List Functionality", () => {
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
      });

      await page.goto("http://localhost:5173/login");
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

    test("should display weight measurements for user", async ({ page }) => {
      const weights: Weight[] = [
        {
          id: "weight-1",
          userId: "test-user-id",
          weightKg: 70.5,
          note: "Morning weigh-in",
          createdAt: "2025-08-20T10:00:00Z",
        },
      ];

      await page.route(
        "http://localhost:8888/.netlify/functions/trpc/**",
        async (route) => {
          const url = route.request().url();
          const method = route.request().method();
          const headers = await route.request().allHeaders();

          const urlObj = new URL(url);
          const queries =
            urlObj.pathname.split("/trpc/")[1]?.split("?")[0]?.split(",") || [];

          if (method !== "POST") {
            await route.continue();
            return;
          }

          const auth = headers["authorization"];
          if (auth !== "Bearer mock-token") {
            await route.fulfill(unauthorizedResponse(queries.join(",")));
            return;
          }

          const responseBody = queries.map((query, index) => {
            if (query === "weight.getWeights") {
              return {
                id: "0",
                result: { data: weights },
              };
            } else if (query === "weight.getCurrentGoal") {
              return {
                id: index.toString(),
                result: { data: null },
              };
            }
            return {
              id: index.toString(),
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

      await page.getByRole("link", { name: "Weight" }).click();
      await expect(
        page.getByRole("heading", {
          name: "Past Measurements",
          exact: true,
          level: 1,
        })
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.locator('[data-slot="table-cell"]').filter({ hasText: "70.5" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page
          .locator('[data-slot="table-cell"]')
          .filter({ hasText: "Morning weigh-in" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page
          .locator('[data-slot="table-cell"]')
          .filter({ hasText: /20\/08\/2025/ })
          .filter({ hasNot: page.getByRole("button") })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should delete a weight measurement when delete button is clicked", async ({
      page,
    }) => {
      let weights: Weight[] = [
        {
          id: "weight-1",
          userId: "test-user-id",
          weightKg: 70.5,
          note: "Morning weigh-in",
          createdAt: "2025-08-20T10:00:00Z",
        },
      ];

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
            await route.fulfill(unauthorizedResponse(queries.join(",")));
            return;
          }

          const responseBody = queries.map((query, index) => {
            if (query === "weight.getWeights") {
              return {
                id: "0",
                result: { data: weights },
              };
            } else if (query === "weight.getCurrentGoal") {
              return {
                id: index.toString(),
                result: { data: null },
              };
            } else if (query === "weight.delete") {
              const input = body ? JSON.parse(body)[0] : {};
              if (!input?.weightId) {
                return {
                  id: "0",
                  error: {
                    message: "Weight ID is required",
                    code: -32001,
                    data: {
                      code: "BAD_REQUEST",
                      httpStatus: 400,
                      path: "weight.delete",
                    },
                  },
                };
              }
              weights = weights.filter((w) => w.id !== input.weightId);
              return {
                id: "0",
                result: { data: { id: input.weightId } },
              };
            }
            return {
              id: index.toString(),
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

      await page.getByRole("link", { name: "Weight" }).click();
      await expect(
        page.getByRole("heading", {
          name: "Past Measurements",
          exact: true,
          level: 1,
        })
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.locator('[data-slot="table-cell"]').filter({ hasText: "70.5" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page
          .locator('[data-slot="table-cell"]')
          .filter({ hasText: "Morning weigh-in" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page
          .locator('[data-slot="table-cell"]')
          .filter({ hasText: /20\/08\/2025/ })
          .filter({ hasNot: page.getByRole("button") })
      ).toBeVisible({ timeout: 10000 });

      const deleteButton = page.getByRole("button", {
        name: /Delete weight measurement/,
      });
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
      await expect(deleteButton).toBeEnabled({ timeout: 10000 });

      await deleteButton.click();

      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("trpc/weight.delete") && resp.status() === 200,
          { timeout: 20000 }
        ),
      ]);

      await page.waitForTimeout(500);

      await expect(
        page
          .locator('[data-slot="table-cell"]')
          .filter({ hasText: "No weight measurements found" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('[data-slot="table-cell"]').filter({ hasText: "70.5" })
      ).not.toBeVisible({ timeout: 10000 });
      await expect(
        page
          .locator('[data-slot="table-cell"]')
          .filter({ hasText: "Morning weigh-in" })
      ).not.toBeVisible({ timeout: 10000 });
      await expect(
        page
          .locator('[data-slot="table-cell"]')
          .filter({ hasText: /20\/08\/2025/ })
          .filter({ hasNot: page.getByRole("button") })
      ).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Unauthenticated", () => {
    test("should redirect to login when not logged in", async ({ page }) => {
      await page.goto("http://localhost:5173/logout");
      await page.route(
        "http://localhost:8888/.netlify/functions/trpc/**",
        async (route) => {
          const url = route.request().url();
          if (route.request().method() === "POST") {
            await route.fulfill(unauthorizedResponse(url));
          } else {
            await route.continue();
          }
        }
      );
      await page.goto("http://localhost:5173/weight");
      await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
      await expect(page.getByPlaceholder("m@example.com")).toBeVisible({
        timeout: 5000,
      });
    });
  });
});