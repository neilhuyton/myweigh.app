// src/store/authStore.ts
import { create } from 'zustand';

export interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null;
  refreshToken: string | null;
  isFirstLogin: boolean;
  login: (userId: string, token: string, refreshToken: string, isFirstLogin: boolean) => void;
  logout: () => void;
}

const initializeState = () => {
  const storedToken = localStorage.getItem('token');
  const storedUserId = localStorage.getItem('userId');
  const storedRefreshToken = localStorage.getItem('refreshToken');
  const storedIsFirstLogin = localStorage.getItem('isFirstLogin');
  return {
    isLoggedIn: !!storedToken && !!storedUserId,
    userId: storedUserId || null,
    token: storedToken || null,
    refreshToken: storedRefreshToken || null,
    isFirstLogin: storedIsFirstLogin ? JSON.parse(storedIsFirstLogin) : false,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initializeState(),
  login: (userId: string, token: string, refreshToken: string, isFirstLogin: boolean) => {
    set({ isLoggedIn: true, userId, token, refreshToken, isFirstLogin });
    localStorage.setItem('userId', userId);
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('isFirstLogin', JSON.stringify(isFirstLogin));
  },
  logout: () => {
    set({ isLoggedIn: false, userId: null, token: null, refreshToken: null, isFirstLogin: false });
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isFirstLogin');
  },
}));