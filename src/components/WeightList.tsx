// src/components/WeightList.tsx
import { useWeightList } from '../hooks/useWeightList';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p>Loading weights...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-1 sm:p-2 lg:p-3">
      {/* Content centered in the middle */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-md bg-background rounded-lg p-4 flex flex-col items-center">
          <h1
            className="text-2xl font-bold text-center mb-4"
            role="heading"
            aria-level={1}
          >
            Weight List
          </h1>
          <div className="space-y-6 w-full">
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
                      <TableCell>{weight.note || '-'}</TableCell>
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
            {isError && (
              <p
                role="alert"
                className={cn(
                  'text-sm text-center text-destructive dark:text-red-400'
                )}
                data-testid="error-message"
              >
                Error: {error?.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeightList;