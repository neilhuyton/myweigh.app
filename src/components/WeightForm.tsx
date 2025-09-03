import { useWeightForm } from "../hooks/useWeightForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Confetti from "react-confetti";
import Joyride, { type Step } from "react-joyride";
import { createPortal } from "react-dom";
import { LoadingSpinner } from "./LoadingSpinner";

function WeightForm() {
  const {
    weight,
    message,
    isSubmitting,
    showConfetti,
    fadeOut,
    runTour,
    runGoalTour,
    handleSubmit,
    handleWeightChange,
    handleTourCallback,
    handleGoalTourCallback,
  } = useWeightForm();

  const firstLoginSteps: Step[] = [
    {
      target: '[data-testid="weight-input"]',
      content:
        "Enter your weight here in kilograms to start tracking your progress!",
      placement: "top",
      disableBeacon: true,
    },
  ];

  const goalSteps: Step[] = [
    {
      target: '[data-testid="submit-button"]',
      content: "Great job! Now set a goal to track your progress.",
      placement: "top",
      disableBeacon: true,
    },
  ];

  return (
    <>
      <Joyride
        steps={firstLoginSteps}
        run={runTour}
        continuous
        showSkipButton
        callback={handleTourCallback}
        styles={{
          options: {
            zIndex: 1000,
            primaryColor: "#3b82f6",
            textColor: "#1f2937",
            backgroundColor: "#ffffff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip",
        }}
      />
      <Joyride
        steps={goalSteps}
        run={runGoalTour}
        continuous
        callback={handleGoalTourCallback}
        styles={{
          options: {
            zIndex: 1000,
            primaryColor: "#3b82f6",
            textColor: "#1f2937",
            backgroundColor: "#ffffff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "OK",
          next: "Next",
          skip: "Skip",
        }}
      />
      {showConfetti &&
        createPortal(
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            numberOfPieces={200}
            recycle={false}
            data-testid="confetti"
            className={cn(
              "fixed inset-0 z-[1000]",
              fadeOut ? "opacity-0" : "opacity-100",
              "transition-opacity duration-1000 ease-out"
            )}
          />,
          document.body
        )}
      <div className="mx-auto max-w-4xl lg:max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          data-testid="weight-form"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="weight"
                className="text-sm font-medium text-foreground"
                data-testid="weight-label"
              >
                Weight (kg)
              </Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                value={weight}
                onChange={handleWeightChange}
                placeholder="Enter your weight (kg)"
                required
                min="0"
                step="0.01"
                disabled={isSubmitting}
                data-testid="weight-input"
                aria-describedby="weight-error"
                className="h-10 rounded-md border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {isSubmitting && (
              <div className="flex justify-center">
                <LoadingSpinner size="md" testId="weight-form-submitting" />
              </div>
            )}
            {message && (
              <p
                className={cn(
                  "text-center text-sm font-medium",
                  message.toLowerCase().includes("success")
                    ? "text-success"
                    : "text-destructive"
                )}
                id="weight-error"
                data-testid="weight-message"
                role="alert"
              >
                {message}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="submit-button"
            >
              {isSubmitting ? "Submitting..." : "Submit Weight"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export default WeightForm;
