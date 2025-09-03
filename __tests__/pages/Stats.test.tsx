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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { trpc } from "../../src/trpc";
import { server } from "../../__mocks__/server";
import "@testing-library/jest-dom";
import { act } from "react";
import WeightChart from "../../src/pages/Stats";
import { useAuthStore } from "../../src/store/authStore";
import { generateToken } from "../utils/token";
import {
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
} from "../../__mocks__/handlers";

// Mock lucide-react icons
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
    Loader2: () => <div data-testid="loading-spinner" />,
    ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
  };
});

describe("WeightChart Component", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpLink({
        url: "http://localhost:8888/.netlify/functions/trpc",
        headers: () => ({
          "content-type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        }),
      }),
    ],
  });

  const setup = async (userId = "test-user-id") => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId,
      token: generateToken(userId),
      refreshToken: "valid-refresh-token",
      login: vi.fn(),
      logout: vi.fn(),
    });

    await act(async () => {
      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div style={{ width: "800px", height: "600px" }}>
              <WeightChart />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
    server.use(weightGetWeightsHandler, weightGetCurrentGoalHandler);
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
  });

  it("renders WeightChart with correct title and select dropdown", async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByTestId("unit-select")).toHaveTextContent("Daily");
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Your Stats"
      );
    });
  });

  it("displays error message when fetch fails", async () => {
    await setup("error-user-id");
    await waitFor(
      () => {
        expect(screen.getByTestId("error")).toBeInTheDocument();
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Error: Failed to fetch weights"
        );
      },
      { timeout: 2000 }
    );
  });

  it("displays no measurements message when weights are empty", async () => {
    await setup("empty-user-id");
    await waitFor(
      () => {
        expect(screen.getByTestId("no-data")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("updates chart data when trend period changes", async () => {
    await setup();
    await waitFor(
      () => {
        expect(screen.getByTestId("chart-mock")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    await act(async () => {
      const select = screen.getByTestId("unit-select");
      fireEvent.change(select, { target: { value: "weekly" } });
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("chart-mock")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("displays latest weight card when weights are available", async () => {
    await setup();
    await waitFor(
      () => {
        expect(screen.getByTestId("latest-weight-card")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("does not display latest weight card when weights are empty", async () => {
    await setup("empty-user-id");
    await waitFor(
      () => {
        expect(screen.getByTestId("no-data")).toBeInTheDocument();
        expect(
          screen.queryByTestId("latest-weight-card")
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("displays goal weight card when goal is available", async () => {
    await setup();
    await waitFor(
      () => {
        expect(screen.getByTestId("goal-weight-card")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("does not display goal weight card when no goal exists", async () => {
    await setup("empty-user-id");
    await waitFor(
      () => {
        expect(screen.getByTestId("no-data")).toBeInTheDocument();
        expect(
          screen.queryByTestId("goal-weight-card")
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
