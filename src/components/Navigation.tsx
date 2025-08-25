// src/components/Navigation.tsx
import { Link } from '@tanstack/react-router';
import { HomeIcon, ScaleIcon, LineChartIcon, TargetIcon } from 'lucide-react';

function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background shadow-md z-10">
      <div className="flex flex-row items-center justify-between p-2 sm:p-4">
        <div className="flex flex-row w-full items-center">
          <Link
            to="/"
            className="flex-1 flex flex-col items-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition relative"
            activeProps={{
              className:
                'font-semibold before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-primary',
            }}
            aria-label="Navigate to Home"
          >
            <HomeIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
            Home
          </Link>
          <Link
            to="/weight"
            className="flex-1 flex flex-col items-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition relative"
            activeProps={{
              className:
                'font-semibold before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-primary',
            }}
            aria-label="Navigate to Weight"
          >
            <ScaleIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
            Weight
          </Link>
          <Link
            to="/weight-chart"
            className="flex-1 flex flex-col items-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition relative"
            activeProps={{
              className:
                'font-semibold before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-primary',
            }}
            aria-label="Navigate to Chart"
          >
            <LineChartIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
            Chart
          </Link>
          <Link
            to="/weight-goal"
            className="flex-1 flex flex-col items-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition relative"
            activeProps={{
              className:
                'font-semibold before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-primary',
            }}
            aria-label="Navigate to Goals"
          >
            <TargetIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
            Goals
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;