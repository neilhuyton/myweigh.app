import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useAuthStore } from "@/store/authStore";
import { suppressActWarnings } from "../../../__tests__/act-suppress";
import { renderWithProviders } from "../../utils/test-helpers";

suppressActWarnings();

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

const createMockAuthState = (overrides = {}) => ({
  user: null,
  session: null,
  loading: false,
  error: null,
  isInitialized: true,
  initialize: vi.fn().mockResolvedValue(undefined),
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  waitUntilReady: vi.fn().mockResolvedValue(null),
  updateUserEmail: vi.fn().mockResolvedValue({ error: null }),
  updateUserPassword: vi.fn().mockResolvedValue({ error: null }),
  setSession: vi.fn(),
  ...overrides,
});

describe("Authenticated Layout Route (/_authenticated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = createMockAuthState();
      return selector ? selector(state) : state;
    });
  });

  it("shows loading screen when loading is true", async () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = createMockAuthState({ loading: true });
      return selector ? selector(state) : state;
    });

    vi.mocked(useAuthStore).getState = vi.fn().mockReturnValue(
      createMockAuthState({ loading: true })
    );

    renderWithProviders({ initialEntries: ["/home"] });

    await waitFor(() => {
      expect(screen.getByText("Loading session...")).toBeInTheDocument();
    });
  });

  it("does not redirect immediately when loading is true", async () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = createMockAuthState({ loading: true });
      return selector ? selector(state) : state;
    });

    vi.mocked(useAuthStore).getState = vi.fn().mockReturnValue(
      createMockAuthState({ loading: true })
    );

    const { router } = renderWithProviders({ initialEntries: ["/home"] });

    await new Promise((r) => setTimeout(r, 400));

    expect(router.state.location.pathname).not.toBe("/login");
    expect(screen.getByText("Loading session...")).toBeInTheDocument();
  });

  it("renders ProfileIcon in the header when authenticated", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };

    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = createMockAuthState({ user: mockUser, loading: false });
      return selector ? selector(state) : state;
    });

    vi.mocked(useAuthStore).getState = vi.fn().mockReturnValue(
      createMockAuthState({ user: mockUser, loading: false })
    );

    renderWithProviders({ initialEntries: ["/home"] });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /profile/i }),
      ).toBeInTheDocument();
    });
  });

  it("navigates to /profile when ProfileIcon is clicked", async () => {
    const user = userEvent.setup();

    const mockUser = { id: "user-123", email: "test@example.com" };

    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = createMockAuthState({ user: mockUser, loading: false });
      return selector ? selector(state) : state;
    });

    vi.mocked(useAuthStore).getState = vi.fn().mockReturnValue(
      createMockAuthState({ user: mockUser, loading: false })
    );

    const { router } = renderWithProviders({ initialEntries: ["/home"] });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /profile/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /profile/i }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/profile");
    });
  });
});