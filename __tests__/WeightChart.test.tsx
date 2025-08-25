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
import { ThemeProvider } from '../src/components/ThemeProvider';

// Mock recharts and chart component
vi.mock('recharts', () => ({
  BarChart: vi.fn(({ children, data, margin }) => (
    <div
      data-testid="chart-mock"
      data-chart-data={JSON.stringify(data)}
      data-margin={JSON.stringify(margin)}
    >
      {children}
    </div>
  )),
  Bar: vi.fn(({ fill, fillOpacity }) => (
    <div
      data-testid="bar-mock"
      data-fill={fill}
      data-fill-opacity={fillOpacity}
    />
  )),
  XAxis: vi.fn(() => null),
  YAxis: vi.fn(() => null),
  Tooltip: vi.fn(() => null),
  CartesianGrid: vi.fn(() => null),
  ResponsiveContainer: vi.fn(({ children }) => <div>{children}</div>),
}));

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: vi.fn(({ config, children, className, id }) => (
    <div
      data-testid="chart-container-mock"
      data-chart-config={JSON.stringify(config)}
      className={className}
      data-chart={id}
    >
      {children}
    </div>
  )),
  ChartTooltipContent: vi.fn(() => null),
}));

// Remove getComputedStyle mock since we're not using it anymore
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

  const setup = async (initialPath: string = '/weight-chart', theme: 'light' | 'dark' = 'dark') => {
    const queryClient = createTestQueryClient();
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      ...router.options,
      history,
      routeTree: router.routeTree,
    });

    // Set theme
    await act(async () => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      // Trigger MutationObserver
      document.documentElement.setAttribute('class', theme);
    });

    await act(async () => {
      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme={theme} enableSystem={true}>
              <RouterProvider router={testRouter} />
            </ThemeProvider>
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
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
    document.documentElement.classList.remove('light', 'dark');
    cleanup();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  it('displays loading message while fetching weights', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'test-user-id' });
    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json([{ id: 0, result: { data: [] } }]);
      })
    );

    await setup();
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('no-data')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it.each([
    { theme: 'dark' as const, expectedColor: 'hsl(0.696 0.17 162.48)' },
    { theme: 'light' as const, expectedColor: 'hsl(0.6 0.118 184.704)' },
  ])('displays weight chart with correct theme color ($theme)', async ({ theme, expectedColor }) => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'test-user-id' });
    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', () =>
        HttpResponse.json([
          {
            id: 0,
            result: {
              data: [
                { id: '1', weightKg: 70.5, note: 'Morning', createdAt: '2025-08-20T10:00:00Z', userId: 'test-user-id' },
                { id: '2', weightKg: 71.0, note: 'Evening', createdAt: '2025-08-19T18:00:00Z', userId: 'test-user-id' },
              ],
            },
          },
        ])
      )
    );

    await setup('/weight-chart', theme);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Total Weight' })).toBeInTheDocument();
      const card = screen.getByTestId('chart-container-mock').closest('.bg-card');
      expect(card).toHaveClass('overflow-hidden');
      expect(screen.getByTestId('chart-container-mock')).toHaveClass('h-full w-full');
      expect(screen.getByTestId('chart-container-mock')).toHaveAttribute('data-chart', 'weight-chart');
      expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
      const chartData = JSON.parse(screen.getByTestId('chart-mock').getAttribute('data-chart-data') || '[]');
      expect(chartData).toEqual([
        { date: '2025-08-19T18:00:00Z', weight: 71, note: 'Evening' },
        { date: '2025-08-20T10:00:00Z', weight: 70.5, note: 'Morning' },
      ]);
      const bar = screen.getByTestId('bar-mock');
      expect(bar).toHaveAttribute('data-fill', expectedColor);
      expect(bar).toHaveAttribute('data-fill-opacity', '0.8');
      const config = JSON.parse(screen.getByTestId('chart-container-mock').getAttribute('data-chart-config') || '{}');
      expect(config.weight.theme).toEqual({
        light: 'hsl(0.6 0.118 184.704)',
        dark: 'hsl(0.696 0.17 162.48)',
      });
      const dataPoints = screen.getAllByTestId('weight-data-point');
      expect(dataPoints).toHaveLength(2);
      expect(dataPoints[0]).toHaveTextContent('71 kg - 19/08/2025 (Evening)');
      expect(dataPoints[1]).toHaveTextContent('70.5 kg - 20/08/2025 (Morning)');
    });
  });

  it('displays error message when fetch fails', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'test-user-id' });
    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', () =>
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

    await setup();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Error: Failed to fetch weights');
    });
  });

  it('displays no measurements message when weights are empty', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'test-user-id' });
    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', () =>
        HttpResponse.json([{ id: 0, result: { data: [] } }])
      )
    );

    await setup();
    await waitFor(() => {
      expect(screen.getByTestId('unit-select')).toHaveTextContent('Daily');
      expect(screen.getByTestId('no-data')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-mock')).not.toBeInTheDocument();
    });
  });

  it('updates chart data when trend period changes', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'test-user-id' });
    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', () =>
        HttpResponse.json([
          {
            id: 0,
            result: {
              data: [
                { id: '1', weightKg: 70.5, note: 'Morning', createdAt: '2025-08-20T10:00:00Z', userId: 'test-user-id' },
                { id: '2', weightKg: 71.0, note: 'Evening', createdAt: '2025-08-19T18:00:00Z', userId: 'test-user-id' },
              ],
            },
          },
        ])
      )
    );

    await setup();
    await waitFor(() => {
      const chartData = JSON.parse(screen.getByTestId('chart-mock').getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(2);
      expect(chartData[0].weight).toBe(71);
      const card = screen.getByTestId('chart-container-mock').closest('.bg-card');
      expect(card).toHaveClass('overflow-hidden');
      expect(screen.getByTestId('chart-container-mock')).toHaveClass('h-full w-full');
      expect(screen.getByTestId('chart-container-mock')).toHaveAttribute('data-chart', 'weight-chart');
      const bar = screen.getByTestId('bar-mock');
      expect(bar).toHaveAttribute('data-fill', 'hsl(0.696 0.17 162.48)');
      expect(bar).toHaveAttribute('data-fill-opacity', '0.8');
      const config = JSON.parse(screen.getByTestId('chart-container-mock').getAttribute('data-chart-config') || '{}');
      expect(config.weight.theme).toEqual({
        light: 'hsl(0.6 0.118 184.704)',
        dark: 'hsl(0.696 0.17 162.48)',
      });
    });

    await userEvent.click(screen.getByTestId('unit-select'));
    await userEvent.click(screen.getByTestId('select-option-weekly'));

    await waitFor(() => {
      const chartData = JSON.parse(screen.getByTestId('chart-mock').getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(1);
      expect(chartData[0].weight).toBeCloseTo((70.5 + 71) / 2);
      expect(chartData[0].date).toBe('2025-08-17');
      const bar = screen.getByTestId('bar-mock');
      expect(bar).toHaveAttribute('data-fill', 'hsl(0.696 0.17 162.48)');
    });
  });

  it('updates bar color when theme changes', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'test-user-id' });
    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', () =>
        HttpResponse.json([
          {
            id: 0,
            result: {
              data: [
                { id: '1', weightKg: 70.5, note: 'Morning', createdAt: '2025-08-20T10:00:00Z', userId: 'test-user-id' },
                { id: '2', weightKg: 71.0, note: 'Evening', createdAt: '2025-08-19T18:00:00Z', userId: 'test-user-id' },
              ],
            },
          },
        ])
      )
    );

    await setup('/weight-chart', 'dark');
    await waitFor(() => {
      const bar = screen.getByTestId('bar-mock');
      expect(bar).toHaveAttribute('data-fill', 'hsl(0.696 0.17 162.48)');
    });

    // Simulate theme switch to light
    await act(async () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      // Trigger MutationObserver
      document.documentElement.setAttribute('class', 'light');
    });

    await waitFor(() => {
      const bar = screen.getByTestId('bar-mock');
      expect(bar).toHaveAttribute('data-fill', 'hsl(0.6 0.118 184.704)');
    });
  });
});