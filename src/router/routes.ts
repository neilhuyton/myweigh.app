// src/router/routes.ts
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
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const checkAuth = () => {
  const { isLoggedIn, token } = useAuthStore.getState();
  if (!isLoggedIn || !token) {
    throw redirect({ to: "/login" });
  }
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return false; // Let trpcClient handle refresh
    }
    return true;
  } catch {
    throw redirect({ to: "/login" });
  }
};

export const homeRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    beforeLoad: () => {
      if (!checkAuth()) {
        return; // Allow trpcClient to attempt refresh
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
      if (!checkAuth()) {
        return; // Allow trpcClient to attempt refresh
      }
    },
    component: Weight,
  });

export const weightChartRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/stats",
    beforeLoad: () => {
      if (!checkAuth()) {
        return; // Allow trpcClient to attempt refresh
      }
    },
    component: WeightChart,
  });

export const weightGoalRoute = (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/goals",
    beforeLoad: () => {
      if (!checkAuth()) {
        return; // Allow trpcClient to attempt refresh
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
      if (!checkAuth()) {
        return; // Allow trpcClient to attempt refresh
      }
    },
    component: Profile,
  });
