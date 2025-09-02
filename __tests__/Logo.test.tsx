import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "../src/components/Logo";
import "@testing-library/jest-dom";

describe("Logo Component", () => {
  it("renders correctly with SVG and app name", () => {
    render(<Logo />);

    // Check outer div
    const logoDiv = screen.getByRole("img").parentElement;
    expect(logoDiv).toBeInTheDocument();
    expect(logoDiv).toHaveClass("flex flex-col items-center");

    // Check SVG
    const svg = screen.getByRole("img", { name: "My Weigh App Logo" });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("stroke-width", "2");
    expect(svg).toHaveAttribute("stroke-linecap", "round");
    expect(svg).toHaveAttribute("stroke-linejoin", "round");
    expect(svg).toHaveAttribute("aria-label", "My Weigh App Logo");
    expect(svg).toHaveAttribute("role", "img");

    // Check SVG children
    const paths = svg.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0]).toHaveAttribute(
      "d",
      "M12 2a10 10 0 0 1 10 10c0 2.757-1.12 5.248-2.93 7.048M12 2a10 10 0 0 0-10 10c0 2.757 1.12 5.248 2.93 7.048M12 2v2m0 16v2"
    );
    expect(paths[1]).toHaveAttribute(
      "d",
      "M12 6a6 6 0 0 0-6 6c0 1.657.672 3.157 1.757 4.243M12 6a6 6 0 0 1 6 6c0 1.657-.672 3.157-1.757 4.243"
    );

    const circle = svg.querySelector("circle");
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute("cx", "12");
    expect(circle).toHaveAttribute("cy", "12");
    expect(circle).toHaveAttribute("r", "2");

    // Check h2
    const appName = screen.getByTestId("app-name");
    expect(appName).toBeInTheDocument();
    expect(appName).toHaveTextContent("My Weigh");
    expect(appName).toHaveClass("text-xl font-semibold text-center mt-2");
  });
});
