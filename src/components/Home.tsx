import { useAuthStore } from "../store/authStore";
import { ScaleIcon, TargetIcon, TrendingUpIcon, ClockIcon } from "lucide-react";
import { trpc } from "../trpc";
import { DashboardCard } from "./DashboardCard";

function Home() {
  const { isLoggedIn } = useAuthStore();

  // tRPC queries
  const {
    data: weightsData = [],
    isLoading: weightsLoading,
    error: weightsError,
  } = trpc.weight.getWeights.useQuery(undefined, {
    enabled: isLoggedIn,
  });
  const {
    data: goalData = null,
    isLoading: goalLoading,
    error: goalError,
  } = trpc.weight.getGoal.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  // Latest weight and goal weight
  const latestWeight = weightsData?.[0]?.weightKg ?? null;
  const goalWeight = goalData?.goalWeightKg ?? null;
  const weightChange =
    latestWeight && goalWeight ? latestWeight - goalWeight : null;

  return (
    <div>
      <div className="w-full max-w-md lg:max-w-full mx-auto bg-background rounded-lg p-4 pb-24">
        <h1
          className="text-2xl font-bold text-left mb-4"
          role="heading"
          aria-level={1}
        >
          Weight Tracker Dashboard
        </h1>
        {(weightsLoading || goalLoading) && (
          <p data-testid="loading">Loading dashboard...</p>
        )}
        {(weightsError || goalError) && (
          <p className="text-red-600" data-testid="error">
            Error loading data. Please try again.
          </p>
        )}
        {!weightsLoading && !goalLoading && !weightsError && !goalError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Current Weight"
              icon={ScaleIcon}
              value={latestWeight ? `${latestWeight.toFixed(1)} kg` : null}
              description={
                latestWeight ? "Latest recorded weight" : "Record your weight"
              }
              buttonText="Record Weight"
              buttonLink="/weight"
              testId="current-weight-card"
            />
            <DashboardCard
              title="Goal Weight"
              icon={TargetIcon}
              value={goalWeight ? `${goalWeight.toFixed(1)} kg` : null}
              description={
                goalWeight ? "Your target weight" : "Set a weight goal"
              }
              buttonText="Set Goal"
              buttonLink="/weight-goal"
              testId="goal-weight-card"
            />
            <DashboardCard
              title="Weight Change"
              icon={TrendingUpIcon}
              value={
                weightChange !== null
                  ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(
                      1
                    )} kg`
                  : null
              }
              description={
                weightChange !== null
                  ? "Difference from goal"
                  : "Track progress"
              }
              buttonText="View Chart"
              buttonLink="/weight-chart"
              testId="weight-change-card"
            />
            <DashboardCard
              title="Recent Measurement"
              icon={ClockIcon}
              value={
                weightsData[0]
                  ? `${weightsData[0].weightKg.toFixed(1)} kg`
                  : null
              }
              description={
                weightsData[0]
                  ? `${weightsData[0].note || "No note"} - ${new Date(
                      weightsData[0].createdAt
                    ).toLocaleDateString("en-US")}`
                  : "No measurements"
              }
              buttonText="View All"
              buttonLink="/weights"
              testId="recent-measurement-card"
            />
            
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;