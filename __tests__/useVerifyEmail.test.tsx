// __tests__/useVerifyEmail.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../__mocks__/server';
import { useVerifyEmail } from '@/hooks/useVerifyEmail';
import { useSearch } from '@tanstack/react-router';
import { trpc } from '../src/trpc';
import { httpBatchLink } from '@trpc/client';
import { useAuthStore } from '@/store/authStore';

vi.mock('@tanstack/react-router', () => ({
  useSearch: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      userId: null,
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
    })),
  },
}));

function TestComponent() {
  const { message, isVerifying } = useVerifyEmail();
  return (
    <div>
      <span data-testid="message">{message}</span>
      <span data-testid="is-verifying">{isVerifying ? 'true' : 'false'}</span>
    </div>
  );
}

describe('useVerifyEmail Hook', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <trpc.Provider
      client={trpc.createClient({
        links: [
          httpBatchLink({
            url: 'http://localhost:8888/.netlify/functions/trpc',
            fetch: async (url, options) => {
              const { userId } = useAuthStore.getState();
              const headers = {
                ...options?.headers,
                ...(userId ? { Authorization: `Bearer ${userId}` } : {}),
              };
              const fetchOptions = {
                ...options,
                headers,
                signal: undefined,
              };
              return fetch(url, fetchOptions);
            },
          }),
        ],
      })}
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    server.close();
  });

  it('verifies email successfully with valid token', async () => {
    vi.mocked(useSearch).mockReturnValue({ token: 'valid-token' });

    render(<TestComponent />, { wrapper });

    await waitFor(
      () => {
        expect(screen.getByTestId('is-verifying').textContent).toBe('false');
        expect(screen.getByTestId('message').textContent).toBe('Email verified successfully');
      },
      { timeout: 5000 }
    );
  });

  it('handles invalid token with error message', async () => {
    vi.mocked(useSearch).mockReturnValue({ token: 'invalid-token' });

    render(<TestComponent />, { wrapper });

    await waitFor(
      () => {
        expect(screen.getByTestId('is-verifying').textContent).toBe('false');
        expect(screen.getByTestId('message').textContent).toBe('Verification failed: Invalid or expired token');
      },
      { timeout: 5000 }
    );
  });

  it('handles missing token', async () => {
    vi.mocked(useSearch).mockReturnValue({ token: undefined });

    render(<TestComponent />, { wrapper });

    await waitFor(
      () => {
        expect(screen.getByTestId('is-verifying').textContent).toBe('false');
        expect(screen.getByTestId('message').textContent).toBe('No verification token provided');
      },
      { timeout: 5000 }
    );
  });
});