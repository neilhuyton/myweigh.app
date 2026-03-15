import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { useAuthStore } from "@/store/authStore";

export function useWeightRealtime() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useRealtimeSubscription({
    channelName: userId
      ? `weight_measurement:user:${userId}`
      : "weight_measurement:placeholder",
    table: "weight_measurement",
    event: "*",
    filter: userId ? `userId=eq.${userId}` : undefined,
    enabled: !!userId,
    autoResubscribe: true,

    onPayload: () => {
      queryClient.invalidateQueries({
        queryKey: ["weight.getWeights"],
      });

      queryClient.invalidateQueries({
        queryKey: ["weight.getCurrentGoal"],
      });

      queryClient.invalidateQueries({
        queryKey: ["weight.getGoals"],
      });
    },
  });
}
