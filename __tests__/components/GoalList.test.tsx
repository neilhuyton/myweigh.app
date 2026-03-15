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
import { server } from "../../__mocks__/server";
import { http, HttpResponse } from "msw";
import GoalList from "@/components/GoalList";

type Goal = {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: string | null;
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const goalsQueryKey = ["weight.getGoals"];

  const setupGetHandler = (goals: Goal[] = []) => {
    server.use(
      http.get("/trpc/weight.getGoals", () => {
        const cached = queryClient.getQueryData<Goal[]>(goalsQueryKey);
        return HttpResponse.json({ result: { data: cached ?? goals } });
      }),
    );
  };

  it("shows loading spinner while fetching", async () => {
    server.use(http.get("/trpc/weight.getGoals", () => new Promise(() => {})));

    render(<GoalList />, { wrapper });

    await waitFor(
      () => {
        expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
        expect(screen.getByTestId("loading-spinner")).toHaveClass(
          "animate-spin",
        );
      },
      { timeout: 3000 },
    );

    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("renders heading 'Past Weight Goals'", async () => {
    setupGetHandler([]);

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Past Weight Goals", level: 2 }),
      ).toBeInTheDocument();
    });
  });

  it("shows table headers", async () => {
    setupGetHandler([]);

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Goal Weight (kg)")).toBeInTheDocument();
      expect(screen.getByText("Set Date")).toBeInTheDocument();
      expect(screen.getByText("Reached Date")).toBeInTheDocument();
    });
  });

  it("shows 'No weight goals found' when empty", async () => {
    setupGetHandler([]);

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("No weight goals found")).toBeInTheDocument();
    });
  });

  it("renders goals list with formatted dates and reached status", async () => {
    const goals: Goal[] = [
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

    setupGetHandler(goals);

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
    server.use(
      http.get(
        "/trpc/weight.getGoals",
        () =>
          new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          }),
      ),
    );

    render(<GoalList />, { wrapper });

    await waitFor(() => {
      const errorEl = screen.getByTestId("error-message");
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent(/Error:/);
      expect(errorEl).toHaveClass("text-destructive");
    });
  });
});
