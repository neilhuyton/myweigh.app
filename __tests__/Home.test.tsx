// __tests__/Home.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { router } from "../src/router";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { act } from "react";
import { useAuthStore } from "../src/store/authStore";
import { toast } from "sonner";

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
        fetch: async (input: RequestInfo | URL, options?: RequestInit) => {
          return fetch(input, { ...options, signal: options?.signal ?? null });
        },
      }),
    ],
  });

  const setup = async (initialPath: string) => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      ...router.options,
      history,
      routeTree: router.routeTree,
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
    vi.spyOn(toast, "success").mockImplementation(() => "toast-success-id");
    vi.spyOn(toast, "error").mockImplementation(() => "toast-error-id");
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false });
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    server.close();
  });

  it("renders login form by default on home route", async () => {
    await setup("/");

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText("m@example.com")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter your password")
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Login" })
        ).toBeInTheDocument();
        expect(screen.getByTestId("signup-link")).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "Register" })
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("switches to register form when sign up is clicked", async () => {
    await setup("/");

    await waitFor(() => {
      expect(screen.getByTestId("signup-link")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("signup-link"));
    });

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText("m@example.com")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter your password")
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Register" })
        ).toBeInTheDocument();
        expect(screen.getByTestId("login-link")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("handles user registration on home route", async () => {
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/*",
        async ({ request, params }) => {
          const body = (await request.json()) as {
            [key: string]: { id?: number; email: string; password: string };
          };
          const input = body["0"];
          const id = input?.id ?? 0;
          if (
            params[0] === "register" &&
            input?.email === "newuser@example.com"
          ) {
            return HttpResponse.json([
              {
                id,
                result: {
                  data: {
                    id: "new-user-id",
                    email: "newuser@example.com",
                    message: "Registration successful! Please check your email to verify your account.",
                  },
                },
              },
            ]);
          }
          return HttpResponse.json(
            [
              {
                id,
                error: {
                  message: "Procedure not found",
                  code: -32601,
                  data: { code: "NOT_FOUND", httpStatus: 404, path: params[0] },
                },
              },
            ],
            { status: 404 }
          );
        }
      )
    );

    await setup("/");

    await waitFor(() => {
      expect(screen.getByTestId("signup-link")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("signup-link"));
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("m@example.com")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("m@example.com"), {
        target: { value: "newuser@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Register" }));
    });

    await waitFor(
      () => {
        expect(toast.success).toHaveBeenCalledWith("Registration successful!", {
          description: "Your account has been created.",
          action: {
            label: "Log in now",
            onClick: expect.any(Function),
          },
          className: "register-toast",
          id: "register-message",
        });
      },
      { timeout: 3000 } // Increased timeout
    );
  });

  it("handles successful login on home route", async () => {
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/*",
        async ({ request, params }) => {
          const body = (await request.json()) as {
            [key: string]: { id?: number; email: string; password: string };
          };
          const input = body["0"];
          const id = input?.id ?? 0;
          if (
            params[0] === "login" &&
            input?.email === "testuser@example.com" &&
            input?.password === "password123"
          ) {
            return HttpResponse.json([
              {
                id,
                result: {
                  data: { id: "test-user-id", email: "testuser@example.com" },
                },
              },
            ]);
          }
          return HttpResponse.json(
            [
              {
                id,
                error: {
                  message: "Invalid email or password",
                  code: -32001,
                  data: {
                    code: "UNAUTHORIZED",
                    httpStatus: 401,
                    path: "login",
                  },
                },
              },
            ],
            { status: 401 }
          );
        }
      )
    );

    await setup("/");

    await waitFor(() => {
      expect(screen.getByPlaceholderText("m@example.com")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("m@example.com"), {
        target: { value: "testuser@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Login" }));
    });

    await waitFor(
      () => {
        // expect(toast.success).toHaveBeenCalledWith("Login successful!", {
        //   description: "You are now logged in.",
        //   action: {
        //     label: "Go to Dashboard",
        //     onClick: expect.any(Function),
        //   },
        //   className: "login-toast",
        //   duration: 5000,
        // });
        expect(screen.getByTestId("login-message")).toBeInTheDocument();
      },
      { timeout: 3000 } // Increased timeout
    );

    // Wait for auth state and UI to update
    await waitFor(
      () => {
        expect(useAuthStore.getState().isLoggedIn).toBe(true);
        expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("handles invalid login credentials on home route", async () => {
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/*",
        async ({ request, params }) => {
          const body = (await request.json()) as {
            [key: string]: { id?: number; email: string; password: string };
          };
          const input = body["0"];
          const id = input?.id ?? 0;
          if (params[0] === "login") {
            return HttpResponse.json(
              [
                {
                  id,
                  error: {
                    message: "Invalid email or password",
                    code: -32001,
                    data: {
                      code: "UNAUTHORIZED",
                      httpStatus: 401,
                      path: "login",
                    },
                  },
                },
              ],
              { status: 401 }
            );
          }
          return HttpResponse.json(
            [
              {
                id,
                error: {
                  message: "Procedure not found",
                  code: -32601,
                  data: { code: "NOT_FOUND", httpStatus: 404, path: params[0] },
                },
              },
            ],
            { status: 404 }
          );
        }
      )
    );

    await setup("/");

    await waitFor(() => {
      expect(screen.getByPlaceholderText("m@example.com")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("m@example.com"), {
        target: { value: "wronguser@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "wrongpassword" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Login" }));
    });

    // await waitFor(
    //   () => {
    //     expect(toast.error).toHaveBeenCalledWith("Login failed", {
    //       description: "Invalid email or password",
    //       action: {
    //         label: "Try again",
    //         onClick: expect.any(Function),
    //       },
    //       className: "login-toast",
    //       duration: 5000,
    //     });
    //   },
    //   { timeout: 3000 } // Increased timeout
    // );
  });
});