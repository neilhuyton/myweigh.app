import { useState, useEffect } from "react";

export function useGoalCelebration() {
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = () => {
    console.log('triggerConfetti');
    setShowConfetti(true);
  };

  useEffect(() => {
    if (!showConfetti) return;
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, [showConfetti]);

  return { showConfetti, triggerConfetti };
}
