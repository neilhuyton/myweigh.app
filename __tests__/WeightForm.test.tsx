// __tests__/WeightForm.test.tsx
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
import { act } from "@testing-library/react";
import WeightForm from "../src/components/WeightForm";
import { weightCreateHandler, weightGetCurrentGoalHandler } from "../__mocks__/handlers";
import { useAuthStore } from "../src/store/authStore";
import { generateToken } from "./utils/token";

// Mock Confetti component (still needed as it's used in WeightForm.tsx)
vi.mock("react-confetti", () => ({
  default: ({ className, ...props }: { className: string; "data-testid": string }) => (
    <div className={className} data-testid={props["data-testid"]} />
  ),
}));

// Mock LoadingSpinner component
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

// Mock useNavigate to avoid router context issues
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("WeightForm Component", () => {
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
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        }),
      }),
    ],
  });

  const setup = async (userId = "test-user-id") => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: true,
        userId,
        token: generateToken(userId),
        refreshToken: "valid-refresh-token",
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <WeightForm />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" }); // Fail on unhandled requests
  });

  beforeEach(() => {
    server.use(weightGetCurrentGoalHandler, weightCreateHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
    document.body.innerHTML = "";
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterAll(() => {
    server.close();
  });

  it("renders WeightForm with correct content", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.queryByTestId("weight-form-submitting")).not.toBeInTheDocument();
        expect(screen.getByTestId("weight-label")).toHaveTextContent("Weight (kg)");
        expect(screen.getByTestId("weight-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
        expect(screen.queryByTestId("weight-message")).not.toBeInTheDocument();
      },
      { timeout: 5000, interval: 100 }
    );
  });

  it("allows user to submit a valid weight", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.queryByTestId("weight-form-submitting")).not.toBeInTheDocument();
        expect(screen.getByTestId("weight-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      },
      { timeout: 5000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("weight-input") as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "70.5", { delay: 10 });
      console.log("Input value before submission:", input.value); // Debug
      expect(input).toHaveValue(70.5);
      const form = screen.getByTestId("weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const messageElement = screen.getByTestId("weight-message");
        expect(messageElement).toBeInTheDocument();
        expect(messageElement).toHaveTextContent("Weight recorded successfully!");
        expect(screen.getByTestId("weight-input")).toHaveValue(null);
      },
      { timeout: 5000, interval: 100 }
    );
  });

  it("displays error message for invalid weight input", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-input")).toBeInTheDocument();
      },
      { timeout: 5000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("weight-input") as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "-5", { delay: 10 });
      console.log("Input value before submission:", input.value); // Debug
      expect(input).toHaveValue(-5);
      const form = screen.getByTestId("weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const messageElement = screen.getByTestId("weight-message");
        expect(messageElement).toBeInTheDocument();
        expect(messageElement).toHaveTextContent("Please enter a valid weight.");
        expect(messageElement).toHaveClass("text-destructive");
      },
      { timeout: 5000, interval: 100 }
    );
  });

  it("displays unauthorized error when user is not logged in", async () => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: false,
        userId: null,
        token: null,
        refreshToken: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <WeightForm />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-input")).toBeInTheDocument();
      },
      { timeout: 5000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("weight-input") as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "70", { delay: 10 });
      console.log("Input value before submission:", input.value); // Debug
      const form = screen.getByTestId("weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const messageElement = screen.getByTestId("weight-message");
        expect(messageElement).toBeInTheDocument();
        expect(messageElement).toHaveTextContent("User ID not found. Please log in again.");
      },
      { timeout: 5000, interval: 100 }
    );
  });

  it("displays error message when weight submission fails", async () => {
    await setup("error-user-id");

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-input")).toBeInTheDocument();
      },
      { timeout: 5000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("weight-input") as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "70", { delay: 10 });
      console.log("Input value before submission:", input.value); // Debug
      expect(input).toHaveValue(70);
      const form = screen.getByTestId("weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await waitFor(
      () => {
        const messageElement = screen.getByTestId("weight-message");
        expect(messageElement).toBeInTheDocument();
        expect(messageElement).toHaveTextContent("Failed to record weight: Failed to create weight");
        expect(messageElement).toHaveClass("text-destructive");
      },
      { timeout: 5000, interval: 100 }
    );
  });
});