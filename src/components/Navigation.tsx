// src/components/Navigation.tsx
import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';

function Navigation() {
  const { isLoggedIn } = useAuthStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background shadow-md z-10">
      <div className="flex flex-row items-center justify-between p-2 sm:p-4 max-w-screen-lg mx-auto">
        {isLoggedIn ? (
          <div className="flex flex-row w-full">
            <Link
              to="/"
              className="flex-1 text-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition"
              activeProps={{
                className: 'font-semibold border-t-2 border-primary',
              }}
            >
              Home
            </Link>
            <Link
              to="/weight"
              className="flex-1 text-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition"
              activeProps={{
                className: 'font-semibold border-t-2 border-primary',
              }}
            >
              Weight
            </Link>
            <Link
              to="/weights"
              className="flex-1 text-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition"
              activeProps={{
                className: 'font-semibold border-t-2 border-primary',
              }}
            >
              Weights
            </Link>
            <Link
              to="/weight-chart"
              className="flex-1 text-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition"
              activeProps={{
                className: 'font-semibold border-t-2 border-primary',
              }}
            >
              Weight Chart
            </Link>
          </div>
        ) : (
          <div className="flex flex-row w-full">
            <span className="flex-1 text-center py-3 text-sm sm:text-base font-medium text-muted-foreground cursor-not-allowed">
              Home
            </span>
            <span className="flex-1 text-center py-3 text-sm sm:text-base font-medium text-muted-foreground cursor-not-allowed">
              Weight
            </span>
            <span className="flex-1 text-center py-3 text-sm sm:text-base font-medium text-muted-foreground cursor-not-allowed">
              Weights
            </span>
            <span className="flex-1 text-center py-3 text-sm sm:text-base font-medium text-muted-foreground cursor-not-allowed">
              Weight Chart
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;