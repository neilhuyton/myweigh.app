// src/components/Navigation.tsx
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../store/authStore";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { Menu } from "lucide-react";

function Navigation() {
  const { isLoggedIn, logout } = useAuthStore();

  return (
    <nav className="flex items-center justify-between p-4 shadow-md">
      {/* Logo/Title */}
      <Link
        to="/"
        className="text-xl font-bold hover:underline transition"
        activeProps={{
          className: "font-semibold border-b-2",
        }}
      >
        Weight Tracker
      </Link>

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center space-x-4">
        {isLoggedIn ? (
          <>
            <Link
              to="/weight"
              className="hover:underline transition"
              activeProps={{
                className: "font-semibold border-b-2",
              }}
            >
              Weight
            </Link>
            <Link
              to="/weights"
              className="hover:underline transition"
              activeProps={{
                className: "font-semibold border-b-2",
              }}
            >
              Weights
            </Link>
            <Link
              to="/weight-chart"
              className="hover:underline transition"
              activeProps={{
                className: "font-semibold border-b-2",
              }}
            >
              Weight Chart
            </Link>
            <Link
              to="/weight-goal"
              className="hover:underline transition"
              activeProps={{
                className: "font-semibold border-b-2",
              }}
            >
              Weight Goal
            </Link>
            <Button
              data-testid="logout-button"
              variant="outline"
              onClick={logout}
              className="hover:underline"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <span className="cursor-not-allowed">Weight</span>
            <span className="cursor-not-allowed">Weights</span>
            <span className="cursor-not-allowed">Weight Chart</span>
            <span className="cursor-not-allowed">Weight Goal</span>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[240px] sm:w-[300px]">
          <div className="flex flex-col gap-4 mt-4">
            {isLoggedIn ? (
              <>
                <SheetClose asChild>
                  <Link
                    to="/weight"
                    className="hover:underline transition"
                    activeProps={{
                      className: "font-semibold",
                    }}
                  >
                    Weight
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/weights"
                    className="hover:underline transition"
                    activeProps={{
                      className: "font-semibold",
                    }}
                  >
                    Weights
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/weight-chart"
                    className="hover:underline transition"
                    activeProps={{
                      className: "font-semibold",
                    }}
                  >
                    Weight Chart
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/weight-goal"
                    className="hover:underline transition"
                    activeProps={{
                      className: "font-semibold",
                    }}
                  >
                    Weight Goal
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <button
                    data-testid="logout-button"
                    // variant="outline"
                    onClick={logout}
                    className="w-full hover:underline"
                  >
                    Logout
                  </button>
                </SheetClose>
              </>
            ) : (
              <>
                <span className="cursor-not-allowed">Weight</span>
                <span className="cursor-not-allowed">Weights</span>
                <span className="cursor-not-allowed">Weight Chart</span>
                <span className="cursor-not-allowed">Weight Goal</span>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

export default Navigation;
