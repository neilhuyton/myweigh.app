import { screen, waitFor, fireEvent } from "@testing-library/react";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import WeightForm from "../src/components/WeightForm";
import {
  weightCreateHandler,
  weightGetCurrentGoalHandler,
  userUpdateFirstLoginHandler,
} from "../__mocks__/handlers";
import { renderWithProviders } from "./utils/setup";

vi.mock("react-confetti", () => ({
  default: ({
    className,
    ...props
  }: {
    className: string;
    "data-testid": string;
  }) => <div className={className} data-testid={props["data-testid"]} />,
}));

vi.mock("../src/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ testId }: { testId: string }) => (
    <div data-testid={testId}>Loading...</div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuthStore = vi.fn(() => ({ userId: "test-user-id" }));
vi.mock("../store/authStore", () => ({
  useAuthStore: mockUseAuthStore,
}));

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
    mockUseAuthStore.mockReturnValue({ userId: "test-user-id" });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
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

  it("successfully submits a weight measurement and shows success message", async () => {
    renderWithProviders(<WeightForm />);

    await waitFor(() => {
      expect(screen.getByTestId("weight-label")).toHaveTextContent(
        "Weight (kg)"
      );
      expect(screen.getByTestId("weight-input")).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });

    const weightInput = screen.getByTestId("weight-input");
    fireEvent.change(weightInput, { target: { value: "65.00" } });

    const form = screen.getByTestId("weight-form");
    await form.dispatchEvent(new Event("submit", { bubbles: true }));

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-message")).toHaveTextContent(
          "Weight recorded successfully!"
        );
        expect(weightInput).toHaveValue(null);
        expect(mockNavigate).not.toHaveBeenCalled();
      },
      { timeout: 2000, interval: 100 }
    );
  });

  it("displays error for negative weight submission", async () => {
    renderWithProviders(<WeightForm />);

    await waitFor(() => {
      expect(screen.getByTestId("weight-form")).toBeInTheDocument();
    });

    const weightInput = screen.getByTestId("weight-input");
    fireEvent.change(weightInput, { target: { value: "-1" } });

    const form = screen.getByTestId("weight-form");
    await form.dispatchEvent(new Event("submit", { bubbles: true }));

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-message")).toHaveTextContent(
          "Please enter a valid weight."
        );
        expect(mockNavigate).not.toHaveBeenCalled();
      },
      { timeout: 2000, interval: 100 }
    );
  });

  it("displays error for weight with too many decimal places", async () => {
    renderWithProviders(<WeightForm />);

    await waitFor(() => {
      expect(screen.getByTestId("weight-form")).toBeInTheDocument();
    });

    const weightInput = screen.getByTestId("weight-input");
    fireEvent.change(weightInput, { target: { value: "65.123" } });

    const form = screen.getByTestId("weight-form");
    await form.dispatchEvent(new Event("submit", { bubbles: true }));

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-message")).toHaveTextContent(
          "Weight can have up to two decimal places."
        );
        expect(mockNavigate).not.toHaveBeenCalled();
      },
      { timeout: 2000, interval: 100 }
    );
  });

  it("clears error message on input change", async () => {
    renderWithProviders(<WeightForm />);

    await waitFor(() => {
      expect(screen.getByTestId("weight-form")).toBeInTheDocument();
    });

    const weightInput = screen.getByTestId("weight-input");
    fireEvent.change(weightInput, { target: { value: "-1" } });

    const form = screen.getByTestId("weight-form");
    await form.dispatchEvent(new Event("submit", { bubbles: true }));

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-message")).toHaveTextContent(
          "Please enter a valid weight."
        );
      },
      { timeout: 2000, interval: 100 }
    );

    fireEvent.change(weightInput, { target: { value: "65.00" } });

    await waitFor(
      () => {
        expect(screen.queryByTestId("weight-message")).not.toBeInTheDocument();
      },
      { timeout: 2000, interval: 100 }
    );
  });
});
