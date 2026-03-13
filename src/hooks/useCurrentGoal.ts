import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";

export function useCurrentGoal() {
  const trpc = useTRPC();

  const queryOptions = trpc.weight.getCurrentGoal.queryOptions(undefined, {
    staleTime: 15000,
    gcTime: 300000,
  });

  return useQuery({
    ...queryOptions,
    select: (data) => data ?? null,
  });
}
