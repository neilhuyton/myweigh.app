// src/hooks/useProfile.ts
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../trpc";
import { useEffect, useState } from "react";
import { type TRPCClientErrorLike } from "@trpc/client";
import type {
  inferProcedureOutput,
  inferProcedureInput,
  TRPCDefaultErrorShape,
} from "@trpc/server";
import type { AppRouter } from "../../server/trpc";

interface EmailFormValues {
  email: string;
}

interface PasswordFormValues {
  email: string;
}

const emailFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const passwordFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

interface UseProfileReturn {
  emailForm: ReturnType<typeof useForm<EmailFormValues>>;
  passwordForm: ReturnType<typeof useForm<PasswordFormValues>>;
  emailMessage: string | null;
  passwordMessage: string | null;
  isEmailPending: boolean;
  isPasswordPending: boolean;
  handleEmailSubmit: (data: EmailFormValues) => Promise<void>;
  handlePasswordSubmit: (data: PasswordFormValues) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const updateEmailMutation = trpc.user.updateEmail.useMutation({
    onMutate: () => {
      setEmailMessage(null);
    },
    onSuccess: (data) => {
      setEmailMessage(data.message || "Email updated successfully");
      emailForm.reset();
    },
    onError: (
      error: TRPCClientErrorLike<{
        input: inferProcedureInput<AppRouter["user"]["updateEmail"]>;
        output: inferProcedureOutput<AppRouter["user"]["updateEmail"]>;
        transformer: false;
        errorShape: TRPCDefaultErrorShape;
      }>
    ) => {
      setEmailMessage(error.message || "Failed to update email");
    },
    onSettled: () => {},
  });

  const resetPasswordMutation = trpc.resetPassword.request.useMutation({
    onMutate: () => {
      setPasswordMessage(null);
    },
    onSuccess: (data) => {
      setPasswordMessage(data.message || "Reset link sent to your email");
      passwordForm.reset();
      // Removed router.navigate({ to: "/login" }) to stay on /profile
    },
    onError: (
      error: TRPCClientErrorLike<{
        input: inferProcedureInput<AppRouter["resetPassword"]["request"]>;
        output: inferProcedureOutput<AppRouter["resetPassword"]["request"]>;
        transformer: false;
        errorShape: TRPCDefaultErrorShape;
      }>
    ) => {
      setPasswordMessage(error.message || "Failed to send reset email");
    },
    onSettled: () => {},
  });

  useEffect(() => {
    const emailSubscription = emailForm.watch((_, { name }) => {
      if (name === "email") {
        setEmailMessage(null);
      }
    });
    const passwordSubscription = passwordForm.watch((_, { name }) => {
      if (name === "email") {
        setPasswordMessage(null);
      }
    });
    return () => {
      emailSubscription.unsubscribe();
      passwordSubscription.unsubscribe();
    };
  }, [emailForm, passwordForm]);

  const handleEmailSubmit = async (data: EmailFormValues) => {
    console.log("Email form submitted with:", data.email);
    const isValid = await emailForm.trigger();
    if (!isValid) {
      console.log("Email form validation failed");
      return;
    }
    console.log("Calling updateEmailMutation");
    await updateEmailMutation.mutateAsync(data);
  };

  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    console.log("Password form submitted with:", data.email);
    const isValid = await passwordForm.trigger();
    if (!isValid) {
      console.log("Password form validation failed");
      return;
    }
    console.log("Calling resetPasswordMutation");
    await resetPasswordMutation.mutateAsync({ email: data.email });
  };

  return {
    emailForm,
    passwordForm,
    emailMessage,
    passwordMessage,
    isEmailPending: updateEmailMutation.isPending,
    isPasswordPending: resetPasswordMutation.isPending,
    handleEmailSubmit,
    handlePasswordSubmit,
  };
};