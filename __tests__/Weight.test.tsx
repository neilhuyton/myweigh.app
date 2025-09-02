import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Weight from "../src/components/Weight";
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
      expect(heading).toHaveClass(
        "text-2xl font-bold text-foreground text-center"
      );
      expect(heading).toHaveAttribute("aria-level", "1");

      // Verify the container
      const container = heading.closest("div");
      expect(container).toHaveClass("mx-auto max-w-4xl space-y-6 px-4 py-6");

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
