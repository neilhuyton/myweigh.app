// __tests__/VerifyEmail.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { http, HttpResponse } from 'msw';
import { server } from '../__mocks__/server';
import { trpc } from '../src/trpc';
import { useAuthStore } from '../src/store/authStore';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';
import { router } from '../src/router';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { toast } from 'sonner';
import { act } from 'react';

// Simplified VerifyEmail component for testing
const VerifyEmailComponent = ({ token }: { token: string }) => {
  const verifyMutation = trpc.verifyEmail.useMutation();

  const handleVerify = async () => {
    try {
      await verifyMutation.mutateAsync({ token });
    } catch (error) {
      // Error handling via toast
    }
  };

  return (
    <div>
      <h1>Verify Your Email</h1>
      <button
        onClick={handleVerify}
        data-testid="verify-button"
        disabled={verifyMutation.isPending}
      >
        {verifyMutation.isPending ? 'Verifying...' : 'Verify Email'}
      </button>
      {verifyMutation.isSuccess && (
        <p data-testid="verify-message" className="text-green-500">
          {verifyMutation.data?.message}
        </p>
      )}
      {verifyMutation.isError && (
        <p data-testid="verify-message" className="text-red-500">
          {verifyMutation.error?.message}
        </p>
      )}
    </div>
  );
};

describe('Email Verification', () => {
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
          const headers = {
            ...options?.headers,
            ...(useAuthStore.getState().userId
              ? { Authorization: `Bearer ${useAuthStore.getState().userId}` }
              : {}),
          };
          return fetch(url, { ...options, headers, signal: undefined });
        },
      }),
    ],
  });

  const setup = async (initialPath: string, token: string) => {
    const history = createMemoryHistory({ initialEntries: [`${initialPath}?token=${token}`] });
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
            <VerifyEmailComponent token={token} />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });

    return { history, testRouter };
  };

  beforeAll(() => {
    vi.spyOn(toast, 'success').mockImplementation(() => 'toast-success-id');
    vi.spyOn(toast, 'error').mockImplementation(() => 'toast-error-id');
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null });
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    server.close();
  });

  it('successfully verifies email with valid token', async () => {
    const validToken = '123e4567-e89b-12d3-a456-426614174000';
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async () => {
        return HttpResponse.json([
          {
            result: {
              data: {
                message: 'Email verified successfully!',
              },
            },
          },
        ]);
      })
    );

    await setup('/verify-email', validToken);

    await waitFor(() => {
      expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
      expect(screen.getByTestId('verify-button')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('verify-button'));
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for mutation
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('verify-message')).toBeInTheDocument();
        expect(screen.getByTestId('verify-message')).toHaveTextContent('Email verified successfully!');
        expect(screen.getByTestId('verify-message')).toHaveClass('text-green-500');
        expect(toast.success).toHaveBeenCalledWith('Email Verification', {
          description: 'Email verified successfully!',
          action: { label: 'Go to Login', onClick: expect.any(Function) },
          className: 'verify-email-toast',
          duration: 5000,
        });
      },
      { timeout: 2000 }
    );
  });

  it('displays error message for invalid or expired verification token', async () => {
    const invalidToken = '00000000-0000-0000-0000-000000000000';
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async () => {
        return HttpResponse.json(
          [
            {
              error: {
                message: 'Invalid or expired verification token',
                code: -32001,
                data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'verifyEmail' },
              },
            },
          ],
          { status: 401 }
        );
      })
    );

    await setup('/verify-email', invalidToken);

    await waitFor(() => {
      expect(screen.getByTestId('verify-button')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('verify-button'));
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for mutation
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('verify-message')).toBeInTheDocument();
        expect(screen.getByTestId('verify-message')).toHaveTextContent('Invalid or expired verification token');
        expect(screen.getByTestId('verify-message')).toHaveClass('text-red-500');
        expect(toast.error).toHaveBeenCalledWith('Verification Failed', {
          description: 'Invalid or expired verification token',
          action: { label: 'Try Again', onClick: expect.any(Function) },
          className: 'verify-email-toast',
          duration: 5000,
        });
      },
      { timeout: 2000 }
    );
  });

  it('displays error message for already verified email', async () => {
    const token = '123e4567-e89b-12d3-a456-426614174000';
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async () => {
        return HttpResponse.json(
          [
            {
              error: {
                message: 'Email already verified',
                code: -32001,
                data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
              },
            },
          ],
          { status: 400 }
        );
      })
    );

    await setup('/verify-email', token);

    await waitFor(() => {
      expect(screen.getByTestId('verify-button')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('verify-button'));
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for mutation
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('verify-message')).toBeInTheDocument();
        expect(screen.getByTestId('verify-message')).toHaveTextContent('Email already verified');
        expect(screen.getByTestId('verify-message')).toHaveClass('text-red-500');
        expect(toast.error).toHaveBeenCalledWith('Verification Failed', {
          description: 'Email already verified',
          action: { label: 'Try Again', onClick: expect.any(Function) },
          className: 'verify-email-toast',
          duration: 5000,
        });
      },
      { timeout: 2000 }
    );
  });

  it('disables verify button during verification process', async () => {
    const token = '123e4567-e89b-12d3-a456-426614174000';
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json([
          {
            result: {
              data: {
                message: 'Email verified successfully!',
              },
            },
          },
        ]);
      })
    );

    await setup('/verify-email', token);

    await waitFor(() => {
      expect(screen.getByTestId('verify-button')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('verify-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('verify-button')).toBeDisabled();
      expect(screen.getByTestId('verify-button')).toHaveTextContent('Verifying...');
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('verify-message')).toBeInTheDocument();
        expect(screen.getByTestId('verify-button')).not.toBeDisabled();
        expect(screen.getByTestId('verify-button')).toHaveTextContent('Verify Email');
      },
      { timeout: 3000 }
    );
  });
});