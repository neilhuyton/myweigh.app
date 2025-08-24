import { useLocation, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";
import { ThemeProvider } from "./ThemeProvider";
import Navigation from "./Navigation";
import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "../../server/trpc";

// Define public routes where Navigation should not be shown
const publicRoutes = [
  "/login",
  "/register",
  "/reset-password",
  "/confirm-reset-password",
  "/verify-email",
];

// Define Root component
function Root({ queryClient, trpcClient }: { queryClient: QueryClient; trpcClient: TRPCClient<AppRouter> }) {
  const { isLoggedIn } = useAuthStore();
  const location = useLocation();
  const isPublicRoute = publicRoutes.includes(location.pathname);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          {isLoggedIn && !isPublicRoute && <Navigation />}
          <Outlet />
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default Root;