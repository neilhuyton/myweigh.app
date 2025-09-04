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
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import GoalForm from "../src/components/GoalForm";
import { weightGetCurrentGoalHandler } from "../__mocks__/handlers";
import { renderWithProviders } from "./utils/setup";

// Mock LoadingSpinner
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

describe("GoalForm Component", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
    server.use(weightGetCurrentGoalHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
  });

  it("renders GoalForm with correct content", async () => {
    renderWithProviders(<GoalForm />);

    await waitFor(
      () => {
        expect(screen.getByTestId("goal-weight-label")).toHaveTextContent(
          "Goal Weight (kg)"
        );
        expect(screen.getByTestId("goal-weight-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
        expect(screen.queryByTestId("goal-message")).not.toBeInTheDocument();
      },
      { timeout: 1000, interval: 100 }
    );
  });
});
