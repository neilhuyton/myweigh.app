import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should render login form on home route', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Check for login form elements
    await expect(page.getByPlaceholder('Enter your email for login')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password for login')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
    // Verify Register form is not visible
    await expect(page.getByPlaceholder('Enter your email', { exact: true })).not.toBeVisible({
      timeout: 10000, // Increase timeout to 10s
    });
    await expect(page.getByRole('button', { name: 'Register' })).not.toBeVisible({
      timeout: 10000,
    });
  });
});