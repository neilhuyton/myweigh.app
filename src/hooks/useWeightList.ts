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
      await utils.weight.getWeights.invalidate();
    },
    onError: () => {},
  });

  const handleDelete = (weightId: string) => {
    if (mutation.isPending) {
      return;
    }
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
