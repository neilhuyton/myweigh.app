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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);
  const [selectedWeightId, setSelectedWeightId] = useState<string | null>(null);

  const handleOpenDialog = (weightId: string) => {
    setSelectedWeightId(weightId);
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedWeightId) {
      handleDelete(selectedWeightId);
    }
    setOpen(false);
    setSelectedWeightId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <LoadingSpinner size="md" testId="weight-list-loading" />
      </div>
    );
  }

  if (weights.length === 0) {
    return;
  }

  return (
    <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm">
      <h1
        className="text-2xl font-bold text-foreground mb-6"
        role="heading"
        aria-level={1}
      >
        Past Measurements
      </h1>
      <Table className="border border-border rounded-lg">
        <TableCaption className="text-sm text-muted-foreground mb-4">
          A list of your recent weight measurements.
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-muted/50 rounded-t-lg">
            <TableHead className="h-10 px-4 text-left font-semibold text-foreground bg-muted/50">
              Weight (kg)
            </TableHead>
            <TableHead className="h-10 px-4 text-left font-semibold text-foreground bg-muted/50">
              Date
            </TableHead>
            <TableHead className="h-10 px-4 text-right font-semibold text-foreground bg-muted/50">
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
                <TableCell className="p-4 text-foreground">
                  {weight.weightKg.toFixed(2)}
                </TableCell>
                <TableCell className="p-4 text-foreground">
                  {formatDate(weight.createdAt)}
                </TableCell>
                <TableCell className="p-4 text-right">
                  <AlertDialog
                    open={open && selectedWeightId === weight.id}
                    onOpenChange={setOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        onClick={() => handleOpenDialog(weight.id)}
                        disabled={isDeleting}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Delete weight measurement from ${formatDate(
                          weight.createdAt
                        )}`}
                        data-testid={`delete-button-${weight.id}`}
                      >
                        <Trash2
                          className="h-4 w-4"
                          data-lucide-name="trash-2"
                        />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the weight measurement of{" "}
                          {weight.weightKg.toFixed(2)} kg from{" "}
                          {formatDate(weight.createdAt)}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="cancel-delete">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmDelete}
                          data-testid="confirm-delete"
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-muted/50 rounded-b-lg">
              <TableCell
                colSpan={4}
                className="p-4 text-center text-muted-foreground"
              >
                No weight measurements found
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
          Error: {error?.message}
        </p>
      )}
    </div>
  );
}

export default WeightList;
