// src/components/Root.tsx
import { useLocation, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";
import { ThemeProvider } from "./ThemeProvider";
import Navigation from "./Navigation";
import ProfileIcon from "./ProfileIcon";
import { ThemeToggle } from "./ThemeToggle";
import { useInstallPrompt } from "../hooks/useInstallPrompt"; // Import the new hook
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
  const { installPrompt, isIOS, handleInstallClick } = useInstallPrompt(); // Use the hook

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
              <header className="sticky top-0 left-0 right-0 z-50 bg-background flex items-center justify-between px-4 py-2">
                <ThemeToggle />
                <ProfileIcon />
              </header>
            )}
            {(installPrompt || isIOS) && isLoggedIn && !isPublicRoute && (
              <div className="fixed bottom-26 left-4 right-4 bg-primary text-foreground dark:bg-primary dark:text-foreground p-4 rounded-md shadow-lg z-50">
                <p className="text-center text-foreground dark:text-foreground">
                  {isIOS
                    ? "Tap the Share icon and select 'Add to Home Screen' to install My Weigh"
                    : "Install My Weigh for quick access!"}
                </p>
                <button
                  className="mt-2 w-full bg-background dark:bg-background text-primary dark:text-primary py-2 rounded hover:bg-accent dark:hover:bg-accent hover:text-accent-foreground dark:hover:text-accent-foreground"
                  onClick={handleInstallClick}
                  disabled={isIOS}
                >
                  {isIOS ? "Install via Safari" : "Install App"}
                </button>
              </div>
            )}
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