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
import ConfirmResetPasswordForm from "../src/components/auth/ConfirmResetPasswordForm";
import { renderWithProviders } from "./utils/setup";

// Mock useSearch from @tanstack/react-router
import { useSearch } from "@tanstack/react-router";
import { resetPasswordConfirmHandler } from "../__mocks__/handlers";
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useSearch: vi.fn(),
  };
});

// Mock react-confetti
vi.mock("react-confetti", () => ({
  default: ({
    className,
    ...props
  }: {
    className: string;
    "data-testid": string;
  }) => <div className={className} data-testid={props["data-testid"]} />,
}));

// Mock LoadingSpinner component
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

// Mock console.error to suppress act warnings during debugging
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("ConfirmResetPasswordForm Component", () => {
  const VALID_TOKEN = "123e4567-e29b-12d3-a456-426614174000";
  const INVALID_TOKEN = "00000000-0000-0000-0000-000000000000";

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  beforeEach(() => {
    server.use(resetPasswordConfirmHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    document.body.innerHTML = "";
    consoleErrorSpy.mockReset();
  });

  afterAll(() => {
    server.close();
    consoleErrorSpy.mockRestore();
  });

  it("renders ConfirmResetPasswordForm with correct content", async () => {
    vi.mocked(useSearch).mockReturnValue({ token: VALID_TOKEN });
    renderWithProviders(<ConfirmResetPasswordForm />);

    await waitFor(
      () => {
        expect(
          screen.getByTestId("confirm-reset-password-form")
        ).toBeInTheDocument();
        expect(screen.getByTestId("password-label")).toHaveTextContent(
          "New Password"
        );
        expect(screen.getByTestId("password-input")).toBeInTheDocument();
        expect(screen.getByTestId("reset-password-button")).toBeInTheDocument();
        expect(
          screen.queryByTestId("confirm-reset-password-message")
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("back-to-login-link")).toBeInTheDocument();
      },
      { timeout: 1000, interval: 100 }
    );
  });

  it("submits valid token and new password and displays success message", async () => {
    vi.mocked(useSearch).mockReturnValue({ token: VALID_TOKEN });
    renderWithProviders(<ConfirmResetPasswordForm />);

    await waitFor(
      () => {
        expect(
          screen.getByTestId("confirm-reset-password-form")
        ).toBeInTheDocument();
      },
      { timeout: 1000, interval: 100 }
    );

    const form = screen.getByTestId("confirm-reset-password-form");
    const passwordInput = screen.getByTestId("password-input");
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, "newSecurePassword123", { delay: 10 });
    expect(passwordInput).toHaveValue("newSecurePassword123");

    await form.dispatchEvent(new Event("submit", { bubbles: true }));

    await waitFor(
      () => {
        expect(
          screen.getByTestId("confirm-reset-password-message")
        ).toHaveTextContent("Password reset successfully");
        expect(
          screen.getByTestId("confirm-reset-password-message")
        ).toHaveClass("text-green-500");
        expect(screen.getByTestId("password-input")).toHaveValue("");
      },
      { timeout: 1000, interval: 100 }
    );
  });

  it("displays error message for invalid token", async () => {
    vi.mocked(useSearch).mockReturnValue({ token: INVALID_TOKEN });
    renderWithProviders(<ConfirmResetPasswordForm />);

    await waitFor(
      () => {
        expect(
          screen.getByTestId("confirm-reset-password-form")
        ).toBeInTheDocument();
      },
      { timeout: 1000, interval: 100 }
    );

    const form = screen.getByTestId("confirm-reset-password-form");
    const passwordInput = screen.getByTestId("password-input");
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, "newSecurePassword123", { delay: 10 });
    expect(passwordInput).toHaveValue("newSecurePassword123");

    await form.dispatchEvent(new Event("submit", { bubbles: true }));

    await waitFor(
      () => {
        expect(
          screen.getByTestId("confirm-reset-password-message")
        ).toHaveTextContent(
          "Failed to reset password: Invalid or expired token"
        );
        expect(
          screen.getByTestId("confirm-reset-password-message")
        ).toHaveClass("text-red-500");
      },
      { timeout: 1000, interval: 100 }
    );
  });
});
