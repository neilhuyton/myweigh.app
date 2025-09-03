// src/components/WeightChangeMessage.tsx
import { Card, CardContent } from "@/components/ui/card"; // Adjust import based on your UI library
import { useWeightChange } from "../hooks/useWeightChange";

export default function WeightChangeMessage() {
  const { message, error } = useWeightChange();

  // Only show message or error if there are at least 2 weights or an error occurs
  if (!message && !error) {
    return null;
  }

  return (
    <Card data-testid="weight-change-card">
      <CardContent className="pt-6">
        {error ? (
          <p data-testid="weight-change-error" role="alert">
            Error: {error.message}
          </p>
        ) : (
          <p data-testid="weight-change-message" role="status">
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}