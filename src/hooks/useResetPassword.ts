// src/hooks/useResetPassword.ts
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type FormValues = z.infer<typeof formSchema>;

interface UseResetPasswordReturn {
  form: ReturnType<typeof useForm<FormValues>>;
  message: string | null;
  isPending: boolean;
  handleSubmit: (data: FormValues) => Promise<void>;
}

export const useResetPassword = (): UseResetPasswordReturn => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (data: FormValues) => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    // Placeholder: Simulate successful mutation
    setMessage('Reset link sent to your email');
    form.reset();
  };

  return {
    form,
    message,
    isPending: false, // Will be updated with actual mutation state
    handleSubmit,
  };
};