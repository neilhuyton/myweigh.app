// e2e/weight.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Weight Form Functionality', () => {
  test('should record weight successfully when logged in', async ({ page }) => {
    // Mock the tRPC login request
    await page.route('**/trpc/login**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
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

    // Mock the tRPC weight.create request
    await page.route('**/trpc/weight.create**', async (route) => {
      if (route.request().method() === 'POST') {
        const headers = await route.request().allHeaders();
        if (headers['authorization'] !== 'Bearer test-user-id') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
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

    // Navigate to the home page and log in
    await page.goto('/');
    await expect(page.getByPlaceholder('Enter your email for login')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Enter your email for login').fill('testuser@example.com');
    await page.getByPlaceholder('Enter your password for login').fill('password123');

    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('trpc/login') && resp.status() === 200, { timeout: 20000 }),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    await expect(page.getByText('Login successful!')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 20000 });

    // Navigate to the weight form
    await page.getByRole('link', { name: 'Weight', exact: true }).click();
    await expect(page.getByPlaceholder('Enter your weight (kg)')).toBeVisible({ timeout: 5000 });

    // Fill in the weight form
    await page.getByPlaceholder('Enter your weight (kg)').fill('70.5');
    await page.getByPlaceholder('Optional note').fill('Morning weigh-in');

    // Submit the form
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('trpc/weight.create') && resp.status() === 200, {
        timeout: 20000,
      }),
      page.getByRole('button', { name: 'Submit Weight' }).click(),
    ]);

    // Verify success
    await expect(page.getByText('Weight recorded successfully!')).toBeVisible({ timeout: 20000 });
  });

  test('should redirect to home when not logged in', async ({ page }) => {
    await page.goto('/weight');

    // Verify redirect to home
    await expect(page.getByPlaceholder('Enter your email for login')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Enter your weight (kg)')).not.toBeVisible({ timeout: 5000 });
  });
});