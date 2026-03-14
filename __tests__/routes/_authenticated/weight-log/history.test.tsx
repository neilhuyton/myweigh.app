import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../utils/test-helpers";

vi.mock("@/components/WeightList", () => ({
  default: () => <div data-testid="weight-list">Weight list content</div>,
}));

describe("WeightHistoryPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Weight History heading", async () => {
    renderWithProviders({ initialEntries: ["/weight-log/history"] });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Weight History", level: 1 })
      ).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("renders back button", async () => {
    renderWithProviders({ initialEntries: ["/weight-log/history"] });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /return to weight entry/i })
      ).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("back button contains ArrowLeft icon", async () => {
    renderWithProviders({ initialEntries: ["/weight-log/history"] });

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /return to weight entry/i });
      expect(btn.querySelector("svg")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("renders WeightList component", async () => {
    renderWithProviders({ initialEntries: ["/weight-log/history"] });

    await waitFor(() => {
      expect(screen.getByTestId("weight-list")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("navigates to /weight-log with replace when back button clicked", async () => {
    const result = renderWithProviders({ initialEntries: ["/weight-log/history"] });

    const router = result.router;
    const mockNavigate = vi.fn();
    vi.spyOn(router, "navigate").mockImplementation(mockNavigate);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /return to weight entry/i })
      ).toBeInTheDocument();
    }, { timeout: 2000 });

    await user.click(
      screen.getByRole("button", { name: /return to weight entry/i })
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/weight-log",
        replace: true,
      })
    );
  });
});