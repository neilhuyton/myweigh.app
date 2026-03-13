import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { getCachedLatestWeight, saveLatestWeight } from "@/utils/weightCache";

interface LatestWeightDisplay {
  weightKg: number;
  createdAt: string;
  source: "cache" | "server";
}

export function useLatestWeight() {
  const cached = getCachedLatestWeight();

  const initialDisplay: LatestWeightDisplay | null = cached
    ? {
        weightKg: cached.weightKg,
        createdAt: cached.createdAt,
        source: "cache" as const,
      }
    : null;

  const { data: weights = [] } = useQuery(
    trpc.weight.getWeights.queryOptions(undefined, {
      staleTime: 1000 * 15,
      gcTime: 1000 * 60 * 5,
    }),
  );

  const [display, setDisplay] = useState<LatestWeightDisplay | null>(
    initialDisplay,
  );

  useEffect(() => {
    if (weights.length === 0) {
      return;
    }

    const sorted = [...weights].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const latest = sorted[0];

    const serverDisplay: LatestWeightDisplay = {
      weightKg: latest.weightKg,
      createdAt: latest.createdAt,
      source: "server" as const,
    };

    if (
      display?.weightKg !== serverDisplay.weightKg ||
      display?.createdAt !== serverDisplay.createdAt ||
      display?.source !== "server"
    ) {
      setDisplay(serverDisplay);
      saveLatestWeight({
        weightKg: latest.weightKg,
        createdAt: latest.createdAt,
      });
    }
  }, [weights, display]);

  const isFromCache = display?.source === "cache";
  const isServerLoaded = display?.source === "server";

  return {
    latestWeight: display,
    isFromCache,
    isServerLoaded,
  };
}
