// e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation Theme Toggle Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock window.matchMedia with a default light theme
    await page.context().addInitScript(() => {
      window.matchMedia = (query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });
    });

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

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('should toggle between light and dark themes when theme toggle button is clicked', async ({ page }) => {
    const loginInput = page.getByPlaceholder('Enter your email for login');

    await expect(loginInput).toBeVisible({ timeout: 10000 });

    await loginInput.fill('testuser@example.com');
    await page.getByPlaceholder('Enter your password for login').fill('password123');

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('trpc/login') && resp.status() === 200,
        { timeout: 30000 }
      ),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    await expect(page.getByText('Login successful!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('link', { name: 'Weight Tracker' })).toBeVisible({ timeout: 10000 });

    const mobileMenuButton = page.getByRole('button', { name: 'Toggle menu' });
    const isMobileMenuVisible = await mobileMenuButton.isVisible();
    if (isMobileMenuVisible) {
      await mobileMenuButton.click();
      await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible({ timeout: 10000 });
    }

    const themeToggleButton = page.getByRole('button', { name: 'Toggle theme' });
    await expect(themeToggleButton).toBeVisible({ timeout: 10000 });
    await expect(themeToggleButton).toHaveText('🌙 Dark', { timeout: 10000 });

    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(false);

    const initialTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(initialTheme).toBe(null);

    await themeToggleButton.click();

    await expect(themeToggleButton).toHaveText('☀️ Light', { timeout: 10000 });
    await page.waitForTimeout(500);
    const hasDarkClassAfterToggle = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClassAfterToggle).toBe(true);

    const themeAfterToggle = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeAfterToggle).toBe('dark');

    await themeToggleButton.click();

    await expect(themeToggleButton).toHaveText('🌙 Dark', { timeout: 10000 });
    await page.waitForTimeout(500);
    const hasDarkClassAfterSecondToggle = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClassAfterSecondToggle).toBe(false);

    const themeAfterSecondToggle = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeAfterSecondToggle).toBe('light');
  });

  test('should persist theme in localStorage and apply it on page load', async ({ page }) => {
    await page.context().addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });

    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('dark');

    const loginInput = page.getByPlaceholder('Enter your email for login');
    await expect(loginInput).toBeVisible({ timeout: 10000 });
    await loginInput.fill('testuser@example.com');
    await page.getByPlaceholder('Enter your password for login').fill('password123');

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('trpc/login') && resp.status() === 200,
        { timeout: 30000 }
      ),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    await expect(page.getByText('Login successful!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('link', { name: 'Weight Tracker' })).toBeVisible({ timeout: 10000 });

    const mobileMenuButton = page.getByRole('button', { name: 'Toggle menu' });
    const isMobileMenuVisible = await mobileMenuButton.isVisible();
    if (isMobileMenuVisible) {
      await mobileMenuButton.click();
      await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible({ timeout: 10000 });
    }

    const themeToggleButton = page.getByRole('button', { name: 'Toggle theme' });
    await expect(themeToggleButton).toBeVisible({ timeout: 10000 });
    await expect(themeToggleButton).toHaveText('☀️ Light', { timeout: 10000 });

    await page.waitForTimeout(500);
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);

    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');

    await themeToggleButton.click();

    await expect(themeToggleButton).toHaveText('🌙 Dark', { timeout: 10000 });
    await page.waitForTimeout(500);
    const hasDarkClassAfterToggle = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClassAfterToggle).toBe(false);

    const themeAfterToggle = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeAfterToggle).toBe('light');
  });

  test('should initialize theme based on prefers-color-scheme when no localStorage value exists', async ({ page }) => {
    await page.context().addInitScript(() => {
      window.matchMedia = (query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });

    const prefersDark = await page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
    expect(prefersDark).toBe(true);

    const loginInput = page.getByPlaceholder('Enter your email for login');
    await expect(loginInput).toBeVisible({ timeout: 10000 });
    await loginInput.fill('testuser@example.com');
    await page.getByPlaceholder('Enter your password for login').fill('password123');

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('trpc/login') && resp.status() === 200,
        { timeout: 30000 }
      ),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    await expect(page.getByText('Login successful!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('link', { name: 'Weight Tracker' })).toBeVisible({ timeout: 10000 });

    const mobileMenuButton = page.getByRole('button', { name: 'Toggle menu' });
    const isMobileMenuVisible = await mobileMenuButton.isVisible();
    if (isMobileMenuVisible) {
      await mobileMenuButton.click();
      await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible({ timeout: 10000 });
    }

    const themeToggleButton = page.getByRole('button', { name: 'Toggle theme' });
    await expect(themeToggleButton).toBeVisible({ timeout: 10000 });
    await expect(themeToggleButton).toHaveText('☀️ Light', { timeout: 10000 });

    await page.waitForTimeout(500);
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);

    const initialTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(initialTheme).toBe(null);

    await themeToggleButton.click();

    await expect(themeToggleButton).toHaveText('🌙 Dark', { timeout: 10000 });
    await page.waitForTimeout(500);
    const hasDarkClassAfterToggle = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClassAfterToggle).toBe(false);

    const themeAfterToggle = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeAfterToggle).toBe('light');
  });
});