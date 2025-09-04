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
import { screen, waitFor } from "@testing-library/react";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import WeightForm from "../src/components/WeightForm";
import {
  weightCreateHandler,
  weightGetCurrentGoalHandler,
  userUpdateFirstLoginHandler,
} from "../__mocks__/handlers";
import { renderWithProviders } from "./utils/setup";

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
    vi.clearAllMocks();
    document.body.innerHTML = "";
    consoleErrorSpy.mockReset();
  });

  afterAll(() => {
    server.close();
    consoleErrorSpy.mockRestore();
  });

  it("renders WeightForm with correct content", async () => {
    renderWithProviders(<WeightForm />);

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
      { timeout: 2000, interval: 100 }
    );
  });
});
