import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { act } from "@testing-library/react";
import GoalList from "../src/components/GoalList";
import { weightGetGoalsHandler } from "../__mocks__/handlers/weightGetGoals";
import { useAuthStore } from "../src/store/authStore";
import { generateToken } from "./utils/token";
import { http, HttpResponse } from "msw";

// Define the type for a tRPC request
interface TRPCRequest {
  path?: string;
  method?: string;
  json?: unknown;
  id?: number;
}

// Mock LoadingSpinner component
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

describe("GoalList Component", () => {
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
        fetch: async (url, options = {}) => {
          let correctedUrl = "http://localhost:8888/.netlify/functions/trpc";
          let modifiedOptions = { ...options };
          let parsedBody;
          try {
            parsedBody = options.body
              ? JSON.parse(options.body as string)
              : null;
          } catch {
            parsedBody = null;
          }

          const isGetGoals =
            parsedBody === null ||
            (Array.isArray(parsedBody) &&
              parsedBody.some(
                (req: TRPCRequest) =>
                  req.path === "weight.getGoals" && req.method === "query"
              ));

          if (isGetGoals) {
            correctedUrl = `${correctedUrl}/weight.getGoals`;
            modifiedOptions = {
              ...options,
              method: "GET",
              body: undefined, // GET requests don't have a body
            };
          } else {
            modifiedOptions = {
              ...options,
              method: "POST",
              body: options.body,
            };
          }

          const response = await fetch(correctedUrl, modifiedOptions);
          const json = await response.json();
          return new Response(JSON.stringify(json), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        },
        headers: () => ({
          "content-type": "application/json",
          ...(useAuthStore.getState().token
            ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
            : {}),
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
            <GoalList />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    server.use(weightGetGoalsHandler);
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

  it("displays loading state while fetching goals", async () => {
    // Clear cache to force a fresh fetch
    queryClient.clear();

    // Mock handler with delay to ensure loading state is visible
    server.use(
      http.get(
        "http://localhost:8888/.netlify/functions/trpc/weight.getGoals",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return HttpResponse.json(
            { id: 0, result: { type: "data", data: [] } },
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      )
    );

    await setup();

    // Check for spinner immediately after setup
    expect(screen.getByTestId("goal-list-loading")).toBeInTheDocument();

    // Wait for the fetch to complete and ensure spinner disappears
    await waitFor(
      () => {
        expect(screen.queryByTestId("goal-list-loading")).not.toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("No weight goals found")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("displays goals in a table when data is available", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.queryByTestId("goal-list-loading")).not.toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("Goal Weight (kg)")).toBeInTheDocument();
        expect(screen.getByText("Set Date")).toBeInTheDocument();
        expect(screen.getByText("Reached Date")).toBeInTheDocument();
        expect(screen.getByText("65.00")).toBeInTheDocument();
        expect(screen.getByText("70.00")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("displays 'No weight goals found' when goals array is empty", async () => {
    await setup("empty-user-id");

    await waitFor(
      () => {
        expect(screen.queryByTestId("goal-list-loading")).not.toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("No weight goals found")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("displays error message when fetch fails", async () => {
    await setup("error-user-id");

    await waitFor(
      () => {
        expect(screen.queryByTestId("goal-list-loading")).not.toBeInTheDocument();
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Error: Failed to fetch goals"
        );
      },
      { timeout: 5000 }
    );
  });
});