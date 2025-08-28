// __tests__/ConfirmResetPassword.test.tsx
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import "@testing-library/jest-dom";
import { server } from "../__mocks__/server";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";
import { router } from "../src/router/router";
import { http, HttpResponse } from "msw";
import { act } from "react";

describe("ConfirmResetPasswordForm Component", () => {
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

  const setup = (initialPath = "/confirm-reset-password", search = {}) => {
    const queryString = new URLSearchParams(search).toString();
    const initialEntry = queryString
      ? `${initialPath}?${queryString}`
      : initialPath;
    const history = createMemoryHistory({ initialEntries: [initialEntry] });
    const testRouter = createRouter({ routeTree: router.routeTree, history });

    // Mock router.navigate
    vi.spyOn(testRouter, "navigate").mockImplementation(async () => {});

    render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>
      </trpc.Provider>
    );
    return { history, testRouter };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" }); // Changed to 'warn' to log unhandled requests
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  it("submits valid token and new password and displays success message", async () => {
    const mockHandler = vi.fn();
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/resetPassword.confirm",
        async () => {
          mockHandler();
          return HttpResponse.json([
            {
              result: {
                data: { message: "Password reset successfully" },
              },
            },
          ]);
        }
      )
    );

    setup("/confirm-reset-password", {
      token: "123e4567-e89b-12d3-a456-426614174000",
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("confirm-reset-password-form")
      ).toBeInTheDocument();
    });

    await act(async () => {
      const passwordInput = screen.getByLabelText("New Password");
      const form = screen.getByTestId("confirm-reset-password-form");
      await userEvent.type(passwordInput, "newSecurePassword123");
      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      await form.dispatchEvent(submitEvent);
    });

    await waitFor(
      () => {
        expect(mockHandler).toHaveBeenCalled();
        expect(
          screen.getByTestId("confirm-reset-password-message")
        ).toHaveTextContent("Password reset successfully");
        expect(
          screen.getByTestId("confirm-reset-password-message")
        ).toHaveClass("text-green-500");
      },
      { timeout: 2000 }
    );
  });
});
