// src/components/Root.tsx
import { useLocation, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";
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

          <div className="flex flex-col">
            <main
              className={
                isLoggedIn && !isPublicRoute
                  ? "min-h-[calc(100vh-3.5rem)] pb-16"
                  : "min-h-screen"
              }
            >
              <Outlet />
            </main>
          </div>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default Root;