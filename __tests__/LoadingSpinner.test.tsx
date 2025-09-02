import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../src/components/LoadingSpinner";
import "@testing-library/jest-dom";

// Mock the cn utility from @/lib/utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "), // Simple class name joiner
}));

describe("LoadingSpinner Component", () => {
  it("renders with default props (size=md, default testId)", () => {
    render(<LoadingSpinner />);

    // Check outer div
    const spinnerDiv = screen.getByTestId("loading-spinner");
    expect(spinnerDiv).toBeInTheDocument();
    expect(spinnerDiv).toHaveClass("flex justify-center items-center");

    // Check SVG
    const svg = spinnerDiv.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("animate-spin text-primary h-8 w-8"); // size="md" -> h-8 w-8
    expect(svg).toHaveAttribute("aria-label", "Loading");

    // Check SVG children
    const circle = svg?.querySelector("circle");
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveClass("opacity-25");
    expect(circle).toHaveAttribute("cx", "12");
    expect(circle).toHaveAttribute("cy", "12");
    expect(circle).toHaveAttribute("r", "10");
    expect(circle).toHaveAttribute("stroke", "currentColor");
    expect(circle).toHaveAttribute("stroke-width", "4");

    const path = svg?.querySelector("path");
    expect(path).toBeInTheDocument();
    expect(path).toHaveClass("opacity-75");
    expect(path).toHaveAttribute("fill", "currentColor");
  });

  it("applies custom className to outer div", () => {
    render(<LoadingSpinner className="custom-class" />);

    const spinnerDiv = screen.getByTestId("loading-spinner");
    expect(spinnerDiv).toHaveClass(
      "flex justify-center items-center custom-class"
    );
  });

  it("applies correct size classes for size=sm", () => {
    render(<LoadingSpinner size="sm" />);

    const spinnerDiv = screen.getByTestId("loading-spinner");
    const svg = spinnerDiv.querySelector("svg");
    expect(svg).toHaveClass("animate-spin text-primary h-6 w-6"); // size="sm" -> h-6 w-6
  });

  it("applies correct size classes for size=lg", () => {
    render(<LoadingSpinner size="lg" />);

    const spinnerDiv = screen.getByTestId("loading-spinner");
    const svg = spinnerDiv.querySelector("svg");
    expect(svg).toHaveClass("animate-spin text-primary h-12 w-12"); // size="lg" -> h-12 w-12
  });

  it("uses custom testId", () => {
    render(<LoadingSpinner testId="custom-spinner" />);

    const spinnerDiv = screen.getByTestId("custom-spinner");
    expect(spinnerDiv).toBeInTheDocument();
    expect(spinnerDiv).toHaveClass("flex justify-center items-center");

    const svg = spinnerDiv.querySelector("svg");
    expect(svg).toHaveClass("animate-spin text-primary h-8 w-8"); // Default size="md"
  });
});
