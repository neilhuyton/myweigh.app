import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../utils/test-helpers";
import { useAuthStore } from "@/store/authStore";
import { suppressActWarnings } from "../../__tests__/act-suppress";

vi.mock("src/routes/_authenticated/route.tsx", () => ({
  Route: {
    beforeLoad: vi.fn(async () => {}),
  },
}));

suppressActWarnings();

vi.mock("@/store/authStore", () => {
  const mockInitialize = vi.fn().mockImplementation(() => {
    return new Promise((resolve) => setTimeout(resolve, 50));
  });

  const mockState = {
    initialize: mockInitialize,
    waitUntilReady: vi.fn().mockResolvedValue(null),
    user: { id: "test-user-123" },
    session: { user: { id: "test-user-123" } },
    isInitialized: true,
  };

  const mockedUseAuthStore = vi.fn(
    (selector?: (state: typeof mockState) => unknown) =>
      selector ? selector(mockState) : mockState,
  );

  Object.defineProperty(mockedUseAuthStore, "getState", {
    value: vi.fn(() => mockState),
    writable: true,
    configurable: true,
  });

  return {
    useAuthStore: mockedUseAuthStore,
  };
});

describe("Email Change Confirmation Page (/email-change)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "location", {
      value: {
        hash: "",
        pathname: "/email-change",
        search: "",
      },
      writable: true,
    });

    Object.defineProperty(window, "history", {
      value: {
        replaceState: vi.fn(),
      },
      writable: true,
    });
  });

  function renderEmailChangePage(customHash = "") {
    if (customHash) {
      window.location.hash = customHash;
    }
    return renderWithProviders({ initialEntries: ["/email-change"] });
  }

  it("renders processing UI initially when hash is empty", async () => {
    renderEmailChangePage();

    await screen.findByText(/Processing/i, {}, { timeout: 2000 });
    expect(screen.getByText(/Please wait a moment/i)).toBeInTheDocument();
  });

  it("calls initialize and shows success UI on empty hash", async () => {
    renderEmailChangePage();

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /Success!/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Email successfully updated/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(useAuthStore.getState().initialize).toHaveBeenCalledTimes(1);
  });

  it("shows error UI immediately when hash contains error param", async () => {
    renderEmailChangePage(
      "#error=access_denied&error_description=Link%20expired",
    );

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /Failed/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/invalid, expired, or already used/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(useAuthStore.getState().initialize).not.toHaveBeenCalled();
  });

  it("shows error UI when error_description contains invalid or expired", async () => {
    renderEmailChangePage("#error_description=token%20expired");

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /Failed/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("shows partial confirmation UI when hash contains confirmation message", async () => {
    renderEmailChangePage(
      "#message=Confirmation%20link%20accepted.%20Please%20proceed%20to%20confirm%20link%20sent%20to%20the%20other%20email",
    );

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /Confirmation Received/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Email change confirmed/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Your new email address is now active/i),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Go to Profile/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(useAuthStore.getState().initialize).not.toHaveBeenCalled();
  });

  it("shows fallback error when initialize fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(useAuthStore.getState().initialize).mockRejectedValueOnce(
      new Error("Session refresh failed"),
    );

    renderEmailChangePage();

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /Failed/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /failed to refresh session.*sign out and sign back in/i,
          ),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    consoleErrorSpy.mockRestore();
  });

  it("clears hash from URL after processing (success case)", async () => {
    renderEmailChangePage("#token=abc123&some=other");

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /Success!/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/email-change",
    );
  });

  it("clears hash from URL even in error case from params", async () => {
    renderEmailChangePage("#error=invalid_request");

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /Failed/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/email-change",
    );
  });
});
