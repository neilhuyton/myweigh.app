import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { trpcClient } from "@/trpc";
import { formatDate } from "@/utils/date";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WeightList() {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isFetching,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["weight", "getWeights"],
    queryFn: async ({ pageParam }) => {
      const result = await trpcClient.weight.getWeights.query({
        limit: 50,
        cursor: pageParam as string | undefined,
      });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ weightId }: { weightId: string }) =>
      trpcClient.weight.delete.mutate({ weightId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight", "getWeights"] });
      queryClient.invalidateQueries({
        queryKey: ["weight", "getLatestWeight"],
      });
    },
    onError: (err) => {
      console.error("Delete failed:", err);
      alert("Failed to delete measurement. Please try again.");
    },
  });

  const handleDelete = (weightId: string) => {
    if (window.confirm("Are you sure you want to delete this measurement?")) {
      deleteMutation.mutate({ weightId });
    }
  };

  const allWeights = data?.pages.flatMap((page) => page.items) ?? [];

  if (isPending || isFetching) {
    return (
      <div className="py-10 flex justify-center" role="status">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          data-testid="loading-spinner"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-destructive">
        <p>Error loading history</p>
        <p className="text-sm mt-2">{error?.message || "Unknown error"}</p>
      </div>
    );
  }

  return (
    <>
      <Table className="border">
        <TableHeader>
          <TableRow className="hover:bg-muted/50">
            <TableHead className="font-bold bg-muted/50">Weight (kg)</TableHead>
            <TableHead className="font-bold bg-muted/50">Date</TableHead>
            <TableHead className="font-bold bg-muted/50 text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allWeights.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center py-12 text-muted-foreground"
              >
                No measurements yet
              </TableCell>
            </TableRow>
          ) : (
            allWeights.map((weight, i) => (
              <TableRow
                key={weight.id}
                className={cn(
                  "hover:bg-muted/50",
                  i === allWeights.length - 1 && "rounded-b-lg",
                )}
              >
                <TableCell className="pl-4">{weight.weightKg}</TableCell>
                <TableCell>{formatDate(weight.createdAt)}</TableCell>
                <TableCell className="text-right pr-4">
                  <button
                    onClick={() => handleDelete(weight.id)}
                    disabled={deleteMutation.isPending}
                    className={cn(
                      "text-sm text-destructive hover:underline",
                      deleteMutation.isPending &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div className="text-center py-8">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
