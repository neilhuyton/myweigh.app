// e2e/register.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Register Functionality', () => {
  test('should register successfully with valid credentials', async ({ page }) => {
    await page.route('**/trpc/register**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 0,
              result: {
                data: {
                  id: 'new-user-id',
                  email: 'newuser@example.com',
                },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('link', { name: 'Sign up' }).click();

    await expect(page.getByPlaceholder('Enter your email')).toBeVisible({ timeout: 5000 });

    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');

    await emailInput.focus();
    await emailInput.fill('newuser@example.com');
    await expect(emailInput).toHaveValue('newuser@example.com');

    await passwordInput.focus();
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');

    const registerButton = page.getByRole('button', { name: 'Register' });
    await expect(registerButton).toBeEnabled({ timeout: 5000 });

    await Promise.all([
      page.waitForResponse(
        (resp) => {
          return resp.request().method() === 'POST' && resp.url().includes('trpc');
        },
        { timeout: 20000 }
      ),
      registerButton.click(),
    ]);

    await expect(page.getByText('Registration successful!')).toBeVisible({ timeout: 20000 });
  });

  test('should display error message with invalid email', async ({ page }) => {
    await page.route('**/trpc/register**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 0,
              error: {
                message: 'Invalid email address',
                code: -32001,
                data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('link', { name: 'Sign up' }).click();

    await expect(page.getByPlaceholder('Enter your email')).toBeVisible({ timeout: 5000 });

    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');

    await emailInput.focus();
    await emailInput.fill('invalid-email');
    await expect(emailInput).toHaveValue('invalid-email');

    await passwordInput.focus();
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');

    const registerButton = page.getByRole('button', { name: 'Register' });
    await expect(registerButton).toBeEnabled({ timeout: 5000 });

    await page.evaluate(() => {
      const form = document.querySelector('.form-container form');
      const emailInput = form?.querySelector('input[type="email"]');
      const passwordInput = form?.querySelector('input[type="password"]');
      if (form && emailInput && passwordInput) {
        emailInput.removeAttribute('required');
        emailInput.setAttribute('type', 'text');
        passwordInput.removeAttribute('required');
      }
    });

    await Promise.all([
      page.waitForResponse(
        (resp) => {
          return resp.request().method() === 'POST' && resp.url().includes('trpc');
        },
        { timeout: 20000 }
      ),
      registerButton.click(),
    ]);

    await expect(page.getByText('Registration failed: Invalid email address')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Registration successful!')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display error message with short password', async ({ page }) => {
    await page.route('**/trpc/register**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 0,
              error: {
                message: 'Password must be at least 8 characters',
                code: -32001,
                data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('link', { name: 'Sign up' }).click();

    await expect(page.getByPlaceholder('Enter your email')).toBeVisible({ timeout: 5000 });

    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');

    await emailInput.focus();
    await emailInput.fill('newuser@example.com');
    await expect(emailInput).toHaveValue('newuser@example.com');

    await passwordInput.focus();
    await passwordInput.fill('short');
    await expect(passwordInput).toHaveValue('short');

    const registerButton = page.getByRole('button', { name: 'Register' });
    await expect(registerButton).toBeEnabled({ timeout: 5000 });

    await Promise.all([
      page.waitForResponse(
        (resp) => {
          return resp.request().method() === 'POST' && resp.url().includes('trpc');
        },
        { timeout: 20000 }
      ),
      registerButton.click(),
    ]);

    await expect(page.getByText('Registration failed: Password must be at least 8 characters')).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText('Registration successful!')).not.toBeVisible({ timeout: 5000 });
  });

  test('should switch to login form when log in button is clicked', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('link', { name: 'Sign up' }).click();

    await expect(page.getByPlaceholder('Enter your email')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByPlaceholder('m@example.com')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Enter your email', { exact: true })).not.toBeVisible({ timeout: 5000 });
  });
});