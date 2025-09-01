// src/components/ThemeProvider.tsx
import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import {
  ThemeProviderContext,
  type Theme,
  type ColorTheme,
} from "../contexts/ThemeContext";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultColorTheme?: ColorTheme;
  storageKey?: string;
  colorStorageKey?: string;
  enableSystem?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  defaultColorTheme = "zinc",
  storageKey = "vite-ui-theme",
  colorStorageKey = "vite-ui-color-theme",
  enableSystem = true,
}: ThemeProviderProps) {
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem(colorStorageKey) as ColorTheme) ||
        defaultColorTheme
      );
    }
    return defaultColorTheme;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, "dark");
        document.documentElement.classList.add("dark");
        setTheme("dark");
      }
      localStorage.setItem(colorStorageKey, colorTheme);
      document.documentElement.setAttribute("data-color-theme", colorTheme);
    }
  }, [theme, setTheme, colorTheme, colorStorageKey, storageKey]);

  return (
    <ThemeProviderContext.Provider
      value={{
        theme: theme as Theme,
        setTheme,
        colorTheme,
        setColorTheme,
      }}
    >
      <NextThemeProvider
        attribute="class"
        defaultTheme={defaultTheme}
        storageKey={storageKey}
        enableSystem={enableSystem}
      >
        {children}
      </NextThemeProvider>
    </ThemeProviderContext.Provider>
  );
}
