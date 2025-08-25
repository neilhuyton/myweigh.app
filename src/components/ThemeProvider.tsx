// src/components/ThemeProvider.tsx
'use client'; // Required for Next.js App Router

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import type { ThemeProviderProps as NextThemeProviderProps } from 'next-themes';

// Extend next-themes' ThemeProviderProps to include only the props you want to expose
type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  enableSystem?: boolean;
} & Omit<NextThemeProviderProps, 'children' | 'defaultTheme' | 'storageKey' | 'enableSystem'>;

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'vite-ui-theme',
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem={enableSystem}
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}