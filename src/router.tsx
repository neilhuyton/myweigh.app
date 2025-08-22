// src/router.tsx
import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./trpc";
import Home from "./components/Home";
import Navigation from "./components/Navigation";
import WeightForm from "./components/WeightForm";
import WeightList from "./components/WeightList";
import WeightChart from "./components/WeightChart";
import WeightGoal from "./components/WeightGoal";
import { useAuthStore } from "./store/authStore";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

// Create tRPC client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url:
        import.meta.env.VITE_TRPC_URL ||
        "http://localhost:8888/.netlify/functions/trpc",
      fetch: async (url, options) => {
        const { userId } = useAuthStore.getState();
        const headers = {
          ...options?.headers,
          ...(userId ? { Authorization: `Bearer ${userId}` } : {}),
        };
        const fetchOptions = {
          ...options,
          headers,
          signal: undefined,
        };
        return fetch(url, fetchOptions);
      },
    }),
  ],
});

// Define root route with Navigation and Toaster
const rootRoute = createRootRoute({
  component: () => (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Navigation />
          <Outlet />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  ),
});

// Define routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const weightRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "weight",
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: WeightForm,
});

const weightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "weights",
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: WeightList,
});

const weightChartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "weight-chart",
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: WeightChart,
});

const weightGoalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "weight-goal",
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: WeightGoal,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  homeRoute,
  weightRoute,
  weightsRoute,
  weightChartRoute,
  weightGoalRoute,
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}