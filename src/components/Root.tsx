// src/components/Root.tsx
import { useLocation, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";
import { ThemeProvider } from "./ThemeProvider";
import Navigation from "./Navigation";
import ProfileIcon from "./ProfileIcon";
import { ThemeToggle } from "./ThemeToggle";
import { InstallPrompt } from "./InstallPrompt";
import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "../../server/trpc";

const publicRoutes = [
  "/login",
  "/register",
  "/reset-password",
  "/confirm-reset-password",
  "/verify-email",
];

function Root({
  queryClient,
  trpcClient,
}: {
  queryClient: QueryClient;
  trpcClient: TRPCClient<AppRouter>;
}) {
  const { isLoggedIn } = useAuthStore();
  const location = useLocation();
  const isPublicRoute = publicRoutes.includes(location.pathname);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="dark"
          storageKey="vite-ui-theme"
          enableSystem={true}
        >
          <div className="flex flex-col">
            {isLoggedIn && !isPublicRoute && (
              <header
                data-testid="header"
                className="sticky top-0 left-0 right-0 z-50 bg-background flex items-center justify-between px-4 py-2"
              >
                <ThemeToggle />
                <ProfileIcon />
              </header>
            )}
            <InstallPrompt
              isLoggedIn={isLoggedIn}
              isPublicRoute={isPublicRoute}
            />
            <main
              className={
                isLoggedIn && !isPublicRoute
                  ? "min-h-[calc(100vh-3.5rem)] pb-16"
                  : "min-h-screen"
              }
            >
              {isLoggedIn && !isPublicRoute && <Navigation />}
              <Outlet />
            </main>
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default Root;