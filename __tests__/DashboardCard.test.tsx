// __tests__/DashboardCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardCard } from '../src/components/DashboardCard';
import { ScaleIcon } from 'lucide-react';
import '@testing-library/jest-dom';
import { act } from 'react';

// Mock @tanstack/react-router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
  }),
}));

describe('DashboardCard Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const setup = async (props = {}) => {
    const defaultProps = {
      title: 'Current Weight',
      icon: ScaleIcon,
      value: '70.5 kg',
      description: 'Latest recorded weight',
      buttonText: 'Record Weight',
      buttonLink: '/weight',
      testId: 'current-weight-card',
    };

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <DashboardCard {...defaultProps} {...props} />
        </QueryClientProvider>
      );
    });

    return { navigate: mockNavigate };
  };

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders card with provided props', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByTestId('current-weight-card')).toBeInTheDocument();
      expect(screen.getByText('Current Weight')).toBeInTheDocument();
      expect(screen.getByText('70.5 kg')).toBeInTheDocument();
      expect(screen.getByText('Latest recorded weight')).toBeInTheDocument();
      expect(screen.getByTestId('current-weight-card-button')).toHaveTextContent('Record Weight');
    });
  });

  it('renders "No data" when value is null', async () => {
    await setup({ value: null, description: 'Record your weight' });
    await waitFor(() => {
      expect(screen.getByTestId('current-weight-card')).toBeInTheDocument();
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.getByText('Record your weight')).toBeInTheDocument();
      expect(screen.getByTestId('current-weight-card-button')).toHaveTextContent('Record Weight');
    });
  });

  it('calls navigate with buttonLink when button is clicked', async () => {
    const { navigate } = await setup();
    await waitFor(() => {
      expect(screen.getByTestId('current-weight-card-button')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('current-weight-card-button'));
    });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: '/weight' });
    });
  });
});