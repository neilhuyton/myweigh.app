import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils/test-helpers";
import { supabase } from "@/lib/supabase";
import { AuthError } from "@supabase/supabase-js";
import { suppressActWarnings } from "../../__tests__/act-suppress";

suppressActWarnings();

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      auth: {
        resend: vi.fn(),
        getSession: vi.fn(),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    },
  };
});

describe("Resend Verification Page (/resend-verification)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.resend).mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: null,
    });
  });

  function renderResendVerificationPage() {
    return renderWithProviders({ initialEntries: ["/resend-verification"] });
  }

  it("renders the form and heading", async () => {
    renderResendVerificationPage();

    await screen.findByRole("heading", { name: "Resend Verification Email" });

    expect(
      screen.getByText(
        /If you didn't receive the verification email or it expired/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Resend Verification Email" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
  });

  it("disables submit button until valid email is entered", async () => {
    const user = userEvent.setup();
    renderResendVerificationPage();

    const emailInput = await screen.findByLabelText("Email");
    const submit = screen.getByRole("button", {
      name: "Resend Verification Email",
    });

    expect(submit).toBeDisabled();

    await user.type(emailInput, "invalid");
    expect(submit).toBeDisabled();

    await user.clear(emailInput);
    await user.type(emailInput, "valid@example.com");

    await waitFor(() => expect(submit).not.toBeDisabled());
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderResendVerificationPage();

    const emailInput = await screen.findByLabelText("Email");

    await user.type(emailInput, "not-an-email");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it("calls supabase.auth.resend and shows success message on success", async () => {
    const user = userEvent.setup();
    renderResendVerificationPage();

    await user.type(await screen.findByLabelText("Email"), "user@example.com");
    await user.click(
      screen.getByRole("button", { name: "Resend Verification Email" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "A new verification email has been sent. Please check your inbox and spam folder.",
        ),
      ).toBeInTheDocument();
    });

    expect(supabase.auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "user@example.com",
    });
  });

  it("shows error message when resend fails", async () => {
    vi.mocked(supabase.auth.resend).mockResolvedValueOnce({
      data: {
        user: null,
        session: null,
      },
      error: new AuthError("Too many requests", 429),
    });

    const user = userEvent.setup();
    renderResendVerificationPage();

    await user.type(await screen.findByLabelText("Email"), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: "Resend Verification Email" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Too many requests. Please wait a minute and try again.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    vi.mocked(supabase.auth.resend).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ data: { user: null, session: null }, error: null }),
            50,
          ),
        ),
    );

    const user = userEvent.setup();
    renderResendVerificationPage();

    await user.type(await screen.findByLabelText("Email"), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: "Resend Verification Email" }),
    );

    vi.advanceTimersByTime(1);

    await waitFor(() => {
      const loadingButton = screen.getByRole("button", { name: /Sending.../i });
      expect(loadingButton).toHaveTextContent("Sending...");
      expect(loadingButton).toBeDisabled();
      expect(loadingButton.querySelector("svg.animate-spin")).not.toBeNull();
    });

    vi.advanceTimersByTime(50);

    await waitFor(() => {
      expect(
        screen.getByText(/A new verification email has been sent/i),
      ).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('navigates back to login when "Login" is clicked', async () => {
    const user = userEvent.setup();
    const { router } = renderResendVerificationPage();

    const loginButton = await screen.findByRole("button", { name: "Login" });

    await user.click(loginButton);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });

  it("navigates to register when Sign up is clicked", async () => {
    const user = userEvent.setup();
    const { router } = renderResendVerificationPage();

    const signUpButton = await screen.findByRole("button", { name: "Sign up" });

    await user.click(signUpButton);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/register");
    });
  });
});
