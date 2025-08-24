// src/hooks/useWeightList.ts
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";

export function useWeightList() {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const {
    data: weights,
    isLoading,
    isError,
    error,
  } = trpc.weight.getWeights.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.weight.delete.useMutation({
    onSuccess: () => {
      utils.weight.getWeights.invalidate();
    },
    onError: (error) => {
      alert(`Failed to delete weight: ${error.message}`);
    },
  });

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

  const handleDelete = (weightId: string) => {
    if (
      window.confirm("Are you sure you want to delete this weight measurement?")
    ) {
      deleteMutation.mutate({ weightId });
    }
  };

  return {
    weights,
    isLoading,
    isError,
    error,
    formatDate,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
