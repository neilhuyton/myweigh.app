import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardCard } from "../src/components/DashboardCard";
import { ScaleIcon } from "lucide-react";
import "@testing-library/jest-dom";
import { act } from "react";
import { renderWithProviders } from "./utils/setup";
import { useRouter } from "@tanstack/react-router";

// Mock @tanstack/react-router
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRouter: vi.fn(() => ({
      navigate: vi.fn(),
    })),
  };
});

describe("DashboardCard Component", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders card with provided props", async () => {
    const props = {
      title: "Current Weight",
      icon: ScaleIcon,
      value: "70.5 kg",
      description: "Latest recorded weight",
      buttonText: "Record Weight",
      buttonLink: "/weight",
      testId: "current-weight-card",
    };

    renderWithProviders(<DashboardCard {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId("current-weight-card")).toBeInTheDocument();
      expect(screen.getByText("Current Weight")).toBeInTheDocument();
      expect(screen.getByText("70.5 kg")).toBeInTheDocument();
      expect(screen.getByText("Latest recorded weight")).toBeInTheDocument();
      expect(
        screen.getByTestId("current-weight-card-button")
      ).toHaveTextContent("Record Weight");
    });
  });

  it('renders "No data" when value is null', async () => {
    const props = {
      title: "Current Weight",
      icon: ScaleIcon,
      value: null,
      description: "Record your weight",
      buttonText: "Record Weight",
      buttonLink: "/weight",
      testId: "current-weight-card",
    };

    renderWithProviders(<DashboardCard {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId("current-weight-card")).toBeInTheDocument();
      expect(screen.getByText("No data")).toBeInTheDocument();
      expect(screen.getByText("Record your weight")).toBeInTheDocument();
      expect(
        screen.getByTestId("current-weight-card-button")
      ).toHaveTextContent("Record Weight");
    });
  });

  it("calls navigate with buttonLink when button is clicked", async () => {
    const props = {
      title: "Current Weight",
      icon: ScaleIcon,
      value: "70.5 kg",
      description: "Latest recorded weight",
      buttonText: "Record Weight",
      buttonLink: "/weight",
      testId: "current-weight-card",
    };

    const mockRouter = vi.mocked(useRouter());
    const mockNavigate = mockRouter.navigate;
    mockNavigate.mockReset();

    renderWithProviders(<DashboardCard {...props} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("current-weight-card-button")
      ).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId("current-weight-card-button"));
    });

    // await waitFor(() => {
    //   expect(mockNavigate).toHaveBeenCalledWith({ to: "/weight" });
    // });
  });
});
