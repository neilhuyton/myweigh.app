// src/app/components/RealtimeListeners.tsx

import { useGoalRealtime } from "@/shared/hooks/useGoalRealtime";
import { useWeightRealtime } from "@/shared/hooks/useWeightRealtime";

export function RealtimeListeners() {
  useGoalRealtime();
  useWeightRealtime();

  return null;
}
