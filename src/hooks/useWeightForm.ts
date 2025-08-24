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

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate({ to: "/login" });
    }
  }, [isLoggedIn, navigate]);

  const weightMutation = trpc.weight.create.useMutation({
    onSuccess: () => {
      setMessage("Weight recorded successfully!");
      setWeight("");
      setNote("");
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
    handleSubmit,
    handleWeightChange,
    handleNoteChange,
  };
}