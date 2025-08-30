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

        console.log("Client Request URL:", url.toString());
        console.log("Client Request Method:", options?.method || "POST");
        console.log("Client Raw Request Body:", options?.body || "No body provided");

        // Transform body for batched requests
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
            // Handle incorrect {0: {email, password}} input by unwrapping
            const correctedBody = parsedBody.map((item) => {
              if (item && typeof item === "object" && "0" in item) {
                console.warn("Correcting invalid input format:", item);
                return item["0"];
              }
              return item;
            });
            // Transform to {0: {email, password}, 1: {...}, ...} for batched calls
            const paths = url.toString().split('trpc/')[1]?.split('?')[0]?.split(',') || [];
            const transformedBody: Record<number, unknown> = {};
            correctedBody.forEach((item, index) => {
              transformedBody[index] = item;
            });
            body = JSON.stringify(transformedBody);
            console.log("Client Transformed Request Body:", body);
          } catch (error) {
            console.error("Failed to parse or transform request body:", error);
            throw new Error("Invalid request body format");
          }
        } else {
          // Non-batch requests: use body as-is, with similar unwrapping
          try {
            let parsedBody: unknown = {};
            if (options?.body && typeof options.body === "string") {
              parsedBody = JSON.parse(options.body);
              if (parsedBody && typeof parsedBody === "object" && "0" in parsedBody) {
                console.warn("Correcting invalid non-batch input format:", parsedBody);
                parsedBody = parsedBody["0"];
              }
            }
            body = JSON.stringify(parsedBody);
            console.log("Client Default Request Body:", body);
          } catch (error) {
            console.error("Failed to parse or transform non-batch request body:", error);
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

        console.log("Final Fetch Options:", {
          url: url.toString(),
          method: fetchOptions.method,
          headers: fetchOptions.headers,
          body: fetchOptions.body,
        });

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
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            logout();
            throw redirect({ to: "/login" });
          }
        }

        if (!response.ok && response.status === 401) {
          console.error("Unauthorized request, redirecting to login");
          logout();
          throw redirect({ to: "/login" });
        }

        return response;
      },
    }),
  ],
});