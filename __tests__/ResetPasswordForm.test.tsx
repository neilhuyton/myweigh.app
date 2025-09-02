// __tests__/ResetPasswordForm.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../src/trpc";
import "@testing-library/jest-dom";
import { server } from "../__mocks__/server";
import { act } from "react-dom/test-utils";
import { resetPasswordRequestHandler } from "../__mocks__/handlers/resetPasswordRequest";
import ResetPasswordForm from "../src/components/ResetPasswordForm";
import { trpcClient, queryClient } from "../src/client";

vi.mock("../src/router/router", () => ({
  router: {
    navigate: vi.fn(),
  },
}));

describe("ResetPasswordForm Component", () => {
  const setup = async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mock("../src/store/authStore", () => ({
      useAuthStore: Object.assign(
        vi.fn().mockReturnValue({ isLoggedIn: false, userId: null, token: null, refreshToken: null }),
        {
          getState: vi.fn().mockReturnValue({ isLoggedIn: false, userId: null, token: null, refreshToken: null }),
        }
      ),
    }));

    await act(async () => {
      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ResetPasswordForm />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    server.use(resetPasswordRequestHandler);
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled rejection in beforeAll:", reason);
      if (reason instanceof Error && reason.message.includes("Invalid email")) {
        return;
      }
      throw reason;
    });
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
    process.removeAllListeners("unhandledRejection");
  });

  it("renders password reset form with email input, submit button, and back to login link", async () => {
    await setup();
    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
        expect(screen.getByTestId("back-to-login-link")).toBeInTheDocument();
      },
      { timeout: 500, interval: 50 }
    );
  });

  it("submits email and displays neutral success message", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
      },
      { timeout: 300, interval: 50 }
    );

    await act(async () => {
      const emailInput = screen.getByTestId("email-input");
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "unknown@example.com", { delay: 10 });
      expect(emailInput).toHaveValue("unknown@example.com");
      const form = screen.getByTestId("reset-password-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const alert = screen.getByTestId("reset-password-message");
        expect(alert).toHaveTextContent("If the email exists, a reset link has been sent.");
        expect(alert).toHaveClass("text-green-500");
        expect(screen.getByTestId("email-input")).toHaveValue("");
      },
      { timeout: 3000, interval: 100 }
    );
  });
});