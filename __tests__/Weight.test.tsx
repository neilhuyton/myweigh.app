import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Weight from "../src/pages/Weight";
import "@testing-library/jest-dom";

// Mock WeightForm and WeightList to isolate Weight component
vi.mock("../src/components/WeightForm", () => ({
  default: () => <div data-testid="weight-form">Mocked WeightForm</div>,
}));

vi.mock("../src/components/WeightList", () => ({
  default: () => <div data-testid="weight-list">Mocked WeightList</div>,
}));

describe("Weight Component", () => {
  it("renders with heading, WeightForm, and WeightList", async () => {
    render(<Weight />);

    await waitFor(() => {
      // Verify the heading
      const heading = screen.getByRole("heading", {
        name: "Your Weight",
        level: 1,
      });
      expect(heading).toBeInTheDocument();

      // Verify WeightForm and WeightList are rendered
      expect(screen.getByTestId("weight-form")).toBeInTheDocument();
      expect(screen.getByTestId("weight-form")).toHaveTextContent(
        "Mocked WeightForm"
      );
      expect(screen.getByTestId("weight-list")).toBeInTheDocument();
      expect(screen.getByTestId("weight-list")).toHaveTextContent(
        "Mocked WeightList"
      );
    });
  });
});
