// src/components/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { trpc } from '../trpc';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

function VerifyEmail() {
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
    if (token && !isVerifying && !verifyEmailMutation.isPending) {
      setIsVerifying(true);
      verifyEmailMutation.mutate({ token });
    } else if (!token) {
      setMessage('No verification token provided');
    }
  }, [token, isVerifying, verifyEmailMutation]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-1 sm:p-2 lg:p-3">
      {/* Logo with spacing above */}
      <div className="pt-14">
        <Logo />
      </div>
      {/* Card with adjusted top margin */}
      <div className="w-full max-w-md bg-background rounded-lg p-4 flex flex-col items-center mt-16 sm:mt-20">
        <h1
          className="text-2xl font-bold text-center mb-4"
          role="heading"
          aria-level={1}
        >
          Email Verification
        </h1>
        <div className="flex flex-col gap-6 w-full">
          {isVerifying && (
            <p className="text-center text-lg" data-testid="verifying-message">
              Verifying your email...
            </p>
          )}
          {message && (
            <p
              className={cn(
                'text-sm text-center',
                message.includes('successfully') ? 'text-green-500' : 'text-red-500'
              )}
              data-testid="verify-message"
            >
              {message}
            </p>
          )}
          {message?.includes('successfully') && (
            <Button asChild className="w-full mt-4" data-testid="go-to-login-button">
              <Link to="/login">Go to Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;