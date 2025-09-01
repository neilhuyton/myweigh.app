// __tests__/WeightGoal.test.tsx
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '../src/trpc';
import { trpcClient, queryClient } from '../src/client';
import { router } from '../src/router/router';
import { server } from '../__mocks__/server';
import '@testing-library/jest-dom';
import { useAuthStore } from '../src/store/authStore';
import { act } from 'react';
import {
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  refreshTokenHandler,
} from '../__mocks__/handlers';
import { generateToken } from './utils/token';
import { http, HttpResponse } from 'msw';

// Mock GoalList
vi.mock('../src/components/GoalList', () => ({
  default: () => <div data-testid="goal-list">Mocked GoalList</div>,
}));

describe('WeightGoal Component', () => {
  const setup = async (initialPath = '/goals', userId = 'test-user-id') => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: true,
        userId,
        token: generateToken(userId),
        refreshToken: 'valid-refresh-token',
        login: vi.fn(),
        logout: vi.fn(),
      });
    });

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
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    server.use(
      weightGetCurrentGoalHandler,
      weightSetGoalHandler,
      weightGetWeightsHandler,
      refreshTokenHandler,
      http.post('http://localhost:8888/.netlify/functions/trpc/*', async ({ request }) => {
        console.log('MSW: Unhandled tRPC request', {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers),
        });
        return HttpResponse.json(
          [
            {
              id: 0,
              error: {
                message: 'Unhandled tRPC request',
                code: -32001,
                data: { code: 'NOT_FOUND', httpStatus: 404, path: request.url },
              },
            },
          ],
          { status: 200 }
        );
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
    document.body.innerHTML = '';
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterAll(() => {
    server.close();
  });

  it('renders WeightGoal with correct content', async () => {
    await setup('/goals', 'test-user-id');

    await waitFor(
      () => {
        const goalQuery = queryClient.getQueryCache().find({
          queryKey: [['weight.getCurrentGoal']],
        });
        console.log('Test (renders WeightGoal) - Goal Query:', {
          status: goalQuery?.state.status,
          data: goalQuery?.state.data,
          error: goalQuery?.state.error,
          queryKey: [['weight.getCurrentGoal']],
        });
        if (!goalQuery) {
          console.log('Test (renders WeightGoal) - No query found for weight.getCurrentGoal');
          screen.debug();
        }
        if (!screen.queryByText(/Current Goal/i)) {
          console.log('Test (renders WeightGoal) - DOM Debug:');
          screen.debug();
        }
        expect(
          screen.queryByTestId('weight-goal-loading')
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'Your Goals' })
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Current Goal.*65 kg/i)
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('Enter your goal weight (kg)')
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /Set Goal/i })
        ).toBeInTheDocument();
        expect(screen.getByTestId('goal-list')).toBeInTheDocument();
      },
      { timeout: 30000 }
    );
  });

  it('allows user to update a weight goal when logged in', async () => {
    await setup('/goals', 'test-user-id');

    await waitFor(
      () => {
        const goalQuery = queryClient.getQueryCache().find({
          queryKey: [['weight.getCurrentGoal']],
        });
        console.log('Test (update weight goal) - Goal Query:', {
          status: goalQuery?.state.status,
          data: goalQuery?.state.data,
          error: goalQuery?.state.error,
          queryKey: [['weight.getCurrentGoal']],
        });
        if (!goalQuery) {
          console.log('Test (update weight goal) - No query found for weight.getCurrentGoal');
          screen.debug();
        }
        if (!screen.queryByText(/Current Goal/i)) {
          console.log('Test (update weight goal) - DOM Debug:');
          screen.debug();
        }
        expect(
          screen.queryByTestId('weight-goal-loading')
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'Your Goals' })
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Current Goal.*65 kg/i)
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('Enter your goal weight (kg)')
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /Set Goal/i })
        ).toBeInTheDocument();
        expect(screen.getByTestId('goal-list')).toBeInTheDocument();
      },
      { timeout: 30000 }
    );

    await act(async () => {
      const input = screen.getByPlaceholderText('Enter your goal weight (kg)');
      fireEvent.change(input, { target: { value: '60' } });
      expect(input).toHaveValue(60);
      fireEvent.click(screen.getByRole('button', { name: /Set Goal/i }));
    });

    await waitFor(
      () => {
        const goalQuery = queryClient.getQueryCache().find({
          queryKey: [['weight.getCurrentGoal']],
        });
        console.log('Test (update weight goal) - Post-mutation Goal Query:', {
          status: goalQuery?.state.status,
          data: goalQuery?.state.data,
          error: goalQuery?.state.error,
          queryKey: [['weight.getCurrentGoal']],
        });
        expect(
          screen.getByText('Goal updated successfully!')
        ).toBeInTheDocument();
      },
      { timeout: 30000 }
    );
  });
});