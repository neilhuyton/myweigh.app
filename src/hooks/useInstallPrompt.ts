// src/hooks/useInstallPrompt.ts
import { useEffect, useState } from "react";

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      (installPrompt as any).prompt();
      (installPrompt as any).userChoice.then(
        (choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User installed the app");
          }
          setInstallPrompt(null);
        }
      );
    }
  };

  return { installPrompt, isIOS, handleInstallClick };
}