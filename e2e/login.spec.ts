import { test, expect } from '@playwright/test';

test.describe('Login Functionality', () => {
  test('should log in successfully with valid credentials', async ({ page }) => {
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

    // Navigate to the home page
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for the login form to be visible
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible({ timeout: 5000 });

    // Fill in login form
    await page.getByPlaceholder('m@example.com').fill('testuser@example.com');
    await page.getByPlaceholder('Enter your password').fill('password123');

    // Click login button and wait for TRPC response
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.request().method() === 'POST' && resp.url().includes('trpc/login'),
        { timeout: 10000 }
      ),
      page.getByTestId('login-button').click(),
    ]);

    // Verify success message
    await expect(page.getByTestId('login-message')).toHaveText('Login successful!', { timeout: 5000 });

    // Verify logged-in state (check for navigation link instead of Logout button)
    await expect(page.getByTestId('login-form')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Measurements' })).toBeVisible({ timeout: 10000 });
  });

  test('should display error message with invalid credentials', async ({ page }) => {
    // Mock the tRPC login request with error response
    await page.route('**/trpc/login**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 0,
              error: {
                message: 'Invalid email or password',
                code: -32001,
                data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'login' },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to the home page
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for the login form to be visible
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible({ timeout: 5000 });

    // Fill in login form with invalid credentials
    await page.getByPlaceholder('m@example.com').fill('wronguser@example.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');

    // Click login button and wait for TRPC response
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.request().method() === 'POST' && resp.url().includes('trpc/login'),
        { timeout: 10000 }
      ),
      page.getByTestId('login-button').click(),
    ]);

    // Verify error message
    await expect(page.getByTestId('login-message')).toHaveText('Login failed: Invalid email or password', { timeout: 5000 });

    // Verify login did not succeed
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Measurements' })).not.toBeVisible({ timeout: 10000 });
  });

  test('should display validation errors for invalid inputs', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for the login form to be visible
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible({ timeout: 5000 });

    // Fill in invalid inputs
    await page.getByPlaceholder('m@example.com').fill('invalid-email');
    await page.getByPlaceholder('Enter your password').fill('short');

    // Trigger validation by clicking login button
    await page.getByTestId('login-button').click();

    // Verify validation error messages
    await expect(page.getByText('Please enter a valid email address')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible({ timeout: 5000 });

    // Verify no TRPC request was made
    const response = await page.waitForResponse(
      (resp) => resp.request().method() === 'POST' && resp.url().includes('trpc/login'),
      { timeout: 2000 }
    ).catch(() => null);
    expect(response).toBeNull();

    // Verify login did not succeed
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: 'Measurements' })).not.toBeVisible({ timeout: 5000 });
  });
});