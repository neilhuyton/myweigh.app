// e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should handle logout from profile page', async ({ page }) => {
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

    // Navigate to the login page and log in
    await page.goto('/login');
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

    // Wait for notifications to disappear
    await page
      .getByLabel('Notifications alt+T')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});

    // Navigate to profile page
    await page.getByTestId('profile-icon').click();
    await expect(page).toHaveURL(/.*\/profile/, { timeout: 10000 });

    // Debug: Log page content and take screenshot if button is not found
    const logoutButton = page.getByTestId('logout-button');
    if (!(await logoutButton.isVisible({ timeout: 10000 }))) {
      await page.screenshot({ path: 'test-results/profile-page-failure.png' });
      throw new Error('Logout button not found on profile page');
    }

    // Verify logout button is visible
    await expect(logoutButton).toBeVisible({ timeout: 10000 });

    // Click logout button
    await logoutButton.click();

    // Verify user is logged out (profile icon is not visible, login form is visible)
    await page.goto('/'); // Navigate to home to check login state
    await expect(page.getByTestId('profile-icon')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 5000 });
  });
});