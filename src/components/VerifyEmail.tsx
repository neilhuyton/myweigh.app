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
  }, [token]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-1 sm:p-2 lg:p-3">
      {/* Logo with spacing above */}
      <div className="pt-14">
        <Logo />
      </div>
      {/* Content centered in the middle */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-md bg-background rounded-lg p-4 flex flex-col items-center">
          <h1
            className="text-2xl font-bold text-center mb-4"
            role="heading"
            aria-level={1}
          >
            Email Verification
          </h1>
          <div className="space-y-6 w-full">
            {isVerifying && (
              <p className="text-center text-lg" data-testid="verifying-message">
                Verifying your email...
              </p>
            )}
            {message && (
              <p
                className={cn(
                  'text-center text-sm font-medium',
                  message.includes('successfully') ? 'text-green-500' : 'text-red-500'
                )}
                data-testid="verify-message"
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Button at the bottom */}
      {message?.includes('successfully') && (
        <div className="w-full max-w-md px-4 pb-4 mt-12">
          <Button asChild className="w-full" data-testid="go-to-login-button">
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;