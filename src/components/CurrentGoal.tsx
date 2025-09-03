// src/components/CurrentGoal.tsx
import { useWeightGoal } from "../hooks/useWeightGoal";

function CurrentGoal() {
  const { currentGoal, isGoalAchieved } = useWeightGoal();

  if (!currentGoal) {
    return null; // Don't render anything if there is no current goal
  }

  return (
    <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2
        className="text-xl font-bold text-foreground mb-4"
        role="heading"
        aria-level={2}
        data-testid="current-goal-heading"
      >
        Current Goal
      </h2>
      <p
        className="text-center text-sm font-medium text-foreground"
        data-testid="current-goal"
      >
        {currentGoal.goalWeightKg.toFixed(2)} kg (Set on{" "}
        {new Date(currentGoal.goalSetAt).toLocaleDateString("en-GB")})
        {isGoalAchieved && (
          <span className="text-success"> - Goal achieved!</span>
        )}
      </p>
    </div>
  );
}

export default CurrentGoal;
