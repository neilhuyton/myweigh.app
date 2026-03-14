import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils/test-helpers";
import { supabase } from "@/lib/supabase";
import { AuthError } from "@supabase/supabase-js";
import { suppressActWarnings } from "../../__tests__/act-suppress";

suppressActWarnings();

vi.mock("@/lib/supabase", () => {
  const mockAuth = {
    resetPasswordForEmail: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  };

  return {
    supabase: {
      auth: mockAuth,
    },
  };
});

describe("Update Password Page (/update-password)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {},
      error: null,
    });
  });

  function renderUpdatePasswordPage() {
    return renderWithProviders({ initialEntries: ["/update-password"] });
  }

  it("renders the reset request form", async () => {
    renderUpdatePasswordPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Reset your password" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Send Reset Link" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Enter your email to receive a password reset link/),
      ).toBeInTheDocument();
    });
  });

  it("disables submit button until valid email is entered", async () => {
    const user = userEvent.setup();
    renderUpdatePasswordPage();

    const emailInput = await screen.findByLabelText("Email");
    const submit = screen.getByRole("button", { name: "Send Reset Link" });

    expect(submit).toBeDisabled();

    await user.type(emailInput, "invalid");

    expect(submit).toBeDisabled();

    await user.clear(emailInput);
    await user.type(emailInput, "valid@example.com");

    await waitFor(() => {
      expect(submit).not.toBeDisabled();
    });
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup({ delay: null });
    renderUpdatePasswordPage();

    const emailInput = await screen.findByLabelText("Email");

    await user.type(emailInput, "invalid");

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address"),
      ).toBeInTheDocument();
    });
  });

  it("calls supabase resetPasswordForEmail and shows success message on success", async () => {
    const user = userEvent.setup();
    renderUpdatePasswordPage();

    await screen.findByLabelText("Email");

    await user.type(screen.getByLabelText("Email"), "user@example.com");

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Password reset link sent! Check your email (including spam/junk).",
        ),
      ).toBeInTheDocument();
    });

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      {
        redirectTo: expect.stringContaining("/update-password"),
      },
    );
  });

  it("shows error message when reset fails", async () => {
    const user = userEvent.setup();
    renderUpdatePasswordPage();

    await screen.findByLabelText("Email");

    await user.type(screen.getByLabelText("Email"), "test@example.com");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: null,
      error: new AuthError("Rate limit exceeded", 429, "rate_limit_exceeded"),
    });

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(
        screen.getByText("Error: Rate limit exceeded"),
      ).toBeInTheDocument();
    });
  });

  it("shows loader during submission", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const user = userEvent.setup();
    renderUpdatePasswordPage();

    const emailInput = await screen.findByLabelText("Email");
    await user.type(emailInput, "user@example.com");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: {}, error: null }), 50),
        ),
    );

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    vi.advanceTimersByTime(1);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Sending…/i }),
      ).toBeInTheDocument();
      expect(
        screen
          .getByRole("button", { name: /Sending…/i })
          .querySelector("svg.animate-spin"),
      ).not.toBeNull();
    });

    vi.advanceTimersByTime(50);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Password reset link sent! Check your email (including spam/junk).",
        ),
      ).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it("clears message when user types again after error", async () => {
    const user = userEvent.setup();
    renderUpdatePasswordPage();

    await screen.findByLabelText("Email");

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: null,
      error: new AuthError("Some error"),
    });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(screen.getByText(/Some error/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Email"), "x");

    expect(screen.queryByText(/Some error/)).not.toBeInTheDocument();
  });
});
