// __tests__/app/components/RealtimeListeners.test.tsx

import { render } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RealtimeListeners } from "@/components/RealtimeListeners";
import { useGoalRealtime } from "@/hooks/useGoalRealtime";
import { useWeightRealtime } from "@/hooks/useWeightRealtime";

vi.mock("@/hooks/useGoalRealtime", () => ({
  useGoalRealtime: vi.fn(),
}));

vi.mock("@/hooks/useWeightRealtime", () => ({
  useWeightRealtime: vi.fn(),
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

    // Reset mocks before each test
    vi.mocked(useGoalRealtime).mockClear();
    vi.mocked(useWeightRealtime).mockClear();
  });

  it("renders nothing and calls both realtime hooks", () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RealtimeListeners />
      </QueryClientProvider>,
    );

    expect(useGoalRealtime).toHaveBeenCalledTimes(1);
    expect(useWeightRealtime).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeNull();
  });
});
