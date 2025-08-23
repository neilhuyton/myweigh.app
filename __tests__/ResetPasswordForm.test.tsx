// __tests__/ResetPasswordForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../src/trpc";
import ResetPasswordForm from "../src/components/ResetPasswordForm";
import "@testing-library/jest-dom";
import { httpBatchLink } from "@trpc/client";
import { server } from "../__mocks__/server";
import { http, HttpResponse } from "msw";

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
        fetch: async (url, options) => {
          return fetch(url, { ...options, signal: undefined });
        },
      }),
    ],
  });

  const setup = (onSwitchToLogin: () => void = vi.fn()) => {
    render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ResetPasswordForm onSwitchToLogin={onSwitchToLogin} />
        </QueryClientProvider>
      </trpc.Provider>
    );
    return { onSwitchToLogin };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  it("renders password reset form with email input, submit button, and back to login link", () => {
    const { onSwitchToLogin } = setup();

    expect(
      screen.getByRole("heading", { name: "Reset your password" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter your email to receive a password reset link")
    ).toBeInTheDocument();
    expect(screen.getByRole("form")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send Reset Link" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to login" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Back to login" }));
    expect(onSwitchToLogin).toHaveBeenCalled();
  });

  it("submits email and displays success message with form reset", async () => {
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/resetPassword.request",
        async () => {
          return HttpResponse.json([
            {
              result: {
                data: {
                  message: "Reset link sent to your email",
                },
              },
            },
          ]);
        }
      )
    );

    setup();

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.change(emailInput, {
      target: { value: "neil.huyton@gmail.com" },
    });
    fireEvent.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Reset link sent to your email"
        );
        expect(emailInput).toHaveValue("");
      },
      { timeout: 5000 }
    );
  });

  it("displays error message when email is not found", async () => {
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/resetPassword.request",
        async () => {
          return HttpResponse.json(
            [
              {
                error: {
                  message: "Email not found",
                  code: -32603,
                  data: {
                    code: "NOT_FOUND",
                    httpStatus: 404,
                    path: "resetPassword.request",
                  },
                },
              },
            ],
            { status: 404 }
          );
        }
      )
    );

    setup();

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.change(emailInput, { target: { value: "unknown@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Failed to send reset link: Email not found"
        );
      },
      { timeout: 5000 }
    );
  });

  it("submits valid email and displays success message", async () => {
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/resetPassword.request",
        async () => {
          return HttpResponse.json([
            {
              result: {
                data: {
                  message: "Reset link sent to your email",
                },
              },
            },
          ]);
        }
      )
    );

    const { onSwitchToLogin } = setup();

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.change(emailInput, {
      target: { value: "neil.huyton@gmail.com" },
    });
    fireEvent.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Reset link sent to your email"
        );
        expect(screen.getByRole("alert")).toHaveClass("text-green-500");
      },
      { timeout: 5000 }
    );

    expect(onSwitchToLogin).not.toHaveBeenCalled();
  });
});
