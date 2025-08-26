// e2e/weight-list.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Weight List Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Handle dialogs to ensure confirm prompts are accepted
    page.on('dialog', async (dialog) => dialog.accept());

    // Mock the tRPC login request
    await page.route('**/trpc/login**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Credentials': 'true',
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

    // Navigate to the login page and perform login
    await page.goto('/login');
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible({
      timeout: 5000,
    });

    await page.getByPlaceholder('m@example.com').fill('testuser@example.com');
    await page.getByPlaceholder('Enter your password').fill('password123');

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('trpc/login') && resp.status() === 200,
        { timeout: 20000 }
      ),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    // Wait for notifications to disappear to avoid interference
    await page
      .getByLabel('Notifications alt+T')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {
        // Ignore if no notifications are present
      });
  });

  test('should display weight measurements for user', async ({ page }) => {
    // Mock the tRPC weight.getWeights request with a single item
    await page.route('**/trpc/weight.getWeights**', async (route) => {
      if (route.request().method() === 'GET') {
        const headers = await route.request().allHeaders();
        if (headers['authorization'] !== 'Bearer test-user-id') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            headers: {
              'Access-Control-Allow-Origin': 'http://localhost:5173',
              'Access-Control-Allow-Credentials': 'true',
            },
            body: JSON.stringify([
              {
                id: 0,
                error: {
                  message: 'Unauthorized: User must be logged in',
                  code: -32001,
                  data: {
                    code: 'UNAUTHORIZED',
                    httpStatus: 401,
                    path: 'weight.getWeights',
                  },
                },
              },
            ]),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: {
              'Access-Control-Allow-Origin': 'http://localhost:5173',
              'Access-Control-Allow-Credentials': 'true',
            },
            body: JSON.stringify([
              {
                result: {
                  data: [
                    {
                      id: '1',
                      weightKg: 70.5,
                      note: 'Morning weigh-in',
                      createdAt: '2025-08-20T10:00:00Z',
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

    // Navigate to the weights list
    await page.getByRole('link', { name: 'Weight' }).click();
    await expect(page.getByText('A list of your recent weight measurements')).toBeVisible({ timeout: 5000 });

    // Verify the weight table is displayed with a single item
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('th').filter({ hasText: 'Weight (kg)' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('th').filter({ hasText: 'Note' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('th').filter({ hasText: 'Date' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table td').filter({ hasText: '70.5' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table td').filter({ hasText: 'Morning weigh-in' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table td').filter({ hasText: /20\/08\/2025/ }).filter({ hasNot: page.getByRole('button') })).toBeVisible({ timeout: 5000 });
  });

  test('should delete a weight measurement when delete button is clicked', async ({ page }) => {
    // Mock state for weights to simulate deletion
    let weights = [
      {
        id: '1',
        weightKg: 70.5,
        note: 'Morning weigh-in',
        createdAt: '2025-08-20T10:00:00Z',
      },
    ];

    // Mock the tRPC weight.getWeights request
    await page.route('**/trpc/weight.getWeights**', async (route) => {
      if (route.request().method() === 'GET') {
        const headers = await route.request().allHeaders();
        if (headers['authorization'] !== 'Bearer test-user-id') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            headers: {
              'Access-Control-Allow-Origin': 'http://localhost:5173',
              'Access-Control-Allow-Credentials': 'true',
            },
            body: JSON.stringify([
              {
                id: 0,
                error: {
                  message: 'Unauthorized: User must be logged in',
                  code: -32001,
                  data: {
                    code: 'UNAUTHORIZED',
                    httpStatus: 401,
                    path: 'weight.getWeights',
                  },
                },
              },
            ]),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: {
              'Access-Control-Allow-Origin': 'http://localhost:5173',
              'Access-Control-Allow-Credentials': 'true',
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
    await page.route('**/trpc/weight.delete**', async (route) => {
      if (route.request().method() === 'POST') {
        weights = []; // Simulate deletion
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Credentials': 'true',
          },
          body: JSON.stringify([
            {
              id: 0,
              result: {
                data: { id: '1' },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to the weights list
    await page.getByRole('link', { name: 'Weight' }).click();
    await expect(page.getByText('A list of your recent weight measurements')).toBeVisible({ timeout: 5000 });

    // Verify initial weight (single item)
    await expect(page.locator('table td').filter({ hasText: '70.5' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table td').filter({ hasText: 'Morning weigh-in' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table td').filter({ hasText: /20\/08\/2025/ }).filter({ hasNot: page.getByRole('button') })).toBeVisible({ timeout: 5000 });

    // Select the delete button for the single weight
    const deleteButton = page.getByRole('button', {
      name: 'Delete weight measurement from 20/08/2025',
    });
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await expect(deleteButton).toBeEnabled({ timeout: 5000 });

    // Click and wait for responses
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('trpc/weight.delete') && resp.status() === 200,
        { timeout: 20000 }
      ),
      page.waitForResponse(
        (resp) => resp.url().includes('trpc/weight.getWeights') && resp.status() === 200,
        { timeout: 20000 }
      ),
      deleteButton.click(),
    ]);

    // Verify the weight is removed and empty state is shown
    await expect(page.getByText('No weight measurements found')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('table td').filter({ hasText: '70.5' })).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('table td').filter({ hasText: 'Morning weigh-in' })).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('table td').filter({ hasText: /20\/08\/2025/ }).filter({ hasNot: page.getByRole('button') })).not.toBeVisible({ timeout: 5000 });
  });
});