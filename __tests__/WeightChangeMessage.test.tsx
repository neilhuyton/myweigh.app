// __tests__/WeightChangeMessage.test.tsx
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
import WeightChangeMessage from "../src/components/WeightChangeMessage";
import { weightGetWeightsHandler } from "../__mocks__/handlers";
import { resetWeights } from "../__mocks__/handlers/weightsData";
import { renderWithProviders } from "./utils/setup";

describe("WeightChangeMessage Component", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
    server.use(weightGetWeightsHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    resetWeights();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
  });

  it("renders nothing when loading", async () => {
    // Simulate loading by delaying the handler response
    vi.spyOn(global, "fetch").mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(
                  JSON.stringify({
                    id: 0,
                    result: { type: "data", data: [] },
                  }),
                  { status: 200 }
                )
              ),
            1000
          )
        )
    );

    renderWithProviders(<WeightChangeMessage />, { userId: "test-user-id" });

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("weight-change-card")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("weight-change-message")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("weight-change-error")
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    vi.restoreAllMocks();
  });

  it("displays error message in card when fetch fails", async () => {
    renderWithProviders(<WeightChangeMessage />, { userId: "error-user-id" });

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-change-card")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-error")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-error")).toHaveTextContent(
          "Error: Failed to fetch weights"
        );
        expect(
          screen.queryByTestId("weight-change-message")
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("renders nothing when no data is available", async () => {
    renderWithProviders(<WeightChangeMessage />, { userId: "empty-user-id" });

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("weight-change-card")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("weight-change-message")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("weight-change-error")
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("displays weight loss message in card", async () => {
    renderWithProviders(<WeightChangeMessage />, { userId: "test-user-id" });

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-change-card")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toHaveTextContent(
          "You have lost 0.10kg in 1 day"
        );
        expect(
          screen.queryByTestId("weight-change-error")
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("displays weight gain message in card", async () => {
    renderWithProviders(<WeightChangeMessage />, { userId: "gain-user-id" });

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-change-card")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toHaveTextContent(
          "You have gained 0.50kg in 1 day"
        );
        expect(
          screen.queryByTestId("weight-change-error")
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("displays no change message in card", async () => {
    renderWithProviders(<WeightChangeMessage />, {
      userId: "no-change-user-id",
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("weight-change-card")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toBeInTheDocument();
        expect(screen.getByTestId("weight-change-message")).toHaveTextContent(
          "Your weight has not changed in 1 day"
        );
        expect(
          screen.queryByTestId("weight-change-error")
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("renders nothing when only one weight is available", async () => {
    renderWithProviders(<WeightChangeMessage />, { userId: "single-user-id" });

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("weight-change-card")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("weight-change-message")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("weight-change-error")
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
