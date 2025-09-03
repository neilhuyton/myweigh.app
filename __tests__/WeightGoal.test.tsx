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
import { act } from "@testing-library/react";
import WeightGoal from "../src/components/WeightGoal";
import {
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
} from "../__mocks__/handlers";
import { useAuthStore } from "../src/store/authStore";
import { generateToken } from "./utils/token";

// Mock GoalList
vi.mock("../src/components/GoalList", () => ({
  default: () => <div data-testid="goal-list">Mocked GoalList</div>,
}));

describe("WeightGoal Component", () => {
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
            <WeightGoal />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  beforeEach(() => {
    server.use(weightGetCurrentGoalHandler, weightSetGoalHandler, weightUpdateGoalHandler);
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

  it("renders WeightGoal with correct content", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.queryByTestId("weight-goal-loading")).not.toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Your Goals" })).toBeInTheDocument();
        expect(screen.getByTestId("current-goal-heading")).toBeInTheDocument();
        expect(screen.getByTestId("current-goal")).toHaveTextContent(/65 kg.*28\/08\/2025/i);
        expect(screen.getByTestId("goal-weight-form")).toBeInTheDocument();
        expect(screen.getByTestId("goal-weight-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
        expect(screen.getByTestId("goal-list")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();

        // Verify Card containers
        const formCard = screen.getByTestId("goal-weight-form").closest("div");
        expect(formCard).toHaveClass("mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm");
        const currentGoalCard = screen.getByTestId("current-goal").closest("div");
        expect(currentGoalCard).toHaveClass("mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm");
        expect(formCard).not.toEqual(currentGoalCard); // Ensure they are different containers
      },
      { timeout: 2000, interval: 100 }
    );
  });

  it("allows user to update a weight goal when logged in", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.queryByTestId("weight-goal-loading")).not.toBeInTheDocument();
        expect(screen.getByTestId("current-goal")).toHaveTextContent(/65 kg.*28\/08\/2025/i);
        expect(screen.getByTestId("goal-weight-form")).toBeInTheDocument();
        expect(screen.getByTestId("goal-weight-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      },
      { timeout: 2000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("goal-weight-input");
      await userEvent.clear(input);
      await userEvent.type(input, "60", { delay: 10 });
      expect(input).toHaveValue(60);
      const form = screen.getByTestId("goal-weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const messageElement = screen.getByTestId("goal-message");
        expect(messageElement).toBeInTheDocument();
        expect(messageElement).toHaveTextContent("Goal updated successfully!");
      },
      { timeout: 5000, interval: 100 }
    );
  });
});