// src/components/Navigation.tsx
import { Link } from "@tanstack/react-router";
import {
  HomeIcon,
  ScaleIcon,
  LineChartIcon,
  TargetIcon,
  type LucideIcon,
} from "lucide-react";

interface NavItemProps {
  to: string;
  label: string;
  Icon: LucideIcon;
}

function NavItem({ to, label, Icon }: NavItemProps) {
  return (
    <Link
      to={to}
      className="flex-1 flex flex-col items-center py-3 text-sm sm:text-base font-medium hover:bg-muted transition relative"
      activeProps={{
        className:
          "font-semibold bg-muted before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-primary",
      }}
      aria-label={`Navigate to ${label}`}
    >
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
      {label}
    </Link>
  );
}

function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background shadow-md z-10">
      <div className="flex flex-row items-center justify-between p-2 sm:p-4">
        <div className="flex flex-row w-full items-center">
          <NavItem to="/" label="Home" Icon={HomeIcon} />
          <NavItem to="/weight" label="Weight" Icon={ScaleIcon} />
          <NavItem to="/weight-chart" label="Chart" Icon={LineChartIcon} />
          <NavItem to="/weight-goal" label="Goals" Icon={TargetIcon} />
        </div>
      </div>
    </nav>
  );
}

export default Navigation;