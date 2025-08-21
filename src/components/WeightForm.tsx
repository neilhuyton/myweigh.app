// src/components/WeightForm.tsx
import { useWeightForm } from '../hooks/useWeightForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function WeightForm() {
  const { weight, note, message, isSubmitting, handleSubmit, handleWeightChange, handleNoteChange } =
    useWeightForm();

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
        <Card className="w-full max-w-md bg-white shadow-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Record Weight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={handleWeightChange}
                  placeholder="Enter your weight (kg)"
                  required
                  min="0"
                  step="0.1"
                  disabled={isSubmitting}
                  className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  aria-describedby="weight-error"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium text-gray-700">
                  Optional Note
                </Label>
                <Input
                  id="note"
                  type="text"
                  value={note}
                  onChange={handleNoteChange}
                  placeholder="Optional note"
                  disabled={isSubmitting}
                  className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Weight'}
              </Button>
            </form>
            {message && (
              <p
                className={`text-center text-sm font-medium ${
                  message.includes('success') ? 'text-green-600' : 'text-red-600'
                }`}
                id="weight-error"
              >
                {message}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default WeightForm;