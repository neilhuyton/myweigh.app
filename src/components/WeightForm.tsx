// src/components/WeightForm.tsx
import { useWeightForm } from '../hooks/useWeightForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { createPortal } from 'react-dom';

function WeightForm() {
  const {
    weight,
    note,
    message,
    isSubmitting,
    showConfetti,
    fadeOut,
    handleSubmit,
    handleWeightChange,
    handleNoteChange,
  } = useWeightForm();

  return (
    <>
      {showConfetti &&
        createPortal(
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            numberOfPieces={200}
            recycle={false}
            data-testid="confetti"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 1000,
              opacity: fadeOut ? 0 : 1,
              transition: 'opacity 1s ease-out',
            }}
          />,
          document.body
        )}
      <form onSubmit={handleSubmit} className="space-y-4 w-full" data-testid="weight-form">
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-semibold py-2"
            data-testid="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Weight'}
          </Button>
        </div>
      </form>
    </>
  );
}

export default WeightForm;