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
import { useAuthStore } from '../src/store/authStore';

describe('WeightList Component', () => {
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
          return fetch(url, { ...options, signal: options?.signal ?? null });
        },
      }),
    ],
  });

  const setup = async (initialPath: string = '/weights') => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      ...router.options,
      history,
      routeTree: router.routeTree,
    });

    render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>
      </trpc.Provider>
    );

    return { history };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null });
    queryClient.clear();
  });

  afterAll(() => {
    server.close();
  });

  it('displays weight measurements in a table when logged in', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'test-user-id' });

    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', () => {
        return HttpResponse.json([
          {
            result: {
              data: [
                { id: '1', weightKg: 70.5, note: 'Morning weigh-in', createdAt: '2025-08-20T10:00:00Z' },
                { id: '2', weightKg: 71.0, note: 'Evening weigh-in', createdAt: '2025-08-19T18:00:00Z' },
              ],
            },
          },
        ]);
      })
    );

    await setup('/weights');

    await waitFor(
      () => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
        expect(screen.getByText('Note')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('70.5')).toBeInTheDocument();
        expect(screen.getByText('Morning weigh-in')).toBeInTheDocument();
        expect(screen.getByText('71')).toBeInTheDocument();
        expect(screen.getByText('Evening weigh-in')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('redirects to home when not logged in', async () => {
    const { history } = await setup('/weights');

    await waitFor(
      () => {
        expect(history.location.pathname).toBe('/');
                expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('deletes a weight measurement when delete button is clicked', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'test-user-id' });

    let weights = [
      { id: '1', weightKg: 70.5, note: 'Morning weigh-in', createdAt: '2025-08-20T10:00:00Z' },
      { id: '2', weightKg: 71.0, note: 'Evening weigh-in', createdAt: '2025-08-19T18:00:00Z' },
    ];

    let getWeightsCallCount = 0;

    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', () => {
        getWeightsCallCount += 1;
        return HttpResponse.json([
          {
            result: { data: weights },
          },
        ]);
      }),
      http.post('http://localhost:8888/.netlify/functions/trpc/weight.delete', async ({ request }) => {
        const headers = Object.fromEntries(request.headers.entries());
        const body = (await request.json()) as { [key: string]: { id?: number; weightId: string } };
        const input = body['0'];
        if (headers['authorization'] !== 'Bearer test-user-id') {
          return HttpResponse.json(
            [
              {
                id: input?.id ?? 0,
                error: {
                  message: 'Unauthorized: User must be logged in',
                  code: -32001,
                  data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.delete' },
                },
              },
            ],
            { status: 401 }
          );
        }
        if (input?.weightId === '1') {
          weights = weights.filter((w) => w.id !== '1');
          return HttpResponse.json([
            {
              id: input?.id ?? 0,
              result: {
                data: { id: '1' },
              },
            },
          ]);
        }
        return HttpResponse.json(
          [
            {
              id: input?.id ?? 0,
              error: {
                message: 'Weight measurement not found',
                code: -32001,
                data: { code: 'NOT_FOUND', httpStatus: 404, path: 'weight.delete' },
              },
            },
          ],
          { status: 404 }
        );
      })
    );

    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    await setup('/weights');

    await waitFor(
      () => {
        expect(screen.getByText('70.5')).toBeInTheDocument();
        expect(screen.getByText('Morning weigh-in')).toBeInTheDocument();
        expect(screen.getByText('71')).toBeInTheDocument();
        expect(screen.getByText('Evening weigh-in')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Delete weight measurement from 20\/08\/2025/i })).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const deleteButton = screen.getByRole('button', { name: /Delete weight measurement from 20\/08\/2025/i });
    fireEvent.click(deleteButton);

    await waitFor(
      () => {
        expect(getWeightsCallCount).toBeGreaterThan(1); // Ensure refetch happened
        expect(screen.queryByText('70.5')).not.toBeInTheDocument();
        expect(screen.queryByText('Morning weigh-in')).not.toBeInTheDocument();
        expect(screen.getByText('71')).toBeInTheDocument();
        expect(screen.getByText('Evening weigh-in')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});