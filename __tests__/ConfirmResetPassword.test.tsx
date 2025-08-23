import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '../src/trpc';
import ConfirmResetPasswordForm from '../src/components/ConfirmResetPasswordForm';
import '@testing-library/jest-dom';
import { httpBatchLink } from '@trpc/client';
import { server } from '../__mocks__/server';

describe('ConfirmResetPasswordForm Component', () => {
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
          return fetch(url, { ...options, signal: undefined });
        },
      }),
    ],
  });

  const setup = (onSwitchToLogin = vi.fn()) => {
    render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ConfirmResetPasswordForm onSwitchToLogin={onSwitchToLogin} />
        </QueryClientProvider>
      </trpc.Provider>
    );
    return { onSwitchToLogin };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  it('submits valid token and new password and displays success message', async () => {
    setup();

    const tokenInput = screen.getByLabelText('Reset Token');
    const passwordInput = screen.getByLabelText('New Password');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });

    fireEvent.change(tokenInput, { target: { value: '123e4567-e89b-12d3-a456-426614174000' } });
    fireEvent.change(passwordInput, { target: { value: 'newSecurePassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const messageElement = screen.getByTestId('confirm-reset-password-message');
      expect(messageElement).toHaveTextContent('Password reset successfully');
      expect(messageElement).toHaveClass('text-green-500');
    }, { timeout: 5000 });
  });
});