// __tests__/WeightChart.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { http, HttpResponse } from 'msw';
import { server } from '../__mocks__/server';
import { trpc } from '../src/trpc';
import { router } from '../src/router';
import { useAuthStore } from '../src/store/authStore';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(({ data, options }) => (
    <div
      data-testid="chart-mock"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
    >
      Mocked Chart
    </div>
  )),
}));

describe('WeightChart Component', () => {
  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0, gcTime: 0 },
        mutations: { retry: false },
      },
    });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:8888/.netlify/functions/trpc',
        fetch: async (url, options) =>
          fetch(url, { ...options, signal: options?.signal ?? null }),
      }),
    ],
  });

  const setup = async (initialPath: string = '/weight-chart') => {
    const queryClient = createTestQueryClient();
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

    return { history, queryClient };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    server.restoreHandlers();
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
    cleanup();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  it('displays loading message while fetching weights', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased delay
          return HttpResponse.json([{ id: 0, result: { data: [] } }]);
        }
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await waitFor(
      () => {
        expect(screen.getByTestId('loading')).toBeInTheDocument();
      },
      { timeout: 2500 }
    );

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
          expect(screen.getByTestId('no-data')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('displays weight chart with measurements sorted by date when logged in', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () =>
          HttpResponse.json([
            {
              id: 0,
              result: {
                data: [
                  {
                    id: '1',
                    weightKg: 70.5,
                    note: 'Morning weigh-in',
                    createdAt: '2025-08-20T10:00:00Z',
                    userId: 'test-user-id',
                  },
                  {
                    id: '2',
                    weightKg: 71.0,
                    note: 'Evening weigh-in',
                    createdAt: '2025-08-19T18:00:00Z',
                    userId: 'test-user-id',
                  },
                ],
              },
            },
          ])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByRole('heading', { name: 'Weight Chart' })).toBeInTheDocument();
          expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
          const chartElement = screen.getByTestId('chart-mock');
          const chartData = JSON.parse(
            chartElement.getAttribute('data-chart-data') || '{}'
          );
          expect(chartData.datasets[0].data).toEqual([
            { x: '2025-08-19T18:00:00Z', y: 71, note: 'Evening weigh-in' },
            { x: '2025-08-20T10:00:00Z', y: 70.5, note: 'Morning weigh-in' },
          ]);
          const dataPoints = screen.getAllByTestId('weight-data-point');
          expect(dataPoints).toHaveLength(2);
          expect(dataPoints[0]).toHaveTextContent(
            '71 kg - 19/08/2025 (Evening weigh-in)'
          );
          expect(dataPoints[1]).toHaveTextContent(
            '70.5 kg - 20/08/2025 (Morning weigh-in)'
          );
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('redirects to home when not logged in', async () => {
    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('email-input')).toBeInTheDocument();
          expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('displays error message when weight fetch fails', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () =>
          HttpResponse.json(
            [
              {
                id: 0,
                error: {
                  message: 'Failed to fetch weights',
                  code: -32603,
                  data: {
                    code: 'INTERNAL_SERVER_ERROR',
                    httpStatus: 500,
                    path: 'weight.getWeights',
                  },
                },
              },
            ],
            { status: 500 }
          )
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('error')).toHaveTextContent('Error: Failed to fetch weights');
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('displays no measurements message when weights array is empty', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () => HttpResponse.json([{ id: 0, result: { data: [] } }])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('unit-select')).toBeInTheDocument();
          expect(screen.getByTestId('unit-select')).toHaveTextContent('Daily');
          expect(screen.getByTestId('no-data')).toBeInTheDocument();
          expect(screen.queryByTestId('chart-mock')).not.toBeInTheDocument();
          expect(screen.queryAllByTestId('weight-data-point')).toHaveLength(0);
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('renders weight data with correct tooltip content in DOM', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () =>
          HttpResponse.json([
            {
              id: 0,
              result: {
                data: [
                  {
                    id: '1',
                    weightKg: 70.5,
                    note: 'Morning weigh-in',
                    createdAt: '2025-08-20T10:00:00Z',
                    userId: 'test-user-id',
                  },
                  {
                    id: '2',
                    weightKg: 71.0,
                    note: null,
                    createdAt: '2025-08-19T18:00:00Z',
                    userId: 'test-user-id',
                  },
                ],
              },
            },
          ])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
          const chartElement = screen.getByTestId('chart-mock');
          const chartData = JSON.parse(
            chartElement.getAttribute('data-chart-data') || '{}'
          );
          expect(chartData.datasets[0].data).toEqual([
            { x: '2025-08-19T18:00:00Z', y: 71, note: null },
            { x: '2025-08-20T10:00:00Z', y: 70.5, note: 'Morning weigh-in' },
          ]);
          const dataPoints = screen.getAllByTestId('weight-data-point');
          expect(dataPoints).toHaveLength(2);
          expect(dataPoints[0]).toHaveTextContent('71 kg - 19/08/2025');
          expect(dataPoints[1]).toHaveTextContent('70.5 kg - 20/08/2025 (Morning weigh-in)');
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('configures chart with correct options', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () =>
          HttpResponse.json([
            {
              id: 0,
              result: {
                data: [
                  {
                    id: '1',
                    weightKg: 70.5,
                    note: 'Morning weigh-in',
                    createdAt: '2025-08-20T10:00:00Z',
                    userId: 'test-user-id',
                  },
                ],
              },
            },
          ])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
          const chartElement = screen.getByTestId('chart-mock');
          const chartOptions = JSON.parse(
            chartElement.getAttribute('data-chart-options') || '{}'
          );
          expect(chartOptions).toMatchObject({
            responsive: true,
            scales: {
              x: {
                type: 'time',
                time: { unit: 'day' },
                title: { display: true, text: 'Date' },
              },
              y: {
                title: { display: true, text: 'Weight (kg)' },
                beginAtZero: false,
              },
            },
            plugins: {
              legend: { display: true },
              tooltip: { callbacks: expect.any(Object) },
            },
          });
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('handles weights with identical timestamps', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () =>
          HttpResponse.json([
            {
              id: 0,
              result: {
                data: [
                  {
                    id: '1',
                    weightKg: 70.5,
                    note: 'First weigh-in',
                    createdAt: '2025-08-20T10:00:00Z',
                    userId: 'test-user-id',
                  },
                  {
                    id: '2',
                    weightKg: 71.0,
                    note: 'Second weigh-in',
                    createdAt: '2025-08-20T10:00:00Z',
                    userId: 'test-user-id',
                  },
                ],
              },
            },
          ])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
          const chartElement = screen.getByTestId('chart-mock');
          const chartData = JSON.parse(
            chartElement.getAttribute('data-chart-data') || '{}'
          );
          expect(chartData.datasets[0].data).toEqual([
            { x: '2025-08-20T10:00:00Z', y: 70.5, note: 'First weigh-in' },
            { x: '2025-08-20T10:00:00Z', y: 71, note: 'Second weigh-in' },
          ]);
          const dataPoints = screen.getAllByTestId('weight-data-point');
          expect(dataPoints).toHaveLength(2);
          expect(dataPoints[0]).toHaveTextContent(
            '70.5 kg - 20/08/2025 (First weigh-in)'
          );
          expect(dataPoints[1]).toHaveTextContent(
            '71 kg - 20/08/2025 (Second weigh-in)'
          );
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('handles invalid createdAt dates', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () =>
          HttpResponse.json([
            {
              id: 0,
              result: {
                data: [
                  {
                    id: '1',
                    weightKg: 70.5,
                    note: 'Morning weigh-in',
                    createdAt: 'invalid-date',
                    userId: 'test-user-id',
                  },
                  {
                    id: '2',
                    weightKg: 71.0,
                    note: 'Evening weigh-in',
                    createdAt: '2025-08-19T18:00:00Z',
                    userId: 'test-user-id',
                  },
                ],
              },
            },
          ])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
          const chartElement = screen.getByTestId('chart-mock');
          const chartData = JSON.parse(
            chartElement.getAttribute('data-chart-data') || '{}'
          );
          expect(chartData.datasets[0].data).toEqual([
            { x: '2025-08-19T18:00:00Z', y: 71, note: 'Evening weigh-in' },
            { x: null, y: 70.5, note: 'Morning weigh-in' },
          ]);
          const dataPoints = screen.getAllByTestId('weight-data-point');
          expect(dataPoints).toHaveLength(2);
          expect(dataPoints[0]).toHaveTextContent(
            '71 kg - 19/08/2025 (Evening weigh-in)'
          );
          expect(dataPoints[1]).toHaveTextContent(
            '70.5 kg - Invalid Date (Morning weigh-in)'
          );
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('displays empty select box', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () => HttpResponse.json([{ id: 0, result: { data: [] } }])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('unit-select')).toBeInTheDocument();
          expect(screen.getByTestId('unit-select')).toHaveTextContent('Daily');
          expect(screen.getByTestId('no-data')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('displays select box with trend period options', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () => HttpResponse.json([{ id: 0, result: { data: [] } }])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('unit-select')).toBeInTheDocument();
          expect(screen.getByTestId('unit-select')).toHaveTextContent('Daily');
        },
        { timeout: 5000 }
      );

      await userEvent.click(screen.getByTestId('unit-select'));

      await waitFor(
        () => {
          expect(screen.getByTestId('select-option-daily')).toHaveTextContent('Daily');
          expect(screen.getByTestId('select-option-weekly')).toHaveTextContent('Weekly');
          expect(screen.getByTestId('select-option-monthly')).toHaveTextContent('Monthly');
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });

  it('updates chart time unit when trend period is changed', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'test-user-id',
      login: vi.fn(),
      logout: vi.fn(),
    });

    server.use(
      http.get(
        'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
        () =>
          HttpResponse.json([
            {
              id: 0,
              result: {
                data: [
                  {
                    id: '1',
                    weightKg: 70.5,
                    note: 'Morning weigh-in',
                    createdAt: '2025-08-20T10:00:00Z',
                    userId: 'test-user-id',
                  },
                  {
                    id: '2',
                    weightKg: 71.0,
                    note: 'Evening weigh-in',
                    createdAt: '2025-08-19T18:00:00Z',
                    userId: 'test-user-id',
                  },
                ],
              },
            },
          ])
      )
    );

    const { queryClient } = await setup('/weight-chart');

    await act(async () => {
      await waitFor(
        () => {
          const chartElement = screen.getByTestId('chart-mock');
          expect(chartElement).toBeInTheDocument();
          const chartOptions = JSON.parse(
            chartElement.getAttribute('data-chart-options') || '{}'
          );
          expect(chartOptions.scales.x.time.unit).toBe('day');
          expect(screen.getByTestId('unit-select')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      await userEvent.click(screen.getByTestId('unit-select'));

      await waitFor(
        () => {
          const weeklyOption = screen.getByTestId('select-option-weekly');
          expect(weeklyOption).toBeInTheDocument();
          userEvent.click(weeklyOption);
        },
        { timeout: 5000 }
      );

      await waitFor(
        () => {
          const chartElement = screen.getByTestId('chart-mock');
          const chartOptions = JSON.parse(
            chartElement.getAttribute('data-chart-options') || '{}'
          );
          expect(chartOptions.scales.x.time.unit).toBe('week');
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    });
  });
});