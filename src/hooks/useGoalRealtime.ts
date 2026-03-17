import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@steel-cut/steel-lib";

export function useGoalRealtime() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useRealtimeSubscription({
    supabase,
    subscribeToAuthChange: (cb) =>
      useAuthStore.subscribe((state) => cb(state.session)),
    channelName: userId ? `goal:user:${userId}` : "goal:placeholder",
    table: "goal",
    event: "*",
    filter: userId ? `userId=eq.${userId}` : undefined,
    enabled: !!userId,
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
