// src/hooks/useWeightList.ts
import { trpc } from "../trpc";

export function useWeightList() {
  const {
    data: weights,
    isLoading,
    isError,
    error,
  } = trpc.weight.getWeights.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.weight.delete.useMutation({
    onSuccess: () => {
      console.log('MSW: deleteMutation onSuccess called, invalidating weight.getWeights');
      utils.weight.getWeights.invalidate();
    },
    onError: (error) => {
      console.error(`Failed to delete weight: ${error.message}`);
    },
  });

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