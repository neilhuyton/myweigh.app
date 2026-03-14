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
import CurrentWeightCard from "@/components/CurrentWeightCard";
import { formatDate } from "@/utils/date";

type Weight = {
  id: string;
  weightKg: number;
  createdAt: string;
  note: string | null;
} | null;

let queryClient: QueryClient;

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  queryClient?.clear();
});
afterAll(() => server.close());

describe("CurrentWeightCard", () => {
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

  const latestWeightQueryKey = trpc.weight.getLatestWeight.queryKey();

  const setupGetHandler = (initialData: Weight = null) => {
    server.use(
      http.get("/trpc/weight.getLatestWeight", () => {
        const cached = queryClient.getQueryData<Weight>(latestWeightQueryKey);
        return HttpResponse.json({ result: { data: cached ?? initialData } });
      }),
    );
  };

  it("shows loading skeleton while fetching", async () => {
    server.use(
      http.get("/trpc/weight.getLatestWeight", () => new Promise(() => {})),
    );

    render(<CurrentWeightCard />, { wrapper });

    await waitFor(
      () => {
        expect(
          screen.queryByText("No weight recorded yet"),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("current-weight-display"),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("shows no-weight message when no latest weight", async () => {
    setupGetHandler(null);

    render(<CurrentWeightCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("No weight recorded yet")).toBeInTheDocument();
      expect(
        screen.getByText("Tap here to add your current weight"),
      ).toBeInTheDocument();
    });
  });

  it("displays latest weight and formatted date when weight exists", async () => {
    const weight: Weight = {
      id: "w1",
      weightKg: 82.3,
      createdAt: "2026-03-12T08:45:00.000Z",
      note: null,
    };

    setupGetHandler(weight);

    render(<CurrentWeightCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("current-weight-display")).toHaveTextContent(
        "82.3",
      );
      expect(screen.getByText("kg")).toBeInTheDocument();
      expect(
        screen.getByText(formatDate(weight.createdAt)),
      ).toBeInTheDocument();
    });
  });

  it("enters edit mode on click and focuses input with current value", async () => {
    const user = userEvent.setup();

    const weight: Weight = {
      id: "w1",
      weightKg: 81.5,
      createdAt: "2026-03-12T14:20:00.000Z",
      note: null,
    };

    setupGetHandler(weight);

    render(<CurrentWeightCard />, { wrapper });

    await waitFor(() => screen.getByTestId("current-weight-display"));

    await user.click(
      screen.getByLabelText(/record or update your current weight/i),
    );

    const input = await screen.findByRole("spinbutton");
    expect(input).toHaveValue(81.5);
    expect(input).toHaveFocus();
  });

  it("creates new weight when none existed + shows optimistic update", async () => {
    const user = userEvent.setup();

    const newWeight: Weight = {
      id: "new1",
      weightKg: 79.8,
      createdAt: "2026-03-14T09:15:00.000Z",
      note: null,
    };

    setupGetHandler(null);

    server.use(
      http.post("/trpc/weight.create", async () => {
        queryClient.setQueryData(latestWeightQueryKey, newWeight);
        return HttpResponse.json({ result: { data: newWeight } });
      }),
    );

    render(<CurrentWeightCard />, { wrapper });

    await waitFor(() =>
      expect(
        screen.getByText("Tap here to add your current weight"),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByText("Tap here to add your current weight"));

    const input = await screen.findByRole("spinbutton");
    await user.type(input, "79.8{Enter}");

    await waitFor(() => {
      expect(screen.getByTestId("current-weight-display")).toHaveTextContent(
        "79.8",
      );
      expect(
        screen.getByText(formatDate(newWeight.createdAt)),
      ).toBeInTheDocument();
    });
  });

  it("shows 'Saving new weight...' and keeps optimistic value during pending mutation", async () => {
    const user = userEvent.setup();

    setupGetHandler(null);

    server.use(
      http.get("/trpc/weight.getLatestWeight", () =>
        HttpResponse.json({ result: { data: null } }),
      ),
      http.post("/trpc/weight.create", () => new Promise(() => {})),
    );

    render(<CurrentWeightCard />, { wrapper });

    await waitFor(() =>
      expect(
        screen.getByText("Tap here to add your current weight"),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByText("Tap here to add your current weight"));

    const input = await screen.findByRole("spinbutton");
    await user.type(input, "85.2");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Saving new weight...")).toBeInTheDocument();
      expect(screen.getByTestId("current-weight-display")).toHaveTextContent(
        "85.2",
      );
    });
  });

  it("cancels edit and restores original value on Escape", async () => {
    const user = userEvent.setup();

    const weight: Weight = {
      id: "w1",
      weightKg: 80.1,
      createdAt: "2026-03-11T17:30:00.000Z",
      note: null,
    };

    setupGetHandler(weight);

    render(<CurrentWeightCard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("current-weight-display")).toHaveTextContent(
        "80.1",
      );
    });

    await user.click(
      screen.getByLabelText(/record or update your current weight/i),
    );

    const input = await screen.findByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "90");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
      expect(screen.getByTestId("current-weight-display")).toHaveTextContent(
        "80.1",
      );
    });
  });
});
