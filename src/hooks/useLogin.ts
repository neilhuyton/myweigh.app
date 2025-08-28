// src/hooks/useLogin.ts
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../trpc';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import type { TRPCClientErrorLike } from '@trpc/client';

interface LoginResponse {
  id: string;
  email: string;
  token: string;
  refreshToken: string; // Define refreshToken as string (UUID)
}

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
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
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const [message, setMessage] = useState<string | null>(null);
  const { login } = useAuthStore();
  const router = useRouter();

  const loginMutation = trpc.login.useMutation({
    onMutate: () => setMessage(null),
    onSuccess: (data: LoginResponse) => {
      setMessage('Login successful!');
      login(data.id, data.token, data.refreshToken);
      form.reset();
      router.navigate({ to: '/' });
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      // Use `any` temporarily to bypass type mismatch
      const errorMessage = error.message || 'Invalid email or password';
      setMessage(`Login failed: ${errorMessage}`);
    },
  });

  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name === 'email' || name === 'password') {
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