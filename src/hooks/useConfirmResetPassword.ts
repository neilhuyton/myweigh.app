import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../trpc";
import { useState, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "server/trpc";

const formSchema = z.object({
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
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: "" },
    mode: "onChange",
  });

  const [message, setMessage] = useState<string | null>(null);
  const { token } = useSearch({ from: "/confirm-reset-password" });

  const resetMutation = trpc.resetPassword.confirm.useMutation({
    onSuccess: () => {
      setMessage("Password reset successfully!");
      form.reset(); // Clear input
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      const errorMessage = error.message || "Failed to reset password";
      setMessage(`Failed to reset password: ${errorMessage}`);
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { type }) => {
      if (type === "change") {
        setMessage(null);
      }
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

    try {
      await resetMutation.mutateAsync({ token, newPassword: data.newPassword });
      setTimeout(() => {
        onSwitchToLogin();
      }, 1000);
    } catch (error: unknown) {
      // Type guard to check if error is TRPCClientErrorLike
      if (error instanceof Error && 'message' in error) {
        setMessage(`Failed to reset password: ${error.message || "Unknown error"}`);
      } else {
        setMessage("Failed to reset password: Unexpected error");
      }
    }
  };

  return {
    form,
    message,
    isPending: resetMutation.isPending,
    handleSubmit,
  };
};