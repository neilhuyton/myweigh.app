import { createRouter, createRootRoute } from "@tanstack/react-router";
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

// Define root route
const rootRoute = createRootRoute({
  component: () => <Root queryClient={queryClient} trpcClient={trpcClient} />,
  errorComponent: (props) => (
    <div>
      An error occurred. Please try again. {JSON.stringify(props.error)}
    </div>
  ),
});

// Create route tree
const routeTree = rootRoute.addChildren([
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
