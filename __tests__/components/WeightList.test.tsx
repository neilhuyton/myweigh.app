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
import { TRPCProvider } from "@/trpc";
import { trpc, trpcClient } from "@/trpc";
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

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
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
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TRPCProvider>
  );

  const weightsQueryKey = trpc.weight.getWeights.queryKey();

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
      http.get("/trpc/weight.getWeights", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<WeightList />, { wrapper });

    await waitFor(
      () => {
        const errorEl = screen.getByTestId("error-message");
        expect(errorEl).toBeInTheDocument();
        expect(errorEl).toHaveTextContent("Failed to load weight history");
        expect(errorEl).toHaveClass("text-destructive");
      },
      { timeout: 5000 },
    );
  });

  it("optimistically removes deleted entry on success", async () => {
    const user = userEvent.setup();

    const weights: WeightEntry[] = [
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

    setupGetHandler(weights);

    server.use(
      http.post("/trpc/weight.delete", async ({ request }) => {
        const json = await request.json();
        if (!json || !Array.isArray(json) || !json[0]) {
          return new HttpResponse(null, { status: 400 });
        }
        const { input } = json[0];
        const updated = weights.filter((w) => w.id !== input.weightId);
        queryClient.setQueryData(weightsQueryKey, updated);
        return HttpResponse.json({ result: { data: null } });
      }),
    );

    render(<WeightList />, { wrapper });

    await waitFor(() => screen.getAllByRole("button", { name: /delete/i }));

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

    const weights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 83.0,
        createdAt: "2026-03-13T11:20:00.000Z",
        note: null,
      },
    ];

    setupGetHandler(weights);

    server.use(
      http.post(
        "/trpc/weight.delete",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    render(<WeightList />, { wrapper });

    await waitFor(() => screen.getByRole("button", { name: /delete/i }));

    await user.click(screen.getByRole("button", { name: /delete entry/i }));

    await waitFor(
      () => {
        expect(screen.getByText("83")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
