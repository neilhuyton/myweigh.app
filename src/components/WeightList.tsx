// src/components/WeightList.tsx
import { useWeightList } from "../hooks/useWeightList";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

function WeightList() {
  const {
    weights,
    isLoading,
    isError,
    error,
    formatDate,
    handleDelete,
    isDeleting,
  } = useWeightList();

  if (isLoading) {
    return (
      <div className="py-4">
        <LoadingSpinner size="md" testId="weight-list-loading" />
      </div>
    );
  }

  return (
    <>
      <h1
        className="text-2xl font-bold text-left mb-4"
        role="heading"
        aria-level={1}
      >
        Past Measurements
      </h1>
      <Table className="border">
        <TableCaption className="text-muted-foreground">
          A list of your recent weight measurements.
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-muted/50 rounded-t-lg">
            <TableHead className="font-bold bg-muted/50">Weight (kg)</TableHead>
            <TableHead className="font-bold bg-muted/50">Note</TableHead>
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
                  index === weights.length - 1 && "rounded-b-lg"
                )}
              >
                <TableCell>{weight.weightKg}</TableCell>
                <TableCell>{weight.note || "-"}</TableCell>
                <TableCell>{formatDate(weight.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => handleDelete(weight.id)}
                    disabled={isDeleting}
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete weight measurement from ${formatDate(
                      weight.createdAt
                    )}`}
                  >
                    <Trash2
                      className="h-4 w-4 text-destructive"
                      data-lucide-name="trash-2"
                    />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-muted/50 rounded-b-lg">
              <TableCell colSpan={4} className="text-center">
                No weight measurements found
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
          Error: {error?.message}
        </p>
      )}
    </>
  );
}

export default WeightList;
