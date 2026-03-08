// src/hooks/useLatestWeight.ts

import { useState, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { getCachedLatestWeight, saveLatestWeight } from "@/utils/weightCache";

interface LatestWeightDisplay {
  weightKg: number;
  createdAt: string;
  source: "cache" | "server";
}

export function useLatestWeight() {
  const { data: weights = [] } = useSuspenseQuery(
    trpc.weight.getWeights.queryOptions(undefined, {
      staleTime: 1000 * 15,
      gcTime: 1000 * 60 * 5,
    }),
  );

  const [display, setDisplay] = useState<LatestWeightDisplay | null>(null);

  useEffect(() => {
    const cached = getCachedLatestWeight();
    if (cached) {
      setDisplay({
        weightKg: cached.weightKg,
        createdAt: cached.createdAt,
        source: "cache",
      });
    }
  }, []);

  useEffect(() => {
    if (weights.length === 0) {
      setDisplay(null);
      return;
    }

    const sorted = [...weights].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const latest = sorted[0];

    setDisplay({
      weightKg: latest.weightKg,
      createdAt: latest.createdAt,
      source: "server",
    });

    saveLatestWeight({
      weightKg: latest.weightKg,
      createdAt: latest.createdAt,
    });
  }, [weights]);

  const isFromCache = display?.source === "cache";

  const isServerLoaded = display?.source === "server";

  return {
    latestWeight: display,
    isFromCache,
    isServerLoaded,
  };
}