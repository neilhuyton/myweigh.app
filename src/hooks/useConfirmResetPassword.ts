// src/hooks/useConfirmResetPassword.ts
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../trpc";
import { useState, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";

const formSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required" }).optional(),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

interface UseConfirmResetPasswordReturn {
  form: ReturnType<typeof useForm<FormValues>>;
  message: string | null;
  isPending: boolean;
  handleSubmit: (
    data: FormValues,
    onSwitchToLogin: () => void
  ) => Promise<void>;
}

export const useConfirmResetPassword = (): UseConfirmResetPasswordReturn => {
  const { token } = useSearch({ from: "/confirm-reset-password" });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { token: token || "", newPassword: "" },
    mode: "onChange",
  });

  const [message, setMessage] = useState<string | null>(null);

  const resetMutation = trpc.resetPassword.confirm.useMutation({
    onSuccess: () => {
      setMessage("Password reset successfully!");
      setTimeout(() => {
        form.reset();
        setMessage(null);
      }, 3000);
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to reset password";
      setMessage(`Failed to reset password: ${errorMessage}`);
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => {
      setMessage(null);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (
    data: FormValues,
    onSwitchToLogin: () => void
  ) => {
    const isValid = await form.trigger("newPassword");
    if (!isValid) {
      return;
    }

    if (!token) {
      setMessage("Failed to reset password: Reset token is missing");
      return;
    }

    await resetMutation.mutateAsync({ token, newPassword: data.newPassword });
    onSwitchToLogin();
  };

  return {
    form,
    message,
    isPending: resetMutation.isPending,
    handleSubmit,
  };
};
