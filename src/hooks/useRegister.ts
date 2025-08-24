// src/hooks/useRegister.ts
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../trpc";
import { useState, useEffect } from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

type FormValues = z.infer<typeof formSchema>;

interface UseRegisterReturn {
  form: ReturnType<typeof useForm<FormValues>>;
  message: string | null;
  isRegistering: boolean;
  handleRegister: (data: FormValues) => Promise<void>;
}

export const useRegister = (onSuccess: () => void): UseRegisterReturn => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const [message, setMessage] = useState<string | null>(null);

  const registerMutation = trpc.register.useMutation({
    onSuccess: () => {
      setMessage(
        "Registration successful! Please check your email to verify your account.!"
      );
      setTimeout(() => {
        form.reset();
        onSuccess();
      }, 3000);
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to register";
      setMessage(`Registration failed: ${errorMessage}`);
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => setMessage(null));
    return () => subscription.unsubscribe();
  }, [form]);

  const handleRegister = async (data: FormValues) => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    await registerMutation.mutateAsync(data);
  };

  return {
    form,
    message,
    isRegistering: registerMutation.isPending,
    handleRegister,
  };
};
