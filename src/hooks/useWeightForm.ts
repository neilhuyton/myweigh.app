// src/hooks/useWeightForm.ts
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";

export function useWeightForm() {
  const { isLoggedIn, userId } = useAuthStore();
  const navigate = useNavigate();
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate({ to: "/" });
    }
  }, [isLoggedIn, navigate]);

  const weightMutation = trpc.weight.create.useMutation({
    onSuccess: () => {
      setMessage("Weight recorded successfully!");
      setWeight("");
      setNote("");
    },
    onError: (error) => {
      setMessage(`Failed to record weight: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage("User ID not found. Please log in again.");
      return;
    }
    const weightKg = parseFloat(weight);
    if (isNaN(weightKg)) {
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
    handleSubmit,
    handleWeightChange,
    handleNoteChange,
  };
}
