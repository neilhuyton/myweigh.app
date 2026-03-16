import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils/test-helpers";
import { useAuthStore } from "@/store/authStore";
import { suppressActWarnings } from "../../__tests__/act-suppress";

suppressActWarnings();

vi.mock("@/store/authStore", () => {
  const mockSession = { user: null };

  const updateUserPassword = vi.fn();

  const mockState = {
    updateUserPassword,
    waitUntilReady: vi.fn().mockResolvedValue(mockSession),
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

describe("Update Password Page (/update-password)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderUpdatePasswordPage() {
    return renderWithProviders({ initialEntries: ["/update-password"] });
  }

  it("renders heading, description and both password fields", async () => {
    renderUpdatePasswordPage();

    await waitFor(() => {
      expect(screen.getByText("Choose a New Password")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Enter and confirm your new password/i),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Update Password/i }),
    ).toBeInTheDocument();
  });

  it("disables submit button until both fields are valid and match", async () => {
    const user = userEvent.setup();
    renderUpdatePasswordPage();

    const newPwd = await screen.findByLabelText("New Password");
    const confirmPwd = screen.getByLabelText("Confirm Password");
    const submit = screen.getByRole("button", { name: /Update Password/i });

    expect(submit).toBeDisabled();

    await user.type(newPwd, "short");
    expect(submit).toBeDisabled();

    await user.clear(newPwd);
    await user.type(newPwd, "verylongbutvalid123");

    expect(submit).toBeDisabled();

    await user.type(confirmPwd, "different");
    expect(submit).toBeDisabled();

    await user.clear(confirmPwd);
    await user.type(confirmPwd, "verylongbutvalid123");

    await waitFor(() => {
      expect(submit).not.toBeDisabled();
    });
  });

  it("shows zod validation messages", async () => {
    const user = userEvent.setup();
    renderUpdatePasswordPage();

    const newPwd = await screen.findByLabelText("New Password");
    const confirm = screen.getByLabelText("Confirm Password");

    await user.type(newPwd, "short");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
    });

    await user.clear(newPwd);
    await user.type(newPwd, "a".repeat(130));
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Password is too long")).toBeInTheDocument();
    });

    await user.clear(newPwd);
    await user.type(newPwd, "goodpassword123");

    await user.type(confirm, "different123");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("shows loading state during password update", async () => {
    vi.mocked(
      useAuthStore.getState().updateUserPassword,
    ).mockImplementationOnce(async () => {
      await new Promise((r) => setTimeout(r, 80));
      return { error: null };
    });

    const user = userEvent.setup();
    renderUpdatePasswordPage();

    const newPwd = await screen.findByLabelText("New Password");
    const confirm = screen.getByLabelText("Confirm Password");
    const submit = screen.getByRole("button", { name: /Update Password/i });

    await user.type(newPwd, "strongpass456");
    await user.type(confirm, "strongpass456");
    await user.click(submit);

    await waitFor(() => {
      expect(submit).toHaveTextContent("Updating...");
      expect(submit).toBeDisabled();
    });
  });

  it("shows success message and navigates to /login after success", async () => {
    vi.mocked(useAuthStore.getState().updateUserPassword).mockResolvedValueOnce(
      {
        error: null,
      },
    );

    const user = userEvent.setup();
    const { router } = renderUpdatePasswordPage();

    const newPwd = await screen.findByLabelText("New Password");
    const confirm = screen.getByLabelText("Confirm Password");
    const submit = screen.getByRole("button", { name: /Update Password/i });

    await user.type(newPwd, "newsecurepass789");
    await user.type(confirm, "newsecurepass789");
    await user.click(submit);

    await waitFor(() => {
      expect(
        screen.getByText("Password updated successfully!"),
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe("/login");
      },
      { timeout: 3000 },
    );
  });

  it("shows error message when update fails", async () => {
    vi.mocked(useAuthStore.getState().updateUserPassword).mockResolvedValueOnce(
      {
        error: new Error("Current password is incorrect"),
      },
    );

    const user = userEvent.setup();
    renderUpdatePasswordPage();

    const newPwd = await screen.findByLabelText("New Password");
    const confirm = screen.getByLabelText("Confirm Password");
    const submit = screen.getByRole("button", { name: /Update Password/i });

    await user.type(newPwd, "newpass12345");
    await user.type(confirm, "newpass12345");
    await user.click(submit);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: Current password is incorrect/i),
      ).toBeInTheDocument();
    });
  });

  it("clears error/success message when user starts typing again", async () => {
    vi.mocked(useAuthStore.getState().updateUserPassword).mockResolvedValueOnce(
      {
        error: new Error("Weak password"),
      },
    );

    const user = userEvent.setup();
    renderUpdatePasswordPage();

    const newPwd = await screen.findByLabelText("New Password");
    const confirm = screen.getByLabelText("Confirm Password");
    const submit = screen.getByRole("button", { name: /Update Password/i });

    await user.type(newPwd, "password123456");
    await user.type(confirm, "password123456");

    await waitFor(() => expect(submit).not.toBeDisabled());

    await user.click(submit);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    await user.clear(newPwd);
    await user.type(newPwd, "a");

    await waitFor(() => {
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

    it('navigates to login when "Login" link is clicked', async () => {
      const user = userEvent.setup();
      const { router } = renderUpdatePasswordPage();
  
      const loginLink = await screen.findByRole("button", { name: /Login/i });
  
      await user.click(loginLink);
  
      expect(router.state.location.pathname).toBe("/login");
    });
});
