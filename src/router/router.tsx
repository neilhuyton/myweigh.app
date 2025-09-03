// src/router/router.tsx
import { createRouter, createRootRoute, createRoute, redirect } from "@tanstack/react-router";
import Root from "../components/Root";
import { queryClient, trpcClient } from "../client";
import {
  registerRoute,
  loginRoute,
  resetPasswordRoute,
  confirmResetPasswordRoute,
  weightRoute,
  weightChartRoute,
  weightGoalRoute,
  verifyEmailRoute,
  profileRoute,
} from "./routes";
import { checkAuth } from "./routes";

// Define root route
const rootRoute = createRootRoute({
  component: () => <Root queryClient={queryClient} trpcClient={trpcClient} />,
  errorComponent: (props) => (
    <div>
      An error occurred. Please try again. {JSON.stringify(props.error)}
    </div>
  ),
});

// Define index route for /
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    if (checkAuth()) {
      throw redirect({ to: "/weight", statusCode: 307 });
    } else {
      throw redirect({ to: "/login", statusCode: 307 });
    }
  },
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  registerRoute(rootRoute),
  loginRoute(rootRoute),
  resetPasswordRoute(rootRoute),
  confirmResetPasswordRoute(rootRoute),
  weightRoute(rootRoute),
  weightChartRoute(rootRoute),
  weightGoalRoute(rootRoute),
  verifyEmailRoute(rootRoute),
  profileRoute(rootRoute),
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}