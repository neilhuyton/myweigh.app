// __mocks__/store/authStore.ts
import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '1h',
  });
};

export const mockAuthState = {
  isLoggedIn: true,
  userId: 'test-user-id',
  token: generateToken('test-user-id'),
  refreshToken: 'valid-refresh-token',
  login: vi.fn(),
  logout: vi.fn(),
};

let state = { ...mockAuthState };

// Define the store state with getState and setState
const storeState = {
  ...state,
  getState: () => state,
  setState: (newState: Partial<typeof state>) => {
    state = { ...state, ...newState };
  },
};

export const useAuthStore = vi.fn((selector?: (state: typeof storeState) => any) => {
  // If a selector is provided, apply it (for routes.ts beforeLoad)
  if (selector) {
    return selector(storeState);
  }
  // Otherwise, return the full state (for Root.tsx destructuring)
  return storeState;
});