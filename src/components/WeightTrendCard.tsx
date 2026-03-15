import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTRPCClient } from "@/trpc";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function WeightTrendCard() {
  const { data: weightsData, isError } = useQuery({
    queryKey: ["weight.getWeights"],
    queryFn: () => getTRPCClient().weight.getWeights.query(),
    staleTime: 1000 * 60 * 5,
  });

  const weights = useMemo(() => {
    if (!weightsData) return [];
    return [...weightsData].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [weightsData]);

  const chartData = useMemo(() => {
    if (!weights.length) return [];
    return weights
      .map((w) => ({
        date: w.createdAt,
        weight: Number(w.weightKg),
      }))
      .filter((d) => !isNaN(d.weight));
  }, [weights]);

  const yTicks = useMemo(() => {
    if (!chartData.length) return [50, 60];
    const values = chartData.map((d) => d.weight);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) return [min - 0.5, min, min + 0.5];

    const step = Math.max(0.2, Math.ceil((range / 5) * 10) / 10);
    const start = Math.floor((min * 10) / (step * 10)) * step;

    const ticks: number[] = [];
    let v = start;
    while (v <= max + step / 2) {
      ticks.push(Number(v.toFixed(1)));
      v += step;
    }

    if (ticks[0] > min + 0.05) ticks.unshift(Number(min.toFixed(1)));
    if (ticks[ticks.length - 1] < max - 0.05)
      ticks.push(Number(max.toFixed(1)));

    return [...new Set(ticks)].sort((a, b) => a - b);
  }, [chartData]);

  const trend =
    chartData.length >= 2
      ? chartData[chartData.length - 1].weight - chartData[0].weight
      : 0;

  const trendLabel =
    trend > 0
      ? `Up ${Math.abs(trend).toFixed(1)} kg`
      : trend < 0
        ? `Down ${Math.abs(trend).toFixed(1)} kg`
        : "Stable";

  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;

  const chartConfig = {
    weight: {
      label: "Weight (kg)",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  if (isError) {
    return (
      <div className="text-center text-destructive py-8">
        Failed to load weight data
      </div>
    );
  }

  if (!weightsData || weights.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 italic">
        No measurements recorded yet
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "rounded-xl border bg-card/60 backdrop-blur-sm p-5",
        "transition-all hover:border-primary/40 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <CardContent className="p-0 pb-1">
        <ChartContainer
          config={chartConfig}
          className="h-[160px] sm:h-[200px] w-full"
        >
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={2}
              tick={{ fontSize: 9 }}
              tickFormatter={(v: string) => format(new Date(v), "d MMM")}
            />

            <YAxis
              ticks={yTicks}
              domain={
                yTicks.length > 1
                  ? [Math.min(...yTicks), Math.max(...yTicks)]
                  : ["dataMin", "dataMax"]
              }
              allowDecimals
              tickLine={false}
              axisLine={false}
              tickMargin={2}
              width={40}
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => Number(v).toFixed(1)}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(v) => format(new Date(v), "PPP")}
                  formatter={(v) => [`${Number(v).toFixed(1)} kg`, "Weight"]}
                />
              }
            />

            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="px-1 py-3 border-t flex items-center justify-between text-sm">
        <div className="font-medium flex items-center gap-1.5">
          {trendLabel}
          <TrendIcon className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground text-xs">Daily view</div>
      </CardFooter>
    </Card>
  );
}
