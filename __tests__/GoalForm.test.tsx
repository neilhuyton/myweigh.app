import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import GoalForm from "../src/components/GoalForm";
import { useAuthStore } from "../src/store/authStore";
import { generateToken } from "./utils/token";
import {
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
} from "../__mocks__/handlers";

// Mock react-joyride
vi.mock("react-joyride", () => ({
  default: ({
    steps,
    run,
    callback,
    locale,
  }: {
    steps: { target: string; content: string; placement: string; disableBeacon: boolean }[];
    run: boolean;
    callback: (data: { status: string; action?: string }) => void;
    styles: { options: Record<string, unknown> };
    locale: Record<string, string>;
  }) => {
    console.log("Joyride props:", { run, steps, locale });
    if (run && steps?.length > 0) {
      return (
        <div data-testid="joyride-tour">
          <div data-testid="joyride-step">{steps[0].content}</div>
          <button
            data-test-id="button-skip"
            onClick={() => callback({ status: "skipped" })}
          >
            {locale.skip}
          </button>
          <button
            data-test-id="button-primary"
            onClick={() => callback({ status: "finished", action: "close" })}
          >
            {locale.last}
          </button>
          <button
            data-test-id="button-close"
            onClick={() => callback({ status: "skipped", action: "close" })}
          >
            Close
          </button>
        </div>
      );
    }
    return null;
  },
  STATUS: {
    FINISHED: "finished",
    SKIPPED: "skipped",
  },
}));

// Mock LoadingSpinner
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock console.error to suppress act warnings
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("GoalForm Component", () => {
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
        isFirstLogin: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <GoalForm />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    vi.spyOn(window.localStorage, "setItem");
    mockNavigate.mockReset();
    server.use(weightGetCurrentGoalHandler, weightSetGoalHandler, weightUpdateGoalHandler);
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
      isFirstLogin: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    consoleErrorSpy.mockReset();
  });

  afterAll(() => {
    server.close();
    consoleErrorSpy.mockRestore();
  });

  it("renders GoalForm with correct content", async () => {
    await setup();

    await waitFor(
      () => {
        expect(screen.getByTestId("goal-weight-label")).toHaveTextContent("Goal Weight (kg)");
        expect(screen.getByTestId("goal-weight-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
        expect(screen.queryByTestId("goal-message")).not.toBeInTheDocument();
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
      },
      { timeout: 1000, interval: 100 }
    );
  });

  it("shows Joyride tour after first goal submission and navigates to /stats", async () => {
    await setup("empty-user-id");

    await waitFor(
      () => {
        expect(screen.getByTestId("goal-weight-input")).toBeInTheDocument();
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
      },
      { timeout: 1000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("goal-weight-input") as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "65.5", { delay: 10 });
      expect(input).toHaveValue(65.5);
      const form = screen.getByTestId("goal-weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await act(async () => {
      await waitFor(
        () => {
          const messageElement = screen.queryByTestId("goal-message");
          if (messageElement) {
            expect(messageElement).toHaveTextContent("Goal set successfully!");
          } else {
            throw new Error("Goal message not found");
          }
          expect(screen.getByTestId("joyride-tour")).toBeInTheDocument();
          expect(screen.getByTestId("joyride-step")).toHaveTextContent(
            "Great job setting your first goal! Check your progress on the Stats page."
          );
          const primaryButton = screen.getByTestId("joyride-tour").querySelector('[data-test-id="button-primary"]');
          expect(primaryButton).toHaveTextContent("Close");
        },
        { timeout: 5000, interval: 100 }
      );
    });

    await act(async () => {
      const closeButton = screen.getByTestId("joyride-tour").querySelector('[data-test-id="button-primary"]') as HTMLButtonElement;
      await userEvent.click(closeButton);
    });

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
          expect(mockNavigate).toHaveBeenCalledWith({ to: "/stats" });
        },
        { timeout: 1000, interval: 100 }
      );
    });
  });

  it("does not show Joyride tour when updating an existing goal", async () => {
    await setup("test-user-id");

    await waitFor(
      () => {
        expect(screen.getByTestId("goal-weight-input")).toBeInTheDocument();
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
      },
      { timeout: 1000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("goal-weight-input") as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "70.0", { delay: 10 });
      expect(input).toHaveValue(70.0);
      const form = screen.getByTestId("goal-weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await act(async () => {
      await waitFor(
        () => {
          const messageElement = screen.queryByTestId("goal-message");
          if (messageElement) {
            expect(messageElement).toHaveTextContent("Goal updated successfully!");
          } else {
            throw new Error("Goal message not found");
          }
          expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
        },
        { timeout: 2000, interval: 100 }
      );
    });
  });
});