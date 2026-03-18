import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { useRealtimeSubscription } from "@steel-cut/steel-lib";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

export function useWeightRealtime() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useRealtimeSubscription({
    supabase,
    subscribeToAuthChange: (cb) =>
      useAuthStore.subscribe((state) => cb(state.session)),
    channelName: userId
      ? `weight_measurement:user:${userId}`
      : "weight_measurement:placeholder",
    table: "weight_measurement",
    event: "*",
    filter: userId ? `userId=eq.${userId}` : undefined,
    enabled: !!userId,
    onPayload: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.weight.getLatestWeight.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.weight.getWeights.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.weight.getCurrentGoal.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.weight.getGoals.queryKey(),
      });
    },
  });
}
