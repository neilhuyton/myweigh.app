import { createTrpcClient } from '@steel-cut/trpc-shared/client';
import type { AppRouter } from '../server/trpc';

import { safeGetSession, safeRefreshSession } from '@/lib/supabase-utils';
import { useAuthStore } from '@/store/authStore';
import { getQueryClient } from '@/queryClient';
import {
  createTRPCContext,
  createTRPCOptionsProxy,
} from '@trpc/tanstack-react-query';

const getAccessToken = async (): Promise<string | null> => {
  const session = useAuthStore.getState().session;

  if (session?.access_token) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at ?? 0;

    if (expiresAt - now >= 120) {
      return session.access_token;
    }
  }

  await safeRefreshSession();

  const freshSession = useAuthStore.getState().session;
  if (freshSession?.access_token) {
    return freshSession.access_token;
  }

  const { data } = await safeGetSession();
  return data?.session?.access_token ?? null;
};

export const trpcClient = createTrpcClient<AppRouter>({
  getAccessToken,
  refreshSession: safeRefreshSession,
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient: getQueryClient(),
});

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();