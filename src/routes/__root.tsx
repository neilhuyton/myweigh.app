import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { RouterContext } from "@/router";
import Navigation from "../components/Navigation";
import { useAuthStore } from "@/store/authStore";

function RootComponent() {
  const isLoggedIn = useAuthStore((state) => !!state.user);

  return (
    <>
      {isLoggedIn && <Navigation />}
      <Outlet />
    </>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});
