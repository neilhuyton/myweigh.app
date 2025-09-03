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
import {
  weightCreateHandler,
  weightGetCurrentGoalHandler,
  userUpdateFirstLoginHandler,
} from "../__mocks__/handlers";
import { useAuthStore } from "../src/store/authStore";
import { generateToken } from "./utils/token";

// Mock react-confetti
vi.mock("react-confetti", () => ({
  default: ({
    className,
    ...props
  }: {
    className: string;
    "data-testid": string;
  }) => <div className={className} data-testid={props["data-testid"]} />,
}));

// Mock LoadingSpinner component
vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

// Mock react-joyride
vi.mock("react-joyride", () => ({
  default: ({
    steps,
    run,
    callback,
    locale,
  }: {
    steps: {
      target: string;
      content: string;
      placement: string;
      disableBeacon: boolean;
    }[];
    run: boolean;
    callback: (data: { status: string }) => void;
    styles: { options: Record<string, unknown> }; // Changed from Record<string, any>
    locale: Record<string, string>;
  }) => {
    if (run) {
      return (
        <div data-testid="joyride-tour">
          <div data-testid="joyride-step">{steps[0].content}</div>
          <button
            data-testid="joyride-skip"
            onClick={() => callback({ status: "skipped" })}
          >
            {locale.skip}
          </button>
          <button
            data-testid="joyride-finish"
            onClick={() => callback({ status: "finished" })}
          >
            {locale.last}
          </button>
        </div>
      );
    }
    return null;
  },
}));

// Mock useNavigate to track navigation calls
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock console.error to suppress act warnings during debugging
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

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

  const setup = async (userId = "test-user-id", isFirstLogin = false) => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: true,
        userId,
        token: generateToken(userId),
        refreshToken: "valid-refresh-token",
        isFirstLogin,
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
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    server.use(
      weightGetCurrentGoalHandler,
      weightCreateHandler,
      userUpdateFirstLoginHandler
    );
    vi.spyOn(window.localStorage, "setItem");
    mockNavigate.mockReset();
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

  it("renders WeightForm with correct content", async () => {
    await setup();

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("weight-form-submitting")
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("weight-label")).toHaveTextContent(
          "Weight (kg)"
        );
        expect(screen.getByTestId("weight-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
        expect(screen.queryByTestId("weight-message")).not.toBeInTheDocument();
      },
      { timeout: 15000, interval: 100 }
    );
  });

  it("starts Joyride tour on first login", async () => {
    await setup("test-user-id", true);

    await waitFor(
      () => {
        expect(screen.getByTestId("joyride-tour")).toBeInTheDocument();
        expect(screen.getByTestId("joyride-step")).toHaveTextContent(
          "Enter your weight here in kilograms to start tracking your progress!"
        );
        expect(screen.getByTestId("joyride-skip")).toHaveTextContent("Skip");
        expect(screen.getByTestId("joyride-finish")).toHaveTextContent(
          "Finish"
        );
      },
      { timeout: 15000, interval: 100 }
    );
  });

  it("does not start Joyride tour when not first login", async () => {
    await setup("test-user-id", false);

    await waitFor(
      () => {
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
      },
      { timeout: 15000, interval: 100 }
    );
  });

  it("skips Joyride tour and updates isFirstLogin", async () => {
    await setup("test-user-id", true);

    await waitFor(
      () => {
        expect(screen.getByTestId("joyride-tour")).toBeInTheDocument();
      },
      { timeout: 15000, interval: 100 }
    );

    await act(async () => {
      const skipButton = screen.getByTestId("joyride-skip");
      await userEvent.click(skipButton);
    });

    await waitFor(
      () => {
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
        expect(useAuthStore.getState().isFirstLogin).toBe(false);
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "isFirstLogin",
          JSON.stringify(false)
        );
      },
      { timeout: 15000, interval: 100 }
    );
  });

  it("completes Joyride tour and updates isFirstLogin", async () => {
    await setup("test-user-id", true);

    await waitFor(
      () => {
        expect(screen.getByTestId("joyride-tour")).toBeInTheDocument();
      },
      { timeout: 15000, interval: 100 }
    );

    await act(async () => {
      const finishButton = screen.getByTestId("joyride-finish");
      await userEvent.click(finishButton);
    });

    await waitFor(
      () => {
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
        expect(useAuthStore.getState().isFirstLogin).toBe(false);
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "isFirstLogin",
          JSON.stringify(false)
        );
      },
      { timeout: 15000, interval: 100 }
    );
  });

  it("handles unauthorized error when updating isFirstLogin", async () => {
    await setup("invalid-user-id", true);

    await waitFor(
      () => {
        expect(screen.getByTestId("joyride-tour")).toBeInTheDocument();
      },
      { timeout: 15000, interval: 100 }
    );

    await act(async () => {
      const finishButton = screen.getByTestId("joyride-finish");
      await userEvent.click(finishButton);
    });

    await waitFor(
      () => {
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
        expect(localStorage.setItem).not.toHaveBeenCalled();
      },
      { timeout: 15000, interval: 100 }
    );
  });

  it("shows goal-setting Joyride tour after first weight submission when no goal exists and navigates to /goals", async () => {
    await setup("empty-user-id", false);

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-input")).toBeInTheDocument();
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
      },
      { timeout: 15000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("weight-input") as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "70.5", { delay: 10 });
      expect(input).toHaveValue(70.5);
      const form = screen.getByTestId("weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await act(async () => {
      await waitFor(
        () => {
          const messageElement = screen.queryByTestId("weight-message");
          if (messageElement) {
            expect(messageElement).toHaveTextContent("Weight recorded successfully!");
          } else {
            throw new Error("Weight message not found");
          }
          expect(screen.getByTestId("joyride-tour")).toBeInTheDocument();
          expect(screen.getByTestId("joyride-step")).toHaveTextContent(
            "Great job! Now set a goal to track your progress."
          );
          expect(screen.getByTestId("joyride-finish")).toHaveTextContent("OK");
        },
        { timeout: 30000, interval: 100 }
      );
    });

    await act(async () => {
      const okButton = screen.getByTestId("joyride-finish");
      await userEvent.click(okButton);
    });

    await act(async () => {
      await waitFor(
        () => {
          expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
          expect(mockNavigate).toHaveBeenCalledWith({ to: "/goals" });
        },
        { timeout: 15000, interval: 100 }
      );
    });
  });

  it("does not show goal-setting Joyride tour when a goal exists", async () => {
    await setup("test-user-id", false);

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-input")).toBeInTheDocument();
        expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
      },
      { timeout: 15000, interval: 100 }
    );

    await act(async () => {
      const input = screen.getByTestId("weight-input") as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "70.5", { delay: 10 });
      expect(input).toHaveValue(70.5);
      const form = screen.getByTestId("weight-form");
      await form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    await act(async () => {
      await waitFor(
        () => {
          const messageElement = screen.queryByTestId("weight-message");
          if (messageElement) {
            expect(messageElement).toHaveTextContent("Weight recorded successfully!");
          } else {
            throw new Error("Weight message not found");
          }
          expect(screen.queryByTestId("joyride-tour")).not.toBeInTheDocument();
        },
        { timeout: 30000, interval: 100 }
      );
    });
  });
});