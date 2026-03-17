import { LineChartIcon, ScaleIcon, TargetIcon } from "lucide-react";
import type { ReactNode } from "react";

export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME,
  defaultAuthenticatedPath: "/weight-log" as const,
  navItems: [
    {
      href: "/weight-log",
      label: "Weight",
      icon: (
        <ScaleIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
      ) satisfies ReactNode,
    },
    {
      href: "/weight-chart",
      label: "Chart",
      icon: (
        <LineChartIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
      ) satisfies ReactNode,
    },
    {
      href: "/weight-goal",
      label: "Goal",
      icon: (
        <TargetIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
      ) satisfies ReactNode,
    },
  ] as const,
} as const;
