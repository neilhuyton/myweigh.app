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
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import WeightList from "../src/components/WeightList";
import { weightGetWeightsHandler } from "../__mocks__/handlers/weightGetWeights";
import { weightDeleteHandler } from "../__mocks__/handlers/weightDelete";
import { useAuthStore } from "../src/store/authStore";
import { generateToken } from "./utils/token";
import { act } from "@testing-library/react";

// Define the type for a tRPC request
interface TRPCRequest {
  path?: string;
  method?: string;
  json?: unknown;
  id?: number;
}

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
            <WeightList />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
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
    await setup();

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("weight-list-loading")
        ).not.toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("Weight (kg)")).toBeInTheDocument();
        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("70")).toBeInTheDocument();
        expect(screen.getByText("69.9")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("deletes a weight measurement when delete button is clicked", async () => {
    await setup();

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("weight-list-loading")
        ).not.toBeInTheDocument();
        expect(screen.getByText("70")).toBeInTheDocument();
        expect(screen.getByText("69.9")).toBeInTheDocument();
        expect(
          screen.getByRole("button", {
            name: /Delete weight measurement from 01\/10\/2023/i,
          })
        ).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const deleteButton = screen.getByRole("button", {
      name: /Delete weight measurement from 01\/10\/2023/i,
    });
    await act(async () => {
      await userEvent.click(deleteButton);
    });

    await waitFor(
      () => {
        expect(screen.queryByText("70")).not.toBeInTheDocument();
        expect(screen.getByText("69.9")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});