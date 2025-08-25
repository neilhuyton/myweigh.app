// src/hooks/useWeightChart.ts
import { useMemo } from 'react';
import { trpc } from '../trpc';
import { startOfWeek, startOfMonth, format } from 'date-fns';

export const useWeightChart = (trendPeriod: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  const { data, isLoading, isError, error } = trpc.weight.getWeights.useQuery();

  const weights = useMemo(() => {
    if (!data) return [];
    return data.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  }, [data]);

  const chartData = useMemo(() => {
    if (!weights.length) return [];
    if (trendPeriod === 'daily') {
      return weights.map((weight) => ({
        date: isNaN(new Date(weight.createdAt).getTime()) ? null : weight.createdAt,
        weight: weight.weightKg,
        note: weight.note,
      }));
    }

    const groupedData = weights.reduce((acc, weight) => {
      const date = new Date(weight.createdAt);
      if (isNaN(date.getTime())) return acc;
      let key: string;
      if (trendPeriod === 'weekly') {
        key = format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      } else {
        key = format(startOfMonth(date), 'yyyy-MM');
      }
      if (!acc[key]) acc[key] = { weights: [], note: weight.note };
      acc[key].weights.push(weight.weightKg);
      return acc;
    }, {} as Record<string, { weights: number[]; note: string | null }>);

    return Object.entries(groupedData).map(([date, { weights, note }]) => ({
      date,
      weight: weights.reduce((sum, w) => sum + w, 0) / weights.length,
      note,
    }));
  }, [weights, trendPeriod]);

  const chartConfig = useMemo(
    () => ({
      weight: {
        label: 'Weight (kg)',
        theme: {
          light: 'hsl(0.6 0.118 184.704)', // Matches :root { --chart-2 }
          dark: 'hsl(0.696 0.17 162.48)', // Matches .dark { --chart-2 }
        },
      },
    }),
    []
  );

  return { weights, isLoading, isError, error, chartData, chartConfig };
};