// __tests__/LoginForm.test.tsx
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpcClient } from '../src/client';
import { trpc } from '../src/trpc';
import { useAuthStore } from '../src/store/authStore';
import '@testing-library/jest-dom';
import { server } from '../__mocks__/server';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { router } from '../src/router/router';
import {
  loginHandler,
  refreshTokenHandler,
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
} from '../__mocks__/handlers';

describe('LoginForm Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
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

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
    vi.mock('jwt-decode', () => ({
      jwtDecode: vi.fn((token) => {
        if (
          token ===
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSJ9.dummy-signature'
        ) {
          return { userId: 'test-user-1' };
        }
        throw new Error('Invalid token');
      }),
    }));
    process.on('unhandledRejection', (reason) => {
      if (
        reason instanceof Error &&
        reason.message.includes('Invalid email or password')
      ) {
        return;
      }
      throw reason;
    });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null, token: null, refreshToken: null });
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
    server.use(
      loginHandler,
      refreshTokenHandler,
      weightGetWeightsHandler,
      weightGetCurrentGoalHandler
    );
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
        expect(useAuthStore.getState().isLoggedIn).toBe(true);
        expect(useAuthStore.getState().userId).toBe('test-user-1');
      },
      { timeout: 2000 }
    );
  });

  it('displays error message on invalid login credentials', async () => {
    server.use(loginHandler);
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
      { timeout: 2000 }
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
      { timeout: 2000 }
    );
  });

  it('disables login button during submission for invalid login', async () => {
    server.use(loginHandler);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await setup();

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).not.toHaveAttribute('disabled');
    expect(loginButton).toHaveTextContent('Login');

    await act(async () => {
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      await userEvent.type(emailInput, 'wronguser@example.com', { delay: 10 });
      await userEvent.type(passwordInput, 'wrongpassword', { delay: 10 });
      const form = screen.getByTestId('login-form');
      await form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(loginButton).toHaveAttribute('disabled');
        expect(loginButton).toHaveTextContent('Logging in...');
      },
      { timeout: 2000, interval: 100 }
    );

    await waitFor(
      () => {
        expect(loginButton).not.toHaveAttribute('disabled');
        expect(loginButton).toHaveTextContent('Login');
        expect(screen.getByTestId('login-message')).toHaveTextContent(
          'Login failed: Invalid email or password'
        );
      },
      { timeout: 2000, interval: 100 }
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
});