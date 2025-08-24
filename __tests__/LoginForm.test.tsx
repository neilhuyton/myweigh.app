import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../src/trpc';
import { useAuthStore } from '../src/store/authStore';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../__mocks__/server';
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router';
import { router } from '../src/router';
import type { AppRouter } from '../server/trpc';
import type { inferProcedureInput } from '@trpc/server';

describe('LoginForm Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:8888/.netlify/functions/trpc',
        fetch: async (input, options) =>
          fetch(input, { ...options, signal: options?.signal ?? null }),
      }),
    ],
  });

  const setup = async (initialPath = '/login') => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({ routeTree: router.routeTree, history });

    await act(async () => {
      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={testRouter} />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });

    return { history, testRouter };
  };

  const setupLoginMock = (
    email: string,
    password: string,
    success: boolean = true,
    delay: number = 200
  ) =>
    server.use(
      http.post(
        'http://localhost:8888/.netlify/functions/trpc/login',
        async ({ request }) => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          const body = await request.json() as Array<
            { id: number } & inferProcedureInput<AppRouter['login']>
          >;
          const { email: inputEmail, password: inputPassword } = body[0] || {};

          if (!inputEmail || !inputPassword) {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: 'Email and password are required',
                    code: -32603,
                    data: {
                      code: 'BAD_REQUEST',
                      httpStatus: 400,
                      path: 'login',
                    },
                  },
                },
              ],
              { status: 400 }
            );
          }

          if (success && inputEmail === email && inputPassword === password) {
            return HttpResponse.json([
              { id: 0, result: { data: { id: 'test-user-id' } } },
            ]);
          }

          return HttpResponse.json(
            [
              {
                id: 0,
                error: {
                  message: 'Invalid email or password',
                  code: -32001,
                  data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'login' },
                },
              },
            ],
            { status: 401 }
          );
        }
      )
    );

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
    process.on('unhandledRejection', (reason) => {
      if (
        reason instanceof Error &&
        (reason.message.includes('Invalid email or password') ||
          reason.message.includes('Email and password are required'))
      ) {
        return;
      }
      throw reason;
    });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null });
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
    process.removeAllListeners('unhandledRejection');
  });

  it('renders login form with email, password inputs, and submit button', async () => {
    await setup();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Login to your account' })
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
    });
  });

  it('handles successful login and updates auth state', async () => {
    setupLoginMock('testuser@example.com', 'password123', true);
    await setup();

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      await userEvent.type(emailInput, 'testuser@example.com', { delay: 10 });
      await userEvent.type(passwordInput, 'password123', { delay: 10 });
      expect(emailInput).toHaveValue('testuser@example.com');
      expect(passwordInput).toHaveValue('password123');
      const form = screen.getByTestId('login-form');
      await form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('login-message')).toBeInTheDocument();
        expect(screen.getByTestId('login-message')).toHaveTextContent(
          'Login successful!'
        );
        expect(screen.getByTestId('login-message')).toHaveClass('text-green-500');
        expect(useAuthStore.getState().isLoggedIn).toBe(true);
        expect(useAuthStore.getState().userId).toBe('test-user-id');
      },
      { timeout: 10000 }
    );
  });

  it('displays error message on invalid login credentials', async () => {
    setupLoginMock('testuser@example.com', 'password123', false);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await setup();

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      await userEvent.type(emailInput, 'wronguser@example.com', { delay: 10 });
      await userEvent.type(passwordInput, 'wrongpassword', { delay: 10 });
      expect(emailInput).toHaveValue('wronguser@example.com');
      expect(passwordInput).toHaveValue('wrongpassword');
      const form = screen.getByTestId('login-form');
      await form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('login-message')).toBeInTheDocument();
        expect(screen.getByTestId('login-message')).toHaveTextContent(
          'Login failed: Invalid email or password'
        );
        expect(screen.getByTestId('login-message')).toHaveClass('text-red-500');
        expect(useAuthStore.getState().isLoggedIn).toBe(false);
      },
      { timeout: 10000 }
    );

    vi.spyOn(console, 'error').mockRestore();
  });

  it('displays validation errors for invalid email and password', async () => {
    await setup();

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      await userEvent.type(emailInput, 'invalid-email', { delay: 10 });
      await userEvent.type(passwordInput, 'short', { delay: 10 });
      await userEvent.click(emailInput);
      await userEvent.click(passwordInput);
      await userEvent.click(document.body);
      const form = screen.getByTestId('login-form');
      await form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Password must be at least 8 characters long')
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('switches to register form when sign up link is clicked', async () => {
    const { testRouter } = await setup();

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('signup-link')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('signup-link'));
    });

    await waitFor(
      () => {
        expect(testRouter.state.location.pathname).toBe('/register');
      },
      { timeout: 5000 }
    );
  });

  it('disables login button during submission for invalid login', async () => {
    setupLoginMock('testuser@example.com', 'password123', false, 200); // Mock invalid login
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error logs

    await setup();

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).not.toHaveAttribute('disabled');
    expect(loginButton).toHaveTextContent('Login');

    // Perform form submission
    await act(async () => {
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      await userEvent.type(emailInput, 'wronguser@example.com', { delay: 10 });
      await userEvent.type(passwordInput, 'wrongpassword', { delay: 10 });
      const form = screen.getByTestId('login-form');
      await form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    // Wait for button to be disabled during submission
    await waitFor(
      () => {
        expect(loginButton).toHaveAttribute('disabled');
        expect(loginButton).toHaveTextContent('Logging in...');
      },
      { timeout: 3000, interval: 100 }
    );

    // Wait for mutation to fail and button to re-enable
    await waitFor(
      () => {
        expect(loginButton).not.toHaveAttribute('disabled');
        expect(loginButton).toHaveTextContent('Login');
        expect(screen.getByTestId('login-message')).toHaveTextContent(
          'Login failed: Invalid email or password'
        );
      },
      { timeout: 3000, interval: 100 }
    );

    vi.spyOn(console, 'error').mockRestore();
  });

  it('displays forgot password link as placeholder', async () => {
    await setup();
    await waitFor(() => {
      const forgotPasswordLink = screen.getByTestId('forgot-password-link');
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '#');
      expect(forgotPasswordLink).toHaveTextContent('Forgot your password?');
    });
  });

  it('navigates to reset password when forgot password link is clicked', async () => {
    const { testRouter } = await setup();

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('forgot-password-link'));
    });

    await waitFor(
      () => {
        expect(testRouter.state.location.pathname).toBe('/reset-password');
      },
      { timeout: 5000 }
    );
  });
});