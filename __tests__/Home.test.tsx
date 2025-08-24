// __tests__/Home.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { router } from "../src/router";
import { server } from "../__mocks__/server";
import { useAuthStore } from "../src/store/authStore";
import "@testing-library/jest-dom";
import { act } from "react";
import { http, HttpResponse } from "msw";
import type { AppRouter } from '../server/trpc';
import type { inferProcedureInput } from '@trpc/server';

describe("Home Component with Router", () => {
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
        fetch: async (input, options) =>
          fetch(input, { ...options, signal: options?.signal ?? null }),
      }),
    ],
  });

  const setupRouter = async (initialPath: string) => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({ routeTree: router.routeTree, history });

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

  const setupRegisterMock = () =>
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/register",
        async ({ request }) => {
          const body = await request.json() as Array<
            { id: number } & inferProcedureInput<AppRouter['register']>
          >;
          const { email, password } = body[0] || {};

          if (!email || !password) {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Email and password are required",
                    code: -32603,
                    data: {
                      code: "BAD_REQUEST",
                      httpStatus: 400,
                      path: "register",
                    },
                  },
                },
              ],
              { status: 400 }
            );
          }

          const response = [
            { id: 0, result: { data: { id: "mock-user-id", email } } },
          ];
          return HttpResponse.json(response);
        }
      )
    );

  const setupLoginMock = (
    email: string,
    password: string,
    success: boolean = true
  ) =>
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/login",
        async ({ request }) => {
          const body = await request.json() as Array<
            { id: number } & inferProcedureInput<AppRouter['login']>
          >;
          const { email: inputEmail, password: inputPassword } = body[0] || {};

          if (!inputEmail || !inputPassword) {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Email and password are required",
                    code: -32603,
                    data: {
                      code: "BAD_REQUEST",
                      httpStatus: 400,
                      path: "login",
                    },
                  },
                },
              ],
              { status: 400 }
            );
          }

          if (success && inputEmail === email && inputPassword === password) {
            const response = [
              { id: 0, result: { data: { id: "mock-user-id" } } },
            ];
            return HttpResponse.json(response);
          }

          const response = [
            {
              id: 0,
              error: {
                message: "Invalid email or password",
                code: -32001,
                data: { code: "UNAUTHORIZED", httpStatus: 401, path: "login" },
              },
            },
          ];
          return HttpResponse.json(response, { status: 401 });
        }
      )
    );

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    // Suppress TRPCClientError to prevent Vitest unhandled rejection warnings
    process.on('unhandledRejection', (reason) => {
      if (
        reason instanceof Error &&
        reason.message.includes('Email and password are required')
      ) {
        return; // Suppress this specific error
      }
      throw reason; // Rethrow other unhandled rejections
    });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null });
    queryClient.clear();
  });

  afterAll(() => {
    server.close();
    // Remove the unhandledRejection listener to clean up
    process.removeAllListeners('unhandledRejection');
  });

  it("renders login form by default on home route", async () => {
    await setupRouter("/");

    await waitFor(
      () => {
        expect(screen.getByTestId("login-form")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("m@example.com")
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter your password")
        ).toBeInTheDocument();
        expect(screen.getByTestId("login-button")).toBeInTheDocument();
        expect(screen.getByTestId("signup-link")).toBeInTheDocument();
        expect(screen.queryByTestId("register-form")).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("switches to register form when sign up is clicked", async () => {
    const { testRouter } = await setupRouter("/");

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
      expect(screen.getByTestId("signup-link")).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId("signup-link"));
    });

    await waitFor(
      () => {
        expect(testRouter.state.location.pathname).toBe("/register");
        expect(screen.getByTestId("register-form")).toBeInTheDocument();
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
        expect(screen.getByTestId("password-input")).toBeInTheDocument();
        expect(screen.getByTestId("register-button")).toBeInTheDocument();
        expect(screen.getByTestId("login-link")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("handles user registration on home route", async () => {
    setupRegisterMock();
    await setupRouter("/");

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
      expect(screen.getByTestId("signup-link")).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId("signup-link"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("register-form")).toBeInTheDocument()
    );

    await act(async () => {
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      await userEvent.type(emailInput, "newuser@example.com", { delay: 10 });
      await userEvent.type(passwordInput, "password123", { delay: 10 });
      expect(emailInput).toHaveValue("newuser@example.com");
      expect(passwordInput).toHaveValue("password123");
      const form = screen.getByTestId("register-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("register-message")).toBeInTheDocument();
        expect(screen.getByTestId("register-message")).toHaveTextContent(
          "Registration successful!"
        );
        expect(screen.getByTestId("login-link")).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    await act(async () => {
      await userEvent.click(screen.getByTestId("login-link"));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("login-form")).toBeInTheDocument();
        expect(screen.getByTestId("login-button")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("handles successful login on home route", async () => {
    setupLoginMock("neil.huyton@gmail.com", "password123", true);
    await setupRouter("/");

    await waitFor(() =>
      expect(screen.getByTestId("login-form")).toBeInTheDocument()
    );

    await act(async () => {
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      await userEvent.type(emailInput, "neil.huyton@gmail.com", { delay: 10 });
      await userEvent.type(passwordInput, "password123", { delay: 10 });
      expect(emailInput).toHaveValue("neil.huyton@gmail.com");
      expect(passwordInput).toHaveValue("password123");
      const form = screen.getByTestId("login-form");
      await act(async () => {
        await form.dispatchEvent(new Event("submit", { bubbles: true }));
      });
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("login-message")).toBeInTheDocument();
        expect(screen.getByTestId("login-message")).toHaveTextContent(
          "Login successful!"
        );
        expect(useAuthStore.getState().isLoggedIn).toBe(true);
        expect(screen.getByTestId("logout-button")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});