// src/hooks/useCustomTheme.ts
import { useContext } from "react";
import { ThemeProviderContext } from "../contexts/ThemeContext";

export function useCustomTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useCustomTheme must be used within a ThemeProvider");
  }
  return context;
}