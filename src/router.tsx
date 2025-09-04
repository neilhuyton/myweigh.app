import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  RootRoute,
} from "@tanstack/react-router";
import Root from "./components/Root";
import Weight from "./pages/Weight";
import WeightChart from "./pages/Stats";
import WeightGoal from "./pages/Goals";
import Register from "./components/Register";
import LoginForm from "./components/LoginForm";
import ResetPasswordForm from "./components/ResetPasswordForm";
import ConfirmResetPasswordForm from "./components/ConfirmResetPasswordForm";
import VerifyEmail from "./components/VerifyEmail";
import Profile from "./components/Profile";
import { useAuthStore } from "./authStore";
import {
  verifyEmailSearchSchema,
  confirmResetPasswordSearchSchema,
} from "./schemas";
import { jwtDecode } from "jwt-decode";
import { queryClient, trpcClient } from "./trpc";

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const checkAuth = () => {
  const { isLoggedIn, token } = useAuthStore.getState();
  if (!isLoggedIn || !token) {
    throw redirect({ to: "/login" });
  }
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return false;
    }
    return true;
  } catch {
    throw redirect({ to: "/login" });
  }
};

const registerRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/register",
    component: Register,
  });

const loginRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: LoginForm,
  });

const resetPasswordRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/reset-password",
    component: ResetPasswordForm,
  });

const confirmResetPasswordRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/confirm-reset-password",
    validateSearch: confirmResetPasswordSearchSchema,
    component: ConfirmResetPasswordForm,
  });

const weightRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/weight",
    beforeLoad: () => {
      if (!checkAuth()) {
        return;
      }
    },
    component: Weight,
  });

const weightChartRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/stats",
    beforeLoad: () => {
      if (!checkAuth()) {
        return;
      }
    },
    component: WeightChart,
  });

const weightGoalRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/goals",
    beforeLoad: () => {
      if (!checkAuth()) {
        return;
      }
    },
    component: WeightGoal,
  });

const verifyEmailRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/verify-email",
    validateSearch: verifyEmailSearchSchema,
    component: VerifyEmail,
  });

const profileRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile",
    beforeLoad: () => {
      if (!checkAuth()) {
        return;
      }
    },
    component: Profile,
  });

const rootRoute = createRootRoute({
  component: () => <Root queryClient={queryClient} trpcClient={trpcClient} />,
  errorComponent: (props) => (
    <div>
      An error occurred. Please try again. {JSON.stringify(props.error)}
    </div>
  ),
});

const indexRoute = createRoute({
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

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
