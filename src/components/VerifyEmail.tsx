import { useEffect, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { trpc } from '../trpc';
import { toast } from 'sonner';

function VerifyEmail() {
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
          onClick: () => window.location.href = '/',
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
    }
  }, [token]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
        <Card className="w-full max-w-md shadow-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isVerifying && <p className="text-center text-lg">Verifying your email...</p>}
            {message && (
              <p
                className={`text-center text-sm font-medium ${
                  message.includes('successfully') ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {message}
              </p>
            )}
            {!isVerifying && message?.includes('successfully') && (
              <Button asChild className="w-full">
                <Link to="/">Go to Login</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default VerifyEmail;