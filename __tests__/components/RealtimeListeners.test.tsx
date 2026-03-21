import { render } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RealtimeListeners } from "@/components/RealtimeListeners";
import { useWeightRealtime } from "@/features/weight/useWeightRealtime";
import { useGoalRealtime } from "@/features/goal/useGoalRealtime";

vi.mock("@/features/weight/useWeightRealtime", () => ({
  useWeightRealtime: vi.fn(),
}));

vi.mock("@/features/goal/useGoalRealtime", () => ({
  useGoalRealtime: vi.fn(),
}));

describe("RealtimeListeners", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(useWeightRealtime).mockClear();
    vi.mocked(useGoalRealtime).mockClear();
  });

  it("renders nothing and calls both realtime hooks", () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RealtimeListeners />
      </QueryClientProvider>,
    );

    expect(useWeightRealtime).toHaveBeenCalledTimes(1);
    expect(useGoalRealtime).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeNull();
  });
});
