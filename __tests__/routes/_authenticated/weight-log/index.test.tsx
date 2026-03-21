import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../utils/test-helpers";
import { useAuthStore } from "@/store/authStore";
import type { User, Session } from "@supabase/supabase-js";

vi.mock("@/features/weight/CurrentWeightCard", () => ({
  default: () => (
    <div data-testid="current-weight-card">Mock CurrentWeightCard</div>
  ),
}));

describe("Weight Log Page (/_authenticated/weight-log/)", () => {
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

  function renderWeightLogPage() {
    return renderWithProviders({ initialEntries: ["/weight-log"] });
  }

  it("renders page title correctly", async () => {
    renderWeightLogPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Weight Entry",
          level: 1,
        }),
      ).toBeInTheDocument();
    });
  });

  it("renders CurrentWeightCard component", async () => {
    renderWeightLogPage();

    await waitFor(() => {
      expect(screen.getByTestId("current-weight-card")).toBeInTheDocument();
    });
  });

  it("renders 'View Weight History' button as a link", async () => {
    renderWeightLogPage();

    await waitFor(() => {
      const link = screen.getByRole("link", {
        name: "View Weight History",
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/weight-log/history");
      expect(link).toHaveClass("border-primary");
      expect(link).toHaveClass("text-primary");
    });
  });
});
