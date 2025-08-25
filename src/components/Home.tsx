// src/components/Home.tsx
import { Link, useRouter } from "@tanstack/react-router";
import { useAuthStore } from "../store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScaleIcon, TargetIcon, TrendingUpIcon, ClockIcon } from "lucide-react";
import { trpc } from "../trpc";
import { useState } from "react";
import { DashboardCard } from "./DashboardCard";

function Home() {
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();

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

  // Form state for login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = trpc.login.useMutation({
    onSuccess: () => {
      router.invalidate();
    },
  });

  // Latest weight and goal weight
  const latestWeight = weightsData?.[0]?.weightKg ?? null;
  const goalWeight = goalData?.goalWeightKg ?? null;
  const weightChange =
    latestWeight && goalWeight ? latestWeight - goalWeight : null;

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">
            Welcome to Weight Tracker
          </h1>
          <p className="text-center text-muted-foreground">
            Please log in to continue.
          </p>
          <form
            data-testid="login-form"
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              data-testid="login-button"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            {loginMutation.isError && (
              <p
                className="text-red-500 text-center"
                data-testid="login-message"
              >
                Login failed: {loginMutation.error.message}
              </p>
            )}
            {loginMutation.isSuccess && (
              <p
                className="text-green-500 text-center"
                data-testid="login-message"
              >
                Login successful!
              </p>
            )}
            <div className="text-center">
              <Link
                to="/register"
                data-testid="signup-link"
                className="text-sm text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] p-4 sm:p-6 pb-24 sm:pb-28">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">
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
                ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg`
                : null
            }
            description={
              weightChange !== null ? "Difference from goal" : "Track progress"
            }
            buttonText="View Chart"
            buttonLink="/weight-chart"
            testId="weight-change-card"
          />
          <DashboardCard
            title="Recent Measurement"
            icon={ClockIcon}
            value={
              weightsData[0] ? `${weightsData[0].weightKg.toFixed(1)} kg` : null
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
  );
}

export default Home;
