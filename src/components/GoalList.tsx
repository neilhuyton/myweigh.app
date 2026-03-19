import { useInfiniteQuery } from "@tanstack/react-query";
import { trpcClient } from "@/trpc";
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
import { format } from "date-fns";

export default function GoalList() {
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
    queryKey: ["weight", "getGoals"],
    queryFn: async ({ pageParam }) => {
      const result = await trpcClient.weight.getGoals.query({
        limit: 50,
        cursor: pageParam as string | undefined,
      });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  const allGoals = data?.pages.flatMap((page) => page.items) ?? [];

  const formatDate = (date: string | Date) =>
    format(new Date(date), "dd MMM yyyy");

  if (isPending || isFetching) {
    return (
      <div className="py-10 flex justify-center" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-destructive">
        <p>Error loading goal history</p>
        <p className="text-sm mt-2">{error?.message || "Unknown error"}</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold text-left mb-4">Past Weight Goals</h2>

      <Table className="border">
        <TableHeader>
          <TableRow className="hover:bg-muted/50">
            <TableHead className="font-bold bg-muted/50">
              Goal Weight (kg)
            </TableHead>
            <TableHead className="font-bold bg-muted/50">Set Date</TableHead>
            <TableHead className="font-bold bg-muted/50">
              Reached Date
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {allGoals.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center py-12 text-muted-foreground"
              >
                No weight goals found
              </TableCell>
            </TableRow>
          ) : (
            allGoals.map((goal, i) => (
              <TableRow
                key={goal.id}
                className={cn(
                  "hover:bg-muted/50",
                  i === allGoals.length - 1 && "rounded-b-lg",
                )}
              >
                <TableCell>{goal.goalWeightKg.toFixed(1)}</TableCell>
                <TableCell>{formatDate(goal.goalSetAt)}</TableCell>
                <TableCell>
                  {goal.reachedAt ? formatDate(goal.reachedAt) : "Not Reached"}
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