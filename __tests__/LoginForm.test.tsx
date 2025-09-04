import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  vi,
} from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuthStore } from "../src/store/authStore";
import "@testing-library/jest-dom";
import { server } from "../__mocks__/server";
import { loginHandler, refreshTokenHandler } from "../__mocks__/handlers";
import LoginForm from "../src/components/LoginForm";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { renderWithProviders } from "./utils/setup";

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn((token) => {
    if (
      token ===
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSJ9.dummy-signature"
    ) {
      return { userId: "test-user-1" };
    }
    throw new Error("Invalid token");
  }),
}));

describe("LoginForm Component", () => {
  const setupRouter = () => {
    const rootRoute = createRootRoute({
      component: () => <LoginForm />,
    });
    const loginRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/login",
    });
    const weightRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/weight",
    });
    const routeTree = rootRoute.addChildren([loginRoute, weightRoute]);
    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const testRouter = createRouter({ routeTree, history });
    return { history, testRouter };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    process.on("unhandledRejection", (reason) => {
      if (
        reason instanceof Error &&
        reason.message.includes("Invalid email or password")
      ) {
        return;
      }
      throw reason;
    });
  });

  beforeEach(() => {
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
    });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
    process.removeAllListeners("unhandledRejection");
  });

  it("renders login form with email, password inputs, and submit button", async () => {
    const { testRouter } = setupRouter();
    renderWithProviders(<RouterProvider router={testRouter} />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Login to your account" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
      expect(screen.getByTestId("forgot-password-link")).toBeInTheDocument();
    });
  });

  it("handles successful login, updates auth state, and redirects to /weight", async () => {
    server.use(loginHandler, refreshTokenHandler);
    const { history, testRouter } = setupRouter();
    renderWithProviders(<RouterProvider router={testRouter} />, {
      userId: "test-user-1",
    });
    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
    const form = screen.getByTestId("login-form");
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    await userEvent.type(emailInput, "testuser@example.com", { delay: 10 });
    await userEvent.type(passwordInput, "password123", { delay: 10 });
    expect(emailInput).toHaveValue("testuser@example.com");
    expect(passwordInput).toHaveValue("password123");
    await form.dispatchEvent(new Event("submit", { bubbles: true }));
    await waitFor(
      () => {
        expect(useAuthStore.getState().isLoggedIn).toBe(true);
        expect(useAuthStore.getState().userId).toBe("test-user-1");
        expect(screen.getByTestId("login-message")).toHaveTextContent(
          "Login successful!"
        );
        expect(screen.getByTestId("login-message")).toHaveClass(
          "text-green-500"
        );
        expect(history.location.pathname).toBe("/weight");
      },
      { timeout: 1000, interval: 100 }
    );
  });

  it("displays error message on invalid login credentials", async () => {
    server.use(loginHandler);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { testRouter } = setupRouter();
    renderWithProviders(<RouterProvider router={testRouter} />, {
      isLoggedIn: false,
    });
    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
    const form = screen.getByTestId("login-form");
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    await userEvent.type(emailInput, "wronguser@example.com", { delay: 10 });
    await userEvent.type(passwordInput, "wrongpassword", { delay: 10 });
    expect(emailInput).toHaveValue("wronguser@example.com");
    expect(passwordInput).toHaveValue("wrongpassword");
    await form.dispatchEvent(new Event("submit", { bubbles: true }));
    await waitFor(
      () => {
        expect(screen.getByTestId("login-message")).toHaveTextContent(
          "Login failed: Invalid email or password"
        );
        expect(screen.getByTestId("login-message")).toHaveClass("text-red-500");
        expect(useAuthStore.getState().isLoggedIn).toBe(false);
      },
      { timeout: 1000, interval: 100 }
    );
    consoleErrorSpy.mockRestore();
  });

  it("displays validation errors for invalid email and password", async () => {
    const { testRouter } = setupRouter();
    renderWithProviders(<RouterProvider router={testRouter} />);
    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
    const form = screen.getByTestId("login-form");
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    await userEvent.type(emailInput, "invalid-email", { delay: 10 });
    await userEvent.type(passwordInput, "short", { delay: 10 });
    await userEvent.click(document.body);
    await form.dispatchEvent(new Event("submit", { bubbles: true }));
    await waitFor(
      () => {
        expect(
          screen.getByText("Please enter a valid email address")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Password must be at least 8 characters long")
        ).toBeInTheDocument();
      },
      { timeout: 1000, interval: 100 }
    );
  });

  it("displays forgot password link as placeholder", async () => {
    const { testRouter } = setupRouter();
    renderWithProviders(<RouterProvider router={testRouter} />);
    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-link")).toBeInTheDocument();
      expect(screen.getByTestId("forgot-password-link")).toHaveAttribute(
        "href",
        "#"
      );
      expect(screen.getByTestId("forgot-password-link")).toHaveTextContent(
        "Forgot your password?"
      );
    });
  });
});
