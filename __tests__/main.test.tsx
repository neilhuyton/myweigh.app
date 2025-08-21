import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '../src/trpc';
import { router } from '../src/router';
import { server } from '../__mocks__/server';
import '@testing-library/jest-dom';
import { act } from 'react';
import { useAuthStore } from '../src/store/authStore';
import { httpBatchLink } from '@trpc/client';

describe('main.tsx', () => {
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

  const setup = async (initialPath: string = '/') => {
    const mockRootElement = document.createElement('div');
    mockRootElement.id = 'root';
    document.body.appendChild(mockRootElement);

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
        </trpc.Provider>,
        { container: mockRootElement }
      );
    });

    return { history, mockRootElement };
  };

  beforeAll(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
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
    const { mockRootElement } = await setup('/');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByPlaceholderText('Enter your email for login')).toBeInTheDocument();
          expect(screen.getByPlaceholderText('Enter your password for login')).toBeInTheDocument();
          expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
          expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
          expect(screen.getByText('Weight Tracker')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    document.body.removeChild(mockRootElement);
  });
});