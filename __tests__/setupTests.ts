import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../__mocks__/server';
import fetch, { Request } from 'node-fetch';

Object.defineProperty(global, 'fetch', { writable: true, value: fetch });
Object.defineProperty(global, 'Request', { writable: false, value: Request });

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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
  value: vi.fn().mockImplementation((query: string) => matchMediaMock(query === '(prefers-color-scheme: dark)')),
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

beforeAll(() => server.listen({ onUnhandledRequest: 'error' })); // Change to 'error' for stricter checking
afterEach(() => server.resetHandlers());
afterAll(() => server.close());