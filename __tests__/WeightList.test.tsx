import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import WeightList from "../src/components/WeightList";
import {
  weightGetWeightsHandler,
  weightDeleteHandler,
} from "../__mocks__/handlers";
import { resetWeights } from "../__mocks__/handlers/weightsData";
import { renderWithProviders } from "./utils/setup";

describe("WeightList Component", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
    server.use(weightGetWeightsHandler, weightDeleteHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    resetWeights();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
  });

  it("displays weight measurements in a table", async () => {
    renderWithProviders(<WeightList />);

    await waitFor(
      () => {
        expect(
          screen.queryByTestId("weight-list-loading")
        ).not.toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("70.00")).toBeInTheDocument();
        expect(screen.getByText("69.90")).toBeInTheDocument();
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("deletes a weight measurement when delete button is clicked", async () => {
    renderWithProviders(<WeightList />);

    await waitFor(
      () => {
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("70.00")).toBeInTheDocument();
        expect(screen.getByText("69.90")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const deleteButton = screen.getByTestId(
      "delete-button-550e8400-e29b-41d4-a716-446655440000"
    );
    await userEvent.click(deleteButton);

    await waitFor(
      () => {
        expect(screen.queryByText("70.00")).not.toBeInTheDocument();
        expect(screen.getByText("69.90")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
