// src/hooks/useVerifyEmail.ts
import { useEffect, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { trpc } from '../trpc';

export function useVerifyEmail() {
  const { token } = useSearch({ from: '/verify-email' });
  const [message, setMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyEmailMutation = trpc.verifyEmail.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
      setIsVerifying(false);
    },
    onError: (error) => {
      setMessage(`Verification failed: ${error.message}`);
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