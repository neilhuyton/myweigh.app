// __tests__/ConfirmResetPassword.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import "@testing-library/jest-dom";
import { act } from "@testing-library/react";
import { server } from "../__mocks__/server";
import { resetPasswordConfirmHandler } from "../__mocks__/handlers/resetPasswordConfirm";
import ConfirmResetPasswordForm from "../src/components/ConfirmResetPasswordForm";
import { RouterProvider, createRouter, createMemoryHistory, createRootRoute, createRoute, useSearch } from "@tanstack/react-router";

// Mock useSearch from @tanstack/react-router
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useSearch: vi.fn(),
  };
});

describe("ConfirmResetPasswordForm Component", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpLink({
        url: "http://localhost:8888/.netlify/functions/trpc",
        headers: () => ({
          "content-type": "application/json",
        }),
      }),
    ],
  });

  const setup = async (token: string = "123e4567-e89b-12d3-a456-426614174000", initialPath = "/confirm-password-reset") => {
    vi.mocked(useSearch).mockReturnValue({ token });

    const rootRoute = createRootRoute({
      component: () => <ConfirmResetPasswordForm />,
    });

    const confirmResetPasswordRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/confirm-password-reset",
    });

    const loginRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/login",
    });

    const routeTree = rootRoute.addChildren([confirmResetPasswordRoute, loginRoute]);

    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      routeTree,
      history,
    });

    await act(async () => {
      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={testRouter} />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });

    return { history, testRouter };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
    // Suppress expected tRPC errors
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    server.use(resetPasswordConfirmHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  it("submits valid token and new password and displays success message", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("confirm-reset-password-form")).toBeInTheDocument();
      },
      { timeout: 2000, interval: 100 }
    );

    await act(async () => {
      const passwordInput = screen.getByTestId("password-input");
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, "newSecurePassword123", { delay: 10 });
      expect(passwordInput).toHaveValue("newSecurePassword123");
      const form = screen.getByTestId("confirm-reset-password-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("confirm-reset-password-message")).toHaveTextContent("Password reset successfully");
        expect(screen.getByTestId("confirm-reset-password-message")).toHaveClass("text-green-500");
        expect(screen.getByTestId("password-input")).toHaveValue(""); // Verify input is cleared
      },
      { timeout: 2000, interval: 100 }
    );
  });

  it("displays error message for invalid token", async () => {
    await setup("invalid-token");

    await waitFor(
      () => {
        expect(screen.getByTestId("confirm-reset-password-form")).toBeInTheDocument();
      },
      { timeout: 2000, interval: 100 }
    );

    await act(async () => {
      const passwordInput = screen.getByTestId("password-input");
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, "newSecurePassword123", { delay: 10 });
      expect(passwordInput).toHaveValue("newSecurePassword123");
      const form = screen.getByTestId("confirm-reset-password-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("confirm-reset-password-message")).toHaveTextContent(
          "Failed to reset password: Invalid or expired token"
        );
        expect(screen.getByTestId("confirm-reset-password-message")).toHaveClass("text-red-500");
      },
      { timeout: 2000, interval: 100 }
    );
  });
});