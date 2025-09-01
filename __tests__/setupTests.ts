// tests/setupTests.ts
// import { configure } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../__mocks__/server';
import fetch, { Request } from 'node-fetch';
import '../src/index.css';

Object.defineProperty(global, 'fetch', {
  writable: true,
  value: fetch,
});

Object.defineProperty(global, 'Request', {
  writable: false,
  value: Request,
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock console methods for cleaner test output (optional)
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});

// configure({
//   getElementError: (message: string | null) => {
//     return new Error(message ?? undefined);
//   },
// });

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => (store[key] = value),
    removeItem: (key: string) => delete store[key],
    clear: () => (store = {}),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

const matchMediaMock = (matchesDark: boolean) =>
  ({
    matches: matchesDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as MediaQueryList);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi
    .fn()
    .mockImplementation((query: string) =>
      matchMediaMock(query === '(prefers-color-scheme: dark)')
    ),
});

if (typeof window !== 'undefined') {
  window.PointerEvent = class PointerEvent extends Event {
    public pointerId: number;
    public clientX: number;
    public clientY: number;
    public isPrimary: boolean;
    public pointerType: string;
    public button: number;
    public buttons: number;

    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
      this.pointerId = init?.pointerId ?? 0;
      this.clientX = init?.clientX ?? 0;
      this.clientY = init?.clientY ?? 0;
      this.isPrimary = init?.isPrimary ?? true;
      this.pointerType = init?.pointerType ?? 'mouse';
      this.button = init?.button ?? 0;
      this.buttons = init?.buttons ?? 0;
    }
  } as unknown as typeof PointerEvent;

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

export const setupMSW = () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
};

// const originalConsoleLog = console.log;
// console.log = (...args) => {
//   originalConsoleLog('[TEST LOG]', ...args);
// };

beforeAll(() => {
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = (element: Element) => {
    const styles = originalGetComputedStyle(element);
    return {
      ...styles,
      getPropertyValue: (property: string) => {
        if (element === document.documentElement) {
          if (property === "--radius") return "0.625rem";
          if (property === "--radius-sm") return "calc(0.625rem - 4px)";
        }
        return styles.getPropertyValue(property);
      },
    } as CSSStyleDeclaration;
  };
});