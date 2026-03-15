import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "server/trpc";
import { useAuthStore } from "@/store/authStore";
import { safeGetSession, safeRefreshSession } from "@/lib/supabase-utils";

let client: ReturnType<typeof createTRPCClient<AppRouter>> | undefined;

export const getTRPCClient = () => {
  if (client) return client;

  client = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: "/trpc",
        async headers() {
          let session = useAuthStore.getState().session;

          if (!session?.access_token) {
            const { data } = await safeGetSession();
            session = data.session;
          }

          if (
            session?.expires_at &&
            session.expires_at - Math.floor(Date.now() / 1000) < 120
          ) {
            await safeRefreshSession();
            session = useAuthStore.getState().session;
          }

          return session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {};
        },
      }),
    ],
  });

  return client;
};

export const trpcClient = getTRPCClient();
