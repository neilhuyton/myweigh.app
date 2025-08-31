import { trpc } from '../trpc';

interface Weight {
  userId: string;
  id: string;
  createdAt: string;
  weightKg: number;
  note: string | null;
}

export function useWeightList() {
  const {
    data: weights,
    isLoading,
    isError,
    error,
  } = trpc.weight.getWeights.useQuery(undefined, {});

  const utils = trpc.useUtils();
  const deleteMutation = trpc.weight.delete.useMutation({
    onSuccess: () => {
      utils.weight.getWeights.invalidate();
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDelete = (weightId: string) => {
    // if (window.confirm('Are you sure you want to delete this weight measurement?')) {
      deleteMutation.mutate({ weightId });
    // }
  };

  return {
    weights: weights as Weight[] | undefined,
    isLoading,
    isError,
    error,
    formatDate,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}