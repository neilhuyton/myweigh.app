// src/client.ts
import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { redirect } from "@tanstack/react-router";
import { trpc } from "./trpc";
import { useAuthStore } from "./store/authStore";

// Create QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Create tRPC client
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url:
        import.meta.env.VITE_TRPC_URL ||
        "http://localhost:8888/.netlify/functions/trpc",
      fetch: async (url, options) => {
        const { token, refreshToken, login, logout } = useAuthStore.getState();
        const headers = {
          ...options?.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        };
        // Construct tRPC batch body for queries if no body is provided
        const procedurePath = url.toString().split('/trpc/')[1]?.split('?')[0] || '';
        const body = options?.body || JSON.stringify([{
          id: 0,
          method: 'query',
          params: { path: procedurePath, input: {} }
        }]);

        const fetchOptions = {
          ...options,
          method: 'POST',
          headers,
          body,
          signal: options?.signal,
        };

        const response = await fetch(url, fetchOptions);

        if (!response.ok && response.status === 401 && refreshToken) {
          try {
            const refreshResponse = await trpcClient.refreshToken.refresh.mutate({
              refreshToken,
            });
            login(
              useAuthStore.getState().userId!,
              refreshResponse.token,
              refreshResponse.refreshToken
            );
            const newHeaders = {
              ...options?.headers,
              Authorization: `Bearer ${refreshResponse.token}`,
              'Content-Type': 'application/json',
            };
            return await fetch(url, { ...fetchOptions, headers: newHeaders });
          } catch (refreshError) {
            console.error("Refresh failed:", refreshError);
            logout();
            throw redirect({ to: "/login" });
          }
        }

        if (!response.ok && response.status === 401) {
          logout();
          throw redirect({ to: "/login" });
        }

        return response;
      },
    }),
  ],
});