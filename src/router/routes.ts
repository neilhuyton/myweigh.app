import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import Home from "../components/Home";
import Weight from "../components/Weight";
import WeightChart from "../components/WeightChart";
import WeightGoal from "../components/WeightGoal";
import Register from "../components/Register";
import LoginForm from "../components/LoginForm";
import ResetPasswordForm from "../components/ResetPasswordForm";
import ConfirmResetPasswordForm from "../components/ConfirmResetPasswordForm";
import VerifyEmail from "../components/VerifyEmail";
import Profile from "../components/Profile";
import { useAuthStore } from "../store/authStore";
import {
  verifyEmailSearchSchema,
  confirmResetPasswordSearchSchema,
} from "../schemas";

export const homeRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    beforeLoad: () => {
      const { isLoggedIn } = useAuthStore.getState();
      if (!isLoggedIn) {
        throw redirect({ to: "/login" });
      }
    },
    component: Home,
  });

export const registerRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/register",
    component: Register,
  });

export const loginRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: LoginForm,
  });

export const resetPasswordRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/reset-password",
    component: ResetPasswordForm,
  });

export const confirmResetPasswordRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/confirm-reset-password",
    validateSearch: confirmResetPasswordSearchSchema,
    component: ConfirmResetPasswordForm,
  });

export const weightRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/weight",
    beforeLoad: () => {
      const { isLoggedIn } = useAuthStore.getState();
      if (!isLoggedIn) {
        throw redirect({ to: "/login" });
      }
    },
    component: Weight,
  });

export const weightChartRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/stats",
    beforeLoad: () => {
      const { isLoggedIn } = useAuthStore.getState();
      if (!isLoggedIn) {
        throw redirect({ to: "/login" });
      }
    },
    component: WeightChart,
  });

export const weightGoalRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/goals",
    beforeLoad: () => {
      const { isLoggedIn } = useAuthStore.getState();
      if (!isLoggedIn) {
        throw redirect({ to: "/login" });
      }
    },
    component: WeightGoal,
  });

export const verifyEmailRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/verify-email",
    validateSearch: verifyEmailSearchSchema,
    component: VerifyEmail,
  });

export const profileRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile",
    beforeLoad: () => {
      const { isLoggedIn } = useAuthStore.getState();
      if (!isLoggedIn) {
        throw redirect({ to: "/login" });
      }
    },
    component: Profile,
  });
