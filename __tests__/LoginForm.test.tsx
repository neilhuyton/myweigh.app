// __tests__/LoginForm.test.tsx
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../__mocks__/server";
import { trpc } from "../src/trpc";
import { useAuthStore } from "../src/store/authStore";
import LoginForm from "../src/components/LoginForm";
import "@testing-library/jest-dom";
import { httpBatchLink } from "@trpc/client";
import type { Mock } from "vitest";
import ResetPasswordForm from "../src/components/ResetPasswordForm";
import { useState } from "react";

// Define the mock type to match AuthState from authStore.ts
interface AuthState {
  userId: string | null;
  isLoggedIn: boolean;
  login: (userId: string) => void;
  logout: () => void;
}

// Custom type to extend Mock with getState
interface MockAuthStore extends Mock {
  getState: Mock;
}

// Mock useAuthStore
vi.mock("../src/store/authStore", () => {
  const loginMock = vi.fn();
  const logoutMock = vi.fn();
  const mockState: AuthState = {
    userId: null,
    isLoggedIn: false,
    login: loginMock,
    logout: logoutMock,
  };
  const useAuthStoreMock = vi.fn(() => mockState) as MockAuthStore;
  useAuthStoreMock.getState = vi.fn(() => mockState);
  return { useAuthStore: useAuthStoreMock };
});

// Mock localStorage to match authStore.ts behavior
vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {});

describe("LoginForm Component", () => {
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
          const { userId } = useAuthStore.getState();
          const headers = {
            ...options?.headers,
            ...(userId ? { Authorization: `Bearer ${userId}` } : {}),
          };
          const fetchOptions = {
            ...options,
            headers,
            signal: undefined,
          };
          return fetch(url, fetchOptions);
        },
      }),
    ],
  });

  const setup = (onSwitchToRegister = vi.fn(), onSwitchToReset = vi.fn()) => {
    render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <LoginForm
            onSwitchToRegister={onSwitchToRegister}
            onSwitchToReset={onSwitchToReset}
          />
        </QueryClientProvider>
      </trpc.Provider>
    );
    return { onSwitchToRegister, onSwitchToReset };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  afterEach(() => {
    server.resetHandlers();
    (useAuthStore.getState().login as Mock).mockReset();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    server.close();
  });

  it("renders login form with email, password inputs, and submit button", () => {
    const { onSwitchToRegister } = setup();
    expect(
      screen.getByRole("heading", { name: "Login to your account" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-link")).toBeInTheDocument();
    expect(onSwitchToRegister).not.toHaveBeenCalled();
  });

  it.skip("handles successful login and updates auth state", async () => {
    const loginMock = vi.fn((userId: string) => {
      const state = useAuthStore.getState();
      state.isLoggedIn = true;
      state.userId = userId;
    });
    (useAuthStore.getState().login as Mock).mockImplementation(loginMock);

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(
      () => {
        expect(screen.getByTestId("login-message")).toBeInTheDocument();
        expect(screen.getByTestId("login-message")).toHaveTextContent(
          "Login successful!"
        );
        expect(screen.getByTestId("login-message")).toHaveClass(
          "text-green-500"
        );
        expect(useAuthStore.getState().isLoggedIn).toBe(true);
        expect(loginMock).toHaveBeenCalledWith("test-user-id");
      },
      { timeout: 5000 }
    );
  });

  it.skip("displays error message on invalid login credentials", async () => {
    setup();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "wronguser@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(
      () => {
        expect(screen.getByTestId("login-message")).toBeInTheDocument();
        expect(screen.getByTestId("login-message")).toHaveTextContent(
          "Login failed: Invalid email or password"
        );
        expect(screen.getByTestId("login-message")).toHaveClass("text-red-500");
      },
      { timeout: 5000 }
    );
  });

  it("displays validation errors for invalid email and password", async () => {
    setup();

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);
    fireEvent.change(passwordInput, { target: { value: "short" } });
    fireEvent.blur(passwordInput);
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(
      () => {
        expect(
          screen.getByText("Please enter a valid email address")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Password must be at least 8 characters long")
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("switches to register form when sign up link is clicked", () => {
    const { onSwitchToRegister } = setup();
    fireEvent.click(screen.getByRole("link", { name: "Sign up" }));
    expect(onSwitchToRegister).toHaveBeenCalled();
  });

  it.skip("disables login button during submission", async () => {
    setup();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    const loginButton = screen.getByRole("button", { name: "Login" });
    expect(loginButton).not.toBeDisabled();

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(loginButton).toBeDisabled();
      expect(loginButton).toHaveTextContent("Logging in...");
    });

    await waitFor(
      () => {
        expect(loginButton).not.toBeDisabled();
        expect(loginButton).toHaveTextContent("Login");
        expect(screen.getByTestId("login-message")).toHaveTextContent(
          "Login successful!"
        );
      },
      { timeout: 5000 }
    );
  });

  it("displays forgot password link as placeholder", () => {
    setup();
    const forgotPasswordLink = screen.getByTestId("forgot-password-link");
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute("href", "#");
    expect(forgotPasswordLink).toHaveTextContent("Forgot your password?");

    fireEvent.click(forgotPasswordLink);
    expect(screen.queryByTestId("login-message")).not.toBeInTheDocument();
  });

  it("calls onSwitchToReset when forgot password link is clicked", () => {
    const onSwitchToReset = vi.fn();
    setup(undefined, onSwitchToReset);

    const forgotPasswordLink = screen.getByTestId("forgot-password-link");
    fireEvent.click(forgotPasswordLink);

    expect(onSwitchToReset).toHaveBeenCalledTimes(1);
  });

  it("displays ResetPasswordForm after clicking forgot password link", async () => {
    const MockParent = () => {
      const [showResetForm, setShowResetForm] = useState(false);
      return showResetForm ? (
        <ResetPasswordForm onSwitchToLogin={() => setShowResetForm(false)} />
      ) : (
        <LoginForm
          onSwitchToRegister={() => {}}
          onSwitchToReset={() => setShowResetForm(true)}
        />
      );
    };

    render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <MockParent />
        </QueryClientProvider>
      </trpc.Provider>
    );

    expect(
      screen.getByRole("heading", { name: "Login to your account" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Reset your password" })
    ).not.toBeInTheDocument();

    const forgotPasswordLink = screen.getByTestId("forgot-password-link");
    fireEvent.click(forgotPasswordLink);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Reset your password" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Login to your account" })
      ).not.toBeInTheDocument();
    });
  });
});
