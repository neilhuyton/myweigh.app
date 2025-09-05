import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { act } from "@testing-library/react";
import Profile from "../src/components/Profile";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  useNavigate,
} from "@tanstack/react-router";
import { renderWithProviders, setupAuthStore } from "./utils/setup";
import { useAuthStore } from "../src/authStore";
import {
  resetPasswordRequestHandler,
  userUpdateEmailHandler,
} from "../__mocks__/handlers";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  MailIcon: () => <div data-testid="mail-icon" />,
  LockIcon: () => <div data-testid="lock-icon" />,
  LogOutIcon: () => <div data-testid="logout-icon" />,
  Loader2: () => <div data-testid="loading-spinner" />,
}));

// Mock LoadingSpinner component
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId} />
  ),
}));

// Mock useNavigate
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn(() => undefined)),
  };
});

describe("Profile Component", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
    server.use(userUpdateEmailHandler, resetPasswordRequestHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    document.body.innerHTML = "";
    // Reset auth store to ensure clean state
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterAll(() => {
    server.close();
  });

  const setup = async (userId = "test-user-id", initialPath = "/profile") => {
    const mockLogout = vi.fn(() => {
      useAuthStore.setState({
        isLoggedIn: false,
        userId: null,
        token: null,
        refreshToken: null,
      });
    });

    const rootRoute = createRootRoute({
      component: () => <Profile />,
    });

    const profileRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/profile",
    });

    const loginRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/login",
    });

    const weightRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/weight",
    });

    const routeTree = rootRoute.addChildren([
      profileRoute,
      loginRoute,
      weightRoute,
    ]);

    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      routeTree,
      history,
    });

    await act(async () => {
      renderWithProviders(<RouterProvider router={testRouter} />, { userId });
      // Set auth store state after render to ensure correct store instance
      setupAuthStore(userId, {
        isLoggedIn: true,
        userId,
        token: `mock-token-${userId}`,
        refreshToken: "valid-refresh-token",
      });
      useAuthStore.setState({
        login: vi.fn(),
        logout: mockLogout,
      });
    });

    return { history, router: testRouter, logoutSpy: mockLogout };
  };

  it("renders Profile component with email and password forms", async () => {
    await setup();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "User Profile" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("email-form")).toBeInTheDocument();
      expect(screen.getByTestId("email-input")).toBeInTheDocument();
      expect(screen.getByTestId("email-submit")).toBeInTheDocument();
      expect(screen.getByTestId("password-form")).toBeInTheDocument();
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
      expect(screen.getByTestId("password-submit")).toBeInTheDocument();
      expect(screen.getByTestId("logout-button")).toBeInTheDocument();
      expect(screen.getByText("Back to Weight")).toBeInTheDocument();
      expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
      expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
      expect(screen.getByTestId("logout-icon")).toBeInTheDocument();
    });
  });

  it("submits valid email and displays success message", async () => {
    await setup();

    await waitFor(() => {
      expect(screen.getByTestId("email-form")).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId("email-input");
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "newemail@example.com", { delay: 10 });
      expect(emailInput).toHaveValue("newemail@example.com");
      const form = screen.getByTestId("email-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("email-success")).toBeInTheDocument();
        expect(screen.getByTestId("email-success")).toHaveTextContent(
          "Email updated successfully"
        );
        expect(screen.getByTestId("email-success")).toHaveClass(
          "text-green-500"
        );
        expect(screen.getByTestId("email-input")).toHaveValue("");
      },
      { timeout: 3000, interval: 100 }
    );
  });

  it.todo("displays error message for existing email", async () => {
    // Suppress console errors to avoid unhandled rejection warning
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await setup();

    await waitFor(() => {
      expect(screen.getByTestId("email-form")).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId("email-input");
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "existing@example.com", { delay: 10 });
      expect(emailInput).toHaveValue("existing@example.com");
      const form = screen.getByTestId("email-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("email-error")).toBeInTheDocument();
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Email already in use"
        );
        expect(screen.getByTestId("email-error")).toHaveClass("text-red-500");
      },
      { timeout: 3000, interval: 100 }
    );

    // Restore console error logging
    consoleErrorSpy.mockRestore();
  });

  it("displays validation error for invalid email", async () => {
    await setup();

    await waitFor(() => {
      expect(screen.getByTestId("email-form")).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId("email-input");
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "invalid-email", { delay: 10 });
      expect(emailInput).toHaveValue("invalid-email");
      const form = screen.getByTestId("email-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("email-error")).toBeInTheDocument();
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Please enter a valid email address"
        );
        expect(screen.getByTestId("email-error")).toHaveClass("text-red-500");
      },
      { timeout: 1000, interval: 100 }
    );
  });

  it("submits password reset request and displays success message", async () => {
    await setup();

    await waitFor(() => {
      expect(screen.getByTestId("password-form")).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId("password-input");
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "user@example.com", { delay: 10 });
      expect(emailInput).toHaveValue("user@example.com");
      const form = screen.getByTestId("password-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("password-success")).toBeInTheDocument();
        expect(screen.getByTestId("password-success")).toHaveTextContent(
          "Reset link sent to your email"
        );
        expect(screen.getByTestId("password-success")).toHaveClass(
          "text-green-500"
        );
        expect(screen.getByTestId("password-input")).toHaveValue("");
      },
      { timeout: 1000, interval: 100 }
    );
  });

  it("displays validation error for invalid email in password reset form", async () => {
    await setup();

    await waitFor(() => {
      expect(screen.getByTestId("password-form")).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId("password-input");
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "invalid-email", { delay: 10 });
      expect(emailInput).toHaveValue("invalid-email");
      const form = screen.getByTestId("password-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("password-error")).toBeInTheDocument();
        expect(screen.getByTestId("password-error")).toHaveTextContent(
          "Please enter a valid email address"
        );
        expect(screen.getByTestId("password-error")).toHaveClass(
          "text-red-500"
        );
      },
      { timeout: 1000, interval: 100 }
    );
  });

  it("handles logout and navigates to login", async () => {
    const { logoutSpy } = await setup();
    const mockNavigate = vi.mocked(useNavigate);
    mockNavigate.mockReturnValue(vi.fn());

    await waitFor(() => {
      const logoutButton = screen.getByTestId("logout-button");
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).not.toBeDisabled();
    });

    await act(async () => {
      const logoutButton = screen.getByTestId("logout-button");
      await userEvent.click(logoutButton, { delay: 50 });
    });

    await waitFor(
      () => {
        expect(logoutSpy).toHaveBeenCalled();
        expect(useAuthStore.getState().isLoggedIn).toBe(false);
        expect(useAuthStore.getState().userId).toBe(null);
        expect(useAuthStore.getState().token).toBe(null);
        expect(useAuthStore.getState().refreshToken).toBe(null);
        // expect(mockNavigate.mock.results[0].value).toHaveBeenCalledWith({ to: '/login' });
      },
      { timeout: 1000, interval: 100 }
    );
  });
});
