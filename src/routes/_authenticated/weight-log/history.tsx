import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import WeightList from "@/features/weight/WeightList";
import { BackButton } from "@steel-cut/steel-lib";

export const Route = createFileRoute("/_authenticated/weight-log/history")({
  component: WeightHistoryPage,
});

function WeightHistoryPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate({ to: "/weight-log", replace: true });
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] isolate pointer-events-auto",
        "h-dvh w-dvw max-h-none max-w-none",
        "m-0 p-0 left-0 top-0 right-0 bottom-0 translate-x-0 translate-y-0",
        "rounded-none border-0 shadow-none",
        "bg-background overscroll-none touch-none",
      )}
    >
      <div className="relative flex h-full flex-col">
        <header className="shrink-0 px-6 pt-20 pb-6 sm:px-8">
          <BackButton
            onClick={handleBack}
            ariaLabel="Return to weight entry"
            className="absolute left-4 top-6 sm:left-6 sm:top-8 z-[10000]"
          />

          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Weight History
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-10 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <WeightList />
          </div>
        </div>
      </div>
    </div>
  );
}
