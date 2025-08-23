// src/hooks/useConfirmResetPassword.ts
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../trpc';
import { useState, useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';

interface ResetPasswordResponse {
  message: string;
}

const formSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

type FormValues = z.infer<typeof formSchema>;

interface UseConfirmResetPasswordReturn {
  form: ReturnType<typeof useForm<FormValues>>;
  message: string | null;
  isPending: boolean;
  handleSubmit: (data: FormValues, onSwitchToLogin: () => void) => Promise<void>;
}

export const useConfirmResetPassword = (): UseConfirmResetPasswordReturn => {
  const { token } = useSearch({ from: '/confirm-reset-password' }); // Update to correct route

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { token: token || '', newPassword: '' },
    mode: 'onChange',
  });

  const [message, setMessage] = useState<string | null>(null);

  const resetMutation = trpc.resetPassword.confirm.useMutation({
    onSuccess: (data: ResetPasswordResponse) => {
      console.log('useConfirmResetPassword: Mutation success', data);
      setMessage('Password reset successfully!');
      setTimeout(() => {
        form.reset();
        setMessage(null);
      }, 3000);
    },
    onError: (error) => {
      console.log('useConfirmResetPassword: Mutation error', error);
      const errorMessage = error.message || 'Failed to reset password';
      setMessage(`Failed to reset password: ${errorMessage}`);
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => setMessage(null));
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (data: FormValues, onSwitchToLogin: () => void) => {
    console.log('useConfirmResetPassword: Submitting', data);
    const isValid = await form.trigger();
    if (!isValid) {
      console.log('useConfirmResetPassword: Form validation failed');
      return;
    }

    try {
      await resetMutation.mutateAsync({ token: data.token, newPassword: data.newPassword });
      onSwitchToLogin(); // Switch to login after success
    } catch (error) {
      console.log('useConfirmResetPassword: Mutation error', error);
    }
  };

  return {
    form,
    message,
    isPending: resetMutation.isPending,
    handleSubmit,
  };
};