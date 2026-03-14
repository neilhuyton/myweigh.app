import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../utils/test-helpers";
import { useAuthStore } from "@/store/authStore";

vi.mock("@/components/CurrentGoalCard", () => ({
  default: () => <div data-testid="current-goal-card">Current Goal Card</div>,
}));

describe("WeightGoalPage", () => {
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

  it("renders Weight Goals heading", async () => {
    renderWithProviders({ initialEntries: ["/weight-goal"] });

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: "Weight Goals", level: 1 }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("renders CurrentGoalCard", async () => {
    renderWithProviders({ initialEntries: ["/weight-goal"] });

    await waitFor(
      () => {
        expect(screen.getByTestId("current-goal-card")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("renders View Goal History button as link", async () => {
    renderWithProviders({ initialEntries: ["/weight-goal"] });

    await waitFor(
      () => {
        expect(
          screen.getByRole("link", { name: "View Goal History" }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("View Goal History link has correct styling classes", async () => {
    renderWithProviders({ initialEntries: ["/weight-goal"] });

    await waitFor(
      () => {
        const link = screen.getByRole("link", { name: "View Goal History" });
        expect(link).toHaveClass("border-primary");
        expect(link).toHaveClass("text-primary");
        expect(link).toHaveClass("hover:bg-primary/10");
        expect(link).toHaveClass("hover:text-primary");
      },
      { timeout: 2000 },
    );
  });

  it("navigates to /weight-goal/history when View Goal History is clicked", async () => {
    const result = renderWithProviders({ initialEntries: ["/weight-goal"] });

    const router = result.router;
    const mockNavigate = vi.fn();
    vi.spyOn(router, "navigate").mockImplementation(mockNavigate);

    await waitFor(
      () => {
        expect(
          screen.getByRole("link", { name: "View Goal History" }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await user.click(screen.getByRole("link", { name: "View Goal History" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/weight-goal/history",
      }),
    );
  });
});
