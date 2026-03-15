import { render, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
  type Router,
} from "@tanstack/react-router";
import { router as appRouter, type RouterContext } from "@/router";
import type { QueryClient as QCType } from "@tanstack/react-query";

export function createTestQueryClient(): QCType {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

type RenderWithProvidersResult = RenderResult & {
  router: Router<typeof appRouter.routeTree>;
};

export function renderWithProviders({
  initialEntries = ["/"],
  queryClient = createTestQueryClient(),
}: {
  initialEntries?: string[];
  queryClient?: QueryClient;
} = {}): RenderWithProvidersResult {
  const history = createMemoryHistory({ initialEntries });

  const testRouter = createRouter({
    routeTree: appRouter.routeTree,
    history,
    defaultPreload: "intent",
    context: { queryClient } satisfies RouterContext,
  });

  const wrapped = (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={testRouter} />
    </QueryClientProvider>
  );

  const renderResult = render(wrapped);

  return {
    ...renderResult,
    router: testRouter,
  };
}

export function renderVerifyEmail(token: string) {
  const url = `/verify-email?token=${encodeURIComponent(token)}`;
  return renderWithProviders({ initialEntries: [url] });
}