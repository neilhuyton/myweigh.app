export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME,
  defaultAuthenticatedPath: "/weight-log" as const,
} as const;
