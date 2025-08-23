import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../src/trpc';
import { router } from '../src/router';
import { server } from '../__mocks__/server';
import '@testing-library/jest-dom';
import { http, HttpResponse } from 'msw';
import { act } from 'react';
import { useAuthStore } from '../src/store/authStore';
import { vi } from 'vitest';

describe('Home Component with Router', () => {
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
        fetch: async (input: RequestInfo | URL, options?: RequestInit) => {
          return fetch(input, { ...options, signal: options?.signal ?? null });
        },
      }),
    ],
  });

  const setup = async (initialPath: string) => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      ...router.options,
      history,
      routeTree: router.routeTree,
    });
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
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false });
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    server.close();
  });

  it('renders login form by default on home route', async () => {
    await setup('/');

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
        expect(screen.getByTestId('signup-link')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('switches to register form when sign up is clicked', async () => {
    await setup('/');

    await waitFor(() => {
      expect(screen.getByTestId('signup-link')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('signup-link'));
    });

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
        expect(screen.getByTestId('login-link')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('handles user registration on home route', async () => {
    server.use(
      http.post(
        'http://localhost:8888/.netlify/functions/trpc/*',
        async ({ request, params }) => {
          const body = (await request.json()) as {
            [key: string]: { id?: number; email: string; password: string };
          };
          const input = body['0'];
          const id = input?.id ?? 0;
          if (params[0] === 'register' && input?.email === 'newuser@example.com') {
            return HttpResponse.json([
              {
                id,
                result: {
                  data: {
                    id: 'new-user-id',
                    email: 'newuser@example.com',
                    message: 'Registration successful! Please check your email to verify your account.',
                  },
                },
              },
            ]);
          }
          return HttpResponse.json(
            [
              {
                id,
                error: {
                  message: 'Procedure not found',
                  code: -32601,
                  data: { code: 'NOT_FOUND', httpStatus: 404, path: params[0] },
                },
              },
            ],
            { status: 404 }
          );
        }
      )
    );

    await setup('/');

    await waitFor(() => {
      expect(screen.getByTestId('signup-link')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('signup-link'));
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
        target: { value: 'newuser@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('register-message')).toBeInTheDocument();
        expect(screen.getByTestId('register-message')).toHaveTextContent(
          'Registration successful! Please check your email to verify your account.'
        );
        expect(screen.getByTestId('login-link')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Simulate clicking the "Log in" link to switch to the login form
    await act(async () => {
      fireEvent.click(screen.getByTestId('login-link'));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('handles successful login on home route', async () => {
    server.use(
      http.post(
        'http://localhost:8888/.netlify/functions/trpc/*',
        async ({ request, params }) => {
          const body = (await request.json()) as {
            [key: string]: { id?: number; email: string; password: string };
          };
          const input = body['0'];
          const id = input?.id ?? 0;
          if (
            params[0] === 'login' &&
            input?.email === 'testuser@example.com' &&
            input?.password === 'password123'
          ) {
            return HttpResponse.json([
              {
                id,
                result: {
                  data: { id: 'test-user-id', email: 'testuser@example.com' },
                },
              },
            ]);
          }
          return HttpResponse.json(
            [
              {
                id,
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

    await setup('/');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
        target: { value: 'testuser@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('login-message')).toBeInTheDocument();
        expect(screen.getByTestId('login-message')).toHaveTextContent('Login successful!');
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(useAuthStore.getState().isLoggedIn).toBe(true);
        expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles invalid login credentials on home route', async () => {
    server.use(
      http.post(
        'http://localhost:8888/.netlify/functions/trpc/*',
        async ({ request, params }) => {
          const body = (await request.json()) as {
            [key: string]: { id?: number; email: string; password: string };
          };
          const input = body['0'];
          const id = input?.id ?? 0;
          if (params[0] === 'login') {
            return HttpResponse.json(
              [
                {
                  id,
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
          return HttpResponse.json(
            [
              {
                id,
                error: {
                  message: 'Procedure not found',
                  code: -32601,
                  data: { code: 'NOT_FOUND', httpStatus: 404, path: params[0] },
                },
              },
            ],
            { status: 404 }
          );
        }
      )
    );

    await setup('/');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
        target: { value: 'wronguser@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('login-message')).toBeInTheDocument();
        expect(screen.getByTestId('login-message')).toHaveTextContent('Invalid email or password');
      },
      { timeout: 3000 }
    );
  });
});