// src/hooks/useRegister.ts
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../trpc';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function useRegister(onSwitchToLogin: () => void) {
  const queryClient = useQueryClient();
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const [message, setMessage] = useState<string | null>(null);

  const registerMutation = trpc.register.useMutation({
    onSuccess: (data) => {
      setMessage(data.message || 'Registration successful!');
      toast.success('Registration successful!', {
        description: 'Your account has been created.', // Updated to match test expectation
        action: {
          label: 'Log in now',
          onClick: () => onSwitchToLogin(),
        },
        id: 'register-message',
        className: 'register-toast',
      });
      setTimeout(() => form.reset(), 1000);
      queryClient.invalidateQueries({ queryKey: ['getUsers'] });
    },
    onError: (error) => {
      const errorMessage = error.message || 'Registration failed';
      setMessage(errorMessage);
      toast.error('Registration failed', {
        description: errorMessage,
        action: {
          label: 'Try again',
          onClick: () => form.reset(),
        },
        id: 'register-message',
        className: 'register-toast',
      });
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => setMessage(null));
    return () => subscription.unsubscribe();
  }, [form]);

  const handleRegister = async (data: RegisterFormData) => {
    const isValid = await form.trigger();
    if (!isValid) return;
    try {
      await registerMutation.mutateAsync(data);
    } catch {
      // Error handled in onError
    }
  };

  const handleSwitchToLogin = () => {
    setMessage(null);
    form.reset();
    onSwitchToLogin();
  };

  return {
    form,
    message,
    isRegistering: registerMutation.isPending,
    handleRegister,
    handleSwitchToLogin,
  };
}