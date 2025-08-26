// src/hooks/useGoalList.ts
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";

export function useGoalList() {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const {
    data: goals,
    isLoading,
    isError,
    error,
  } = trpc.weight.getGoals.useQuery();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate({ to: "/" });
    }
  }, [isLoggedIn, navigate]);

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return {
    goals,
    isLoading,
    isError,
    error,
    formatDate,
  };
}