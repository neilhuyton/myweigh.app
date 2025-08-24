// src/hooks/useLogin.ts
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../trpc";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router"; // Add this import
import { type TRPCClientErrorLike } from "@trpc/client";
import type {
  inferProcedureOutput,
  inferProcedureInput,
  TRPCDefaultErrorShape,
} from "@trpc/server";
import type { AppRouter } from "../../server/trpc";

interface LoginResponse {
  id: string;
  email: string;
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

type FormValues = z.infer<typeof formSchema>;

interface UseLoginReturn {
  form: ReturnType<typeof useForm<FormValues>>;
  message: string | null;
  isPending: boolean;
  handleSubmit: (data: FormValues) => Promise<void>;
}

export const useLogin = (): UseLoginReturn => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const [message, setMessage] = useState<string | null>(null);
  const { login } = useAuthStore();
  const router = useRouter(); // Initialize router

  const loginMutation = trpc.login.useMutation({
    onMutate: () => {
      setMessage(null); // Clear message before mutation
    },
    onSuccess: (data: LoginResponse) => {
      setMessage("Login successful!");
      login(data.id);
      form.reset(); // Reset form after setting message
      router.navigate({ to: "/" });
    },
    onError: (
      error: TRPCClientErrorLike<{
        input: inferProcedureInput<AppRouter["login"]>;
        output: inferProcedureOutput<AppRouter["login"]>;
        transformer: false;
        errorShape: TRPCDefaultErrorShape;
      }>
    ) => {
      const errorMessage = error.message || "Invalid email or password";
      setMessage(`Login failed: ${errorMessage}`);
    },
    onSettled: () => {},
  });

  useEffect(() => {
    // Only clear message on user-initiated form changes
    const subscription = form.watch((_, { name }) => {
      if (name === "email" || name === "password") {
        setMessage(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (data: FormValues) => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    await loginMutation.mutateAsync(data);
  };

  return {
    form,
    message,
    isPending: loginMutation.isPending,
    handleSubmit,
  };
};
