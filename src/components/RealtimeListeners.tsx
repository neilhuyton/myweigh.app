import { useGoalRealtime } from "@/features/goal/useGoalRealtime";
import { useWeightRealtime } from "@/features/weight/useWeightRealtime";

export function RealtimeListeners() {
  useGoalRealtime();
  useWeightRealtime();

  return null;
}
