// src/hooks/useLogin.ts
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../trpc";
import { useAuthStore } from "../authStore";
import { useEffect, useState } from "react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "server/trpc";
import { router } from "../router";

// Define the expected response type for the login mutation
type LoginResponse = {
  id: string;
  email: string;
  token: string;
  refreshToken: string;
};

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

interface UseLoginProps {
  navigate: typeof router.navigate;
}

export const useLogin = ({ navigate }: UseLoginProps): UseLoginReturn => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const [message, setMessage] = useState<string | null>(null);
  const { login } = useAuthStore();

  const loginMutation = trpc.login.useMutation({
    onMutate: () => {
      setMessage(null);
    },
    onSuccess: (data: { result: { data: LoginResponse } } | LoginResponse) => {
      const response = "result" in data ? data.result.data : data;
      setMessage("Login successful!");
      login(response.id, response.token, response.refreshToken);
      form.reset();
      navigate({ to: "/weight" });
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setMessage(`Login failed: ${error.message || "Unknown error"}`);
    },
  });

  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name === "email" || name === "password") {
        setMessage(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (data: FormValues) => {
    const isValid = await form.trigger();
    if (!isValid) return;
    await loginMutation.mutateAsync(data);
  };

  return {
    form,
    message,
    isPending: loginMutation.isPending,
    handleSubmit,
  };
};
