// src/components/GoalList.tsx
import { useGoalList } from "../hooks/useGoalList";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

function GoalList() {
  const { goals, isLoading, isError, error, formatDate } = useGoalList();

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <LoadingSpinner size="md" testId="goal-list-loading" />
      </div>
    );
  }

  if (goals?.length === 0) {
    return;
  }

  return (
    <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm">
      <h1
        className="text-2xl font-bold text-foreground mb-6"
        role="heading"
        aria-level={1}
      >
        Past Weight Goals
      </h1>
      <Table className="border border-border rounded-lg">
        <TableCaption className="text-sm text-muted-foreground mb-4">
          A list of your past weight goals.
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-muted/50 rounded-t-lg">
            <TableHead className="h-10 px-4 text-left font-semibold text-foreground bg-muted/50">
              Goal Weight (kg)
            </TableHead>
            <TableHead className="h-10 px-4 text-left font-semibold text-foreground bg-muted/50">
              Set Date
            </TableHead>
            <TableHead className="h-10 px-4 text-left font-semibold text-foreground bg-muted/50">
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
                  index === goals.length - 1 && "rounded-b-lg"
                )}
              >
                <TableCell className="p-4 text-foreground">
                  {goal.goalWeightKg.toFixed(2)}
                </TableCell>
                <TableCell className="p-4 text-foreground">
                  {formatDate(goal.goalSetAt)}
                </TableCell>
                <TableCell className="p-4 text-foreground">
                  {goal.reachedAt ? formatDate(goal.reachedAt) : "Not Reached"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-muted/50 rounded-b-lg">
              <TableCell
                colSpan={3}
                className="p-4 text-center text-muted-foreground"
              >
                No weight goals found
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
          Error: {error?.message || "An unexpected error occurred"}
        </p>
      )}
    </div>
  );
}

export default GoalList;
