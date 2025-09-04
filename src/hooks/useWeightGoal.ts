import { useState } from "react";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "server/trpc";
import { STATUS } from "react-joyride";

type Goal = {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: Date | null;
};

export function useWeightGoal() {
  const [goalWeight, setGoalWeight] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [runStatsTour, setRunStatsTour] = useState(false);
  const { userId } = useAuthStore();

  const {
    data: currentGoal = null,
    isLoading: isGoalLoading,
    error: goalError,
  } = trpc.weight.getCurrentGoal.useQuery(undefined, {
    enabled: !!userId,
  }) as {
    data: Goal | null;
    isLoading: boolean;
    error: TRPCClientErrorLike<AppRouter>;
  };

  const queryClient = trpc.useContext();
  const setGoalMutation = trpc.weight.setGoal.useMutation({
    onSuccess: () => {
      setGoalWeight("");
      setMessage("Goal set successfully!");
      queryClient.weight.getCurrentGoal.invalidate();
      queryClient.weight.getGoals.invalidate();
      // Trigger Stats tour only if this is the first goal
      if (!currentGoal) {
        setRunStatsTour(true);
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
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
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setMessage(`Failed to update goal: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
    // Validate two decimal places
    const decimalPlaces = (goalWeight.split(".")[1]?.length || 0);
    if (decimalPlaces > 2) {
      setMessage("Goal weight can have up to two decimal places.");
      return;
    }
    if (currentGoal) {
      await updateGoalMutation.mutateAsync({ goalId: currentGoal.id, goalWeightKg });
    } else {
      await setGoalMutation.mutateAsync({ goalWeightKg });
    }
  };

  const handleGoalWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGoalWeight(value);
    setMessage(null); // Clear message on input change
  };

  const handleJoyrideCallback = (data: { status: string }) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRunStatsTour(false);
    }
  };

  return {
    currentGoal,
    isLoading: isGoalLoading,
    error: goalError,
    goalWeight,
    message,
    isSettingGoal: setGoalMutation.isPending || updateGoalMutation.isPending,
    isGoalAchieved: currentGoal?.reachedAt !== null,
    handleSubmit,
    handleGoalWeightChange,
    runStatsTour,
    handleJoyrideCallback,
  };
}