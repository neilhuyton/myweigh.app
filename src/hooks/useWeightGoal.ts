// src/hooks/useWeightGoal.ts
import { useState } from "react";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";

export function useWeightGoal() {
  const [goalWeight, setGoalWeight] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { userId } = useAuthStore();

  const {
    data: goal,
    isLoading,
    error,
  } = trpc.weight.getGoal.useQuery(undefined, {
    enabled: !!userId,
  });

  const queryClient = trpc.useContext();
  const setGoalMutation = trpc.weight.setGoal.useMutation({
    onSuccess: () => {
      setGoalWeight("");
      setMessage("Goal set successfully!");
      queryClient.weight.getGoal.invalidate();
    },
    onError: (error) => {
      setMessage(`Failed to set goal: ${error.message}`);
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
    setGoalMutation.mutate({ goalWeightKg });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoalWeight(e.target.value);
  };

  return {
    goal,
    isLoading,
    error,
    goalWeight,
    message,
    isSettingGoal: setGoalMutation.isPending,
    handleSubmit,
    handleInputChange,
  };
}
