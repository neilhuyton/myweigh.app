// src/components/WeightList.tsx
import { useWeightList } from '../hooks/useWeightList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function WeightList() {
  const { weights, isLoading, isError, error, formatDate, handleDelete, isDeleting } = useWeightList();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-700">Loading weights...</p>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-red-600">Error: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
        <Card className="w-full max-w-4xl bg-white shadow-lg mx-auto">
          <CardHeader>
            <h1 className="text-2xl font-bold text-center text-gray-900">
              Weight Measurements
            </h1>
          </CardHeader>
          <CardContent className="space-y-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Weight (kg)</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Note</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {weights && weights.length > 0 ? (
                  weights.map((weight) => (
                    <tr key={weight.id} className="border-b border-gray-200">
                      <td className="py-3 px-4 text-gray-700">{weight.weightKg}</td>
                      <td className="py-3 px-4 text-gray-700">{weight.note || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{formatDate(weight.createdAt)}</td>
                      <td className="py-3 px-4">
                        <Button
                          onClick={() => handleDelete(weight.id)}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3"
                          aria-label={`Delete weight measurement from ${formatDate(weight.createdAt)}`}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-center text-lg text-gray-700">
                      No weight measurements found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default WeightList;