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
import { trpcClient } from "@/trpc";
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
    vi.spyOn(window, "alert").mockImplementation(() => {});
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

  const mockPending = () => {
    server.use(
      http.get("/trpc/weight.getWeights", () => new Promise(() => {})),
    );
  };

  const mockError = () => {
    server.use(
      http.get("/trpc/weight.getWeights", () => {
        return HttpResponse.json(null, { status: 500 });
      }),
    );
  };

  it("shows loading spinner while fetching", async () => {
    mockPending();

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByRole("status").firstChild).toHaveClass("animate-spin");
    });
  });

  it("renders table headers", async () => {
    mockSuccessResponse([]);

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Weight (kg)")).toBeInTheDocument();
      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });
  });

  it("shows 'No measurements yet' when empty", async () => {
    mockSuccessResponse([]);

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("No measurements yet")).toBeInTheDocument();
    });
  });

  it("renders weight entries with formatted dates and delete buttons", async () => {
    const weights: WeightEntry[] = [
      {
        id: "w1",
        weightKg: 81.5,
        createdAt: "2026-03-05T09:15:00.000Z",
        note: null,
      },
      {
        id: "w2",
        weightKg: 79.2,
        createdAt: "2026-03-10T14:30:00.000Z",
        note: null,
      },
    ];

    mockSuccessResponse(weights);

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("81.5")).toBeInTheDocument();
      expect(screen.getByText("79.2")).toBeInTheDocument();

      expect(
        screen.getByText(formatDate("2026-03-05T09:15:00.000Z")),
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatDate("2026-03-10T14:30:00.000Z")),
      ).toBeInTheDocument();

      expect(screen.getAllByText("Delete")).toHaveLength(2);
    });
  });

  it("shows error message when query fails", async () => {
    mockError();

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Error loading history")).toBeInTheDocument();
    });
  });

  it("removes deleted entry from UI on successful delete", async () => {
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

    mockSuccessResponse(weights);

    server.use(
      http.post("/trpc/weight.delete", async ({ request }) => {
        const body = await request.json();
        const input =
          Array.isArray(body) && body.length > 0 ? body[0].input : null;

        if (input?.weightId === "w1") {
          return HttpResponse.json({
            result: {
              data: null,
            },
          });
        }

        return HttpResponse.json(
          {
            result: {
              data: null,
            },
          },
          { status: 400 },
        );
      }),
    );

    render(<WeightList />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText("Delete")).toHaveLength(2);
    });

    await user.click(screen.getAllByText("Delete")[0]);

    await waitFor(() => {
      expect(screen.queryByText("82.0")).not.toBeInTheDocument();
      expect(screen.getByText("80.5")).toBeInTheDocument();
    });
  });
});
