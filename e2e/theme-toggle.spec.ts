// e2e/theme-toggle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Functionality', () => {
  test('should display theme toggle only when logged in and toggle themes', async ({ page }) => {
    // Test unauthenticated state
    await page.goto('/');
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Toggle theme' })).not.toBeVisible({ timeout: 5000 });

    // Mock tRPC login
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

    // Log in
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

    // Wait for notifications
    await page
      .getByLabel('Notifications alt+T')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});

    // Wait for hydration
    await page.waitForTimeout(1000);

    // Verify header and theme toggle
    await expect(page.getByTestId('profile-icon')).toBeVisible({ timeout: 5000 });
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' }).first();
    await expect(themeToggle).toBeVisible({ timeout: 5000 });
    await expect(themeToggle).toBeEnabled({ timeout: 5000 });

    // Debug: Log HTML attributes
    const htmlElement = page.locator('html');
    if (!(await htmlElement.evaluate((el) => el.classList.contains('dark'), { timeout: 5000 }))) {
      await page.screenshot({ path: 'test-results/theme-toggle-failure.png' });
      throw new Error('Expected dark class on html element');
    }

    // Verify initial theme (class="dark")
    await expect(htmlElement).toHaveClass(/dark/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="sun"]')).toHaveClass(/scale-0/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="moon"]')).toHaveClass(/scale-100/, { timeout: 5000 });

    // Select Light theme
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'Light' }).click();
    await expect(htmlElement).toHaveClass(/light/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="sun"]')).toHaveClass(/scale-100/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="moon"]')).toHaveClass(/scale-0/, { timeout: 5000 });

    // Select Dark theme
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();
    await expect(htmlElement).toHaveClass(/dark/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="sun"]')).toHaveClass(/scale-0/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="moon"]')).toHaveClass(/scale-100/, { timeout: 5000 });

    // Select System theme (mock system as light)
    await page.emulateMedia({ colorScheme: 'light' });
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'System' }).click();
    await expect(htmlElement).toHaveClass(/light/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="sun"]')).toHaveClass(/scale-100/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="moon"]')).toHaveClass(/scale-0/, { timeout: 5000 });

    // Select System theme (mock system as dark)
    await page.emulateMedia({ colorScheme: 'dark' });
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'System' }).click();
    await expect(htmlElement).toHaveClass(/dark/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="sun"]')).toHaveClass(/scale-0/, { timeout: 5000 });
    await expect(page.locator('svg[data-lucide-name="moon"]')).toHaveClass(/scale-100/, { timeout: 5000 });
  });
});