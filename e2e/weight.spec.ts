import { test, expect } from '@playwright/test';

test.describe('Weight Form Functionality', () => {
  test.describe('Authenticated', () => {
    test.beforeEach(async ({ page }) => {
      // Mock the tRPC login request
      await page.route('**/trpc/login**', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: {
              "Access-Control-Allow-Origin": "http://localhost:5173",
              "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify([
              {
                id: 0,
                result: {
                  data: {
                    id: 'test-user-id',
                    email: 'testuser@example.com',
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
      await page.goto('/login');
      await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 15000 });

      await page.getByPlaceholder('m@example.com').fill('testuser@example.com');
      await page.getByPlaceholder('Enter your password').fill('password123');

      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('trpc/login') && resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole('button', { name: 'Login' }).click(),
      ]);

      // Wait for login confirmation
      await expect(page.getByTestId('login-message')).toBeVisible({ timeout: 20000 });

      // Wait for notifications to disappear to avoid interference
      await page.getByLabel('Notifications alt+T').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {
        // Ignore if no notifications are present
      });
    });

    test('should record weight successfully when logged in', async ({ page }) => {
      // Mock the tRPC weight.create request
      await page.route('**/trpc/weight.create**', async (route) => {
        if (route.request().method() === 'POST') {
          const headers = await route.request().allHeaders();
          const body = await route.request().postData();
          if (headers['authorization'] !== 'Bearer test-user-id') {
            await route.fulfill({
              status: 401,
              contentType: 'application/json',
              headers: {
                "Access-Control-Allow-Origin": "http://localhost:5173",
                "Access-Control-Allow-Credentials": "true",
              },
              body: JSON.stringify([
                {
                  id: 0,
                  error: {
                    message: 'Unauthorized: User must be logged in',
                    code: -32001,
                    data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.create' },
                  },
                },
              ]),
            });
          } else {
            const input = JSON.parse(body || '{}')['0'];
            if (!input?.weightKg || input.weightKg <= 0) {
              await route.fulfill({
                status: 400,
                contentType: 'application/json',
                headers: {
                  "Access-Control-Allow-Origin": "http://localhost:5173",
                  "Access-Control-Allow-Credentials": "true",
                },
                body: JSON.stringify([
                  {
                    id: 0,
                    error: {
                      message: 'Weight must be a positive number',
                      code: -32001,
                      data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.create' },
                    },
                  },
                ]),
              });
            } else {
              await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: {
                  "Access-Control-Allow-Origin": "http://localhost:5173",
                  "Access-Control-Allow-Credentials": "true",
                },
                body: JSON.stringify([
                  {
                    id: 0,
                    result: {
                      data: {
                        id: 'weight-id-123',
                        weightKg: input.weightKg,
                        note: input.note || null,
                        createdAt: new Date().toISOString(),
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

      // Check viewport size to handle mobile menu
      const viewport = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
      if (viewport.width < 1024) { // lg breakpoint
        await page.getByRole('button', { name: 'Toggle menu' }).click();
      }

      // Navigate to the weight form
      await page.getByRole('link', { name: 'Weight', exact: true }).click();
      await page.waitForURL(/.*\/weight/, { timeout: 15000 });
      // Debug: Log page content and take screenshot
      await page.screenshot({ path: 'weight-form-screenshot.png' });
      await expect(page.getByText('Record Weight')).toBeVisible({ timeout: 15000 });

      // Fill in the weight form
      await page.getByPlaceholder('Enter your weight (kg)').fill('70.5');
      await page.getByPlaceholder('Optional note').fill('Morning weigh-in');
      await expect(page.getByPlaceholder('Enter your weight (kg)')).toHaveValue('70.5');
      await expect(page.getByPlaceholder('Optional note')).toHaveValue('Morning weigh-in');

      // Submit the form
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('trpc/weight.create') && resp.status() === 200,
          { timeout: 20000 }
        ),
        page.getByRole('button', { name: 'Submit Weight' }).click(),
      ]);

      // Verify success
      await expect(page.getByText('Weight recorded successfully!')).toBeVisible({ timeout: 20000 });
      await expect(page.getByPlaceholder('Enter your weight (kg)')).toHaveValue('');
      await expect(page.getByPlaceholder('Optional note')).toHaveValue('');
    });

    test('should display error for invalid weight', async ({ page }) => {
      // Mock the tRPC weight.create request for invalid input
      await page.route('**/trpc/weight.create**', async (route) => {
        if (route.request().method() === 'POST') {
          const headers = await route.request().allHeaders();
          const body = await route.request().postData();
          if (headers['authorization'] !== 'Bearer test-user-id') {
            await route.fulfill({
              status: 401,
              contentType: 'application/json',
              headers: {
                "Access-Control-Allow-Origin": "http://localhost:5173",
                "Access-Control-Allow-Credentials": "true",
              },
              body: JSON.stringify([
                {
                  id: 0,
                  error: {
                    message: 'Unauthorized: User must be logged in',
                    code: -32001,
                    data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.create' },
                  },
                },
              ]),
            });
          } else {
            const input = JSON.parse(body || '{}')['0'];
            if (!input?.weightKg || input.weightKg <= 0) {
              await route.fulfill({
                status: 400,
                contentType: 'application/json',
                headers: {
                  "Access-Control-Allow-Origin": "http://localhost:5173",
                  "Access-Control-Allow-Credentials": "true",
                },
                body: JSON.stringify([
                  {
                    id: 0,
                    error: {
                      message: 'Weight must be a positive number',
                      code: -32001,
                      data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.create' },
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

      // Check viewport size to handle mobile menu
      const viewport = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
      if (viewport.width < 1024) { // lg breakpoint
        await page.getByRole('button', { name: 'Toggle menu' }).click();
      }

      // Navigate to the weight form
      await page.getByRole('link', { name: 'Weight', exact: true }).click();
      await page.waitForURL(/.*\/weight/, { timeout: 15000 });
      // Debug: Log page content and take screenshot
      await page.screenshot({ path: 'weight-form-error-screenshot.png' });
      await expect(page.getByText('Record Weight')).toBeVisible({ timeout: 15000 });

      // Fill in the weight form with invalid input
      await page.getByPlaceholder('Enter your weight (kg)').fill('0');
      await expect(page.getByPlaceholder('Enter your weight (kg)')).toHaveValue('0');

      // Submit the form
      await page.getByRole('button', { name: 'Submit Weight' }).click();

      // Verify error message
      await expect(page.getByText('Please enter a valid weight.')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Weight recorded successfully!')).not.toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Unauthenticated', () => {
    test('should redirect to login when not logged in', async ({ page }) => {
      // Navigate to logout to ensure unauthenticated state
      await page.goto('/logout');

      // Mock the tRPC weight.create request to return unauthorized
      await page.route('**/trpc/weight.create**', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            headers: {
              "Access-Control-Allow-Origin": "http://localhost:5173",
              "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify([
              {
                id: 0,
                error: {
                  message: 'Unauthorized: User must be logged in',
                  code: -32001,
                  data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.create' },
                },
              },
            ]),
          });
        } else {
          await route.continue();
        }
      });

      // Navigate directly to the weight form
      await page.goto('/weight');

      // Verify redirect to login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Record Weight')).not.toBeVisible({ timeout: 15000 });
    });
  });
});