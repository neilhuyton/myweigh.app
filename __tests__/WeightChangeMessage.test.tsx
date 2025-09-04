// __tests__/WeightChangeMessage.test.tsx
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
import WeightChangeMessage from "../src/components/WeightChangeMessage";
import { useAuthStore } from "../src/store/authStore";
import { generateToken } from "./utils/token";
import { weightGetWeightsHandler } from "../__mocks__/handlers/weightGetWeights";
import { http, HttpResponse } from "msw";
import { resetWeights } from "../__mocks__/handlers/weightsData";

// Define the type for a tRPC request
interface TRPCRequest {
  path?: string;
  method?: string;
  json?: unknown;
  id?: number;
}

describe("WeightChangeMessage Component", () => {
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

          const isGetWeights =
            parsedBody === null ||
            (Array.isArray(parsedBody) &&
              parsedBody.some(
                (req: TRPCRequest) =>
                  req.path === "weight.getWeights" && req.method === "query"
              ));

          if (isGetWeights) {
            correctedUrl = `${correctedUrl}/weight.getWeights`;
            modifiedOptions = {
              ...options,
              method: "GET",
              body: undefined,
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
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: true,
        userId,
        token: generateToken(userId),
        refreshToken: "valid-refresh-token",
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <WeightChangeMessage />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    server.use(weightGetWeightsHandler);
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
    resetWeights();
  });

  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  it("renders nothing when loading", async () => {
    server.use(
      http.get(
        "http://localhost:8888/.netlify/functions/trpc/weight.getWeights",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return HttpResponse.json(
            { id: 0, result: { type: "data", data: [] } },
            { status: 200 }
          );
        }
      )
    );

    await setup();
    await waitFor(
      () => {
        expect(screen.queryByTestId("weight-change-card")).not.toBeInTheDocument();
        expect(screen.queryByTestId("weight-change-message")).not.toBeInTheDocument();
        expect(screen.queryByTestId("weight-change-error")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("displays error message in card when fetch fails", async () => {
    await setup("error-user-id");
    await waitFor(
      () => {
        expect(screen.getByTestId("weight-change-card")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-error")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-error")).toHaveTextContent(
          "Error: Failed to fetch weights"
        );
        expect(screen.queryByTestId("weight-change-message")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("renders nothing when no data is available", async () => {
    await setup("empty-user-id");
    await waitFor(
      () => {
        expect(screen.queryByTestId("weight-change-card")).not.toBeInTheDocument();
        expect(screen.queryByTestId("weight-change-message")).not.toBeInTheDocument();
        expect(screen.queryByTestId("weight-change-error")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("displays weight loss message in card", async () => {
    await setup("test-user-id");
    await waitFor(
      () => {
        expect(screen.getByTestId("weight-change-card")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toHaveTextContent(
          "You have lost 0.10kg in 1 day"
        );
        expect(screen.queryByTestId("weight-change-error")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("displays weight gain message in card", async () => {
    await setup("gain-user-id");
    await waitFor(
      () => {
        expect(screen.getByTestId("weight-change-card")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toHaveTextContent(
          "You have gained 0.50kg in 1 day"
        );
        expect(screen.queryByTestId("weight-change-error")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("displays no change message in card", async () => {
    await setup("no-change-user-id");
    await waitFor(
      () => {
        expect(screen.getByTestId("weight-change-card")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toHaveTextContent(
          "Your weight has not changed in 1 day"
        );
        expect(screen.queryByTestId("weight-change-error")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("renders nothing when only one weight is available", async () => {
    await setup("single-user-id");
    await waitFor(
      () => {
        expect(screen.queryByTestId("weight-change-card")).not.toBeInTheDocument();
        expect(screen.queryByTestId("weight-change-message")).not.toBeInTheDocument();
        expect(screen.queryByTestId("weight-change-error")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});