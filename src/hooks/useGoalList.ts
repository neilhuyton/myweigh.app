// src/hooks/useGoalList.ts
import { trpc } from "../trpc";

export function useGoalList() {
  const {
    data: goals,
    isLoading,
    isError,
    error,
  } = trpc.weight.getGoals.useQuery();

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
