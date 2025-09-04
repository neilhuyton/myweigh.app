// src/hooks/useWeightChange.ts
import { useMemo } from "react";
import { useAuthStore } from "../authStore";
import { trpc } from "../trpc";

export function useWeightChange() {
  const { userId } = useAuthStore();

  const {
    data: weights,
    isLoading,
    error,
  } = trpc.weight.getWeights.useQuery(
    undefined, // No input parameter, as userId is inferred from auth context
    { enabled: !!userId }
  );

  const message = useMemo(() => {
    if (!weights || weights.length < 2) {
      return null; // Need at least two weights to calculate difference
    }

    const latestWeight = weights[weights.length - 1];
    const previousWeight = weights[weights.length - 2];

    const weightDiff = latestWeight.weightKg - previousWeight.weightKg;
    const timeDiffMs =
      new Date(latestWeight.createdAt).getTime() -
      new Date(previousWeight.createdAt).getTime();
    const timeDiffDays = Math.round(timeDiffMs / (1000 * 60 * 60 * 24));

    if (weightDiff === 0) {
      return `Your weight has not changed in ${timeDiffDays} day${
        timeDiffDays === 1 ? "" : "s"
      }`;
    }

    const absWeightDiff = Math.abs(weightDiff).toFixed(2);
    const direction = weightDiff > 0 ? "gained" : "lost";
    return `You have ${direction} ${absWeightDiff}kg in ${timeDiffDays} day${
      timeDiffDays === 1 ? "" : "s"
    }`;
  }, [weights]);

  return { message, isLoading, error };
}
