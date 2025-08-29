// __tests__/useVerifyEmail.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../src/trpc';
import { server } from '../__mocks__/server';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router';
import { router } from '../src/router/router';
import { verifyEmailHandler } from '../__mocks__/handlers/verifyEmail';

describe('useVerifyEmail Hook', () => {
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
          fetch(input, { ...options }),
      }),
    ],
  });

  const setup = (initialPath = '/verify-email', search = {}) => {
    const queryString = new URLSearchParams(search).toString();
    const initialEntry = queryString ? `${initialPath}?${queryString}` : initialPath;
    const history = createMemoryHistory({ initialEntries: [initialEntry] });
    const testRouter = createRouter({
      routeTree: router.routeTree,
      history,
    });

    act(() => {
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
    server.use(verifyEmailHandler); // Use the external verifyEmail handler
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  it('verifies email successfully with valid token', async () => {
    setup('/verify-email', { token: '42c6b154-c097-4a71-9b34-5b28669ea467' });

    await waitFor(
      () => {
        expect(screen.getByTestId('is-verifying').textContent).toBe('false');
        expect(screen.getByTestId('message').textContent).toBe('Email verified successfully!');
      },
      { timeout: 5000 }
    );
  });

  it('handles invalid token with error message', async () => {
    setup('/verify-email', { token: 'invalid-token' });

    await waitFor(
      () => {
        expect(screen.getByTestId('is-verifying').textContent).toBe('false');
        expect(screen.getByTestId('message').textContent).toBe('Verification failed: Invalid or expired verification token');
      },
      { timeout: 5000 }
    );
  });

  it('handles missing token', async () => {
    setup('/verify-email', { token: undefined });

    await waitFor(
      () => {
        expect(screen.getByTestId('is-verifying').textContent).toBe('false');
        expect(screen.getByTestId('message').textContent).toBe('No verification token provided');
      },
      { timeout: 5000 }
    );
  });
});