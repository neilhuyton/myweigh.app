// src/hooks/useLogin.ts
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../trpc';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface LoginResponse {
  id: string;
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
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const [message, setMessage] = useState<string | null>(null);
  const { login } = useAuthStore();

  const loginMutation = trpc.login.useMutation({
    onSuccess: (data: LoginResponse) => {
      setMessage('Login successful!');
      toast.success('Login successful!', {
        description: 'You are now logged in.',
        action: {
          label: 'Go to Dashboard',
          onClick: () => console.log('Navigate to dashboard'),
        },
        duration: 5000,
        className: 'login-toast',
      });
      setTimeout(() => {
        console.log('Resetting form and logging in, current URL:', window.location.href); // Debug
        form.reset();
        login(data.id);
      }, 3000); // Increased to 3s
    },
    onError: (error) => {
      const errorMessage = error.message || 'Invalid email or password';
      setMessage(`Login failed: ${errorMessage}`);
      toast.error('Login failed', {
        description: errorMessage,
        action: {
          label: 'Try again',
          onClick: () => form.reset(),
        },
        duration: 5000,
        className: 'login-toast',
      });
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => setMessage(null));
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (data: FormValues) => {
    const isValid = await form.trigger();
    if (!isValid) return;

    try {
      await loginMutation.mutateAsync(data);
    } catch {
      // Error handled in onError
    }
  };

  return {
    form,
    message,
    isPending: loginMutation.isPending,
    handleSubmit,
  };
};