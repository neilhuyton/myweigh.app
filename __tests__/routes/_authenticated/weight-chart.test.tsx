import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { useAuthStore } from "@/store/authStore";
import { renderWithProviders } from "../../../__tests__/utils/test-helpers";

vi.mock("@/components/WeightTrendCard", () => ({
  default: () => <div data-testid="weight-trend-card">Weight Trend Card</div>,
}));

describe("WeightChartPage", () => {
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

  it("renders Weight Trend heading", async () => {
    renderWithProviders({ initialEntries: ["/weight-chart"] });

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: "Weight Trend", level: 1 }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("renders WeightTrendCard", async () => {
    renderWithProviders({ initialEntries: ["/weight-chart"] });

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-trend-card")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
