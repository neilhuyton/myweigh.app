// src/components/CurrentWeightCard.tsx

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { formatDate } from "@/utils/date";
import { saveLatestWeight } from "@/utils/weightCache";
import { useLatestWeight } from "@/hooks/useLatestWeight";
import EditableNumberCard from "./EditableNumberCard";

function useLatestWeightEditor() {
  const { latestWeight, isFromCache, isServerLoaded } = useLatestWeight();

  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(
    latestWeight?.weightKg?.toString() ?? "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (latestWeight) {
      setEditValue(latestWeight.weightKg.toString());
    } else {
      setEditValue("");
    }
  }, [latestWeight]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => setIsEditing(true);

  const cancelEdit = () => {
    setEditValue(latestWeight?.weightKg?.toString() ?? "");
    setIsEditing(false);
  };

  const getValidatedWeight = (): number | null => {
    const trimmed = editValue.trim();
    if (!trimmed) return null;

    const val = parseFloat(trimmed);
    if (isNaN(val) || val <= 0) return null;
    if (latestWeight && val === latestWeight.weightKg) return null;

    return val;
  };

  const weightsQueryKey = trpc.weight.getWeights.queryKey();

  const mutation = useMutation(
    trpc.weight.create.mutationOptions({
      onMutate: async ({ weightKg, note }) => {
        await queryClient.cancelQueries({ queryKey: weightsQueryKey });

        const previousWeights = queryClient.getQueryData(weightsQueryKey) ?? [];

        const tempEntry = {
          id: `temp-${Date.now()}`,
          weightKg,
          createdAt: new Date().toISOString(),
          note: note || null,
        };

        const newWeights = [tempEntry, ...previousWeights];

        queryClient.setQueryData(weightsQueryKey, newWeights);

        return { previousWeights };
      },

      onSuccess: (_, { weightKg }) => {
        saveLatestWeight({
          weightKg,
          createdAt: new Date().toISOString(),
        });

        queryClient.invalidateQueries({ queryKey: weightsQueryKey });
        queryClient.invalidateQueries({
          queryKey: trpc.weight.getCurrentGoal.queryKey(),
        });
      },

      onError: (_, __, context) => {
        if (context?.previousWeights) {
          queryClient.setQueryData(weightsQueryKey, context.previousWeights);
        }
      },
    }),
  );

  const isPending = mutation.isPending;

  const displayedWeight = isPending
    ? parseFloat(editValue) || latestWeight?.weightKg
    : (latestWeight?.weightKg ?? null);

  const statusText = (() => {
    if (isPending) return "Saving new weight...";

    if (!latestWeight) return "";

    const parts = [formatDate(latestWeight.createdAt)];
    if (isFromCache) parts.push(" • cached");
    if (isServerLoaded) parts.push(" • synced");
    return parts.join("");
  })();

  const saveEdit = () => {
    const newWeight = getValidatedWeight();
    if (newWeight === null) {
      cancelEdit();
      return;
    }

    setIsEditing(false);

    mutation.mutate({
      weightKg: newWeight,
      note: "",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return {
    isEditing,
    isPending,
    displayedWeight,
    editValue,
    inputRef,
    setEditValue,
    startEditing,
    cancelEdit,
    saveEdit,
    handleKeyDown,
    hasWeight: displayedWeight !== null,
    statusText,
  };
}

export default function CurrentWeightCard() {
  const {
    isEditing,
    isPending,
    displayedWeight,
    editValue,
    inputRef,
    statusText,
    startEditing,
    cancelEdit,
    saveEdit,
    setEditValue,
    handleKeyDown,
  } = useLatestWeightEditor();

  return (
    <EditableNumberCard
      title="Current Weight"
      ariaLabel="Record or update your current weight"
      value={displayedWeight ?? null}
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
      noValueMessage="No weight recorded yet"
      noValueSubMessage="Tap here to add your current weight"
      dataTestId="current-weight-display"
    />
  );
}
