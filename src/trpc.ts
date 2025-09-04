import { QueryClient } from "@tanstack/react-query";
import { createTRPCReact, httpLink } from "@trpc/react-query";
import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "./authStore";
import type { AppRouter } from "../server/trpc";

export const trpc = createTRPCReact<AppRouter>();

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
      fetch: async (url, options): Promise<Response> => {
        const { token, refreshToken, userId, login, logout } =
          useAuthStore.getState();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const response = await fetch(url, { ...options, headers });
        const responseData = await response.json();

        const isUnauthorized =
          responseData?.error?.data?.code === "UNAUTHORIZED" ||
          responseData?.error?.message?.includes("Unauthorized");

        if (isUnauthorized && refreshToken && userId) {
          try {
            const refreshResponse: { token: string; refreshToken: string } =
              await trpcClient.refreshToken.refresh.mutate({ refreshToken });
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

        return new Response(JSON.stringify(responseData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      },
    }),
  ],
});
