import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import EditableNumberCard from "@/components/EditableNumberCard";
import { formatDate } from "@/utils/date";

export default function CurrentWeightCard() {
  const queryClient = useQueryClient();

  const latestWeightQuery = trpc.weight.getLatestWeight;

  const { data: latestWeight, isLoading } = useQuery(
    latestWeightQuery.queryOptions(undefined, {
      staleTime: 30000,
      gcTime: 300000,
    }),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (latestWeight) {
      setEditValue(latestWeight.weightKg.toString());
    }
  }, [latestWeight]);

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
    if (latestWeight && val === latestWeight.weightKg) return null;
    return val;
  };

  const createMutation = useMutation(
    trpc.weight.create.mutationOptions({
      onMutate: async ({ weightKg, note = "" }) => {
        const queryKey = latestWeightQuery.queryKey();
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);

        const optimistic = {
          id: `temp-${Date.now()}`,
          weightKg,
          createdAt: new Date().toISOString(),
          note,
        };

        queryClient.setQueryData(queryKey, optimistic);

        return { previous };
      },

      onError: (_, __, context) => {
        if (context?.previous !== undefined) {
          queryClient.setQueryData(
            latestWeightQuery.queryKey(),
            context.previous,
          );
        }
      },

      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: latestWeightQuery.queryKey(),
        });
      },
    }),
  );

  const isPending = createMutation.isPending;

  const displayedWeight = isPending
    ? ((Number(editValue) || latestWeight?.weightKg) ?? null)
    : (latestWeight?.weightKg ?? null);

  const statusText = isPending
    ? "Saving new weight..."
    : latestWeight?.createdAt
      ? formatDate(latestWeight.createdAt)
      : "";

  const saveEdit = () => {
    const newWeight = getValidatedWeight();
    if (newWeight === null) {
      setIsEditing(false);
      setEditValue(latestWeight?.weightKg?.toString() ?? "");
      return;
    }

    setIsEditing(false);
    createMutation.mutate({ weightKg: newWeight, note: "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(latestWeight?.weightKg?.toString() ?? "");
    }
  };

  if (isLoading && !latestWeight) {
    return <div className="h-40 animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <EditableNumberCard
      title="Current Weight"
      ariaLabel="Record or update your current weight"
      value={displayedWeight}
      unit="kg"
      statusText={statusText}
      isEditing={isEditing}
      isPending={isPending}
      editValue={editValue}
      onStartEditing={() => setIsEditing(true)}
      onCancel={() => {
        setIsEditing(false);
        setEditValue(latestWeight?.weightKg?.toString() ?? "");
      }}
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
