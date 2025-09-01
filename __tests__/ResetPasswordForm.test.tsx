// __tests__/ResetPasswordForm.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import "@testing-library/jest-dom";
import { server } from "../__mocks__/server";
import { act } from "react-dom/test-utils";
import { resetPasswordRequestHandler } from "../__mocks__/handlers/resetPasswordRequest";
import ResetPasswordForm from "../src/components/ResetPasswordForm"; // Adjust the import path as needed

// Mock the router module to avoid router.navigate errors
vi.mock("../src/router/router", () => ({
  router: {
    navigate: vi.fn(),
  },
}));

describe("ResetPasswordForm Component", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:8888/.netlify/functions/trpc",
        fetch: async (input, options) => fetch(input, { ...options }),
      }),
    ],
  });

  const setup = async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mock("../src/store/authStore", () => ({
      useAuthStore: Object.assign(
        vi.fn().mockReturnValue({ isLoggedIn: false, userId: null }),
        {
          getState: vi
            .fn()
            .mockReturnValue({ isLoggedIn: false, userId: null }),
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
      if (
        reason instanceof Error &&
        reason.message.includes("Invalid email")
      ) {
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
      const form = screen.getByRole("form");
      await userEvent.type(emailInput, "unknown@example.com");
      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      await form.dispatchEvent(submitEvent);
    });

    await waitFor(
      () => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(
          "If the email exists, a reset link has been sent."
        );
        expect(alert).toHaveClass("text-green-500");
        expect(screen.getByTestId("email-input")).toHaveValue("");
      },
      { timeout: 300, interval: 50 }
    );
  });
});