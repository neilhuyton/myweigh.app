// __tests__/ThemeProvider.test.tsx
import { render, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../src/components/ThemeProvider";

describe("ThemeProvider", () => {
  it("defaults to dark theme with zinc color theme", async () => {
    render(<ThemeProvider>Test</ThemeProvider>);
    await waitFor(
      () => {
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(document.documentElement.getAttribute("data-color-theme")).toBe(
          "zinc"
        );
        expect(localStorage.getItem("vite-ui-theme")).toBe("dark");
        expect(localStorage.getItem("vite-ui-color-theme")).toBe("zinc");
      },
      { timeout: 1000 }
    );
  });

  it("respects existing theme in localStorage", async () => {
    localStorage.setItem("vite-ui-theme", "light");
    localStorage.setItem("vite-ui-color-theme", "blue");
    render(<ThemeProvider>Test</ThemeProvider>);
    await waitFor(
      () => {
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(document.documentElement.getAttribute("data-color-theme")).toBe(
          "blue"
        );
        expect(localStorage.getItem("vite-ui-theme")).toBe("light");
        expect(localStorage.getItem("vite-ui-color-theme")).toBe("blue");
      },
      { timeout: 1000 }
    );
  });

  it("applies rounded styles from CSS", async () => {
    render(<ThemeProvider>Test</ThemeProvider>);
    await waitFor(
      () => {
        const computedStyles = getComputedStyle(document.documentElement);
        expect(computedStyles.getPropertyValue("--radius").trim()).toBe(
          "0.625rem"
        );
        expect(computedStyles.getPropertyValue("--radius-sm").trim()).toBe(
          "calc(0.625rem - 4px)"
        );
      },
      { timeout: 1000 }
    );
  });
});
