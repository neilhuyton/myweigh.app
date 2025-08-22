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
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
        <Card className="w-full max-w-md shadow-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Record Weight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space chronological order-y-2">
                <Label htmlFor="weight" className="text-sm font-medium">
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
                  aria-describedby="weight-error"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium">
                  Optional Note
                </Label>
                <Input
                  id="note"
                  type="text"
                  value={note}
                  onChange={handleNoteChange}
                  placeholder="Optional note"
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full font-semibold py-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Weight'}
              </Button>
            </form>
            {message && (
              <p
                className="text-center text-sm font-medium"
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