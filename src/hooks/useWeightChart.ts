// src/hooks/useWeightChart.ts
import { useMemo } from 'react';
import { trpc } from '../trpc';
import type { TooltipItem } from 'chart.js';

// Define the data point structure for the chart
interface WeightDataPoint {
  x: string | null;
  y: number;
  note: string | null;
}

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

  const chartData = useMemo(() => ({
    datasets: [
      {
        label: 'Weight (kg)',
        data: weights.map((weight) => ({
          x: isNaN(new Date(weight.createdAt).getTime()) ? null : weight.createdAt,
          y: weight.weightKg,
          note: weight.note,
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  }), [weights]);

  const chartOptions = useMemo(() => {
    const timeUnitMap: Record<'daily' | 'weekly' | 'monthly', 'day' | 'week' | 'month'> = {
      daily: 'day',
      weekly: 'week',
      monthly: 'month',
    };

    return {
      responsive: true,
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: timeUnitMap[trendPeriod],
          },
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Weight (kg)',
          },
          beginAtZero: false,
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'line'> & { raw: WeightDataPoint }) => {
              const weight = context.raw.y;
              const note = context.raw.note ? ` (${context.raw.note})` : '';
              return `${weight} kg${note}`;
            },
          },
        },
      },
    };
  }, [trendPeriod]);

  return { weights, isLoading, isError, error, chartData, chartOptions };
};