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
import { server } from "../../../__mocks__/server";
import { http, HttpResponse } from "msw";
import GoalList from "@/features/goal/GoalList";

type GoalItem = {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: string | null;
};

type MockResponse = {
  items: GoalItem[];
  nextCursor: string | null;
};

let queryClient: QueryClient;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  queryClient?.clear();
});
afterAll(() => server.close());

describe("GoalList", () => {
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
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TRPCProvider>
  );

  const mockSuccessResponse = (
    items: GoalItem[] = [],
    nextCursor: string | null = null,
  ) => {
    server.use(
      http.get("/trpc/weight.getGoals", () => {
        return HttpResponse.json({
          result: {
            data: {
              items,
              nextCursor,
            } satisfies MockResponse,
          },
        });
      }),
    );
  };

  const mockInfinitePending = () => {
    server.use(
      http.get("/trpc/weight.getGoals", () => {
        return new Promise(() => {});
      }),
    );
  };

  const mockError = () => {
    server.use(
      http.get("/trpc/weight.getGoals", () => {
        return HttpResponse.json(null, { status: 500 });
      }),
    );
  };

  it("shows loading spinner while fetching", async () => {
    mockInfinitePending();

    render(<GoalList />, { wrapper });

    await waitFor(
      () => {
        expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
        expect(screen.getByTestId("loading-spinner")).toHaveClass(
          "animate-spin",
        );
      },
      { timeout: 2000 },
    );

    expect(screen.queryByText("Past Weight Goals")).not.toBeInTheDocument();
  });

  it("renders heading 'Past Weight Goals'", async () => {
    mockSuccessResponse([]);

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Past Weight Goals", level: 2 }),
      ).toBeInTheDocument();
    });
  });

  it("shows table headers", async () => {
    mockSuccessResponse([]);

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Goal Weight (kg)")).toBeInTheDocument();
      expect(screen.getByText("Set Date")).toBeInTheDocument();
      expect(screen.getByText("Reached Date")).toBeInTheDocument();
    });
  });

  it("shows 'No weight goals found' when empty", async () => {
    mockSuccessResponse([]);

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("No weight goals found")).toBeInTheDocument();
    });
  });

  it("renders goals list with formatted dates and reached status", async () => {
    const goals: GoalItem[] = [
      {
        id: "g1",
        goalWeightKg: 75,
        goalSetAt: "2026-01-05T09:30:00.000Z",
        reachedAt: "2026-02-20T07:45:00.000Z",
      },
      {
        id: "g2",
        goalWeightKg: 70.5,
        goalSetAt: "2026-03-01T14:15:00.000Z",
        reachedAt: null,
      },
    ];

    mockSuccessResponse(goals);

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("75.0")).toBeInTheDocument();
      expect(screen.getByText("70.5")).toBeInTheDocument();

      expect(screen.getByText("05 Jan 2026")).toBeInTheDocument();
      expect(screen.getByText("01 Mar 2026")).toBeInTheDocument();

      expect(screen.getByText("20 Feb 2026")).toBeInTheDocument();
      expect(screen.getByText("Not Reached")).toBeInTheDocument();
    });
  });

  it("shows error message when query fails", async () => {
    mockError();

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText("Error loading goal history"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Unable to transform response from server"),
      ).toBeInTheDocument();
    });
  });
});
