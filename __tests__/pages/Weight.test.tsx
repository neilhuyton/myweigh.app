// __tests__/pages/Weight.test.tsx
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
import { trpc } from "../../src/trpc";
import { server } from "../../__mocks__/server";
import "@testing-library/jest-dom";
import { act } from "react";
import Weight from "../../src/pages/Weight";
import { useAuthStore } from "../../src/authStore";
import { generateToken } from "../utils/token";

// Mock WeightForm, WeightList, and WeightChangeMessage
vi.mock("../../src/components/WeightForm", () => ({
  default: () => <div data-testid="weight-form">Mocked WeightForm</div>,
}));

vi.mock("../../src/components/WeightList", () => ({
  default: () => <div data-testid="weight-list">Mocked WeightList</div>,
}));

vi.mock("../../src/components/WeightChangeMessage", () => ({
  default: () => (
    <div data-testid="weight-change-message">Mocked WeightChangeMessage</div>
  ),
}));

// Mock useNavigate to avoid RouterProvider requirement
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock useWeightChange to control message output
vi.mock("../../src/hooks/useWeightChange", () => ({
  useWeightChange: vi.fn(() => ({
    message: null,
    isLoading: false,
    error: null,
  })),
}));

describe("Weight Component", () => {
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
            <Weight />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
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

  it("renders with heading, WeightForm, WeightChangeMessage, and WeightList", async () => {
    await setup();
    await waitFor(() => {
      // Verify the heading
      const heading = screen.getByRole("heading", {
        name: "Your Weight",
        level: 1,
      });
      expect(heading).toBeInTheDocument();

      // Verify WeightForm, WeightChangeMessage, and WeightList are rendered
      expect(screen.getByTestId("weight-form")).toBeInTheDocument();
      expect(screen.getByTestId("weight-form")).toHaveTextContent(
        "Mocked WeightForm"
      );
      expect(screen.getByTestId("weight-change-message")).toBeInTheDocument();
      expect(screen.getByTestId("weight-change-message")).toHaveTextContent(
        "Mocked WeightChangeMessage"
      );
      expect(screen.getByTestId("weight-list")).toBeInTheDocument();
      expect(screen.getByTestId("weight-list")).toHaveTextContent(
        "Mocked WeightList"
      );
    });
  });
});
