import { useWeightGoal } from "../hooks/useWeightGoal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

function GoalForm() {
  const {
    isLoading,
    error,
    goalWeight,
    message,
    isSettingGoal,
    handleSubmit,
    handleGoalWeightChange,
  } = useWeightGoal();

  return (
    <div className="goal-form-container mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm">
      {isLoading ? (
        <div className="flex items-center justify-center bg-background min-h-[calc(100vh-3.5rem)]">
          <LoadingSpinner size="lg" testId="weight-goal-loading" />
        </div>
      ) : (
        <>
          {error && (
            <p
              className="text-center text-sm font-medium text-destructive mb-6"
              role="alert"
              data-testid="error-message"
            >
              Error loading goal: {error.message}
            </p>
          )}
          <form onSubmit={handleSubmit} data-testid="goal-weight-form">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="goalWeight"
                  className="text-xl font-medium text-foreground"
                  data-testid="goal-weight-label"
                >
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
                  step="0.01"
                  disabled={isSettingGoal}
                  data-testid="goal-weight-input"
                  aria-describedby="goal-weight-error"
                  className="h-10 rounded-md border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {message && (
                <p
                  className={cn(
                    "text-center text-sm font-medium",
                    message.toLowerCase().includes("success")
                      ? "text-success"
                      : "text-destructive"
                  )}
                  id="goal-weight-error"
                  data-testid="goal-message"
                  role="alert"
                >
                  {message}
                </p>
              )}
              <Button
                type="submit"
                disabled={isSettingGoal}
                className="w-full h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="submit-button"
              >
                {isSettingGoal ? "Setting Goal..." : "Set Goal"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default GoalForm;
