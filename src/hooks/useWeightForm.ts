import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";

type Goal = {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: string | null;
};

export function useWeightForm() {
  const { userId, isFirstLogin } = useAuthStore();
  const navigate = useNavigate();
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [runTour, setRunTour] = useState(isFirstLogin); // First login tour
  const [runGoalTour, setRunGoalTour] = useState(false); // Goal-setting tour

  const { data: currentGoal } = trpc.weight.getCurrentGoal.useQuery(undefined, {
    enabled: !!userId,
  }) as { data: Goal | null };

  const queryClient = trpc.useContext();
  const weightMutation = trpc.weight.create.useMutation({
    onSuccess: async (_, variables) => {
      setMessage("Weight recorded successfully!");
      setWeight("");
      setNote("");
      if (
        currentGoal &&
        variables.weightKg <= currentGoal.goalWeightKg &&
        !currentGoal.reachedAt
      ) {
        const updatedGoal = await queryClient.weight.getCurrentGoal.fetch();
        if (!updatedGoal) {
          setShowConfetti(true);
          setFadeOut(false);
          setTimeout(() => setFadeOut(true), 6000);
          setTimeout(() => setShowConfetti(false), 7000);
        }
      } else if (!currentGoal) {
        setRunGoalTour(true);
      }
      queryClient.weight.getWeights.invalidate();
      queryClient.weight.getCurrentGoal.invalidate();
      queryClient.weight.getGoals.invalidate();
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        setMessage("Please log in to record a weight.");
        navigate({ to: "/login" });
      } else {
        setMessage(`Failed to record weight: ${error.message}`);
      }
    },
  });

  const updateFirstLogin = trpc.user.updateFirstLogin.useMutation({
    onSuccess: () => {
      useAuthStore.setState({ isFirstLogin: false });
      localStorage.setItem("isFirstLogin", JSON.stringify(false));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage("User ID not found. Please log in again.");
      navigate({ to: "/login" });
      return;
    }
    const weightKg = parseFloat(weight);
    if (isNaN(weightKg) || weightKg <= 0) {
      setMessage("Please enter a valid weight.");
      return;
    }
    const decimalPlaces = (weight.split(".")[1]?.length || 0);
    if (decimalPlaces > 2) {
      setMessage("Weight can have up to two decimal places.");
      return;
    }
    weightMutation.mutate({ weightKg, note: note || undefined });
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(e.target.value);
    setMessage(null);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };

  const handleTourCallback = (data: { status: string }) => {
    if (data.status === "finished" || data.status === "skipped") {
      setRunTour(false);
      if (isFirstLogin && userId) {
        updateFirstLogin.mutate({ isFirstLogin: false });
      }
    }
  };

  const handleGoalTourCallback = (data: { status: string }) => {
    if (data.status === "finished") {
      setRunGoalTour(false);
      navigate({ to: "/goals" });
    }
  };

  return {
    weight,
    note,
    message,
    isSubmitting: weightMutation.isPending,
    showConfetti,
    fadeOut,
    runTour,
    runGoalTour,
    handleSubmit,
    handleWeightChange,
    handleNoteChange,
    handleTourCallback,
    handleGoalTourCallback,
  };
}