import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => (store[key] = value),
    clear: () => (store = {}),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
const matchMediaMock = (matchesDark: boolean) => ({
  matches: matchesDark,
  media: '(prefers-color-scheme: dark)',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true),
} as MediaQueryList);

// Default to light theme unless overridden in specific tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => matchMediaMock(query === '(prefers-color-scheme: dark)')),
});

// Polyfill PointerEvent for jsdom to support @radix-ui/react-select
if (typeof window !== 'undefined') {
  window.PointerEvent = class PointerEvent extends Event {
    constructor(type: string, init?: EventInit) {
      super(type, init);
    }
  } as any;

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }

  // Polyfill scrollIntoView for jsdom
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}