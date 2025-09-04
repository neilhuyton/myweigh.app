import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { trpc } from "../../src/trpc";
import { useAuthStore } from "../../src/authStore";
import { generateToken } from "./token";
import { vi } from "vitest";
import type { ReactNode } from "react";

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export const createTestTrpcClient = () =>
  trpc.createClient({
    links: [
      httpLink({
        url: "http://localhost:8888/.netlify/functions/trpc",
        headers: () => ({
          "content-type": "application/json",
          ...(useAuthStore.getState().token
            ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
            : {}),
        }),
      }),
    ],
  });

export const setupAuthStore = (
  userId = "test-user-id",
  options: Partial<{
    isLoggedIn: boolean;
    userId: string;
    token: string | null;
    refreshToken: string | null;
  }> = {}
) => {
  useAuthStore.setState({
    isLoggedIn: options.isLoggedIn ?? true,
    userId: options.userId ?? userId,
    token: options.token ?? generateToken(userId),
    refreshToken: options.refreshToken ?? "valid-refresh-token",
    login: vi.fn(),
    logout: vi.fn(),
  });
};

export const renderWithProviders = (
  ui: ReactNode,
  options: RenderOptions & {
    userId?: string;
    isLoggedIn?: boolean;
  } = {}
) => {
  const queryClient = createTestQueryClient();
  const trpcClient = createTestTrpcClient();
  setupAuthStore(options.userId, { isLoggedIn: options.isLoggedIn });

  return render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </trpc.Provider>,
    options
  );
};
