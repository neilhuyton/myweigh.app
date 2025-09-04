// src/pages/Weight.tsx
import WeightForm from "../components/weight/WeightForm";
import WeightList from "../components/weight/WeightList";
import WeightChangeMessage from "../components/weight/WeightChangeMessage";

function Weight() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1
        className="text-2xl font-bold text-foreground text-center"
        role="heading"
        aria-level={1}
      >
        Your Weight
      </h1>
      <WeightForm />
      <WeightChangeMessage />
      <WeightList />
    </div>
  );
}

export default Weight;