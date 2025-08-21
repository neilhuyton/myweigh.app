// src/hooks/useRegister.ts
import { useState } from "react";
import { trpc } from "../trpc";
import { useQueryClient } from "@tanstack/react-query";

export function useRegister(onSwitchToLogin: () => void) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  const registerMutation = trpc.register.useMutation({
    onSuccess: () => {
      alert("Registration successful!");
      setEmail("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["getUsers"] });
    },
    onError: (error) => {
      alert(`Registration failed: ${error.message}`);
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ email, password });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSwitchToLogin = () => {
    onSwitchToLogin();
  };

  return {
    email,
    password,
    isRegistering: registerMutation.isPending,
    isSuccess: registerMutation.isSuccess,
    isError: registerMutation.isError,
    error: registerMutation.error,
    handleRegister,
    handleEmailChange,
    handlePasswordChange,
    handleSwitchToLogin,
  };
}
