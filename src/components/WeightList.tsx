import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { formatDate } from "@/utils/date";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WeightList() {
  const queryClient = useQueryClient();
  const weightsQueryKey = trpc.weight.getWeights.queryKey();

  const {
    data: weightsRaw,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    trpc.weight.getWeights.queryOptions(undefined, {
      staleTime: 1000 * 15,
    }),
  );

  const weights = weightsRaw
    ? [...weightsRaw].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : undefined;

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

      onSuccess: () => {
        refetch();
        queryClient.invalidateQueries({ queryKey: weightsQueryKey });
      },

      onError: (_, __, context) => {
        if (context?.previousWeights) {
          queryClient.setQueryData(weightsQueryKey, context.previousWeights);
        }
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

  const isDeleting = deleteMutation.isPending;

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <Loader2
          data-testid="loading-spinner"
          className="h-5 w-5 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <p
        data-testid="error-message"
        className="text-sm text-center text-destructive mt-4"
      >
        Failed to load weight history
      </p>
    );
  }

  return (
    <>
      <Table className="border">
        <TableHeader>
          <TableRow className="hover:bg-muted/50 rounded-t-lg">
            <TableHead className="font-bold bg-muted/50">
              Weight (kg)
            </TableHead>
            <TableHead className="font-bold bg-muted/50">Date</TableHead>
            <TableHead className="font-bold bg-muted/50 text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {weights && weights.length > 0 ? (
            weights.map((weight, index) => (
              <TableRow
                key={weight.id}
                className={cn(
                  "hover:bg-muted/50",
                  index === weights.length - 1 && "rounded-b-lg",
                )}
              >
                <TableCell className="pl-4">{weight.weightKg}</TableCell>
                <TableCell>{formatDate(weight.createdAt)}</TableCell>
                <TableCell className="text-right pr-4">
                  <button
                    onClick={() => handleDelete(weight.id)}
                    disabled={isDeleting}
                    className={cn(
                      "text-sm text-destructive hover:text-destructive/80 hover:underline",
                      isDeleting && "opacity-50 cursor-not-allowed",
                    )}
                    aria-label={`Delete entry from ${formatDate(weight.createdAt)}`}
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-muted/50 rounded-b-lg">
              <TableCell
                colSpan={3}
                className="text-center py-8 text-muted-foreground"
              >
                No measurements recorded yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {isError && (
        <p
          role="alert"
          className="text-sm text-center text-destructive mt-4"
          data-testid="error-message"
        >
          Failed to load weight history
        </p>
      )}
    </>
  );
}