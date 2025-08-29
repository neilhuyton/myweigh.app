// __tests__/Register.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { router } from "../src/router/router";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";
import { useAuthStore } from "../src/store/authStore";
import { registerHandler } from "../__mocks__/handlers/register"; // Import the external register handler

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
        fetch: async (input, options) =>
          fetch(input, { ...options }),
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
    server.use(registerHandler); // Use the external register handler
    process.on("unhandledRejection", (reason) => {
      if (
        reason instanceof Error &&
        (reason.message.includes("Email already exists") ||
          reason.message.includes("Email and password are required") ||
          reason.message.includes("Invalid email address") ||
          reason.message.includes("Password must be at least 8 characters"))
      ) {
        return;
      }
      throw reason;
    });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null });
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
    process.removeAllListeners("unhandledRejection");
  });

  it("displays email verification prompt after successful registration", async () => {
    await setup("/register");

    await waitFor(() => {
      expect(screen.getByText("Create an account")).toBeInTheDocument();
      expect(screen.getByTestId("email-input")).toBeInTheDocument();
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
      expect(screen.getByTestId("register-button")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByTestId("password-input"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByTestId("register-button"));
    });

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