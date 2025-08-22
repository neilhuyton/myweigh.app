// src/components/WeightGoal.tsx
import { useWeightGoal } from '../hooks/useWeightGoal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function WeightGoal() {
  const { goal, isLoading, error, goalWeight, message, isSettingGoal, handleSubmit, handleInputChange } =
    useWeightGoal();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
        <Card className="w-full max-w-md shadow-lg mx-auto">
          <CardHeader>
            <h1 className="text-2xl font-bold text-center">
              Set Weight Goal
            </h1>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <p className="text-center text-lg">Error loading goal: {error.message}</p>
            )}
            {goal && (
              <p className="text-center text-lg">Current Goal: {goal.goalWeightKg} kg</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalWeight" className="text-sm font-medium">
                  Goal Weight (kg)
                </Label>
                <Input
                  id="goalWeight"
                  type="number"
                  value={goalWeight}
                  onChange={handleInputChange}
                  placeholder="Enter your goal weight (kg)"
                  required
                  min="0"
                  step="0.1"
                  disabled={isSettingGoal}
                />
              </div>
              <Button
                type="submit"
                disabled={isSettingGoal}
                className="w-full font-semibold py-2"
              >
                {isSettingGoal ? 'Setting Goal...' : 'Set Goal'}
              </Button>
            </form>
            {message && (
              <p
                className="text-center text-sm font-medium"
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

export default WeightGoal;