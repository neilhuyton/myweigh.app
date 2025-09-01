import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../src/trpc';
import { server } from '../__mocks__/server';
import '@testing-library/jest-dom';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { router } from '../src/router/router';
import { useAuthStore } from '../src/store/authStore';
import { weightGetWeightsHandler } from '../__mocks__/handlers/weightGetWeights';
import { weightGetCurrentGoalHandler } from '../__mocks__/handlers/weightGetCurrentGoal';
import { generateToken } from './utils/token';

// Mock ResizeObserver to fix recharts dimension issue
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Create queryClient once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Create trpcClient with auth headers
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:8888/.netlify/functions/trpc',
      fetch: async (url, options) => {
        const headers = {
          ...options?.headers,
          ...(useAuthStore.getState().token
            ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
            : {}),
        };
        return fetch(url, {
          ...options,
          headers,
          method: 'POST',
        });
      },
    }),
  ],
});

describe('WeightChart Component', () => {
  const setup = async (initialPath = '/stats', userId?: string) => {
    if (userId) {
      useAuthStore.setState({
        isLoggedIn: true,
        userId,
        token: generateToken(userId),
        refreshToken: null,
      });
    }
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      routeTree: router.routeTree,
      history,
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
    server.use(weightGetWeightsHandler, weightGetCurrentGoalHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
    });
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterAll(() => {
    server.close();
  });

  it('renders WeightChart with correct title and select dropdown', async () => {
    await setup('/stats', 'test-user-id');

    await waitFor(
      () => {
        if (!screen.queryByTestId('unit-select')) {
          console.log('Test (renders WeightChart) - DOM Debug:');
          screen.debug();
          const weightsQuery = queryClient
            .getQueryCache()
            .find({ queryKey: ['weight.getWeights'] });
          console.log('Weights Query:', {
            status: weightsQuery?.state.status,
            error: weightsQuery?.state.error,
          });
          const goalQuery = queryClient
            .getQueryCache()
            .find({ queryKey: ['weight.getCurrentGoal'] });
          console.log('Goal Query:', {
            status: goalQuery?.state.status,
            error: goalQuery?.state.error,
          });
          const goalsQuery = queryClient
            .getQueryCache()
            .find({ queryKey: ['weight.getGoals'] });
          console.log('Goals Query:', {
            status: goalsQuery?.state.status,
            error: goalsQuery?.state.error,
          });
        }
        expect(
          screen.getByRole('heading', { name: 'Your Stats' })
        ).toBeInTheDocument();
        expect(screen.getByTestId('unit-select')).toHaveTextContent('Daily');
      },
      { timeout: 2000 }
    );
  });

  it('displays error message when fetch fails', async () => {
    await setup('/stats', 'error-user-id');

    await waitFor(
      () => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Error: Failed to fetch weights'
        );
      },
      { timeout: 2000 }
    );
  });

  it.skip('displays no measurements message when weights are empty', async () => {
    await setup('/stats', 'empty-user-id');

    await waitFor(
      () => {
        expect(screen.getByTestId('unit-select')).toHaveTextContent('Daily');
        expect(screen.getByTestId('no-data')).toBeInTheDocument();
        expect(screen.getByTestId('no-data')).toHaveTextContent(
          'No weight measurements found'
        );
      },
      { timeout: 2000 }
    );
  });

  it.skip('updates chart data when trend period changes', async () => {
    await setup('/stats', 'test-user-id');

    await waitFor(
      () => {
        expect(screen.getByTestId('unit-select')).toHaveTextContent('Daily');
        expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    await act(async () => {
      const selectTrigger = screen.getByTestId('unit-select');
      fireEvent.change(selectTrigger, { target: { value: 'weekly' } });
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('unit-select')).toHaveValue('weekly');
        expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it.skip('displays latest weight card when weights are available', async () => {
    await setup('/stats', 'test-user-id');

    await waitFor(
      () => {
        const latestWeightCard = screen.getByTestId('latest-weight-card');
        expect(latestWeightCard).toBeInTheDocument();
        expect(latestWeightCard).toHaveTextContent('Latest Weight');
        expect(latestWeightCard).toHaveTextContent('69.5 kg');
        expect(latestWeightCard).toHaveTextContent(
          formatDate('2023-10-02T00:00:00Z')
        );
      },
      { timeout: 2000 }
    );
  });

  it.skip('does not display latest weight card when weights are empty', async () => {
    await setup('/stats', 'empty-user-id');

    await waitFor(
      () => {
        expect(
          screen.queryByTestId('latest-weight-card')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('no-data')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('does not display latest weight card when fetch fails', async () => {
    await setup('/stats', 'error-user-id');

    await waitFor(
      () => {
        expect(
          screen.queryByTestId('latest-weight-card')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('error')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it.skip('displays goal weight card when goal is available', async () => {
    await setup('/stats', 'test-user-id');

    await waitFor(
      () => {
        const goalWeightCard = screen.getByTestId('goal-weight-card');
        expect(goalWeightCard).toBeInTheDocument();
        expect(goalWeightCard).toHaveTextContent('Goal Weight');
        expect(goalWeightCard).toHaveTextContent('65.0 kg');
      },
      { timeout: 2000 }
    );
  });

  it.skip('does not display goal weight card when no goal exists', async () => {
    await setup('/stats', 'empty-user-id');

    await waitFor(
      () => {
        expect(
          screen.queryByTestId('goal-weight-card')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('no-data')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('does not display goal weight card when fetch fails', async () => {
    await setup('/stats', 'error-user-id');

    await waitFor(
      () => {
        expect(
          screen.queryByTestId('goal-weight-card')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('error')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB');
}