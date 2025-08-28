// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null;
  refreshToken: string | null; // Add refreshToken
  login: (userId: string, token: string, refreshToken: string) => void; // Update signature
  logout: () => void;
}

const initializeState = () => {
  const storedToken = localStorage.getItem('token');
  const storedUserId = localStorage.getItem('userId');
  const storedRefreshToken = localStorage.getItem('refreshToken'); // Add refreshToken
  return {
    isLoggedIn: !!storedToken && !!storedUserId,
    userId: storedUserId || null,
    token: storedToken || null,
    refreshToken: storedRefreshToken || null, // Initialize refreshToken
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initializeState(),
  login: (userId: string, token: string, refreshToken: string) => {
    set({ isLoggedIn: true, userId, token, refreshToken });
    localStorage.setItem('userId', userId);
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken); // Store refreshToken
  },
  logout: () => {
    set({ isLoggedIn: false, userId: null, token: null, refreshToken: null });
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken'); // Remove refreshToken
  },
}));