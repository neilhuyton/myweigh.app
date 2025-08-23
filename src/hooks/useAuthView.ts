// src/hooks/useAuthView.ts
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuthView = () => {
  const { isLoggedIn } = useAuthStore();
  const [showLogin, setShowLogin] = useState(true);
  const [showReset, setShowReset] = useState(false);

  const switchToRegister = () => {
    setShowLogin(false);
    setShowReset(false);
  };

  const switchToLogin = () => {
    setShowLogin(true);
    setShowReset(false);
  };

  const switchToReset = () => {
    setShowLogin(false);
    setShowReset(true);
  };

  return {
    isLoggedIn,
    showLogin,
    showReset,
    switchToRegister,
    switchToLogin,
    switchToReset,
  };
};