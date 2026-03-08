// src/shared/hooks/useGoalRealtime.ts

import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { useAuthStore } from "@/shared/store/authStore";

export function useGoalRealtime() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useRealtimeSubscription({
    channelName: userId ? `goal:user:${userId}` : "goal:placeholder",
    table: "goal",
    event: "*",
    filter: userId ? `userId=eq.${userId}` : undefined,
    enabled: !!userId,
    autoResubscribe: true,

    onPayload: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.weight.getCurrentGoal.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.weight.getGoals.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.weight.getWeights.queryKey(),
      });
    },
  });
}
