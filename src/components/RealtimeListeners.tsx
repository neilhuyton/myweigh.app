// src/components/RealtimeListeners.tsx

import { useGoalRealtime } from "@/hooks/useGoalRealtime";
import { useWeightRealtime } from "@/hooks/useWeightRealtime";

export function RealtimeListeners() {
  useGoalRealtime();
  useWeightRealtime();

  return null;
}
