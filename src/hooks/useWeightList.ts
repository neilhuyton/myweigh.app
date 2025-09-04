// src/hooks/useWeightList.ts
import { trpc } from "../trpc";
import { format } from "date-fns";

export const useWeightList = () => {
  const {
    data: weightsData,
    isLoading: weightsLoading,
    isError: weightsError,
    error: weightsErrorObj,
  } = trpc.weight.getWeights.useQuery();

  const utils = trpc.useUtils();
  const mutation = trpc.weight.delete.useMutation({
    onSuccess: async () => {
      console.log("Delete mutation succeeded, invalidating weights query");
      await utils.weight.getWeights.invalidate();
    },
    onError: (err) => {
      console.error("Delete mutation error:", err.message);
    },
  });

  const handleDelete = (weightId: string) => {
    if (mutation.isPending) {
      console.log("Mutation already in progress, skipping:", weightId);
      return;
    }
    console.log("Calling handleDelete with weightId:", weightId);
    mutation.mutate({ weightId });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  return {
    weights: weightsData ?? [],
    isLoading: weightsLoading,
    isError: weightsError,
    error: weightsErrorObj,
    formatDate,
    handleDelete,
    isDeleting: mutation.isPending,
  };
};
