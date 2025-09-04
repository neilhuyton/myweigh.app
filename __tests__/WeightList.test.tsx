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
import { resetWeights } from "../__mocks__/handlers/weightsData";
import type { ButtonHTMLAttributes } from "react";

// Mock LoadingSpinner component
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Trash2: () => <div data-testid="trash-2-icon" />,
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({
    onClick,
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
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

    render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <WeightList />
        </QueryClientProvider>
      </trpc.Provider>
    );
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
    server.use(weightGetWeightsHandler, weightDeleteHandler);
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

  it("displays weight measurements in a table", async () => {
    await setup();

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("weight-list-loading")
        ).not.toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("70.00")).toBeInTheDocument();
        expect(screen.getByText("69.90")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("deletes a weight measurement when delete button is clicked", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("70.00")).toBeInTheDocument();
        expect(screen.getByText("69.90")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const deleteButton = screen.getByTestId(
      "delete-button-550e8400-e29b-41d4-a716-446655440000"
    );

    await userEvent.click(deleteButton);

    await waitFor(
      () => {
        expect(screen.queryByText("70.00")).not.toBeInTheDocument();
        expect(screen.getByText("69.90")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
