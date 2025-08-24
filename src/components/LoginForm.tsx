// src/components/LoginForm.tsx
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin } from '../hooks/useLogin';
import { useRouter } from '@tanstack/react-router';

interface LoginFormProps {
  className?: string;
}

function LoginForm({ className }: LoginFormProps) {
  const { form, message, isPending, handleSubmit } = useLogin();
  const router = useRouter();

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card>
        <CardHeader className="px-6">
          <CardTitle role="heading" aria-level={1}>
            Login to your account
          </CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} data-testid="login-form">
              <div className="flex flex-col gap-6">
                {message && (
                  <p
                    data-testid="login-message"
                    className={cn(
                      'text-sm',
                      message.includes('failed') ? 'text-red-500' : 'text-green-500'
                    )}
                  >
                    {message}
                  </p>
                )}
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="email" data-testid="email-label">
                          Email
                        </Label>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            data-testid="email-input"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between leading-none mb-0">
                          <Label htmlFor="password" data-testid="password-label">
                            Password
                          </Label>
                          <a
                            href="#"
                            className="inline-block text-sm underline-offset-0 hover:underline"
                            data-testid="forgot-password-link"
                            onClick={(e) => {
                              e.preventDefault();
                              router.navigate({ to: '/reset-password' });
                            }}
                          >
                            Forgot your password?
                          </a>
                        </div>
                        <FormControl>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            data-testid="password-input"
                            disabled={isPending}
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    data-testid="login-button"
                    disabled={isPending}
                  >
                    {isPending ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </div>
              <div className="mt-8 text-center text-sm">
                Don&apos;t have an account?{' '}
                <a
                  href="#"
                  role="link"
                  onClick={(e) => {
                    e.preventDefault();
                    router.navigate({ to: '/register' });
                  }}
                  className="underline underline-offset-4"
                  data-testid="signup-link"
                >
                  Sign up
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;