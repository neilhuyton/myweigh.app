// __tests__/ResetPasswordForm.test.tsx
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
import { resetPasswordRequestHandler } from "../__mocks__/handlers";
import ResetPasswordForm from "../src/components/ResetPasswordForm";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  MailIcon: () => <div data-testid="mail-icon" />,
}));

// Mock LoadingSpinner component
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

// Mock Logo component
vi.mock("../src/components/Logo", () => ({
  Logo: () => (
    <div className="flex flex-col items-center">
      <svg
        aria-label="My Weigh App Logo"
        fill="none"
        height="48"
        role="img"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2a10 10 0 0 1 10 10c0 2.757-1.12 5.248-2.93 7.048M12 2a10 10 0 0 0-10 10c0 2.757 1.12 5.248 2.93 7.048M12 2v2m0 16v2" />
        <path d="M12 6a6 6 0 0 0-6 6c0 1.657.672 3.157 1.757 4.243M12 6a6 6 0 0 1 6 6c0 1.657-.672 3.157-1.757 4.243" />
        <circle cx="12" cy="12" r="2" />
      </svg>
      <h2
        className="text-xl font-semibold text-center mt-2"
        data-testid="app-name"
      >
        My Weigh
      </h2>
    </div>
  ),
}));

// Mock useNavigate to track navigation calls
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    createRouter: actual.createRouter,
    RouterProvider: actual.RouterProvider,
    createRootRoute: actual.createRootRoute,
    createRoute: actual.createRoute,
    createMemoryHistory: actual.createMemoryHistory,
  };
});

describe("ResetPasswordForm Component", () => {
  // Spy on console.error to suppress act warnings
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    server.use(resetPasswordRequestHandler);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockReset();
    consoleErrorSpy.mockReset();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    server.close();
  });

  const setup = async () => {
    const rootRoute = createRootRoute({
      component: () => <ResetPasswordForm />,
    });

    const resetPasswordRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/reset-password",
    });

    const loginRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/login",
    });

    const routeTree = rootRoute.addChildren([resetPasswordRoute, loginRoute]);

    const history = createMemoryHistory({
      initialEntries: ["/reset-password"],
    });
    const testRouter = createRouter({
      routeTree,
      history,
    });

    renderWithProviders(<RouterProvider router={testRouter} />, {
      userId: undefined,
    });

    return { history, testRouter };
  };

  it("renders password reset form with email input, submit button, and back to login link", async () => {
    await setup();
    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
        expect(screen.getByTestId("back-to-login-link")).toBeInTheDocument();
        expect(screen.getByTestId("app-name")).toHaveTextContent("My Weigh");
      },
      { timeout: 2000 }
    );
  });

  it("submits email and displays neutral success message", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const emailInput = screen.getByTestId("email-input");
    const form = screen.getByTestId("reset-password-form");

    await act(async () => {
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "unknown@example.com");
      expect(emailInput).toHaveValue("unknown@example.com");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const alert = screen.getByTestId("reset-password-message");
        expect(alert).toHaveTextContent(
          "If the email exists, a reset link has been sent."
        );
        expect(alert).toHaveClass("text-green-500");
        expect(screen.getByTestId("email-input")).toHaveValue("");
      },
      { timeout: 2000 }
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
    const form = screen.getByTestId("reset-password-form");

    await act(async () => {
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "invalid-email");
      expect(emailInput).toHaveValue("invalid-email");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const alert = screen.getByText("Please enter a valid email address");
        expect(alert).toHaveClass("text-destructive");
        expect(screen.getByTestId("email-input")).toHaveValue("invalid-email");
      },
      { timeout: 2000 }
    );
  });

  it("displays loading state during form submission", async () => {
    vi.spyOn(global, "fetch").mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(
                  JSON.stringify({
                    id: 0,
                    result: {
                      type: "data",
                      data: {
                        message:
                          "If the email exists, a reset link has been sent.",
                      },
                    },
                  }),
                  { status: 200 }
                )
              ),
            1000
          )
        )
    );

    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const emailInput = screen.getByTestId("email-input");
    const form = screen.getByTestId("reset-password-form");

    await act(async () => {
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "unknown@example.com");
      expect(emailInput).toHaveValue("unknown@example.com");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(
          screen.getByTestId("reset-password-loading")
        ).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    await waitFor(
      () => {
        const alert = screen.getByTestId("reset-password-message");
        expect(alert).toHaveTextContent(
          "If the email exists, a reset link has been sent."
        );
        expect(
          screen.queryByTestId("reset-password-loading")
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    vi.restoreAllMocks();
  });

  it("navigates to login page when back to login link is clicked", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("back-to-login-link")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    await act(async () => {
      const backToLoginLink = screen.getByTestId("back-to-login-link");
      await userEvent.click(backToLoginLink);
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
      },
      { timeout: 1000 }
    );
  });
});
