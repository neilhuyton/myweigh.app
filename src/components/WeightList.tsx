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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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
      <div className="min-h-[100dvh] flex items-center justify-center bg-background dark:bg-gray-900">
        <p>Loading weights...</p>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background dark:bg-gray-900">
        <p className="text-destructive dark:text-red-400">
          Error: {error?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
        <Card className="w-full max-w-md shadow-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Weight List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Table>
              <TableCaption>
                A list of your recent weight measurements.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weights && weights.length > 0 ? (
                  weights.map((weight) => (
                    <TableRow key={weight.id}>
                      <TableCell>{weight.weightKg}</TableCell>
                      <TableCell>{weight.note || "-"}</TableCell>
                      <TableCell>{formatDate(weight.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleDelete(weight.id)}
                          disabled={isDeleting}
                          variant="destructive"
                          size="sm"
                          aria-label={`Delete weight measurement from ${formatDate(
                            weight.createdAt
                          )}`}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      No weight measurements found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default WeightList;
