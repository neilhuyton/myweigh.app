// src/hooks/useLogin.ts
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../trpc';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

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
      console.log('Mutation onSuccess, data:', data); // Debug
      setMessage('Login successful!');
      setTimeout(() => {
        console.log('Resetting form and logging in, userId:', data.id); // Debug
        form.reset();
        login(data.id);
      }, 3000);
    },
    onError: (error) => {
      console.log('Mutation onError:', error); // Debug
      const errorMessage = error.message || 'Invalid email or password';
      setMessage(`Login failed: ${errorMessage}`);
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => setMessage(null));
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (data: FormValues) => {
    console.log('handleSubmit called with:', data); // Debug
    const isValid = await form.trigger();
    if (!isValid) {
      console.log('Form validation failed:', form.formState.errors); // Debug
      return;
    }

    try {
      console.log('Triggering login mutation...'); // Debug
      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.log('Mutation error caught:', error); // Debug
    }
  };

  return {
    form,
    message,
    isPending: loginMutation.isPending,
    handleSubmit,
  };
};