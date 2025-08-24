import { useWeightForm } from '../hooks/useWeightForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function WeightForm() {
  const { weight, note, message, isSubmitting, handleSubmit, handleWeightChange, handleNoteChange } =
    useWeightForm();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-1 sm:p-2 lg:p-3 pb-24 sm:pb-28">
      {/* Form centered in the middle */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-md bg-background rounded-lg p-4 flex flex-col items-center">
          <h1
            className="text-2xl font-bold text-center mb-4"
            role="heading"
            aria-level={1}
          >
            Record Weight
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6 w-full" data-testid="weight-form">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium" data-testid="weight-label">
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
                  data-testid="weight-input"
                  aria-describedby="weight-error"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium" data-testid="note-label">
                  Optional Note
                </Label>
                <Input
                  id="note"
                  type="text"
                  value={note}
                  onChange={handleNoteChange}
                  placeholder="Optional note"
                  disabled={isSubmitting}
                  data-testid="note-input"
                />
              </div>
              {message && (
                <p
                  className={cn('text-center text-sm font-medium', {
                    'text-green-500': message.toLowerCase().includes('success'),
                    'text-red-500': message.toLowerCase().includes('failed'),
                  })}
                  id="weight-error"
                  data-testid="weight-message"
                  role="alert"
                >
                  {message}
                </p>
              )}
              <div className="mt-8">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-semibold py-2 sticky bottom-0 z-20"
                  data-testid="submit-button"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Weight'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default WeightForm;