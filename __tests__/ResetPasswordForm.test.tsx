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

  const setup = (initialPath = "/reset-password") => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({ routeTree: router.routeTree, history });

    vi.spyOn(testRouter, "navigate").mockImplementation(async () => {});
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
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  it("renders password reset form with email input, submit button, and back to login link", async () => {
    setup();
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
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/resetPassword.request",
        async () => {
          return HttpResponse.json([
            {
              result: {
                data: {
                  message: "If the email exists, a reset link has been sent.",
                },
              },
            },
          ]);
        }
      )
    );

    setup();

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
