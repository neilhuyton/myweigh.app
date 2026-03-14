import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../utils/test-helpers";
import { useAuthStore } from "@/store/authStore";

vi.mock("@/components/GoalList", () => ({
  default: () => <div data-testid="goal-list">Goal list content</div>,
}));

describe("GoalHistoryPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
      },
      loading: false,
    });
  });

  it("renders Goal History heading", async () => {
    renderWithProviders({ initialEntries: ["/weight-goal/history"] });

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: "Goal History", level: 1 }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("renders back button", async () => {
    renderWithProviders({ initialEntries: ["/weight-goal/history"] });

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /return to weight goals/i }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("back button contains ArrowLeft icon", async () => {
    renderWithProviders({ initialEntries: ["/weight-goal/history"] });

    await waitFor(
      () => {
        const btn = screen.getByRole("button", {
          name: /return to weight goals/i,
        });
        expect(btn.querySelector("svg")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("renders GoalList component", async () => {
    renderWithProviders({ initialEntries: ["/weight-goal/history"] });

    await waitFor(
      () => {
        expect(screen.getByTestId("goal-list")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("navigates to /weight-goal with replace when back button clicked", async () => {
    const result = renderWithProviders({
      initialEntries: ["/weight-goal/history"],
    });

    const router = result.router;
    const mockNavigate = vi.fn();
    vi.spyOn(router, "navigate").mockImplementation(mockNavigate);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /return to weight goals/i }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await user.click(
      screen.getByRole("button", { name: /return to weight goals/i }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/weight-goal",
        replace: true,
      }),
    );
  });
});
