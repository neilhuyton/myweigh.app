// src/router.tsx
import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { z } from 'zod';
import { trpc } from './trpc';
import Home from './components/Home';
import Weight from './components/Weight';
import WeightChart from './components/WeightChart';
import WeightGoal from './components/WeightGoal';
import Register from './components/Register';
import LoginForm from './components/LoginForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import ConfirmResetPasswordForm from './components/ConfirmResetPasswordForm';
import VerifyEmail from './components/VerifyEmail';
import Profile from './components/Profile';
import { useAuthStore } from './store/authStore';
import Root from './components/Root';

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
      url: import.meta.env.VITE_TRPC_URL || 'http://localhost:8888/.netlify/functions/trpc',
      fetch: async (url, options) => {
        const { token, refreshToken, login, logout } = useAuthStore.getState();
        const headers = {
          ...options?.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const fetchOptions = {
          ...options,
          headers,
          signal: options?.signal, // Preserve the signal for cancellation
        };

        const response = await fetch(url, fetchOptions);

        // Handle 401 errors for expired tokens
        if (!response.ok && response.status === 401 && refreshToken) {
          try {
            const refreshResponse = await trpcClient.refreshToken.refresh.mutate({
              refreshToken,
            });
            login(useAuthStore.getState().userId!, refreshResponse.token, refreshResponse.refreshToken);
            const newHeaders = {
              ...options?.headers,
              Authorization: `Bearer ${refreshResponse.token}`,
            };
            return await fetch(url, { ...fetchOptions, headers: newHeaders });
          } catch (refreshError) {
            console.error('Refresh failed:', refreshError);
            logout();
            throw redirect({ to: '/login' });
          }
        }

        // If still 401 and no refreshToken, redirect to login
        if (!response.ok && response.status === 401) {
          logout();
          throw redirect({ to: '/login' });
        }

        return response;
      },
    }),
  ],
});

// Define root route with Root component
const rootRoute = createRootRoute({
  component: () => <Root queryClient={queryClient} trpcClient={trpcClient} />,
});

// Define search schemas
const verifyEmailSearchSchema = z.object({
  token: z.string().uuid().optional(),
});
const confirmResetPasswordSearchSchema = z.object({
  token: z.string().uuid().optional(),
});

// Define routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: '/login' });
    }
  },
  component: Home,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: Register,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginForm,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPasswordForm,
});

const confirmResetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirm-reset-password',
  validateSearch: confirmResetPasswordSearchSchema,
  component: ConfirmResetPasswordForm,
});

const weightRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/weight',
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: '/login' });
    }
  },
  component: Weight,
});

const weightChartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/weight-chart',
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: '/login' });
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
      throw redirect({ to: '/login' });
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

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) {
      throw redirect({ to: '/login' });
    }
  },
  component: Profile,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  homeRoute,
  registerRoute,
  loginRoute,
  resetPasswordRoute,
  confirmResetPasswordRoute,
  weightRoute,
  weightChartRoute,
  weightGoalRoute,
  verifyEmailRoute,
  profileRoute,
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}