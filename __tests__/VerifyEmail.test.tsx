// __tests__/VerifyEmail.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { http, HttpResponse } from "msw";
import { server } from "../__mocks__/server";
import { trpc } from "../src/trpc";
import { useAuthStore } from "../src/store/authStore";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { router } from "../src/router/router";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { act } from "react";

describe("Email Verification", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:8888/.netlify/functions/trpc",
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
    const history = createMemoryHistory({
      initialEntries: [`${initialPath}?token=${token}`],
    });
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
          </QueryClientProvider>
        </trpc.Provider>
      );
    });

    return { history, testRouter };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
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

  it("successfully verifies email with valid token", async () => {
    const validToken = "123e4567-e89b-12d3-a456-426614174000";
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/verifyEmail",
        async () => {
          return HttpResponse.json([
            {
              result: {
                data: {
                  message: "Email verified successfully!",
                },
              },
            },
          ]);
        }
      )
    );

    await setup("/verify-email", validToken);

    await waitFor(
      () => {
        expect(screen.getByText("Email Verification")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toHaveTextContent(
          "Email verified successfully!"
        );
        expect(screen.getByTestId("verify-message")).toHaveClass(
          "text-green-500"
        );
      },
      { timeout: 2000 }
    );
  });

  it("displays error message for invalid or expired verification token", async () => {
    const invalidToken = "00000000-0000-0000-0000-000000000000";
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/verifyEmail",
        async () => {
          return HttpResponse.json(
            [
              {
                error: {
                  message: "Invalid or expired verification token",
                  code: -32001,
                  data: {
                    code: "UNAUTHORIZED",
                    httpStatus: 401,
                    path: "verifyEmail",
                  },
                },
              },
            ],
            { status: 401 }
          );
        }
      )
    );

    await setup("/verify-email", invalidToken);

    await waitFor(
      () => {
        expect(screen.getByTestId("verify-message")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toHaveTextContent(
          "Invalid or expired verification token"
        );
        expect(screen.getByTestId("verify-message")).toHaveClass(
          "text-red-500"
        );
      },
      { timeout: 2000 }
    );
  });

  it("displays error message for already verified email", async () => {
    const token = "123e4567-e89b-12d3-a456-426614174000";
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/verifyEmail",
        async () => {
          return HttpResponse.json(
            [
              {
                error: {
                  message: "Email already verified",
                  code: -32001,
                  data: {
                    code: "BAD_REQUEST",
                    httpStatus: 400,
                    path: "verifyEmail",
                  },
                },
              },
            ],
            { status: 400 }
          );
        }
      )
    );

    await setup("/verify-email", token);

    await waitFor(
      () => {
        expect(screen.getByTestId("verify-message")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toHaveTextContent(
          "Email already verified"
        );
        expect(screen.getByTestId("verify-message")).toHaveClass(
          "text-red-500"
        );
      },
      { timeout: 2000 }
    );
  });

  it("displays verifying message during verification process", async () => {
    const token = "123e4567-e89b-12d3-a456-426614174000";
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/verifyEmail",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return HttpResponse.json([
            {
              result: {
                data: {
                  message: "Email verified successfully!",
                },
              },
            },
          ]);
        }
      )
    );

    await setup("/verify-email", token);

    await waitFor(() => {
      expect(screen.getByText("Verifying your email...")).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("verify-message")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toHaveTextContent(
          "Email verified successfully!"
        );
      },
      { timeout: 3000 }
    );
  });
});
