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
import { useAuthStore } from "../src/store/authStore";
import { act } from "react";

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
        headers: () => {
          const headers = {
            authorization: `Bearer ${useAuthStore.getState().token}`,
          };
          console.log("trpc client: Sending request with headers:", headers);
          return headers;
        },
        fetch: async (url, options) => {
          console.log("trpc client: Sending request:", {
            url,
            headers: options?.headers,
          });
          return fetch(url, { ...options });
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

    console.log("Test: Rendering with userId:", useAuthStore.getState().userId);
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
    server.listen({
      onUnhandledRequest: (request) => {
        console.error(
          "Test: Unhandled request:",
          request.url,
          request.method,
          request.headers.get("authorization")
        );
        throw new Error(
          `Unhandled ${request.method} request to ${request.url}`
        );
      },
    });
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
    await act(async () => {
      useAuthStore.setState({ isLoggedIn: true, userId: "test-user-id" });
      await setup("/weight-goal");
    });

    await waitFor(
      () => {
        // Check for errors first
        const error = screen.queryByRole("alert", {
          name: /Error loading goal/i,
        });
        if (error) {
          console.log("Test: Error found in DOM:", error.textContent);
          screen.debug();
          throw new Error(`Error in useWeightGoal: ${error.textContent}`);
        }

        // Check DOM before asserting
        // if (screen.queryByTestId("weight-goal-loading")) {
        //   console.log("Test: Loading spinner still present");
        //   screen.debug();
        // }

        // Wait for loading spinner to disappear
        // expect(screen.queryByTestId("weight-goal-loading")).not.toBeInTheDocument();

        // Verify expected content
        const heading = screen.queryByRole("heading", { name: "Weight Goal" });
        // if (!heading) {
        //   console.log("Test: Heading not found");
        //   screen.debug();
        // }
        expect(heading).toBeInTheDocument();
        // expect(screen.getByText(/Current Goal: 65 kg/)).toBeInTheDocument();
        // expect(screen.getByPlaceholderText("Enter your goal weight (kg)")).toBeInTheDocument();
        // expect(screen.getByRole("button", { name: /Set Goal/i })).toBeInTheDocument();
      },
      { timeout: 20000 } // Increased timeout
    );

    await act(async () => {
      fireEvent.change(
        screen.getByPlaceholderText("Enter your goal weight (kg)"),
        {
          target: { value: "60" },
        }
      );
      fireEvent.click(screen.getByRole("button", { name: /Set Goal/i }));
    });

    await waitFor(
      () => {
        expect(screen.getByText("Goal set successfully!")).toBeInTheDocument();
      },
      { timeout: 20000 }
    );
  });
});
