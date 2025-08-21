// src/components/WeightChart.tsx
import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@radix-ui/react-select';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useWeightChart } from '../hooks/useWeightChart';

// Register Chart.js components
ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function WeightChart() {
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { weights, isLoading, isError, error, chartData, chartOptions } = useWeightChart(trendPeriod);

  const handleTrendPeriodChange = (value: string) => {
    if (value === 'daily' || value === 'weekly' || value === 'monthly') {
      setTrendPeriod(value);
    }
  };

  if (isLoading) {
    return (
      <div data-slot="card" className="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 w-full max-w-4xl bg-white shadow-lg mx-auto">
        <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
          <h1 data-slot="card-title" className="text-2xl font-bold text-center text-gray-900">
            Weight Chart
          </h1>
        </div>
        <div data-slot="card-content" className="px-6 space-y-6">
          <p data-testid="loading">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div data-slot="card" className="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 w-full max-w-4xl bg-white shadow-lg mx-auto">
        <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
          <h1 data-slot="card-title" className="text-2xl font-bold text-center text-gray-900">
            Weight Chart
          </h1>
        </div>
        <div data-slot="card-content" className="px-6 space-y-6">
          <p data-testid="error">Error: {error?.message}</p>
        </div>
      </div>
    );
  }

  if (!weights.length) {
    return (
      <div data-slot="card" className="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 w-full max-w-4xl bg-white shadow-lg mx-auto">
        <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
          <h1 data-slot="card-title" className="text-2xl font-bold text-center text-gray-900">
            Weight Chart
          </h1>
          <div className="flex justify-end">
            <Select onValueChange={handleTrendPeriodChange} value={trendPeriod}>
              <SelectTrigger data-testid="unit-select" aria-label="Select trend period" className="w-[100px]">
                <SelectValue>{trendPeriod.charAt(0).toUpperCase() + trendPeriod.slice(1)}</SelectValue>
              </SelectTrigger>
              <SelectContent data-testid="select-content">
                <SelectItem data-testid="select-option-daily" value="daily">Daily</SelectItem>
                <SelectItem data-testid="select-option-weekly" value="weekly">Weekly</SelectItem>
                <SelectItem data-testid="select-option-monthly" value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div data-slot="card-content" className="px-6 space-y-6">
          <p data-testid="no-data">No weight measurements found</p>
        </div>
      </div>
    );
  }

  return (
    <div data-slot="card" className="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 w-full max-w-4xl bg-white shadow-lg mx-auto">
      <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
        <h1 data-slot="card-title" className="text-2xl font-bold text-center text-gray-900">
          Weight Chart
        </h1>
        <div className="flex justify-end">
          <Select onValueChange={handleTrendPeriodChange} value={trendPeriod}>
            <SelectTrigger data-testid="unit-select" aria-label="Select trend period" className="w-[100px]">
              <SelectValue>{trendPeriod.charAt(0).toUpperCase() + trendPeriod.slice(1)}</SelectValue>
            </SelectTrigger>
            <SelectContent data-testid="select-content">
              <SelectItem data-testid="select-option-daily" value="daily">Daily</SelectItem>
              <SelectItem data-testid="select-option-weekly" value="weekly">Weekly</SelectItem>
              <SelectItem data-testid="select-option-monthly" value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div data-slot="card-content" className="px-6 space-y-6">
        <div>
          <Line data={chartData} options={chartOptions} data-testid="chart-mock" />
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
      </div>
    </div>
  );
}

export default WeightChart;