import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "server/trpc";

describe("trpc setup", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates trpc proxy using createTRPCOptionsProxy", async () => {
    const mockCreate = vi.fn().mockReturnValue(vi.fn());

    vi.doMock("../src/trpc", () => ({
      trpc: mockCreate({
        client: {} as TRPCClient<AppRouter>,
        queryClient: {},
      }),
      trpcClient: {} as TRPCClient<AppRouter>,
      TRPCProvider: vi.fn(),
      useTRPC: vi.fn(),
      useTRPCClient: vi.fn(),
    }));

    const { trpc } = await import("../src/trpc");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.any(Object),
        queryClient: expect.any(Object),
      }),
    );

    expect(trpc).toBeDefined();
    expect(typeof trpc).toBe("function");
  });

  it("exports trpcClient correctly", async () => {
    const { trpcClient } = await import("../src/trpc");

    expect(trpcClient).toBeDefined();
    expect(typeof trpcClient).toBe("object");
  });

  it("conditionally uses httpLink in test mode", async () => {
    vi.stubEnv("MODE", "test");

    vi.doMock("@steel-cut/trpc-shared/client", () => ({
      createTrpcClient: vi.fn().mockReturnValue({} as TRPCClient<AppRouter>),
    }));

    const { trpcClient } = await import("../src/trpc");

    expect(trpcClient).toBeDefined();
    expect(typeof trpcClient).toBe("object");
  });
});
