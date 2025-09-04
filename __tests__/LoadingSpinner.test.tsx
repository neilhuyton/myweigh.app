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

    // Check SVG
    const svg = spinnerDiv.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-label", "Loading");

    // Check SVG children
    const circle = svg?.querySelector("circle");
    expect(circle).toBeInTheDocument();

    const path = svg?.querySelector("path");
    expect(path).toBeInTheDocument();
    expect(path).toHaveClass("opacity-75");
    expect(path).toHaveAttribute("fill", "currentColor");
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

});
