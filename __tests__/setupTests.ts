// __tests__/setupTests.ts
// import { configure } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../__mocks__/server';

// Suppress HTML output in @testing-library error messages
// configure({
//   getElementError: (message: string | null) => {
//     return new Error(message ?? undefined); // Convert null to undefined
//   },
// });

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

// Polyfill PointerEvent for jsdom to support @radix-ui/react-select
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

  // Polyfill scrollIntoView for jsdom
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

// MSW setup for server tests
export const setupMSW = () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
};

// Enhance console.log for clarity in tests
// const originalConsoleLog = console.log;
// console.log = (...args) => {
//   originalConsoleLog('[TEST LOG]', ...args);
// };