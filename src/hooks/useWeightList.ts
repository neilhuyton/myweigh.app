import { trpc } from "../trpc";
import { format } from "date-fns";

export const useWeightList = () => {
  const { data, isLoading, error, isError } = trpc.weight.getWeights.useQuery(undefined, {});

  const utils = trpc.useUtils();
  const mutation = trpc.weight.delete.useMutation({
    onSuccess: async () => {
      await utils.weight.getWeights.invalidate();
    },
  });

  const handleDelete = async (weightId: string) => {
    mutation.mutate({ weightId });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  return {
    weights: data ?? [],
    isLoading,
    error,
    isError,
    formatDate,
    handleDelete,
    isDeleting: mutation.isPending,
  };
};