// src/hooks/useWeightGoal.ts
import { useState } from "react";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";

export function useWeightGoal() {
  const [goalWeight, setGoalWeight] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { userId } = useAuthStore();

  const {
    data: currentGoal,
    isLoading: isGoalLoading,
    error: goalError,
  } = trpc.weight.getCurrentGoal.useQuery(undefined, {
    enabled: !!userId,
  });

  const {
    data: goals,
    isLoading: isGoalsLoading,
    error: goalsError,
  } = trpc.weight.getGoals.useQuery(undefined, {
    enabled: !!userId,
  });

  const queryClient = trpc.useContext();
  const setGoalMutation = trpc.weight.setGoal.useMutation({
    onSuccess: () => {
      setGoalWeight("");
      setMessage("Goal set successfully!");
      queryClient.weight.getCurrentGoal.invalidate();
      queryClient.weight.getGoals.invalidate();
    },
    onError: (error) => {
      setMessage(`Failed to set goal: ${error.message}`);
    },
  });

  const updateGoalMutation = trpc.weight.updateGoal.useMutation({
    onSuccess: () => {
      setGoalWeight("");
      setMessage("Goal updated successfully!");
      queryClient.weight.getCurrentGoal.invalidate();
      queryClient.weight.getGoals.invalidate();
    },
    onError: (error) => {
      setMessage(`Failed to update goal: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage("You must be logged in to set a goal");
      return;
    }
    const goalWeightKg = parseFloat(goalWeight);
    if (isNaN(goalWeightKg) || goalWeightKg <= 0) {
      setMessage("Goal weight must be a positive number");
      return;
    }
    if (currentGoal) {
      // Update existing goal
      updateGoalMutation.mutate({ goalId: currentGoal.id, goalWeightKg });
    } else {
      // Set new goal
      setGoalMutation.mutate({ goalWeightKg });
    }
  };

  const handleGoalWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoalWeight(e.target.value);
  };

  return {
    currentGoal,
    goals,
    isLoading: isGoalLoading || isGoalsLoading,
    error: goalError || goalsError,
    goalWeight,
    message,
    isSettingGoal: setGoalMutation.isPending || updateGoalMutation.isPending,
    handleSubmit,
    handleGoalWeightChange,
  };
}