import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { formatDate } from "@/utils/date";
import {
  getCachedLatestWeight,
  saveLatestWeight,
  clearLatestWeightCache,
} from "@/utils/weightCache";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function useWeightListLogic() {
  const queryClient = useQueryClient();
  const weightsQueryKey = trpc.weight.getWeights.queryKey();

  const {
    data: weightsRaw,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(
    trpc.weight.getWeights.queryOptions(undefined, {
      staleTime: 1000 * 15,
    }),
  );

  if (weightsRaw && weightsRaw.length > 0) {
    const sorted = [...weightsRaw].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const latest = sorted[0];
    saveLatestWeight({
      weightKg: latest.weightKg,
      createdAt: latest.createdAt,
    });
  }

  const weights = weightsRaw
    ? [...weightsRaw].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : undefined;

  const cachedLatest = getCachedLatestWeight();

  const latestWeight =
    weights?.[0] ??
    (cachedLatest
      ? {
          id: "cached",
          weightKg: cachedLatest.weightKg,
          createdAt: cachedLatest.createdAt,
        }
      : undefined);

  const deleteMutation = useMutation(
    trpc.weight.delete.mutationOptions({
      onMutate: async (variables: { weightId: string }) => {
        await queryClient.cancelQueries({ queryKey: weightsQueryKey });
        const previous = queryClient.getQueryData(weightsQueryKey);
        if (previous) {
          queryClient.setQueryData(
            weightsQueryKey,
            previous.filter((w) => w.id !== variables.weightId),
          );
        }
        return { previousWeights: previous };
      },

      onSuccess: (_, variables) => {
        refetch();
        queryClient.invalidateQueries({ queryKey: weightsQueryKey });

        const currentData = queryClient.getQueryData(weightsQueryKey);
        if (currentData) {
          const remaining = currentData.filter(
            (w) => w.id !== variables.weightId,
          );
          if (remaining.length > 0) {
            const newLatest = remaining.reduce((a, b) =>
              new Date(b.createdAt).getTime() > new Date(a.createdAt).getTime()
                ? b
                : a,
            );
            saveLatestWeight({
              weightKg: newLatest.weightKg,
              createdAt: newLatest.createdAt,
            });
          } else {
            clearLatestWeightCache();
          }
        } else {
          clearLatestWeightCache();
        }
      },

      onError: (_, __, context) => {
        if (context?.previousWeights) {
          queryClient.setQueryData(weightsQueryKey, context.previousWeights);
        }
        console.error("Delete failed:");
      },
    }),
  );

  const handleDelete = (weightId: string) => {
    if (
      window.confirm("Are you sure you want to delete this weight measurement?")
    ) {
      deleteMutation.mutate({ weightId });
    }
  };

  return {
    weights,
    latestWeight,
    isLoading,
    isError,
    error,
    formatDate,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}

export default function WeightList() {
  const {
    weights,
    isLoading,
    isError,
    error,
    formatDate,
    handleDelete,
    isDeleting,
  } = useWeightListLogic();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!weights || weights.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground italic">
        No measurements recorded yet
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            <TableHead className="pl-0 font-medium w-1/4">
              Weight (kg)
            </TableHead>
            <TableHead className="font-medium">Date</TableHead>
            <TableHead className="text-right font-medium pr-0 w-16">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weights.map((weight) => (
            <TableRow
              key={weight.id}
              className="border-b last:border-b-0 hover:bg-muted/60 transition-colors"
            >
              <TableCell className="pl-0 font-medium">
                {weight.weightKg}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(weight.createdAt)}
              </TableCell>
              <TableCell className="text-right pr-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(weight.id)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  aria-label={`Delete entry from ${formatDate(weight.createdAt)}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isError && (
        <p className="mt-6 text-center text-sm text-destructive">
          {error?.message || "Failed to load weight history"}
        </p>
      )}
    </>
  );
}
