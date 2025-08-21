// src/hooks/useAuthView.ts
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

interface UseAuthViewReturn {
  isLoggedIn: boolean;
  showLogin: boolean;
  switchToRegister: () => void;
  switchToLogin: () => void;
}

export const useAuthView = (): UseAuthViewReturn => {
  const [showLogin, setShowLogin] = useState(true);
  const { isLoggedIn } = useAuthStore();

  const switchToRegister = () => setShowLogin(false);
  const switchToLogin = () => setShowLogin(true);

  return {
    isLoggedIn,
    showLogin,
    switchToRegister,
    switchToLogin,
  };
};
