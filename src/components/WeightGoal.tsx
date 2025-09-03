// src/components/WeightGoal.tsx
import GoalForm from "./GoalForm";
import CurrentGoal from "./CurrentGoal";
import GoalList from "./GoalList";

function WeightGoal() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1
        className="text-2xl font-bold text-foreground text-center"
        role="heading"
        aria-level={1}
      >
        Your Goals
      </h1>
      <GoalForm />
      <CurrentGoal />
      <GoalList />
    </div>
  );
}

export default WeightGoal;