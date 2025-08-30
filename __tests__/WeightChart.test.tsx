// __tests__/WeightChart.test.tsx
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../src/trpc";
import { trpcClient, queryClient } from "../src/client";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { act } from "react";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";
import { router } from "../src/router/router";
import { useAuthStore } from "../src/store/authStore";
import { weightGetWeightsHandler } from "../__mocks__/handlers/weightGetWeights";
import { generateToken } from './utils/token'; // Import from utility

describe("WeightChart Component", () => {
  const setup = async (initialPath = "/weight-chart", userId?: string) => {
    if (userId) {
      useAuthStore.setState({
        isLoggedIn: true,
        userId,
        token: generateToken(userId),
        refreshToken: null,
      });
    }
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      routeTree: router.routeTree,
      history,
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
    console.log("MSW: Starting server");
    server.listen({ onUnhandledRequest: "warn" });
    server.use(weightGetWeightsHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
    });
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
  });

  it("renders WeightChart with correct title and select dropdown", async () => {
    await setup("/weight-chart", "test-user-id");

    await act(async () => {
      await waitFor(
        () => {
          expect(
            screen.getByRole("heading", { name: "Total Weight" })
          ).toBeInTheDocument();
          expect(screen.getByTestId("unit-select")).toHaveTextContent("Daily");
        },
        { timeout: 5000 }
      );
    });
  });

  it("displays error message when fetch fails", async () => {
    await setup("/weight-chart", "error-user-id");

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId("error")).toBeInTheDocument();
          expect(screen.getByTestId("error")).toHaveTextContent(
            "Error: Failed to fetch weights"
          );
        },
        { timeout: 5000 }
      );
    });
  });

  it("displays no measurements message when weights are empty", async () => {
    await setup("/weight-chart", "empty-user-id");

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId("unit-select")).toHaveTextContent("Daily");
          expect(screen.getByTestId("no-data")).toBeInTheDocument();
          expect(screen.getByTestId("no-data")).toHaveTextContent(
            "No weight measurements found"
          );
        },
        { timeout: 5000 }
      );
    });
  });

  it("updates chart data when trend period changes", async () => {
    await setup("/weight-chart", "test-user-id");

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId("unit-select")).toHaveTextContent("Daily");
          expect(screen.getByTestId("chart-mock")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await act(async () => {
      const selectTrigger = screen.getByTestId("unit-select");
      fireEvent.change(selectTrigger, { target: { value: "weekly" } });
    });

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId("unit-select")).toHaveValue("weekly");
          expect(screen.getByTestId("chart-mock")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });
});