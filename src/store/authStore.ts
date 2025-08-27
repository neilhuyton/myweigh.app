// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null; // Add token to store
  login: (userId: string, token: string) => void; // Update login signature
  logout: () => void;
}

const initializeState = () => {
  const storedToken = localStorage.getItem('token');
  const storedUserId = localStorage.getItem('userId');
  return {
    isLoggedIn: !!storedToken && !!storedUserId,
    userId: storedUserId || null,
    token: storedToken || null,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initializeState(),
  login: (userId: string, token: string) => {
    set({ isLoggedIn: true, userId, token });
    localStorage.setItem('userId', userId);
    localStorage.setItem('token', token); // Store JWT
  },
  logout: () => {
    set({ isLoggedIn: false, userId: null, token: null });
    localStorage.removeItem('userId');
    localStorage.removeItem('token'); // Remove JWT
  },
}));