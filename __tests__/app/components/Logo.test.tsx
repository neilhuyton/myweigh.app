// __tests__/Logo.test.tsx

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "@/app/components/Logo";

describe("Logo", () => {
  it("renders the SVG logo with correct accessibility attributes", () => {
    render(<Logo />);

    const svg = screen.getByRole("img", { name: /My Weigh App Logo/i });

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-label", "My Weigh App Logo");
    expect(svg.tagName).toBe("svg");
  });

  it("renders the app name text", () => {
    render(<Logo />);

    const appName = screen.getByTestId("app-name");

    expect(appName).toBeInTheDocument();
    expect(appName).toHaveTextContent("My Weigh App");
    expect(appName.tagName).toBe("H2");
  });

  it("renders both the icon and the text together", () => {
    render(<Logo />);

    expect(
      screen.getByRole("img", { name: /My Weigh App Logo/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("My Weigh App")).toBeInTheDocument();
  });

  it("does not render anything unexpected", () => {
    render(<Logo />);

    expect(
      screen.queryByText(/something not in the logo/i),
    ).not.toBeInTheDocument();
  });
});
