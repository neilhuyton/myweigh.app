// src/hooks/useVerifyEmail.ts
import { useEffect, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { trpc } from '../trpc';
import { toast } from 'sonner';

interface VerifyEmailResult {
  message: string | null;
  isVerifying: boolean;
}

export function useVerifyEmail() {
  const { token } = useSearch({ from: '/verify-email' });
  const [message, setMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyEmailMutation = trpc.verifyEmail.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
      toast.success('Email Verification', {
        description: data.message,
        action: {
          label: 'Go to Login',
          onClick: () => (window.location.href = '/'),
        },
        duration: 5000,
        className: 'verify-email-toast',
      });
    },
    onError: (error) => {
      setMessage(`Verification failed: ${error.message}`);
      toast.error('Verification Failed', {
        description: error.message,
        action: {
          label: 'Try Again',
          onClick: () => setMessage(null),
        },
        duration: 5000,
        className: 'verify-email-toast',
      });
    },
    onSettled: () => {
      setIsVerifying(false);
    },
  });

  useEffect(() => {
    if (token) {
      setIsVerifying(true);
      verifyEmailMutation.mutate({ token });
    } else {
      setMessage('No verification token provided');
      setIsVerifying(false);
    }
  }, [token]);

  return { message, isVerifying };
}