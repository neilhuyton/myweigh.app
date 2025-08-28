// __tests__/Register.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { router } from "../src/router/router";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { useAuthStore } from "../src/store/authStore";

describe("Register Component Email Verification", () => {
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
          return fetch(url, { ...options, signal: options?.signal ?? null });
        },
      }),
    ],
  });

  const setup = async (initialPath: string = "/register") => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      ...router.options,
      history,
      routeTree: router.routeTree,
    });

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
    useAuthStore.setState({ isLoggedIn: false, userId: null });
    queryClient.clear();
  });

  afterAll(() => {
    server.close();
  });

  it("displays email verification prompt after successful registration", async () => {
    server.use(
      http.post(
        "http://localhost:8888/.netlify/functions/trpc/register",
        async () => {
          return HttpResponse.json([
            {
              result: {
                data: {
                  id: "user-id",
                  email: "test@example.com",
                  message:
                    "Registration successful! Please check your email to verify your account.",
                },
              },
            },
          ]);
        }
      )
    );

    await setup("/register");

    await waitFor(() => {
      expect(screen.getByText("Create an account")).toBeInTheDocument();
      expect(screen.getByTestId("email-input")).toBeInTheDocument();
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
      expect(screen.getByTestId("register-button")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByTestId("register-button"));

    await waitFor(
      () => {
        expect(screen.getByTestId("register-message")).toHaveTextContent(
          "Registration successful! Please check your email to verify your account."
        );
        expect(screen.getByTestId("register-message")).toHaveClass(
          "text-green-500"
        );
      },
      { timeout: 2000 }
    );
  });
});
