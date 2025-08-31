import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
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
    httpBatchLink({
      url:
        import.meta.env.VITE_TRPC_URL ||
        "http://localhost:8888/.netlify/functions/trpc",
      fetch: async (url, options) => {
        const { token, refreshToken, login, logout } = useAuthStore.getState();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        let body: string;
        if (url.toString().includes("batch=1")) {
          try {
            let parsedBody: unknown[] = [];
            if (options?.body && typeof options.body === "string") {
              parsedBody = JSON.parse(options.body);
              if (!Array.isArray(parsedBody)) {
                parsedBody = [parsedBody];
              }
            }
            const correctedBody = parsedBody.map((item) => {
              if (item && typeof item === "object" && "0" in item) {
                return item["0"];
              }
              return item;
            });
            const transformedBody: Record<number, unknown> = {};
            correctedBody.forEach((item, index) => {
              transformedBody[index] = item;
            });
            body = JSON.stringify(transformedBody);
          } catch {
            throw new Error("Invalid request body format");
          }
        } else {
          try {
            let parsedBody: unknown = {};
            if (options?.body && typeof options.body === "string") {
              parsedBody = JSON.parse(options.body);
              if (parsedBody && typeof parsedBody === "object" && "0" in parsedBody) {
                parsedBody = parsedBody["0"];
              }
            }
            body = JSON.stringify(parsedBody);
          } catch {
            throw new Error("Invalid request body format");
          }
        }

        const fetchOptions = {
          ...options,
          method: "POST",
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
              refreshToken,
            );
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${refreshResponse.token}`,
            };
            return await fetch(url, { ...fetchOptions, headers: newHeaders });
          } catch {
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