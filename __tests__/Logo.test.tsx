import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "../src/components/Logo";
import "@testing-library/jest-dom";

describe("Logo Component", () => {
  it("renders correctly with SVG and app name", () => {
    render(<Logo />);

    const logoDiv = screen.getByRole("img").parentElement;
    expect(logoDiv).toBeInTheDocument();

    const appName = screen.getByTestId("app-name");
    expect(appName).toBeInTheDocument();
    expect(appName).toHaveTextContent("My Weigh");
  });
});
