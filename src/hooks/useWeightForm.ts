// src/hooks/useWeightForm.ts
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";

// Define Goal type to match weightRouter.ts and Prisma schema
type Goal = {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: Date | null;
};

export function useWeightForm() {
  const { isLoggedIn, userId } = useAuthStore();
  const navigate = useNavigate();
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Fetch user's current (unreached) weight goal
  const { data: currentGoal } = trpc.weight.getCurrentGoal.useQuery(undefined, {
    enabled: !!userId,
  }) as { data: Goal | null };

  // Fetch all goals to check for recently achieved goals
  const { data: goals = [] } = trpc.weight.getGoals.useQuery(undefined, {
    enabled: !!userId,
  }) as { data: Goal[] };

  // Get the most recent goal
  const latestGoal: Goal | null =
    goals.length > 0
      ? goals.sort((a, b) => new Date(b.goalSetAt).getTime() - new Date(a.goalSetAt).getTime())[0]
      : currentGoal;

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate({ to: "/login" });
    }
  }, [isLoggedIn, navigate]);

  const queryClient = trpc.useContext();
  const weightMutation = trpc.weight.create.useMutation({
    onSuccess: (data, variables) => {
      setMessage("Weight recorded successfully!");
      setWeight("");
      setNote("");
      // Check if the entered weight meets or is below the latest goal
      if (latestGoal && variables.weightKg <= latestGoal.goalWeightKg) {
        setShowConfetti(true);
        setFadeOut(false);
        // Start fade-out 1 second before the end
        setTimeout(() => setFadeOut(true), 6000);
        // Hide confetti after 7 seconds
        setTimeout(() => setShowConfetti(false), 7000);
      }
      // Invalidate queries to refresh goal and weight data
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
    weightMutation.mutate({ weightKg, note: note || undefined });
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(e.target.value);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };

  return {
    weight,
    note,
    message,
    isSubmitting: weightMutation.isPending,
    showConfetti,
    fadeOut,
    handleSubmit,
    handleWeightChange,
    handleNoteChange,
  };
}