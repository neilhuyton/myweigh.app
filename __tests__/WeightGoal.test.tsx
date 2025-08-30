// __tests__/WeightGoal.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
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
import { Component, type ErrorInfo } from 'react';
import { weightHandlers } from '../__mocks__/handlers/weightHandlers';
import { weightGetWeightsHandler } from '../__mocks__/handlers/weightGetWeights';
import { refreshTokenHandler } from '../__mocks__/handlers/refreshToken';
import jwt from 'jsonwebtoken';

// ErrorBoundary
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary caught:', error.message, errorInfo);
  }
  render() {
    if (this.state.error) {
      return <div data-testid="error-boundary">An error occurred. Please try again. {this.state.error}</div>;
    }
    return this.props.children;
  }
}

// Mock GoalList
vi.mock('../src/components/GoalList', () => ({
  default: () => <div data-testid="goal-list">Mocked GoalList</div>,
}));

// Mock JWT tokens
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '1h',
  });
};

describe('WeightGoal Component', () => {
  const setup = async (initialPath = '/weight-goal', userId = 'test-user-id') => {
    // Set auth state before rendering
    useAuthStore.setState({
      isLoggedIn: true,
      userId,
      token: generateToken(userId),
      refreshToken: 'valid-refresh-token',
      login: vi.fn(),
      logout: vi.fn(),
    });

    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      routeTree: router.routeTree,
      history,
    });

    await act(async () => {
      render(
        <ErrorBoundary>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <RouterProvider router={testRouter} />
            </QueryClientProvider>
          </trpc.Provider>
        </ErrorBoundary>
      );
    });

    return { history, testRouter };
  };

  beforeAll(() => {
    console.log('MSW: Starting server');
    server.listen({ onUnhandledRequest: 'warn' });
    server.use(...weightHandlers, weightGetWeightsHandler, refreshTokenHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
    document.body.innerHTML = '';
    // Reset auth state
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
    await setup('/weight-goal', 'test-user-id');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
          expect(screen.queryByTestId('weight-goal-loading')).not.toBeInTheDocument();
          expect(screen.getByRole('heading', { name: 'Weight Goal' })).toBeInTheDocument();
          expect(screen.getByText(/Current Goal: 65 kg/)).toBeInTheDocument();
          expect(screen.getByPlaceholderText('Enter your goal weight (kg)')).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /Set Goal/i })).toBeInTheDocument();
          expect(screen.getByTestId('goal-list')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  it('allows user to update a weight goal when logged in', async () => {
    await setup('/weight-goal', 'test-user-id');

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
          expect(screen.queryByTestId('weight-goal-loading')).not.toBeInTheDocument();
          expect(screen.getByRole('heading', { name: 'Weight Goal' })).toBeInTheDocument();
          expect(screen.getByText(/Current Goal: 65 kg/)).toBeInTheDocument();
          expect(screen.getByPlaceholderText('Enter your goal weight (kg)')).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /Set Goal/i })).toBeInTheDocument();
          expect(screen.getByTestId('goal-list')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      const input = screen.getByPlaceholderText('Enter your goal weight (kg)');
      fireEvent.change(input, { target: { value: '60' } });
      expect(input).toHaveValue(60); // Changed from '60' (string) to 60 (number)
      fireEvent.click(screen.getByRole('button', { name: /Set Goal/i }));
    });

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByText('Goal updated successfully!')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });
});