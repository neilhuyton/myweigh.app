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
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../__mocks__/server";
import { http, HttpResponse } from "msw";
import WeightList from "@/components/WeightList";
import { formatDate } from "@/utils/date";

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

describe("WeightList", () => {
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
    vi.spyOn(window, "confirm").mockImplementation(() => true);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const weightsQueryKey = ["weight.getWeights"];

  const setupGetHandler = (weights: WeightEntry[] = []) => {
    server.use(
      http.get("/trpc/weight.getWeights", () => {
        const cached = queryClient.getQueryData<WeightEntry[]>(weightsQueryKey);
        return HttpResponse.json({ result: { data: cached ?? weights } });
      }),
    );
  };

  it("shows loading spinner while fetching", async () => {
    server.use(
      http.get("/trpc/weight.getWeights", () => new Promise(() => {})),
    );

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner.querySelector("svg")).toHaveClass("animate-spin");
    });
  });

  it("shows no measurements message when list is empty", async () => {
    setupGetHandler([]);

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText("No measurements recorded yet"),
      ).toBeInTheDocument();
    });
  });

  it("renders table headers correctly", async () => {
    const weights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 80.0,
        createdAt: "2026-03-10T10:00:00.000Z",
        note: null,
      },
    ];
    setupGetHandler(weights);

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Weight (kg)")).toBeInTheDocument();
      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });
  });

  it("displays sorted weight entries with formatted dates and delete button", async () => {
    const weights: WeightEntry[] = [
      {
        id: "w2",
        weightKg: 79.2,
        createdAt: "2026-03-10T14:30:00.000Z",
        note: null,
      },
      {
        id: "w1",
        weightKg: 81.5,
        createdAt: "2026-03-05T09:15:00.000Z",
        note: null,
      },
    ];

    setupGetHandler(weights);

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("81.5")).toBeInTheDocument();
      expect(screen.getByText("79.2")).toBeInTheDocument();

      expect(
        screen.getByText(formatDate(weights[0].createdAt)),
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatDate(weights[1].createdAt)),
      ).toBeInTheDocument();

      expect(
        screen.getAllByRole("button", { name: /delete entry/i }),
      ).toHaveLength(2);
    });
  });

  it("shows error message when query fails", async () => {
    server.use(
      http.get("/trpc/weight.getWeights", () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );

    render(<WeightList />, { wrapper });

    await waitFor(
      () => {
        const errorEl = screen.getByTestId("error-message");
        expect(errorEl).toBeInTheDocument();
        expect(errorEl).toHaveTextContent("Failed to load weight history");
      },
      { timeout: 5000 },
    );
  });

  it("optimistically removes deleted entry on success", async () => {
    const user = userEvent.setup();

    const initialWeights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 82.0,
        createdAt: "2026-03-12T10:00:00.000Z",
        note: null,
      },
      {
        id: "w2",
        weightKg: 80.5,
        createdAt: "2026-03-10T08:45:00.000Z",
        note: null,
      },
    ];

    setupGetHandler(initialWeights);

    server.use(
      http.post("/trpc/weight.delete", async ({ request }) => {
        const rawBody = await request.json();

        // Explicit type for tRPC batch request body
        interface TrpcBatchItem {
          id: number;
          json: {
            input: {
              weightId: string;
            };
          };
        }

        if (!Array.isArray(rawBody) || rawBody.length === 0) {
          return new HttpResponse(null, { status: 400 });
        }

        const firstItem = rawBody[0] as TrpcBatchItem | undefined;
        const input = firstItem?.json?.input;

        if (!input || typeof input.weightId !== "string") {
          return new HttpResponse(null, { status: 400 });
        }

        const updatedWeights = initialWeights.filter(
          (weight) => weight.id !== input.weightId,
        );

        queryClient.setQueryData<WeightEntry[]>(
          weightsQueryKey,
          updatedWeights,
        );

        return HttpResponse.json({
          result: { data: { success: true, deletedId: input.weightId } },
        });
      }),
    );

    render(<WeightList />, { wrapper });

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(
        2,
      ),
    );

    const deleteButtons = screen.getAllByRole("button", {
      name: /delete entry/i,
    });

    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("82.0")).not.toBeInTheDocument();
      expect(screen.getByText("80.5")).toBeInTheDocument();
    });
  });

  it("restores previous data on delete error", async () => {
    const user = userEvent.setup();

    const initialWeights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 83.0,
        createdAt: "2026-03-13T11:20:00.000Z",
        note: null,
      },
    ];

    setupGetHandler(initialWeights);

    server.use(
      http.post(
        "/trpc/weight.delete",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    render(<WeightList />, { wrapper });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /delete entry/i }));

    await waitFor(() => {
      expect(screen.getByText("83")).toBeInTheDocument();
    });
  });
});
