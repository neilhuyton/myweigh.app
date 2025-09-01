// src/contexts/ThemeContext.ts
import { createContext } from "react";

export type Theme = "dark" | "light" | "system";
export type ColorTheme = "default" | "red" | "rose" | "orange" | "green" | "blue" | "yellow" | "violet";

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  colorTheme: "default",
  setColorTheme: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);