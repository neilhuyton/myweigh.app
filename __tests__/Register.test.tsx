import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { renderWithProviders } from "./utils/setup";
import { registerHandler } from "../__mocks__/handlers";
import Register from "../src/components/auth/Register";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";

// Mock useRouter to track navigation calls
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouter: () => ({
      navigate: mockNavigate,
    }),
    createRouter: actual.createRouter,
    RouterProvider: actual.RouterProvider,
    createRootRoute: actual.createRootRoute,
    createRoute: actual.createRoute,
    createMemoryHistory: actual.createMemoryHistory,
  };
});

describe("Register Component Email Verification", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    server.use(registerHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockReset();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
  });

  const setup = async () => {
    const rootRoute = createRootRoute({
      component: () => <Register />,
    });

    const registerRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/register",
    });

    const loginRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/login",
    });

    const routeTree = rootRoute.addChildren([registerRoute, loginRoute]);

    const history = createMemoryHistory({ initialEntries: ["/register"] });
    const testRouter = createRouter({
      routeTree,
      history,
    });

    renderWithProviders(<RouterProvider router={testRouter} />, {
      userId: undefined,
    });

    return { history, testRouter };
  };

  it("renders register form with email input, password input, and register button", async () => {
    await setup();
    await waitFor(
      () => {
        expect(screen.getByText("Create an account")).toBeInTheDocument();
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
        expect(screen.getByTestId("password-input")).toBeInTheDocument();
        expect(screen.getByTestId("register-button")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("displays email verification prompt after successful registration", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const form = screen.getByTestId("register-form");

    await act(async () => {
      await userEvent.clear(emailInput);
      await userEvent.clear(passwordInput);
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("password123");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const alert = screen.getByTestId("register-message");
        expect(alert).toHaveTextContent(
          "Registration successful! Please check your email to verify your account."
        );
        expect(alert).toHaveClass("text-green-500");
      },
      { timeout: 1000 }
    );
  });

  it("displays validation error for invalid email", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const form = screen.getByTestId("register-form");

    await act(async () => {
      await userEvent.clear(emailInput);
      await userEvent.clear(passwordInput);
      await userEvent.type(emailInput, "invalid-email");
      await userEvent.type(passwordInput, "password123");
      expect(emailInput).toHaveValue("invalid-email");
      expect(passwordInput).toHaveValue("password123");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const alert = screen.getByText("Please enter a valid email address");
        expect(alert).toHaveClass("text-destructive");
        expect(screen.getByTestId("email-input")).toHaveValue("invalid-email");
      },
      { timeout: 1000 }
    );
  });

  it("displays validation error for short password", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const form = screen.getByTestId("register-form");

    await act(async () => {
      await userEvent.clear(emailInput);
      await userEvent.clear(passwordInput);
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "short");
      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("short");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const alert = screen.getByText(
          "Password must be at least 8 characters long"
        );
        expect(alert).toHaveClass("text-destructive");
        expect(screen.getByTestId("password-input")).toHaveValue("short");
      },
      { timeout: 1000 }
    );
  });

  it("displays error for existing email", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const form = screen.getByTestId("register-form");

    await act(async () => {
      await userEvent.clear(emailInput);
      await userEvent.clear(passwordInput);
      await userEvent.type(emailInput, "exists@example.com");
      await userEvent.type(passwordInput, "password123");
      expect(emailInput).toHaveValue("exists@example.com");
      expect(passwordInput).toHaveValue("password123");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const alert = screen.getByTestId("register-message");
        expect(alert).toHaveTextContent(
          "Registration failed: Email already exists"
        );
        expect(alert).toHaveClass("text-red-500"); // Changed to match Register.tsx
        expect(screen.getByTestId("email-input")).toHaveValue(
          "exists@example.com"
        );
      },
      { timeout: 1000 }
    );
  });

  it("navigates to login page when login link is clicked", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("login-link")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const loginLink = screen.getByTestId("login-link");
    await act(async () => {
      await userEvent.click(loginLink);
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
      },
      { timeout: 1000 }
    );
  });
});
