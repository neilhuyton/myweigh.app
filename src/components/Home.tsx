// src/components/Home.tsx
import { Link, useRouter } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScaleIcon, TargetIcon, TrendingUpIcon, ClockIcon } from 'lucide-react';
import { trpc } from '../trpc';
import { useState } from 'react';

function Home() {
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();

  // tRPC queries
  const { data: weightsData, isLoading: weightsLoading, error: weightsError } = trpc.weight.getWeights.useQuery(undefined, {
    enabled: isLoggedIn,
  });
  const { data: goalData, isLoading: goalLoading, error: goalError } = trpc.weight.getGoal.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  // Form state for login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = trpc.login.useMutation({
    onSuccess: () => {
      router.invalidate();
    },
  });

  // Latest weight and goal weight
  const latestWeight = weightsData?.[0]?.weightKg ?? null;
  const goalWeight = goalData?.goalWeightKg ?? null;
  // Keep weightChange as a number (or null) for comparison
  const weightChange = latestWeight && goalWeight ? latestWeight - goalWeight : null;

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">Welcome to Weight Tracker</h1>
          <p className="text-center text-muted-foreground">Please log in to continue.</p>
          <form data-testid="login-form" onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>
            <Button type="submit" className="w-full" data-testid="login-button">
              Login
            </Button>
            <div className="text-center">
              <Link to="/register" data-testid="signup-link" className="text-sm text-primary hover:underline">
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
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Weight Tracker Dashboard</h1>
      {(weightsLoading || goalLoading) && <p>Loading dashboard...</p>}
      {(weightsError || goalError) && (
        <p className="text-red-600">Error loading data. Please try again.</p>
      )}
      {weightsData && goalData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Current Weight Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
              <ScaleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestWeight ? `${latestWeight} kg` : 'No data'}
              </div>
              <p className="text-xs text-muted-foreground">
                {latestWeight ? 'Latest recorded weight' : 'Record your weight'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.navigate({ to: '/weight' })}
              >
                Record Weight
              </Button>
            </CardContent>
          </Card>

          {/* Goal Weight Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goal Weight</CardTitle>
              <TargetIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {goalWeight ? `${goalWeight} kg` : 'Not set'}
              </div>
              <p className="text-xs text-muted-foreground">
                {goalWeight ? 'Your target weight' : 'Set a weight goal'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.navigate({ to: '/weight-goal' })}
              >
                Set Goal
              </Button>
            </CardContent>
          </Card>

          {/* Weight Change Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weight Change</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weightChange !== null
                  ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`
                  : 'No data'}
              </div>
              <p className="text-xs text-muted-foreground">
                {weightChange !== null ? 'Difference from goal' : 'Track progress'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.navigate({ to: '/weight-chart' })}
              >
                View Chart
              </Button>
            </CardContent>
          </Card>

          {/* Recent Measurement Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Measurement</CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {weightsData?.[0] ? (
                <>
                  <div className="text-2xl font-bold">{weightsData[0].weightKg} kg</div>
                  <p className="text-xs text-muted-foreground">
                    {weightsData[0].note || 'No note'} -{' '}
                    {new Date(weightsData[0].createdAt).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold">No data</div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.navigate({ to: '/weights' })}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Home;