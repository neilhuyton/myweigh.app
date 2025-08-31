// __tests__/WeightList.test.tsx
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
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { act } from "react";
import WeightList from "../src/components/WeightList";
import { weightGetWeightsHandler } from "../__mocks__/handlers/weightGetWeights";
import { weightDeleteHandler } from "../__mocks__/handlers/weightDelete";
import { useAuthStore } from "../src/store/authStore";
import { generateToken } from "./utils/token"; // Import from utility

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Trash2: () => <div data-testid="trash-icon" />,
}));

describe("WeightList Component", () => {
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
            ...(useAuthStore.getState().token
              ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
              : {}),
          };
          return fetch(url, {
            ...options,
            headers,
            method: "POST",
          });
        },
      }),
    ],
  });

  const setup = async (
    initialPath: string = "/weights",
    userId = "test-user-id"
  ) => {
    // Set auth state for handlers
    useAuthStore.setState({
      isLoggedIn: true,
      userId,
      token: generateToken(userId),
      refreshToken: "valid-refresh-token",
      login: vi.fn(),
      logout: vi.fn(),
    });

    // Define a minimal route tree
    const rootRoute = createRootRoute({
      component: () => <WeightList />,
    });

    const weightsRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/weights",
    });

    const routeTree = rootRoute.addChildren([weightsRoute]);

    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      routeTree,
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
    server.listen({ onUnhandledRequest: "warn" });
    server.use(weightGetWeightsHandler, weightDeleteHandler);
    vi.spyOn(window, "confirm").mockImplementation(() => true);
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
    document.body.innerHTML = "";
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  it("displays weight measurements in a table", async () => {
    await setup("/weights");

    await waitFor(
      () => {
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("Weight (kg)")).toBeInTheDocument();
        // expect(screen.getByText("Note")).toBeInTheDocument();
        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("70")).toBeInTheDocument();
        // expect(screen.getByText("Morning weigh-in")).toBeInTheDocument();
        expect(screen.getByText("69.5")).toBeInTheDocument();
        // expect(screen.getByText("Evening weigh-in")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("deletes a weight measurement when delete button is clicked", async () => {
    await setup("/weights");

    await waitFor(
      () => {
        expect(screen.getByText("70")).toBeInTheDocument();
        // expect(screen.getByText("Morning weigh-in")).toBeInTheDocument();
        expect(screen.getByText("69.5")).toBeInTheDocument();
        // expect(screen.getByText("Evening weigh-in")).toBeInTheDocument();
        expect(
          screen.getByRole("button", {
            name: /Delete weight measurement from 01\/10\/2023/i,
          })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    await act(async () => {
      const deleteButton = screen.getByRole("button", {
        name: /Delete weight measurement from 01\/10\/2023/i,
      });
      fireEvent.click(deleteButton);
    });
  });
});
