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

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-1 sm:p-2 lg:p-3 pb-24 sm:pb-28">
      {/* Content centered in the middle */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-md bg-background rounded-lg p-4 flex flex-col items-center">
          <h1
            className="text-2xl font-bold text-center mb-4"
            role="heading"
            aria-level={1}
            data-slot="card-title"
          >
            Weight Chart
          </h1>
          <div className="space-y-6 w-full">
            <div className="flex justify-end">
              <Select onValueChange={handleTrendPeriodChange} value={trendPeriod}>
                <SelectTrigger
                  data-testid="unit-select"
                  aria-label="Select trend period"
                  className="w-[100px]"
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
                className="text-center text-sm font-medium text-red-500"
                role="alert"
              >
                Error: {error?.message}
              </p>
            ) : !weights.length ? (
              <p
                data-testid="no-data"
                className="text-center text-sm font-medium"
                role="alert"
              >
                No weight measurements found
              </p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeightChart;