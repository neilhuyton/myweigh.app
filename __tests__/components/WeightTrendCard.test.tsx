import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider } from "@/trpc";
import { trpcClient } from "@/trpc";
import { server } from "../../__mocks__/server";
import { http, HttpResponse } from "msw";
import WeightTrendCard from "@/components/WeightTrendCard";

type WeightEntry = {
  id: string;
  weightKg: number;
  createdAt: string;
  note: string | null;
};

let queryClient: QueryClient;

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  queryClient?.clear();
});
afterAll(() => server.close());

describe("WeightTrendCard", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
      },
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TRPCProvider>
  );

  const mockSuccessResponse = (
    items: WeightEntry[] = [],
    nextCursor: string | null = null,
  ) => {
    server.use(
      http.get("/trpc/weight.getWeights", () => {
        return HttpResponse.json({
          result: {
            data: {
              items,
              nextCursor,
            },
          },
        });
      }),
    );
  };

  it("shows loading skeleton during fetch (no empty message yet)", () => {
    server.use(
      http.get("/trpc/weight.getWeights", () => new Promise(() => {})),
    );

    render(<WeightTrendCard />, { wrapper });

    expect(screen.getByTestId("weight-trend-card")).toBeInTheDocument();
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
    expect(
      screen.queryByText("No measurements recorded yet"),
    ).not.toBeInTheDocument();
  });

  it("shows empty state when no weights (after loading)", async () => {
    mockSuccessResponse([]);

    render(<WeightTrendCard />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText("No measurements recorded yet"),
      ).toBeInTheDocument();
    });
  });

  it("shows fallback error message when query fails", async () => {
    server.use(
      http.get("/trpc/weight.getWeights", () =>
        HttpResponse.json(
          {
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
              data: {
                code: "INTERNAL_SERVER_ERROR",
                httpStatus: 500,
                stack: "Server error",
                path: "weight.getWeights",
              },
            },
            id: null,
          },
          { status: 500 },
        ),
      ),
    );

    render(<WeightTrendCard />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load weight data"),
      ).toBeInTheDocument();
    });
  });

  it("renders trend label and footer when data exists - downward trend", async () => {
    const weights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 82.5,
        createdAt: "2026-03-01T10:00:00.000Z",
        note: null,
      },
      {
        id: "w2",
        weightKg: 81.2,
        createdAt: "2026-03-08T14:30:00.000Z",
        note: null,
      },
      {
        id: "w3",
        weightKg: 79.8,
        createdAt: "2026-03-14T09:15:00.000Z",
        note: null,
      },
    ];

    mockSuccessResponse(weights);

    render(<WeightTrendCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Down 2.7 kg")).toBeInTheDocument();
      expect(screen.getByText("Daily view")).toBeInTheDocument();
    });
  });

  it("shows upward trend label correctly", async () => {
    const weights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 75.0,
        createdAt: "2026-02-20T08:00:00.000Z",
        note: null,
      },
      {
        id: "w2",
        weightKg: 77.4,
        createdAt: "2026-03-10T12:00:00.000Z",
        note: null,
      },
    ];

    mockSuccessResponse(weights);

    render(<WeightTrendCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Up 2.4 kg")).toBeInTheDocument();
    });
  });

  it("shows stable label with single measurement", async () => {
    const weights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 80.0,
        createdAt: "2026-03-14T10:00:00.000Z",
        note: null,
      },
    ];

    mockSuccessResponse(weights);

    render(<WeightTrendCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Stable")).toBeInTheDocument();
    });
  });

  it("shows stable label when all weights are identical", async () => {
    const weights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 79.5,
        createdAt: "2026-03-05T09:00:00.000Z",
        note: null,
      },
      {
        id: "w2",
        weightKg: 79.5,
        createdAt: "2026-03-12T15:30:00.000Z",
        note: null,
      },
    ];

    mockSuccessResponse(weights);

    render(<WeightTrendCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Stable")).toBeInTheDocument();
    });
  });
});
