import Confetti from "react-confetti";
import { useEffect, useState } from "react";

export function ConfettiLayer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => {
      setShow(true);
      setTimeout(() => setShow(false), 7000);
    };

    window.addEventListener("trigger-confetti", handler);

    return () => {
      window.removeEventListener("trigger-confetti", handler);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={400}
        gravity={0.12}
        initialVelocityY={-25}
        recycle={false}
        tweenDuration={7000}
        colors={[
          "#22c55e",
          "#eab308",
          "#3b82f6",
          "#a855f7",
          "#ec4899",
          "#f97316",
        ]}
      />
    </div>
  );
}
