'use client';

import { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useWeightChart } from '../hooks/useWeightChart';
import { useTheme } from 'next-themes';

function WeightChart() {
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { weights, isLoading, isError, error, chartData, chartConfig } = useWeightChart(trendPeriod);
  const { theme } = useTheme();

  // Set bar color based on the current theme
  const [barColor, setBarColor] = useState<string>(
    theme === 'dark' ? chartConfig.weight.theme.dark : chartConfig.weight.theme.light
  );

  useEffect(() => {
    // Update bar color when theme changes
    const newColor = theme === 'dark' ? chartConfig.weight.theme.dark : chartConfig.weight.theme.light;
    setBarColor(newColor);

    // Observe theme changes
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const newColor = newTheme === 'dark' ? chartConfig.weight.theme.dark : chartConfig.weight.theme.light;
      setBarColor(newColor);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme, chartConfig]);

  const handleTrendPeriodChange = (value: string) => {
    if (value === 'daily' || value === 'weekly' || value === 'monthly') {
      setTrendPeriod(value);
    }
  };

  return (
    <div>
      <div className="w-full max-w-md lg:max-w-full mx-auto bg-background rounded-lg p-4 pb-24">
        <div className="flex items-start justify-between mb-4">
          <h1
            className="text-2xl font-bold text-left"
            role="heading"
            aria-level={1}
            data-slot="card-title"
          >
            Total Weight
          </h1>
          <Select onValueChange={handleTrendPeriodChange} value={trendPeriod}>
            <SelectTrigger
              data-testid="unit-select"
              aria-label="Select trend period"
              className="w-[100px] h-8 text-sm"
            >
              <SelectValue>
                {trendPeriod.charAt(0).toUpperCase() + trendPeriod.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-testid="select-content">
              <SelectItem data-testid="select-option-daily" value="daily">
                Daily
              </SelectItem>
              <SelectItem data-testid="select-option-weekly" value="weekly">
                Weekly
              </SelectItem>
              <SelectItem data-testid="select-option-monthly" value="monthly">
                Monthly
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <p data-testid="loading" className="text-center text-sm font-medium">
            Loading...
          </p>
        ) : isError ? (
          <p
            data-testid="error"
            className="text-center text-sm font-medium text-destructive"
            role="alert"
          >
            Error: {error?.message}
          </p>
        ) : !weights.length ? (
          <p
            data-testid="no-data"
            className="text-center text-sm font-medium text-muted-foreground"
            role="alert"
          >
            No weight measurements found
          </p>
        ) : (
          <div className="h-[400px] w-full overflow-hidden">
            <ChartContainer config={chartConfig} id="weight-chart" className="h-full w-full">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value
                      ? new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: trendPeriod === 'daily' ? 'numeric' : undefined,
                          year: trendPeriod === 'monthly' ? 'numeric' : undefined,
                        })
                      : ''
                  }
                  stroke="hsl(var(--foreground))"
                />
                <YAxis
                  dataKey="weight"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => `${value} kg`}
                  stroke="hsl(var(--foreground))"
                />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, name, props) => [
                        `${value} kg${props.payload.note ? ` (${props.payload.note})` : ''}`,
                        'Weight',
                      ]}
                    />
                  }
                />
                <Bar dataKey="weight" fill={barColor} fillOpacity={0.8} radius={4} />
              </BarChart>
            </ChartContainer>
            <ul style={{ display: 'none' }}>
              {weights.map((weight) => (
                <li key={weight.id} data-testid="weight-data-point">
                  {weight.weightKg} kg -{' '}
                  {new Date(weight.createdAt).toLocaleDateString('en-GB')}{' '}
                  {weight.note && `(${weight.note})`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeightChart;