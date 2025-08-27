// src/components/Weight.tsx
import WeightForm from "./WeightForm";
import WeightList from "./WeightList";

function Weight() {
  return (
    <div>
      <div className="w-full max-w-md lg:max-w-full mx-auto bg-background rounded-lg p-4 pb-24">
        <h1
          className="text-2xl font-bold text-left mb-4"
          role="heading"
          aria-level={1}
        >
          Weight
        </h1>
        <div className="space-y-8">
          <div className="max-w-sm mx-auto">
            <WeightForm />
          </div>
          <div className="mt-4">
            <WeightList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Weight;
