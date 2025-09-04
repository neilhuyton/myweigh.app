// __tests__/pages/Goals.test.tsx
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
import Goals from "../../src/pages/Goals";
import { useAuthStore } from "../../src/authStore";
import { generateToken } from "../utils/token";

// Mock child components to isolate Goals component
vi.mock("../../src/components/weight/GoalForm", () => ({
  default: () => <div data-testid="goal-form">Mocked GoalForm</div>,
}));

vi.mock("../../src/components/weight/CurrentGoal", () => ({
  default: () => <div data-testid="current-goal">Mocked CurrentGoal</div>,
}));

vi.mock("../../src/components/weight/GoalList", () => ({
  default: () => <div data-testid="goal-list">Mocked GoalList</div>,
}));

describe("Goals Component", () => {
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
            <Goals />
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

  it("renders with heading, GoalForm, CurrentGoal, and GoalList", async () => {
    await setup();
    await waitFor(() => {
      // Verify the heading
      const heading = screen.getByRole("heading", {
        name: "Your Goals",
        level: 1,
      });
      expect(heading).toBeInTheDocument();

      // Verify GoalForm, CurrentGoal, and GoalList are rendered
      expect(screen.getByTestId("goal-form")).toBeInTheDocument();
      expect(screen.getByTestId("goal-form")).toHaveTextContent(
        "Mocked GoalForm"
      );
      expect(screen.getByTestId("current-goal")).toBeInTheDocument();
      expect(screen.getByTestId("current-goal")).toHaveTextContent(
        "Mocked CurrentGoal"
      );
      expect(screen.getByTestId("goal-list")).toBeInTheDocument();
      expect(screen.getByTestId("goal-list")).toHaveTextContent(
        "Mocked GoalList"
      );
    });
  });
});
