import { useEffect } from 'react';
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
  } = trpc.weight.getWeights.useQuery(undefined, {
    // Removed onSuccess and onError
  });

  // Log query state
  useEffect(() => {
    if (weights) {
      console.log('useWeightList: weights data:', JSON.stringify(weights, null, 2));
    }
    if (isError && error) {
      console.error('useWeightList: weights error:', error.message);
    }
  }, [weights, isError, error]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDelete = (weightId: string) => {
    // if (window.confirm('Are you sure you want to delete this weight measurement?')) {
      console.log('useWeightList: deleting weightId:', weightId);
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