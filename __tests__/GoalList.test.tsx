import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import GoalList from "../src/components/GoalList";
import { weightGetGoalsHandler } from "../__mocks__/handlers/weightGetGoals";
import { useAuthStore } from "../src/store/authStore";
import { renderWithProviders, setupAuthStore } from "./utils/setup";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";

// Mock LoadingSpinner component
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

describe("GoalList Component", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    server.use(weightGetGoalsHandler);
  });

  afterEach(() => {
    server.resetHandlers();
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

  const setup = async (userId = "test-user-id") => {
    setupAuthStore(userId, {
      isLoggedIn: true,
      userId,
      token: `mock-token-${userId}`,
      refreshToken: "valid-refresh-token",
    });

    await act(async () => {
      renderWithProviders(<GoalList />, { userId });
    });
  };

  it("displays goals in a table when data is available", async () => {
    await setup();

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("goal-list-loading")
        ).not.toBeInTheDocument();
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

  it("displays error message when fetch fails", async () => {
    await setup("error-user-id");

    await waitFor(
      () => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Error: Failed to fetch goals"
        );
      },
      { timeout: 5000 }
    );
  });
});
