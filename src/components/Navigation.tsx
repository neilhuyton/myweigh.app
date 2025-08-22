// src/components/Navigation.tsx
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../store/authStore";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

function Navigation() {
  const { isLoggedIn, logout } = useAuthStore();

  return (
    <nav className="flex items-center justify-between bg-primary dark:bg-gray-900 p-4 shadow-md">
      {/* Logo/Title */}
      <Link
        to="/"
        className="text-primary-foreground dark:text-white text-xl font-bold hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
        activeProps={{
          className: "text-muted-foreground dark:text-gray-300 border-b-2 border-muted-foreground dark:border-gray-300",
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
              className="text-primary-foreground dark:text-white hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
              activeProps={{
                className: "text-muted-foreground dark:text-gray-300 border-b-2 border-muted-foreground dark:border-gray-300",
              }}
            >
              Weight
            </Link>
            <Link
              to="/weights"
              className="text-primary-foreground dark:text-white hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
              activeProps={{
                className: "text-muted-foreground dark:text-gray-300 border-b-2 border-muted-foreground dark:border-gray-300",
              }}
            >
              Weights
            </Link>
            <Link
              to="/weight-chart"
              className="text-primary-foreground dark:text-white hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
              activeProps={{
                className: "text-muted-foreground dark:text-gray-300 border-b-2 border-muted-foreground dark:border-gray-300",
              }}
            >
              Weight Chart
            </Link>
            <Link
              to="/weight-goal"
              className="text-primary-foreground dark:text-white hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
              activeProps={{
                className: "text-muted-foreground dark:text-gray-300 border-b-2 border-muted-foreground dark:border-gray-300",
              }}
            >
              Weight Goal
            </Link>
            <Button
              variant="outline"
              onClick={logout}
              className="text-primary-foreground dark:text-white border-primary-foreground dark:border-gray-300 hover:bg-primary-foreground dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <span className="text-muted-foreground dark:text-gray-400 cursor-not-allowed">Weight</span>
            <span className="text-muted-foreground dark:text-gray-400 cursor-not-allowed">Weights</span>
            <span className="text-muted-foreground dark:text-gray-400 cursor-not-allowed">Weight Chart</span>
            <span className="text-muted-foreground dark:text-gray-400 cursor-not-allowed">Weight Goal</span>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden text-primary-foreground dark:text-white"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[240px] sm:w-[300px] bg-background dark:bg-gray-800">
          <div className="flex flex-col gap-4 mt-4">
            {isLoggedIn ? (
              <>
                <SheetClose asChild>
                  <Link
                    to="/weight"
                    className="text-foreground dark:text-white hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
                    activeProps={{
                      className: "text-muted-foreground dark:text-gray-300 font-semibold",
                    }}
                  >
                    Weight
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/weights"
                    className="text-foreground dark:text-white hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
                    activeProps={{
                      className: "text-muted-foreground dark:text-gray-300 font-semibold",
                    }}
                  >
                    Weights
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/weight-chart"
                    className="text-foreground dark:text-white hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
                    activeProps={{
                      className: "text-muted-foreground dark:text-gray-300 font-semibold",
                    }}
                  >
                    Weight Chart
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/weight-goal"
                    className="text-foreground dark:text-white hover:text-muted-foreground dark:hover:text-gray-300 transition-colors"
                    activeProps={{
                      className: "text-muted-foreground dark:text-gray-300 font-semibold",
                    }}
                  >
                    Weight Goal
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="w-full text-foreground dark:text-white border-foreground dark:border-gray-300 hover:bg-foreground dark:hover:bg-gray-700 hover:text-background dark:hover:text-white"
                  >
                    Logout
                  </Button>
                </SheetClose>
              </>
            ) : (
              <>
                <span className="text-muted-foreground dark:text-gray-400 cursor-not-allowed">Weight</span>
                <span className="text-muted-foreground dark:text-gray-400 cursor-not-allowed">Weights</span>
                <span className="text-muted-foreground dark:text-gray-400 cursor-not-allowed">Weight Chart</span>
                <span className="text-muted-foreground dark:text-gray-400 cursor-not-allowed">Weight Goal</span>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

export default Navigation;