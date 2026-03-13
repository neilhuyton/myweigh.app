import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { formatDate } from "@/utils/date";
import { saveLatestWeight } from "@/utils/weightCache";
import { useLatestWeight } from "./useLatestWeight";

export function useLatestWeightEditor() {
  const { latestWeight, isFromCache, isServerLoaded } = useLatestWeight();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(latestWeight?.weightKg?.toString() ?? "");
    }
  }, [latestWeight, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const mutation = useMutation(
    trpc.weight.create.mutationOptions({
      onSuccess: (_data, variables) => {
        saveLatestWeight({
          weightKg: variables.weightKg,
          createdAt: new Date().toISOString(),
        });
      },
    }),
  );

  const isPending = mutation.isPending;

  const pendingWeight = Number(editValue);
  const displayedWeight = isPending
    ? Number.isNaN(pendingWeight)
      ? (latestWeight?.weightKg ?? null)
      : pendingWeight
    : (latestWeight?.weightKg ?? null);

  const statusText = (() => {
    if (isPending) return "Saving new weight...";

    if (!latestWeight?.createdAt) return "";

    const parts: string[] = [formatDate(latestWeight.createdAt)];
    if (isFromCache) parts.push(" • cached");
    if (isServerLoaded) parts.push(" • synced");
    return parts.join("");
  })();

  const startEditing = () => setIsEditing(true);

  const cancelEdit = () => {
    setEditValue(latestWeight?.weightKg?.toString() ?? "");
    setIsEditing(false);
  };

  const getValidatedWeight = (): number | null => {
    const trimmed = editValue.trim();
    if (!trimmed) return null;

    const val = Number(trimmed);
    if (Number.isNaN(val) || val <= 0) return null;
    if (latestWeight && val === latestWeight.weightKg) return null;

    return val;
  };

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
