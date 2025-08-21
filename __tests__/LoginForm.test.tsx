// __tests__/LoginForm.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { http, HttpResponse } from 'msw';
import { server } from '../__mocks__/server';
import { trpc } from '../src/trpc';
import { useAuthStore } from '../src/store/authStore';
import LoginForm from '../src/components/LoginForm';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

describe('LoginForm Component', () => {
  const setup = (onSwitchToRegister = vi.fn()) => {
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
          fetch: async (url, options) => {
            return fetch(url, { ...options, signal: null });
          },
        }),
      ],
    });

    render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <LoginForm onSwitchToRegister={onSwitchToRegister} />
        </QueryClientProvider>
      </trpc.Provider>
    );

    return { queryClient, onSwitchToRegister };
  };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });
  afterAll(() => server.close());

  it.only('renders login form with email, password inputs, and submit button', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Login to your account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('handles successful login and updates auth state', async () => {
    const loginMock = vi.fn((userId: string) => {
      useAuthStore.setState({ isLoggedIn: true, userId });
    });
    useAuthStore.setState({ login: loginMock });

    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/:procedure', async ({ request, params }) => {
        const body = (await request.json()) as { [key: string]: { id?: number; email: string; password: string } };
        const input = body['0'];
        const id = input?.id ?? 0;
        if (
          params.procedure === 'login' &&
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
      })
    );

    setup();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'testuser@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(
      () => {
        expect(screen.getByText('Login successful!')).toBeInTheDocument();
        expect(useAuthStore.getState().isLoggedIn).toBe(true);
        expect(loginMock).toHaveBeenCalledWith('test-user-id');
      },
      { timeout: 2000 }
    );
  });

  it('displays error message on invalid login credentials', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/:procedure', async ({ request, params }) => {
        const body = (await request.json()) as { [key: string]: { id?: number; email: string; password: string } };
        const input = body['0'];
        const id = input?.id ?? 0;
        if (params.procedure === 'login') {
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
                data: { code: 'NOT_FOUND', httpStatus: 404, path: 'login' },
              },
            },
          ],
          { status: 404 }
        );
      })
    );

    setup();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'wronguser@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(
      () => {
        expect(screen.getByText(/Login failed:.*Invalid email or password/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('displays validation errors for invalid email and password', async () => {
    setup();
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('switches to register form when sign up button is clicked', () => {
    const { onSwitchToRegister } = setup();
    fireEvent.click(screen.getByRole('link', { name: 'Sign up' }));
    expect(onSwitchToRegister).toHaveBeenCalled();
  });
});