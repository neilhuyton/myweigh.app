import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { useAuthStore } from "@/store/authStore";

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
        queryKey: ["weight.getCurrentGoal"],
      });

      queryClient.invalidateQueries({
        queryKey: ["weight.getGoals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["weight.getWeights"],
      });
    },
  });
}
