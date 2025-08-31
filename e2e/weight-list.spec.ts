// e2e/weight-list.spec.ts
import { test, expect } from '@playwright/test';

const headers = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Credentials': 'true',
  'Cache-Control': 'no-cache',
};

const unauthorizedResponse = (path: string) => ({
  status: 401,
  contentType: 'application/json',
  headers,
  body: JSON.stringify([
    {
      id: 0,
      error: {
        message: 'Unauthorized: User must be logged in',
        code: -32001,
        data: { code: 'UNAUTHORIZED', httpStatus: 401, path },
      },
    },
  ]),
});

const badRequestResponse = (path: string, message: string) => ({
  status: 400,
  contentType: 'application/json',
  headers,
  body: JSON.stringify([
    {
      id: 0,
      error: {
        message,
        code: -32001,
        data: { code: 'BAD_REQUEST', httpStatus: 400, path },
      },
    },
  ]),
});

test.describe('Weight List Functionality', () => {
  test.describe('Authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('http://localhost:8888/.netlify/functions/trpc/login?batch=1', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers,
            body: JSON.stringify([
              {
                id: 0,
                result: {
                  data: {
                    id: 'test-user-id',
                    email: 'testuser@example.com',
                    token: 'mock-token',
                    refreshToken: 'mock-refresh-token',
                  },
                },
              },
            ]),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('http://localhost:5173/login');
      await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 5000 });
      await page.getByPlaceholder('m@example.com').fill('testuser@example.com');
      await page.getByPlaceholder('Enter your password').fill('password123');
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('trpc/login') && resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole('button', { name: 'Login' }).click(),
      ]);

      await page.evaluate(() => {
        localStorage.setItem('token', 'mock-token');
      });

      await page
        .getByLabel('Notifications alt+T')
        .waitFor({ state: 'hidden', timeout: 5000 })
        .catch(() => {});
    });

    test('should display weight measurements for user', async ({ page }) => {
      const weights = [
        {
          id: 'weight-1',
          userId: 'test-user-id',
          weightKg: 70.5,
          note: 'Morning weigh-in',
          createdAt: '2025-08-20T10:00:00Z',
        },
      ];

      await page.route('http://localhost:8888/.netlify/functions/trpc/**', async (route) => {
        const url = route.request().url();
        const method = route.request().method();
        const headers = await route.request().allHeaders();

        if (url.includes('trpc/login')) {
          await route.continue();
          return;
        }

        const urlObj = new URL(url);
        const queries = urlObj.pathname.split('/trpc/')[1]?.split('?')[0]?.split(',') || [];

        if (method !== 'POST') {
          await route.continue();
          return;
        }

        const auth = headers['authorization'];
        if (auth !== 'Bearer mock-token') {
          return await route.fulfill(unauthorizedResponse(queries.join(',')));
        }

        const responseBody = queries.map((query, index) => {
          if (query === 'weight.getWeights') {
            return {
              id: index,
              result: { data: weights },
            };
          } else if (query === 'weight.getCurrentGoal') {
            return {
              id: index,
              result: { data: null },
            };
          } else if (query === 'weight.getGoals') {
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
                code: 'METHOD_NOT_FOUND',
                httpStatus: 404,
                path: query,
              },
            },
          };
        });

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify(responseBody),
        });
      });

      await page.getByRole('link', { name: 'Weight' }).click();
      await expect(page.getByText('A list of your recent weight measurements')).toBeVisible({ timeout: 10000 });

      await expect(page.locator('table td').filter({ hasText: '70.5' })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('table td').filter({ hasText: 'Morning weigh-in' })).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('table td').filter({ hasText: /20\/08\/2025/ }).filter({ hasNot: page.getByRole('button') })
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('th').filter({ hasText: 'Weight (kg)' })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('th').filter({ hasText: 'Note' })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('th').filter({ hasText: 'Date' })).toBeVisible({ timeout: 10000 });
    });

    test('should delete a weight measurement when delete button is clicked', async ({ page }) => {
      let weights = [
        {
          id: 'weight-1',
          userId: 'test-user-id',
          weightKg: 70.5,
          note: 'Morning weigh-in',
          createdAt: '2025-08-20T10:00:00Z',
        },
      ];

      await page.route('http://localhost:8888/.netlify/functions/trpc/**', async (route) => {
        const url = route.request().url();
        const method = route.request().method();
        const headers = await route.request().allHeaders();
        const body = await route.request().postData();

        if (url.includes('trpc/login')) {
          await route.continue();
          return;
        }

        const urlObj = new URL(url);
        const queries = urlObj.pathname.split('/trpc/')[1]?.split('?')[0]?.split(',') || [];

        if (method !== 'POST') {
          await route.continue();
          return;
        }

        const auth = headers['authorization'];
        if (auth !== 'Bearer mock-token') {
          return await route.fulfill(unauthorizedResponse(queries.join(',')));
        }

        const responseBody = queries.map((query, index) => {
          if (query === 'weight.getWeights') {
            return {
              id: index,
              result: { data: weights },
            };
          } else if (query === 'weight.getCurrentGoal') {
            return {
              id: index,
              result: { data: null },
            };
          } else if (query === 'weight.getGoals') {
            return {
              id: index,
              result: { data: [] },
            };
          } else if (query === 'weight.delete') {
            const input = JSON.parse(body || '{}')[index];
            if (!input?.weightId) {
              return badRequestResponse('weight.delete', 'Weight ID is required');
            }
            weights = weights.filter((w) => w.id !== input.weightId);
            return {
              id: index,
              result: { data: { id: input.weightId } },
            };
          }
          return {
            id: index,
            error: {
              message: `Unknown query: ${query}`,
              code: -32601,
              data: {
                code: 'METHOD_NOT_FOUND',
                httpStatus: 404,
                path: query,
              },
            },
          };
        });

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify(responseBody),
        });
      });

      await page.getByRole('link', { name: 'Weight' }).click();
      await expect(page.getByText('A list of your recent weight measurements')).toBeVisible({ timeout: 10000 });

      await expect(page.locator('table td').filter({ hasText: '70.5' })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('table td').filter({ hasText: 'Morning weigh-in' })).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('table td').filter({ hasText: /20\/08\/2025/ }).filter({ hasNot: page.getByRole('button') })
      ).toBeVisible({ timeout: 10000 });

      const deleteButton = page.getByRole('button', { name: 'Delete weight measurement from 20/08/2025' });
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
      await expect(deleteButton).toBeEnabled({ timeout: 10000 });

      const dropdownTrigger = page.locator('[data-testid="dropdown-trigger"]');
      if (await dropdownTrigger.isVisible()) {
        await dropdownTrigger.click();
        const deleteMenuItem = page.getByRole('menuitem', { name: 'Delete' });
        await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
        await deleteMenuItem.click();
      } else {
        await deleteButton.click();
      }

      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('trpc/weight.delete') && resp.status() === 200,
          { timeout: 20000 }
        ),
      ]);

      await page.waitForTimeout(500);

      await expect(page.getByText('No weight measurements found')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('table td').filter({ hasText: '70.5' })).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('table td').filter({ hasText: 'Morning weigh-in' })).not.toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('table td').filter({ hasText: /20\/08\/2025/ }).filter({ hasNot: page.getByRole('button') })
      ).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Unauthenticated', () => {
    test('should redirect to login when not logged in', async ({ page }) => {
      await page.goto('http://localhost:5173/logout');
      await page.route('**/trpc/weight.getWeights**', async (route) => {
        if (route.request().method() !== 'POST') return await route.continue();
        await route.fulfill(unauthorizedResponse('weight.getWeights'));
      });
      await page.route('**/trpc/weight.getCurrentGoal**', async (route) => {
        if (route.request().method() !== 'POST') return await route.continue();
        await route.fulfill(unauthorizedResponse('weight.getCurrentGoal'));
      });
      await page.route('**/trpc/weight.getGoals**', async (route) => {
        if (route.request().method() !== 'POST') return await route.continue();
        await route.fulfill(unauthorizedResponse('weight.getGoals'));
      });
      await page.goto('http://localhost:5173/weight');
      await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
      await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 5000 });
    });
  });
});