// __tests__/VerifyEmail.test.tsx

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpLink } from '@trpc/client';
import { server } from '../__mocks__/server';
import { trpc } from '../src/trpc';
import { useAuthStore } from '../src/store/authStore';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';
import { router } from '../src/router/router';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { verifyEmailHandler } from '../__mocks__/handlers/verifyEmail';
import { mockUsers, type MockUser } from '../__mocks__/mockUsers';
import { http, HttpResponse } from 'msw';

describe('Email Verification', () => {
  let queryClient: QueryClient;
  let trpcClient: ReturnType<typeof trpc.createClient>;

  const createTestClients = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    trpcClient = trpc.createClient({
      links: [
        httpLink({
          url: 'http://localhost:8888/.netlify/functions/trpc',
          headers: () => ({
            'Content-Type': 'application/json',
          }),
        }),
      ],
    });
  };

  const setup = async (initialPath: string, token: string) => {
    const history = createMemoryHistory({
      initialEntries: [`${initialPath}?token=${token}`],
    });
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
    server.listen({ onUnhandledRequest: 'warn' });
    server.use(verifyEmailHandler);
  });

  beforeEach(() => {
    createTestClients();
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null, token: null, refreshToken: null });
    queryClient.clear();
    vi.clearAllMocks();
    mockUsers.length = 0;
    mockUsers.push(...JSON.parse(JSON.stringify(initialMockUsers)));
    cleanup();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    server.close();
  });

  const initialMockUsers: MockUser[] = JSON.parse(JSON.stringify(mockUsers));

  it('successfully verifies email with valid token', async () => {
    const validToken = '42c6b154-c097-4a71-9b34-5b28669ea467';
    await setup('/verify-email', validToken);

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByText('Email Verification')).toBeInTheDocument();
          expect(screen.getByTestId('verify-message')).toBeInTheDocument();
          expect(screen.getByTestId('verify-message')).toHaveTextContent('Email verified successfully!');
          expect(screen.getByTestId('verify-message')).toHaveClass('text-green-500');
          expect(screen.getByTestId('go-to-login-button')).toBeInTheDocument();
        },
        { timeout: 3000, interval: 100 }
      );
    });
  });

  it('displays error message for invalid or expired verification token', async () => {
    const invalidToken = '00000000-0000-0000-0000-000000000000';
    await setup('/verify-email', invalidToken);

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('verify-message')).toBeInTheDocument();
          expect(screen.getByTestId('verify-message')).toHaveTextContent('Invalid or expired verification token');
          expect(screen.getByTestId('verify-message')).toHaveClass('text-red-500');
        },
        { timeout: 3000, interval: 100 }
      );
    });
  });

  it('displays error message for already verified email', async () => {
    const token = '987fcdeb-12d3-4e5a-9876-426614174000';
    await setup('/verify-email', token);

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('verify-message')).toBeInTheDocument();
          expect(screen.getByTestId('verify-message')).toHaveTextContent('Email already verified');
          expect(screen.getByTestId('verify-message')).toHaveClass('text-red-500');
        },
        { timeout: 3000, interval: 100 }
      );
    });
  });

  it('displays verifying message during verification process', async () => {
    // Set up custom handler for this test only
    const customHandler = http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return HttpResponse.json(
        {
          result: {
            data: { message: 'Email verified successfully!' },
          },
        },
        { status: 200 }
      );
    });
    server.use(customHandler);

    const token = '42c6b154-c097-4a71-9b34-5b28669ea467';
    await setup('/verify-email', token);

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('verify-email-loading')).toBeInTheDocument();
        },
        { timeout: 1500, interval: 100 }
      );

      await waitFor(
        () => {
          expect(screen.getByTestId('verify-message')).toBeInTheDocument();
          expect(screen.getByTestId('verify-message')).toHaveTextContent('Email verified successfully!');
        },
        { timeout: 3000, interval: 100 }
      );
    });

    // Reset handlers after test to avoid interference
    server.resetHandlers();
    server.use(verifyEmailHandler);
  });
});