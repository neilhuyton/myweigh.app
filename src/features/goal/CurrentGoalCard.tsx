import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import EditableNumberCard from "@/components/EditableNumberCard";
import { formatDate } from "@/utils/date";

export default function CurrentGoalCard() {
  const queryClient = useQueryClient();

  const currentGoalQuery = trpc.weight.getActiveGoal;
  const latestReachedQuery = trpc.weight.getLatestReachedGoal;

  const { data: currentGoal, isLoading: isLoadingActive } = useQuery(
    currentGoalQuery.queryOptions(undefined, {
      staleTime: 15000,
      gcTime: 300000,
    }),
  );

  const { data: latestReachedGoal } = useQuery(
    latestReachedQuery.queryOptions(undefined, {
      staleTime: 15000,
      gcTime: 300000,
      enabled: !currentGoal,
    }),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentGoal) {
      setEditValue(currentGoal.goalWeightKg.toString());
    } else if (latestReachedGoal) {
      setEditValue(latestReachedGoal.goalWeightKg.toString());
    }
  }, [currentGoal, latestReachedGoal]);

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

    const currentVal =
      currentGoal?.goalWeightKg ?? latestReachedGoal?.goalWeightKg;
    if (currentVal && val === currentVal) return null;

    return val;
  };

  const createGoalMutation = useMutation(
    trpc.weight.setGoal.mutationOptions({
      onMutate: async ({ goalWeightKg }) => {
        const queryKey = currentGoalQuery.queryKey();
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, {
          id: `temp-${Date.now()}`,
          goalWeightKg,
          goalSetAt: new Date().toISOString(),
          reachedAt: null,
        });

        return { previous };
      },
      onError: (_, __, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            currentGoalQuery.queryKey(),
            context.previous,
          );
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: currentGoalQuery.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.weight.getGoals.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: latestReachedQuery.queryKey(),
        });
      },
    }),
  );

  const updateGoalMutation = useMutation(
    trpc.weight.updateGoal.mutationOptions({
      onMutate: async ({ goalWeightKg }) => {
        const queryKey = currentGoalQuery.queryKey();
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);

        if (previous) {
          queryClient.setQueryData(queryKey, { ...previous, goalWeightKg });
        }

        return { previous };
      },
      onError: (_, __, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            currentGoalQuery.queryKey(),
            context.previous,
          );
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: currentGoalQuery.queryKey(),
        });
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
    : (currentGoal?.goalWeightKg ??
      (latestReachedGoal && !currentGoal
        ? latestReachedGoal.goalWeightKg
        : null));

  const statusText = (() => {
    if (isPending) return "Saving goal...";
    if (currentGoal?.goalSetAt) return formatDate(currentGoal.goalSetAt);
    if (latestReachedGoal?.reachedAt && !currentGoal) {
      return `Reached ${formatDate(latestReachedGoal.reachedAt)}. You reached ${latestReachedGoal.goalWeightKg} kg — tap to set new goal`;
    }
    return "";
  })();

  const cardTitle = currentGoal
    ? "Current Goal"
    : latestReachedGoal && !currentGoal
      ? "Goal Reached!"
      : "Current Goal";

  const saveEdit = () => {
    const newWeight = getValidatedWeight();
    if (newWeight === null) {
      setIsEditing(false);
      setEditValue(
        currentGoal?.goalWeightKg?.toString() ??
          (latestReachedGoal && !currentGoal
            ? latestReachedGoal.goalWeightKg?.toString()
            : "") ??
          "",
      );
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
      setEditValue(
        currentGoal?.goalWeightKg?.toString() ??
          (latestReachedGoal && !currentGoal
            ? latestReachedGoal.goalWeightKg?.toString()
            : "") ??
          "",
      );
    }
  };

  const startEditing = () => setIsEditing(true);
  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue(
      currentGoal?.goalWeightKg?.toString() ??
        (latestReachedGoal && !currentGoal
          ? latestReachedGoal.goalWeightKg?.toString()
          : "") ??
        "",
    );
  };

  if (isLoadingActive && !currentGoal && !latestReachedGoal) {
    return (
      <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-6 min-h-[220px] animate-pulse bg-muted" />
    );
  }

  return (
    <EditableNumberCard
      title={cardTitle}
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
