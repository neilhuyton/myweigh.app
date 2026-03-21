import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../utils/test-helpers";
import { useAuthStore } from "@/store/authStore";
import type { User, Session } from "@supabase/supabase-js";

vi.mock("@/features/weight/WeightList", () => ({
  default: () => <div data-testid="weight-list">Weight list content</div>,
}));

describe("WeightHistoryPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: {
        id: "test-user",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
      } as User,
      session: {
        access_token: "mock-token",
        refresh_token: "mock-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: "test-user",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          role: "authenticated",
          created_at: new Date().toISOString(),
        } as User,
      } as Session,
      loading: false,
      error: null,
      isInitialized: true,
    });
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