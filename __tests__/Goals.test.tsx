// __tests__/Goals.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Goals from "../src/pages/Goals";
import "@testing-library/jest-dom";

// Mock GoalForm, CurrentGoal, and GoalList to isolate Goals component
vi.mock("../src/components/GoalForm", () => ({
  default: () => <div data-testid="goal-form">Mocked GoalForm</div>,
}));

vi.mock("../src/components/CurrentGoal", () => ({
  default: () => <div data-testid="current-goal">Mocked CurrentGoal</div>,
}));

vi.mock("../src/components/GoalList", () => ({
  default: () => <div data-testid="goal-list">Mocked GoalList</div>,
}));

describe("Goals Component", () => {
  it("renders with heading, GoalForm, CurrentGoal, and GoalList", async () => {
    render(<Goals />);

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
