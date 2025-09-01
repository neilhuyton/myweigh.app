// e2e/theme-toggle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Functionality', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      await page.screenshot({ path: `test-results/failure-screenshot-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png` });
    }
  });

  test('should display theme toggle only when logged in and toggle themes', async ({ page }) => {
    // Log console messages for debugging
    page.on('console', (msg) => console.log(`Browser console: ${msg.text()}`));

    // Mock the login API response
    await page.route('**/trpc/login**', (route) => {
      console.log('Mock intercepted:', route.request().url());
      console.log('Request body:', route.request().postData());
      return route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          result: {
            data: {
              id: 'test-user-1',
              email: 'test@example.com',
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc1NjcyNTIwMCwiZXhwIjoxNzU5MzE3MjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
              refreshToken: 'mock-refresh-token',
            },
          },
        }]),
      });
    });

    // Mock the weight-related API responses
    await page.route('**/trpc/weight.getCurrentGoal,weight.getWeights**', (route) => {
      console.log('Mock intercepted:', route.request().url());
      console.log('Request body:', route.request().postData());
      return route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            result: {
              data: {
                id: 'goal-1',
                targetWeight: 70,
                createdAt: '2025-09-01T00:00:00Z',
              },
            },
          },
          {
            result: {
              data: [
                { id: 'weight-1', weight: 75, date: '2025-09-01', userId: 'test-user-1' },
              ],
            },
          },
        ]),
      });
    });

    // Navigate to the login page
    await page.goto('http://localhost:5173/login');

    // Simulate login
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password');
    await page.getByTestId('login-button').click();

    // Log URL and content before waiting
    console.log('URL before wait:', await page.url());
    console.log('Page content:', await page.content());

    // Wait for navigation to /weight
    await page.waitForURL('**/weight', { timeout: 20000 });

    // Log URL and content after navigation
    console.log('URL after wait:', await page.url());
    console.log('Page content after navigation:', await page.content());

    // Verify header and theme toggle
    await expect(page.getByTestId('header')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('profile-icon')).toBeVisible({ timeout: 20000 });
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' }).first();
    await expect(themeToggle).toBeVisible({ timeout: 20000 });

    // Test theme toggle functionality
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/); // Assuming default is dark

    // Open the dropdown and select "Light"
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'Light' }).click();
    await page.waitForTimeout(1000); // Wait for theme transition
    const theme = await page.evaluate(() => localStorage.getItem('vite-ui-theme'));
    console.log('Theme after toggle to light:', theme);
    await expect(htmlElement).not.toHaveClass(/dark/, { timeout: 5000 }); // Should be light

    // Open the dropdown and select "Dark"
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();
    await page.waitForTimeout(1000); // Wait for theme transition
    console.log('Theme after toggle to dark:', await page.evaluate(() => localStorage.getItem('vite-ui-theme')));
    await expect(htmlElement).toHaveClass(/dark/, { timeout: 5000 }); // Should be dark
  });
});