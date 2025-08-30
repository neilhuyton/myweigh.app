import { test, expect } from '@playwright/test';

test.describe('Weight Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Log browser console messages
    page.on('console', (msg) => {
      console.log(`Browser console: ${msg.type()} - ${msg.text()}`);
    });

    // Log all intercepted requests and responses
    page.on('request', (request) => {
      console.log(`Request sent: ${request.method()} ${request.url()}`);
    });
    page.on('response', async (response) => {
      console.log(`Response received: ${response.status()} ${response.url()}`);
      if (response.url().includes('trpc')) {
        try {
          const body = await response.json();
          console.log(`tRPC response body: ${JSON.stringify(body, null, 2)}`);
        } catch (e) {
          console.log(`Failed to parse tRPC response for ${response.url()}:`, e);
        }
      }
    });

    // Route handler to avoid mocking critical assets
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const headers = await route.request().allHeaders();
      const postData = await route.request().postData();
      console.log(`Intercepted request: ${method} ${url}`, { headers, postData });
      // Avoid mocking critical assets
      if (
        url.includes('localhost:5173') &&
        method === 'GET' &&
        !url.includes('/login') &&
        !url.includes('/weight') &&
        !url.includes('/@vite/client') &&
        !url.includes('/src/main.tsx') &&
        !url.includes('/@react-refresh') &&
        !url.includes('/node_modules/.vite/deps/') &&
        !url.includes('/src/router/router.tsx') &&
        !url.includes('/src/index.css') &&
        !url.includes('/vite/dist/client/env.mjs') &&
        !url.includes('/src/components/Root.tsx') &&
        !url.includes('/src/client.ts') &&
        !url.includes('/src/router/routes.ts') &&
        !url.includes('/node_modules/.vite/deps/chunk-')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: '// Mocked response',
        });
      } else {
        await route.continue();
      }
    });

    // Mock the tRPC login request
    await page.route('**/trpc/login**', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postData();
        console.log('login request body:', requestBody);
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
                  token: 'mock-token',
                  refreshToken: 'mock-refresh-token',
                },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to the login page
    await page.goto('http://localhost:5173/login', { timeout: 30000 });
    console.log('Page HTML after navigating to login:', await page.content());

    // Wait for the login form to render
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        const hasContent = root?.innerHTML !== '';
        console.log(`Root div has content: ${hasContent}`);
        return hasContent;
      },
      { timeout: 30000 }
    );
    console.log('Page HTML after root populated:', await page.content());

    // Verify login form is visible
    const emailInput = page
      .getByPlaceholder('m@example.com')
      .or(page.getByLabel(/email/i))
      .or(page.getByRole('textbox', { name: /email/i }));
    await expect(emailInput, 'Email input should be visible').toBeVisible({ timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await emailInput.fill('testuser@example.com');

    const passwordInput = page
      .getByPlaceholder('Enter your password')
      .or(page.getByLabel(/password/i))
      .or(page.getByRole('textbox', { name: /password/i }));
    await expect(passwordInput, 'Password input should be visible').toBeVisible({ timeout: 30000 });
    await passwordInput.fill('password123');

    // Perform login
    await Promise.all([
      page.waitForResponse(
        (resp) => {
          const matches = resp.url().includes('trpc/login') && resp.status() === 200;
          console.log(`waitForResponse (login): ${resp.url()} - Status: ${resp.status()} - Matches: ${matches}`);
          return matches;
        },
        { timeout: 30000 }
      ),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    // Verify token is set
    const token = await page.evaluate(() => localStorage.getItem('token') || document.cookie);
    console.log(`Stored token after login: ${token}`);

    // Wait for notifications to disappear
    await page
      .getByLabel('Notifications alt+T')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});
  });

  test('should record weight successfully for user', async ({ page }) => {
    // Log tRPC responses
    page.on('response', async (resp) => {
      if (resp.url().includes('trpc')) {
        try {
          const body = await resp.json();
          console.log(`Response for ${resp.url()}:`, JSON.stringify(body, null, 2));
        } catch (e) {
          console.log(`Failed to parse response for ${resp.url()}:`, e);
        }
      }
    });

    // Mock the tRPC weight.create request
    await page.route('**/trpc/weight.create**', async (route) => {
      if (route.request().method() === 'POST') {
        const headers = await route.request().allHeaders();
        const body = await route.request().postData();
        console.log(`tRPC weight.create request intercepted: ${route.request().url()}`, { headers, body });
        if (headers['authorization'] !== 'Bearer mock-token') {
          console.log('Unauthorized: Invalid token');
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
                  data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.create' },
                },
              },
            ]),
          });
        } else {
          const input = JSON.parse(body || '{}')['0'];
          if (!input?.weightKg || input.weightKg <= 0) {
            console.log('Invalid input: Weight must be positive');
            await route.fulfill({
              status: 400,
              contentType: 'application/json',
              headers: {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Credentials': 'true',
              },
              body: JSON.stringify([
                {
                  id: 0,
                  error: {
                    message: 'Weight must be a positive number',
                    code: -32001,
                    data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.create' },
                  },
                },
              ]),
            });
          } else {
            console.log('Valid weight.create response');
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
                      id: 'weight-id-123',
                      weightKg: input.weightKg,
                      note: input.note || null,
                      createdAt: new Date().toISOString(),
                    },
                  },
                },
              ]),
            });
          }
        }
      } else {
        console.log(`Non-POST tRPC request: ${route.request().method()} ${route.request().url()}`);
        await route.continue();
      }
    });

    // Navigate to the weight form
    await page.goto('http://localhost:5173/weight', { timeout: 30000 });
    await page.waitForURL(/.*\/weight/, { timeout: 30000 });
    console.log('Page HTML after navigating to weight:', await page.content());
    await expect(page.getByText('A list of your recent weight measurements'), 'Weight measurements text should be visible').toBeVisible({ timeout: 30000 });

    // Fill in the weight form
    await page.getByPlaceholder('Enter your weight (kg)').fill('70.5');
    await page.getByPlaceholder('Optional note').fill('Morning weigh-in');
    await expect(page.getByPlaceholder('Enter your weight (kg)')).toHaveValue('70.5');
    await expect(page.getByPlaceholder('Optional note')).toHaveValue('Morning weigh-in');

    // Set up waitForResponse before clicking submit
    const createResponsePromise = page.waitForResponse(
      (resp) => {
        const matches = resp.url().includes('trpc') && resp.status() === 200 && resp.url().includes('weight.create');
        console.log(`waitForResponse (weight.create): ${resp.url()} - Status: ${resp.status()} - Matches: ${matches}`);
        return matches;
      },
      { timeout: 30000 }
    );

    // Submit the form
    await page.getByRole('button', { name: 'Submit Weight' }).click();
    await createResponsePromise;

    // Verify success
    console.log('Page HTML after form submission:', await page.content());
    await expect(page.getByText('Weight recorded successfully!'), 'Success message should be visible').toBeVisible({ timeout: 30000 });
    await expect(page.getByPlaceholder('Enter your weight (kg)')).toHaveValue('');
    await expect(page.getByPlaceholder('Optional note')).toHaveValue('');
  });

  test('should display error for invalid weight', async ({ page }) => {
    // Log tRPC responses
    page.on('response', async (resp) => {
      if (resp.url().includes('trpc')) {
        try {
          const body = await resp.json();
          console.log(`Response for ${resp.url()}:`, JSON.stringify(body, null, 2));
        } catch (e) {
          console.log(`Failed to parse response for ${resp.url()}:`, e);
        }
      }
    });

    // Mock the tRPC weight.create request for invalid input
    await page.route('**/trpc/weight.create**', async (route) => {
      if (route.request().method() === 'POST') {
        const headers = await route.request().allHeaders();
        const body = await route.request().postData();
        console.log(`tRPC weight.create request intercepted: ${route.request().url()}`, { headers, body });
        if (headers['authorization'] !== 'Bearer mock-token') {
          console.log('Unauthorized: Invalid token');
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
                  data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.create' },
                },
              },
            ]),
          });
        } else {
          const input = JSON.parse(body || '{}')['0'];
          if (!input?.weightKg || input.weightKg <= 0) {
            console.log('Invalid input: Weight must be positive');
            await route.fulfill({
              status: 400,
              contentType: 'application/json',
              headers: {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Credentials': 'true',
              },
              body: JSON.stringify([
                {
                  id: 0,
                  error: {
                    message: 'Weight must be a positive number',
                    code: -32001,
                    data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.create' },
                  },
                },
              ]),
            });
          } else {
            console.log('Valid weight.create response');
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
                      id: 'weight-id-123',
                      weightKg: input.weightKg,
                      note: input.note || null,
                      createdAt: new Date().toISOString(),
                    },
                  },
                },
              ]),
            });
          }
        }
      } else {
        console.log(`Non-POST tRPC request: ${route.request().method()} ${route.request().url()}`);
        await route.continue();
      }
    });

    // Navigate to the weight form
    await page.goto('http://localhost:5173/weight', { timeout: 30000 });
    await page.waitForURL(/.*\/weight/, { timeout: 30000 });
    console.log('Page HTML after navigating to weight:', await page.content());
    await expect(page.getByText('A list of your recent weight measurements'), 'Weight measurements text should be visible').toBeVisible({ timeout: 30000 });

    // Fill in the weight form with invalid input
    await page.getByPlaceholder('Enter your weight (kg)').fill('0');
    await expect(page.getByPlaceholder('Enter your weight (kg)')).toHaveValue('0');

    // Set up waitForResponse before clicking submit
    const createResponsePromise = page.waitForResponse(
      (resp) => {
        const matches = resp.url().includes('trpc') && resp.status() === 400 && resp.url().includes('weight.create');
        console.log(`waitForResponse (weight.create): ${resp.url()} - Status: ${resp.status()} - Matches: ${matches}`);
        return matches;
      },
      { timeout: 30000 }
    );

    // Submit the form
    await page.getByRole('button', { name: 'Submit Weight' }).click();
    await createResponsePromise;

    // Verify error message
    console.log('Page HTML after form submission:', await page.content());
    await expect(page.getByText('Please enter a valid weight.'), 'Error message should be visible').toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Weight recorded successfully!')).not.toBeVisible({ timeout: 30000 });
  });
});