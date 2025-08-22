import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { z } from 'zod';
import { trpc } from './trpc';
import Home from './components/Home';
import Navigation from './components/Navigation';
import WeightForm from './components/WeightForm';
import WeightList from './components/WeightList';
import WeightChart from './components/WeightChart';
import WeightGoal from './components/WeightGoal';
import Register from './components/Register';
import LoginForm from './components/LoginForm';
import VerifyEmail from './components/VerifyEmail';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

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
        'http://localhost:8888/.netlify/functions/trpc',
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

// Define search schema for verify-email route
const verifyEmailSearchSchema = z.object({
  token: z.string().uuid().optional(),
});

// Define routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: () => <Register onSwitchToLogin={() => router.navigate({ to: '/login' })} />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <LoginForm onSwitchToRegister={() => router.navigate({ to: '/register' })} />,
});

const weightRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/weight',
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: '/' });
    }
  },
  component: WeightForm,
});

const weightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/weights',
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: '/' });
    }
  },
  component: WeightList,
});

const weightChartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/weight-chart',
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: '/' });
    }
  },
  component: WeightChart,
});

const weightGoalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/weight-goal',
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: '/' });
    }
  },
  component: WeightGoal,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  validateSearch: verifyEmailSearchSchema,
  component: VerifyEmail,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  homeRoute,
  registerRoute,
  loginRoute,
  weightRoute,
  weightsRoute,
  weightChartRoute,
  weightGoalRoute,
  verifyEmailRoute,
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}