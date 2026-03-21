import WeightTrendCard from "@/features/weight/WeightTrendCard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/weight-chart")({
  component: WeightChartPage,
});

function WeightChartPage() {
  return (
    <div
      className="
        min-h-[calc(100vh-7rem)]
        flex flex-col
        px-4 py-6
        pb-24 sm:pb-28 lg:pb-32
        bg-background
      "
    >
      <h1 className="text-3xl font-bold tracking-tight text-center mb-8 shrink-0">
        Weight Trend
      </h1>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <WeightTrendCard />
        </div>
      </div>
    </div>
  );
}
