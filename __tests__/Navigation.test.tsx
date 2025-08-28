// __tests__/Navigation.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../src/trpc";
import { router } from "../src/router/router";
import { server } from "../__mocks__/server";
import { useAuthStore } from "../src/store/authStore";
import { act } from "react";
import { vi } from "vitest";

describe("Navigation Component - Theme Toggle", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:8888/.netlify/functions/trpc",
        fetch: async (url, options) => {
          const { userId } = useAuthStore.getState();
          return fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              ...(userId ? { Authorization: `Bearer ${userId}` } : {}),
            },
            signal: options?.signal ?? null,
          });
        },
      }),
    ],
  });

  const setup = async (initialPath: string = "/") => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const testRouter = createRouter({
      ...router.options,
      history,
      routeTree: router.routeTree,
    });

    await act(async () => {
      render(
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={testRouter} />
          </QueryClientProvider>
        </trpc.Provider>
      );
    });

    return { history, queryClient };
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({ isLoggedIn: false, userId: null });
    queryClient.clear();
    window.localStorage.clear();
    vi.restoreAllMocks(); // Reset mocks to default
  });

  afterAll(() => {
    server.close();
  });

  it.skip("should toggle between light and dark themes when theme toggle button is clicked", async () => {
    // Mock prefers-color-scheme: light
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query === "(prefers-color-scheme: dark)" ? false : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        } as MediaQueryList)
    );

    // Mock a logged-in user
    useAuthStore.setState({ isLoggedIn: true, userId: "test-user-id" });

    // Render the Navigation component
    await act(async () => {
      await setup("/");
    });

    // Wait for the Navigation component to render
    await waitFor(
      () => {
        expect(
          screen.getByRole("link", { name: "Weight Tracker" })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Find the theme toggle button
    const themeToggleButton = screen.getByRole("button", {
      name: /toggle theme/i,
    });
    expect(themeToggleButton).toBeInTheDocument();

    // Check initial theme (light)
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Simulate clicking the toggle button
    await act(async () => {
      fireEvent.click(themeToggleButton);
    });

    // Expect the dark theme to be applied
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    // Click again to toggle back to light
    await act(async () => {
      fireEvent.click(themeToggleButton);
    });

    // Expect the light theme to be restored
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  it.skip("should persist theme in localStorage and apply it on mount", async () => {
    // Set dark theme in localStorage before rendering
    window.localStorage.setItem("theme", "dark");

    // Render the Navigation component
    await act(async () => {
      await setup("/");
    });

    // Wait for the Navigation component to render
    await waitFor(
      () => {
        expect(
          screen.getByRole("link", { name: "Weight Tracker" })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Expect the dark theme to be applied on mount
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Find the theme toggle button
    const themeToggleButton = screen.getByRole("button", {
      name: /toggle theme/i,
    });
    expect(themeToggleButton).toBeInTheDocument();

    // Expect localStorage to still have the dark theme
    expect(window.localStorage.getItem("theme")).toBe("dark");

    // Simulate clicking the toggle button to switch to light
    await act(async () => {
      fireEvent.click(themeToggleButton);
    });

    // Expect the light theme to be applied
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    // Expect localStorage to be updated to light
    expect(window.localStorage.getItem("theme")).toBe("light");
  });

  it("should initialize theme based on prefers-color-scheme when no localStorage value exists", async () => {
    // Mock prefers-color-scheme: dark
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query === "(prefers-color-scheme: dark)" ? true : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        } as MediaQueryList)
    );

    // Ensure localStorage is empty
    window.localStorage.clear();

    // Render the Navigation component
    await act(async () => {
      await setup("/");
    });

    // Wait for the Navigation component to render
    // await waitFor(
    //   () => {
    //     expect(screen.getByRole('link', { name: 'Weight Tracker' })).toBeInTheDocument();
    //   },
    //   { timeout: 2000 }
    // );

    // Expect the dark theme to be applied on mount based on prefers-color-scheme
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Expect localStorage to have no theme set initially
    expect(window.localStorage.getItem("theme")).toBe(null);

    // Find the theme toggle button
    // const themeToggleButton = screen.getByRole('button', { name: /toggle theme/i });
    // expect(themeToggleButton).toBeInTheDocument();

    // Simulate clicking the toggle button to switch to light
    // await act(async () => {
    //   fireEvent.click(themeToggleButton);
    // });

    // Expect the light theme to be applied
    // await waitFor(() => {
    //   expect(document.documentElement.classList.contains('dark')).toBe(false);
    // });

    // Expect localStorage to be updated to light
    // expect(window.localStorage.getItem('theme')).toBe('light');
  });
});
