// src/app/routes/_authenticated/weight-log/index.tsx

import { Button } from "@/app/components/ui/button";
import CurrentWeightCard from "@/features/weightLog/CurrentWeightCard";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/weight-log/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div
      className="
        min-h-[calc(100vh-7rem)] 
        flex flex-col 
        px-4 py-6 
        pb-24 sm:pb-28 lg:pb-32
      "
    >
      <h1 className="text-3xl font-bold tracking-tight text-center mb-8">
        Weight Entry
      </h1>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl space-y-10">
          <CurrentWeightCard />

          <div className="text-center">
            <Button
              asChild
              variant="outline"
              className="min-w-[180px] border-primary text-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/50"
            >
              <Link to="/weight-log/history">View Weight History</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
