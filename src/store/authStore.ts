// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  login: (userId: string) => void;
  logout: () => void;
}

const initializeState = () => {
  const storedUserId = localStorage.getItem('userId');
  return {
    isLoggedIn: !!storedUserId,
    userId: storedUserId || null,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initializeState(),
  login: (userId: string) => {
    set({ isLoggedIn: true, userId });
    localStorage.setItem('userId', userId);
  },
  logout: () => {
    set({ isLoggedIn: false, userId: null });
    localStorage.removeItem('userId');
  },
}));