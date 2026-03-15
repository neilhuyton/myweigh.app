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
import CurrentGoalCard from "@/components/CurrentGoalCard";
import { formatDate } from "@/utils/date";

type Goal = {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: string | null;
} | null;

let queryClient: QueryClient;

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  queryClient?.clear();
});
afterAll(() => server.close());

describe("CurrentGoalCard", () => {
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

  const currentGoalQueryKey = ["weight", "getCurrentGoal"];

  const setupGetHandler = (initialData: Goal = null) => {
    server.use(
      http.get("/trpc/weight.getCurrentGoal", () => {
        const cached = queryClient.getQueryData<Goal>(currentGoalQueryKey);
        return HttpResponse.json({ result: { data: cached ?? initialData } });
      }),
    );
  };

  it("shows no-goal message when current goal is null", async () => {
    setupGetHandler(null);

    render(<CurrentGoalCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("No goal set yet")).toBeInTheDocument();
      expect(
        screen.getByText("Tap here to set your target weight"),
      ).toBeInTheDocument();
    });
  });

  it("displays goal weight and formatted date when goal exists", async () => {
    const goal: Goal = {
      id: "g1",
      goalWeightKg: 68.5,
      goalSetAt: "2026-03-01T10:15:00.000Z",
      reachedAt: null,
    };

    setupGetHandler(goal);

    render(<CurrentGoalCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("current-goal-weight")).toHaveTextContent(
        "68.5",
      );
      expect(screen.getByText("kg")).toBeInTheDocument();
      expect(screen.getByText(formatDate(goal.goalSetAt))).toBeInTheDocument();
    });
  });

  it("enters edit mode on click and focuses input with current value", async () => {
    const user = userEvent.setup();

    const goal: Goal = {
      id: "g1",
      goalWeightKg: 70,
      goalSetAt: "2026-03-10T12:00:00.000Z",
      reachedAt: null,
    };

    setupGetHandler(goal);

    render(<CurrentGoalCard />, { wrapper });

    await waitFor(() => screen.getByTestId("current-goal-weight"));

    await user.click(screen.getByLabelText(/edit your weight goal/i));

    const input = await screen.findByRole("spinbutton");
    expect(input).toHaveValue(70);
    expect(input).toHaveFocus();
  });

  it("creates new goal when none existed", async () => {
    const user = userEvent.setup();

    const newGoal: Goal = {
      id: "new1",
      goalWeightKg: 75,
      goalSetAt: "2026-03-13T14:30:00.000Z",
      reachedAt: null,
    };

    setupGetHandler(null);

    server.use(
      http.post("/trpc/weight.setGoal", async () => {
        queryClient.setQueryData(currentGoalQueryKey, newGoal);
        return HttpResponse.json({ result: { data: newGoal } });
      }),
    );

    render(<CurrentGoalCard />, { wrapper });

    await waitFor(() => screen.getByText("Tap here to set your target weight"));

    await user.click(screen.getByText("Tap here to set your target weight"));

    const input = await screen.findByRole("spinbutton");
    await user.type(input, "75{Enter}");

    await waitFor(() => {
      expect(screen.getByTestId("current-goal-weight")).toHaveTextContent("75");
      expect(
        screen.getByText(formatDate(newGoal.goalSetAt)),
      ).toBeInTheDocument();
    });
  });

  it("updates existing goal", async () => {
    const user = userEvent.setup();

    const existing: Goal = {
      id: "g1",
      goalWeightKg: 72,
      goalSetAt: "2026-03-10T00:00:00.000Z",
      reachedAt: null,
    };

    const updated: Goal = {
      ...existing,
      goalWeightKg: 74,
    };

    setupGetHandler(existing);

    server.use(
      http.post("/trpc/weight.updateGoal", async () => {
        queryClient.setQueryData(currentGoalQueryKey, updated);
        return HttpResponse.json({ result: { data: updated } });
      }),
    );

    render(<CurrentGoalCard />, { wrapper });

    await waitFor(() => screen.getByTestId("current-goal-weight"));

    await user.click(screen.getByLabelText(/edit your weight goal/i));

    const input = await screen.findByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "74{Enter}");

    await waitFor(() => {
      expect(screen.getByTestId("current-goal-weight")).toHaveTextContent("74");
    });
  });

  it('shows "Saving goal..." and optimistic update during pending mutation', async () => {
    const user = userEvent.setup();

    setupGetHandler(null);

    server.use(http.post("/trpc/weight.setGoal", () => new Promise(() => {})));

    render(<CurrentGoalCard />, { wrapper });

    await waitFor(() => screen.getByText("Tap here to set your target weight"));

    await user.click(screen.getByText("Tap here to set your target weight"));

    const input = await screen.findByRole("spinbutton");
    await user.type(input, "81.5");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Saving goal...")).toBeInTheDocument();
      expect(screen.getByTestId("current-goal-weight")).toHaveTextContent(
        "81.5",
      );
    });
  });

  it("cancels edit and restores original value on Escape", async () => {
    const user = userEvent.setup();

    const goal: Goal = {
      id: "g1",
      goalWeightKg: 69,
      goalSetAt: "2026-03-12T09:00:00.000Z",
      reachedAt: null,
    };

    setupGetHandler(goal);

    render(<CurrentGoalCard />, { wrapper });

    await waitFor(() => screen.getByText("69"));

    await user.click(screen.getByLabelText(/edit your weight goal/i));

    const input = await screen.findByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "123");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
      expect(screen.getByText("69")).toBeInTheDocument();
    });
  });
});
