// __tests__/Register.test.tsx
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
import { httpLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { act } from "react"; // Use react for act
import { useAuthStore } from "../src/store/authStore";
import { registerHandler } from "../__mocks__/handlers/register";
import Register from "../src/components/Register"; // Adjust the import path as needed
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";

// Mock useRouter (if used in Register component)
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouter: vi.fn(),
  };
});

describe("Register Component Email Verification", () => {
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

  const setup = async () => {
    const rootRoute = createRootRoute({
      component: () => <Register />,
    });

    const registerRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/register",
    });

    const routeTree = rootRoute.addChildren([registerRoute]);
    const history = createMemoryHistory({ initialEntries: ["/register"] });
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
    server.use(registerHandler);
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
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
    process.removeAllListeners("unhandledRejection");
  });

  it("displays email verification prompt after successful registration", async () => {
    await setup();

    await waitFor(() => {
      expect(screen.getByText("Create an account")).toBeInTheDocument();
      expect(screen.getByTestId("email-input")).toBeInTheDocument();
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
      expect(screen.getByTestId("register-button")).toBeInTheDocument();
    });

    await act(async () => {
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const form = screen.getByTestId("register-form");
      await userEvent.clear(emailInput);
      await userEvent.clear(passwordInput);
      await userEvent.type(emailInput, "test@example.com", { delay: 10 });
      await userEvent.type(passwordInput, "password123", { delay: 10 });
      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("password123");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
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
      { timeout: 3000, interval: 100 }
    );
  });
});
