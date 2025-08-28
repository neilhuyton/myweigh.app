// __tests__/WeightGoal.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { router } from "../src/router/router";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { useAuthStore } from "../src/store/authStore";
import { act } from "react";

// Define the expected shape of the TRPC request body
interface TRPCRequestBody {
  [key: string]: {
    id?: number;
    path: string;
    input?: { goalWeightKg: number } | undefined;
  };
}

describe("WeightGoal Component", () => {
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
          return fetch(url, { ...options, signal: options?.signal ?? null });
        },
      }),
    ],
  });

  const setup = async (initialPath: string = "/weight-goal") => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
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

    return { history, queryClient };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null });
    queryClient.clear();
  });

  afterAll(() => {
    server.close();
  });

  it("allows user to set a weight goal when logged in", async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: "test-user-id" });

    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc",
        async ({ request }) => {
          const headers = Object.fromEntries(request.headers.entries());
          const body = (await request.json()) as TRPCRequestBody;
          const query = body["0"];

          if (query.path === "weight.getGoal") {
            if (headers["authorization"] !== "Bearer test-user-id") {
              return HttpResponse.json(
                [
                  {
                    error: {
                      message: "Unauthorized: User must be logged in",
                      code: -32001,
                      data: {
                        code: "UNAUTHORIZED",
                        httpStatus: 401,
                        path: "weight.getGoal",
                      },
                    },
                  },
                ],
                { status: 401 }
              );
            }
            return HttpResponse.json([
              {
                result: {
                  data: { goalWeightKg: 65 },
                },
              },
            ]);
          }

          if (query.path === "weight.setGoal") {
            const input = query.input;
            if (headers["authorization"] !== "Bearer test-user-id") {
              return HttpResponse.json(
                [
                  {
                    id: query.id ?? 0,
                    error: {
                      message: "Unauthorized: User must be logged in",
                      code: -32001,
                      data: {
                        code: "UNAUTHORIZED",
                        httpStatus: 401,
                        path: "weight.setGoal",
                      },
                    },
                  },
                ],
                { status: 401 }
              );
            }
            if (!input || input.goalWeightKg <= 0) {
              return HttpResponse.json(
                [
                  {
                    id: query.id ?? 0,
                    error: {
                      message: "Goal weight must be a positive number",
                      code: -32001,
                      data: {
                        code: "BAD_REQUEST",
                        httpStatus: 400,
                        path: "weight.setGoal",
                      },
                    },
                  },
                ],
                { status: 400 }
              );
            }
            return HttpResponse.json([
              {
                id: query.id ?? 0,
                result: {
                  data: { goalWeightKg: input.goalWeightKg },
                },
              },
            ]);
          }

          return HttpResponse.json(
            [
              {
                error: {
                  message: "Unknown endpoint",
                  code: -32001,
                  data: {
                    code: "NOT_FOUND",
                    httpStatus: 404,
                    path: query.path,
                  },
                },
              },
            ],
            { status: 404 }
          );
        }
      )
    );

    await act(async () => {
      await setup("/weight-goal");
    });

    await act(async () => {
      await waitFor(
        () => {
          expect(
            screen.getByRole("heading", { name: "Set Weight Goal" })
          ).toBeInTheDocument();
          expect(screen.getByText("Current Goal: 65 kg")).toBeInTheDocument();
          expect(
            screen.getByPlaceholderText("Enter your goal weight (kg)")
          ).toBeInTheDocument();
          expect(
            screen.getByRole("button", { name: "Set Goal" })
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    await act(async () => {
      fireEvent.change(
        screen.getByPlaceholderText("Enter your goal weight (kg)"),
        {
          target: { value: "60" },
        }
      );
      fireEvent.click(screen.getByRole("button", { name: "Set Goal" }));
    });

    await act(async () => {
      await waitFor(
        () => {
          expect(
            screen.getByText("Goal set successfully!")
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });
});
