import { test, expect } from '@playwright/test';

test.describe('Weight Form Functionality', () => {
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

    // Navigate to the home page and log in
    await page.goto('/');
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

    // Wait for login confirmation
    await expect(page.getByTestId('login-message')).toBeVisible({ timeout: 20000 });

    // Wait for notifications to disappear to avoid interference
    await page.getByLabel('Notifications alt+T').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // Ignore if no notifications are present
    });
  });

  test('should record weight successfully when logged in', async ({ page }) => {
    // Mock the tRPC weight.create request
    await page.route('**/trpc/weight.create**', async (route) => {
      if (route.request().method() === 'POST') {
        const headers = await route.request().allHeaders();
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
                    weightKg: 70.5,
                    createdAt: new Date().toISOString(),
                  },
                },
              },
            ]),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Navigate to the weight form
    await page.getByRole('link', { name: 'Weight', exact: true }).click();
    await expect(page.getByPlaceholder('Enter your weight (kg)')).toBeVisible({ timeout: 5000 });

    // Fill in the weight form
    await page.getByPlaceholder('Enter your weight (kg)').fill('70.5');
    await page.getByPlaceholder('Optional note').fill('Morning weigh-in');

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
  });

  test('should redirect to home when not logged in', async ({ page }) => {
    // No login mock needed since we're testing unauthorized access
    await page.goto('/weight');

    // Verify redirect to home
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Enter your weight (kg)')).not.toBeVisible({ timeout: 5000 });
  });
});