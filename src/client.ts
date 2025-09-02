// src/client.ts
import { QueryClient } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { redirect } from "@tanstack/react-router";
import { trpc } from "./trpc";
import { useAuthStore } from "./store/authStore";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url:
        import.meta.env.VITE_TRPC_URL ||
        "http://localhost:8888/.netlify/functions/trpc",
      fetch: async (url, options) => {
        const { token, refreshToken, userId, login, logout } =
          useAuthStore.getState();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const response = await fetch(url, { ...options, headers });
        const responseData = await response.json(); // Read JSON once

        // Handle unauthorized errors with refresh token
        const isUnauthorized =
          responseData?.error?.data?.code === "UNAUTHORIZED" ||
          responseData?.error?.message?.includes("Unauthorized");

        if (isUnauthorized && refreshToken && userId) {
          try {
            const refreshResponse = await trpcClient.refreshToken.refresh.mutate({
              refreshToken,
            });
            login(userId, refreshResponse.token, refreshResponse.refreshToken);
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${refreshResponse.token}`,
            };
            return await fetch(url, { ...options, headers: newHeaders });
          } catch {
            logout();
            throw redirect({ to: "/login" });
          }
        }

        if (isUnauthorized) {
          logout();
          throw redirect({ to: "/login" });
        }

        // Return a new Response with the cached JSON data
        return new Response(JSON.stringify(responseData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      },
    }),
  ],
});