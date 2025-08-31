// __tests__/Navigation.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Navigation from "../src/components/Navigation";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { act } from "react";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  HomeIcon: () => <div data-testid="home-icon" />,
  ScaleIcon: () => <div data-testid="scale-icon" />,
  LineChartIcon: () => <div data-testid="line-chart-icon" />,
  TargetIcon: () => <div data-testid="target-icon" />,
}));

describe("Navigation Component", () => {
  const setup = async (initialPath = "/") => {
    // Define a minimal route tree
    const rootRoute = createRootRoute({
      component: () => <Navigation />,
    });

    // const homeRoute = createRoute({
    //   getParentRoute: () => rootRoute,
    //   path: "/",
    // });

    const weightRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/weight",
    });

        const goalsRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/weight-goal",
    });

    const chartRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/weight-chart",
    });



    const routeTree = rootRoute.addChildren([
      // homeRoute,
      weightRoute,
      goalsRoute,
      chartRoute,
    ]);

    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      routeTree,
      history,
    });

    await act(async () => {
      render(<RouterProvider router={testRouter} />);
    });

    return { history, testRouter };
  };

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("renders all navigation links correctly", async () => {
    await setup("/");

    // Check that all links are rendered using aria-label
    expect(screen.getByRole("link", { name: "Navigate to Weight" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Navigate to Chart" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Navigate to Goals" })).toBeInTheDocument();

    // Check href attributes
    expect(screen.getByRole("link", { name: "Navigate to Weight" })).toHaveAttribute("href", "/weight");
    expect(screen.getByRole("link", { name: "Navigate to Chart" })).toHaveAttribute("href", "/weight-chart");
    expect(screen.getByRole("link", { name: "Navigate to Goals" })).toHaveAttribute("href", "/weight-goal");

    // Check text content of links
    expect(screen.getByRole("link", { name: "Navigate to Weight" })).toHaveTextContent("Weight");
    expect(screen.getByRole("link", { name: "Navigate to Chart" })).toHaveTextContent("Chart");
    expect(screen.getByRole("link", { name: "Navigate to Goals" })).toHaveTextContent("Goals");

    // Check icons are rendered
    expect(screen.getByTestId("scale-icon")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart-icon")).toBeInTheDocument();
    expect(screen.getByTestId("target-icon")).toBeInTheDocument();
  });

  it("applies active styles to the current route", async () => {
    await setup("/weight");

    await act(async () => {
      const weightLink = screen.getByRole("link", { name: "Navigate to Weight" });
      expect(weightLink).toHaveClass("font-semibold");
      expect(weightLink).toHaveClass("bg-muted");

      // Verify other links do not have active styles
      const homeLink = screen.getByRole("link", { name: "Navigate to Goals" });
      expect(homeLink).not.toHaveClass("font-semibold");
      expect(homeLink).not.toHaveClass("bg-muted");
    });
  });

  it("triggers navigation when a link is clicked", async () => {
    const { history } = await setup("/");

    const weightLink = screen.getByRole("link", { name: "Navigate to Weight" });
    await act(async () => {
      fireEvent.click(weightLink);
    });

    // Check that the router navigated to the correct route
    expect(history.location.pathname).toBe("/weight");
    expect(weightLink).toHaveAttribute("href", "/weight");
  });
});