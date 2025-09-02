// vite.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  test: {
    silent: true,
    environment: "jsdom",
    setupFiles: ["./__tests__/setupTests.ts"],
    env: {
      VITE_TRPC_URL: "http://localhost:8888/.netlify/functions/trpc",
    },
    globals: true,
    testTimeout: 15000,
    deps: {
      optimizer: {
        web: {
          include: [
            "@testing-library/react",
            "@testing-library/jest-dom",
            "@tanstack/history",
          ],
        },
      },
    },
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"], // Only include __tests__ directory
    exclude: ["e2e/**/*", "node_modules", "dist", ".idea", ".git", ".cache"], // Explicitly exclude e2e
  },
  define: {
    "import.meta.env.VITE_TRPC_URL": JSON.stringify(process.env.VITE_TRPC_URL),
  },
});
