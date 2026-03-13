import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

function GoalList() {
  const {
    data: goals,
    isLoading,
    isError,
    error,
  } = useQuery(
    trpc.weight.getGoals.queryOptions(undefined, {
      staleTime: 1000 * 60 * 5,
    }),
  );

  const formatDate = (date: string | Date) =>
    format(new Date(date), "dd MMM yyyy");

  if (isLoading) {
    return (
      <div className="py-4">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h2
        className="text-xl font-bold text-left mb-4"
        role="heading"
        aria-level={2}
      >
        Past Weight Goals
      </h2>

      <Table className="border">
        <TableHeader>
          <TableRow className="hover:bg-muted/50 rounded-t-lg">
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
          {goals && goals.length > 0 ? (
            goals.map((goal, index) => (
              <TableRow
                key={goal.id}
                className={cn(
                  "hover:bg-muted/50",
                  index === goals.length - 1 && "rounded-b-lg",
                )}
              >
                <TableCell>{goal.goalWeightKg.toFixed(1)}</TableCell>
                <TableCell>{formatDate(goal.goalSetAt)}</TableCell>
                <TableCell>
                  {goal.reachedAt ? formatDate(goal.reachedAt) : "Not Reached"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-muted/50 rounded-b-lg">
              <TableCell colSpan={3} className="text-center">
                No weight goals found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {isError && (
        <p
          role="alert"
          className="text-sm text-center text-destructive dark:text-red-400 mt-4"
          data-testid="error-message"
        >
          Error: {error?.message || "An unexpected error occurred"}
        </p>
      )}
    </>
  );
}

export default GoalList;
