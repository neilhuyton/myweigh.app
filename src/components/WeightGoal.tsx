// src/components/WeightGoal.tsx
import { useWeightGoal } from '../hooks/useWeightGoal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GoalList from './GoalList';
import { cn } from '@/lib/utils';

function WeightGoal() {
  const {
    currentGoal,
    isLoading,
    error,
    goalWeight,
    message,
    isSettingGoal,
    isGoalAchieved,
    handleSubmit,
    handleGoalWeightChange,
  } = useWeightGoal();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-background min-h-[calc(100vh-3.5rem)]">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full max-w-md lg:max-w-full mx-auto bg-background rounded-lg p-4 pb-24">
        <h1
          className="text-2xl font-bold text-left mb-4"
          role="heading"
          aria-level={1}
        >
          Weight Goal
        </h1>
        <div className="max-w-sm mx-auto space-y-6">
          {error && (
            <p className="text-center text-lg text-destructive px-6 my-6" role="alert">
              Error loading goal: {error.message}
            </p>
          )}
          {currentGoal && (
            <p className="text-center text-lg px-6 my-6">
              Current Goal: {currentGoal.goalWeightKg} kg (Set on{' '}
              {new Date(currentGoal.goalSetAt).toLocaleDateString('en-GB')})
              {isGoalAchieved && <span className="text-green-500"> - Goal achieved!</span>}
            </p>
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
                onChange={handleGoalWeightChange}
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
              className={cn(
                'text-center text-sm font-medium px-6 my-6',
                message.toLowerCase().includes('success') ? 'text-green-500' : 'text-red-500'
              )}
              role="alert"
            >
              {message}
            </p>
          )}
        </div>
      </div>
      <div className="w-full max-w-md lg:max-w-full mx-auto bg-background rounded-lg p-4 pb-24">
        <GoalList />
      </div>
    </div>
  );
}

export default WeightGoal;