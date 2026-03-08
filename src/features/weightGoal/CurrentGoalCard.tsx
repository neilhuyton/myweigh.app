// src/components/CurrentGoalCard.tsx

import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";
import EditableNumberCard from "@/app/components/EditableNumberCard";
import {
  getCachedCurrentGoal,
  saveCurrentGoal,
  clearCurrentGoalCache,
} from "@/utils/goalCache";

export default function CurrentGoalCard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const currentGoalQueryKey = trpc.weight.getCurrentGoal.queryKey();

  const cachedGoal = getCachedCurrentGoal();

  const { data: currentGoal, isLoading } = useQuery(
    trpc.weight.getCurrentGoal.queryOptions(undefined, {
      staleTime: 15_000,
      gcTime: 300_000,
      initialData: cachedGoal ?? undefined,
      initialDataUpdatedAt: cachedGoal ? Date.now() : undefined,
    }),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentGoal) {
      setEditValue(currentGoal.goalWeightKg.toString());
      saveCurrentGoal(currentGoal);
    } else if (!isLoading) {
      clearCurrentGoalCache();
    }
  }, [currentGoal, isLoading]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const getValidatedWeight = (): number | null => {
    const trimmed = editValue.trim();
    if (!trimmed) return null;
    const val = parseFloat(trimmed);
    if (isNaN(val) || val <= 0) return null;
    if (currentGoal && val === currentGoal.goalWeightKg) return null;
    return val;
  };

  const createGoalMutation = useMutation(
    trpc.weight.setGoal.mutationOptions({
      onMutate: async ({ goalWeightKg }) => {
        await queryClient.cancelQueries({ queryKey: currentGoalQueryKey });
        const previous = queryClient.getQueryData(currentGoalQueryKey);

        queryClient.setQueryData(currentGoalQueryKey, {
          id: `temp-${Date.now()}`,
          goalWeightKg,
          goalSetAt: new Date().toISOString(),
          reachedAt: null,
        });

        return { previous };
      },
      onSuccess: (newGoal) => {
        saveCurrentGoal(newGoal);
      },
      onError: (_, __, context) => {
        if (context?.previous) {
          queryClient.setQueryData(currentGoalQueryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: currentGoalQueryKey });
        queryClient.invalidateQueries({
          queryKey: trpc.weight.getGoals.queryKey(),
        });
      },
    }),
  );

  const updateGoalMutation = useMutation(
    trpc.weight.updateGoal.mutationOptions({
      onMutate: async ({ goalWeightKg }) => {
        await queryClient.cancelQueries({ queryKey: currentGoalQueryKey });
        const previous = queryClient.getQueryData(currentGoalQueryKey);

        if (previous) {
          queryClient.setQueryData(currentGoalQueryKey, {
            ...previous,
            goalWeightKg,
          });
        }

        return { previous };
      },
      onSuccess: (updatedGoal) => {
        saveCurrentGoal(updatedGoal);
      },
      onError: (_, __, context) => {
        if (context?.previous) {
          queryClient.setQueryData(currentGoalQueryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: currentGoalQueryKey });
        queryClient.invalidateQueries({
          queryKey: trpc.weight.getGoals.queryKey(),
        });
      },
    }),
  );

  const isPending =
    createGoalMutation.isPending || updateGoalMutation.isPending;

  const displayedWeight = isPending
    ? ((Number(editValue) || currentGoal?.goalWeightKg) ?? null)
    : (currentGoal?.goalWeightKg ?? null);

  const statusText = isPending ? "Saving goal..." : "";

  const saveEdit = () => {
    const newWeight = getValidatedWeight();
    if (newWeight === null) {
      setIsEditing(false);
      setEditValue(currentGoal?.goalWeightKg?.toString() ?? "");
      return;
    }

    setIsEditing(false);

    if (currentGoal?.id && !currentGoal.reachedAt) {
      updateGoalMutation.mutate({
        goalId: currentGoal.id,
        goalWeightKg: newWeight,
      });
    } else {
      createGoalMutation.mutate({
        goalWeightKg: newWeight,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(currentGoal?.goalWeightKg?.toString() ?? "");
    }
  };

  const startEditing = () => setIsEditing(true);
  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue(currentGoal?.goalWeightKg?.toString() ?? "");
  };

  // Optional: show loading skeleton instead of "no goal" during first load
  if (isLoading && !currentGoal) {
    return <div className="h-40 animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <EditableNumberCard
      title="Current Goal"
      ariaLabel="Edit your weight goal"
      value={displayedWeight}
      unit="kg"
      statusText={statusText}
      isEditing={isEditing}
      isPending={isPending}
      editValue={editValue}
      onStartEditing={startEditing}
      onCancel={cancelEdit}
      onSave={saveEdit}
      onChange={setEditValue}
      onKeyDown={handleKeyDown}
      inputRef={inputRef}
      noValueMessage="No goal set yet"
      noValueSubMessage="Tap here to set your target weight"
      dataTestId="current-goal-weight"
    />
  );
}
