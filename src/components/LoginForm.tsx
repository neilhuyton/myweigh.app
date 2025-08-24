// src/components/LoginForm.tsx
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLogin } from '../hooks/useLogin';
import { useRouter } from '@tanstack/react-router';
import { Logo } from './Logo';

function LoginForm() {
  const { form, message, isPending, handleSubmit } = useLogin();
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-1 sm:p-2 lg:p-3">
      {/* Logo with spacing above */}
      <div className="pt-14">
        <Logo />
      </div>
      {/* Form centered in the middle */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-md bg-background rounded-lg p-4 flex flex-col items-center">
          <h1
            className="text-2xl font-bold text-center mb-4"
            role="heading"
            aria-level={1}
          >
            Login to your account
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            Enter your email below to login to your account
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              data-testid="login-form"
              className="w-full"
            >
              <div className="flex flex-col gap-6">
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
                {message && (
                  <p
                    data-testid="login-message"
                    className={cn(
                      'text-sm text-center',
                      message.includes('failed') ? 'text-red-500' : 'text-green-500'
                    )}
                  >
                    {message}
                  </p>
                )}
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
        </div>
      </div>
      {/* Submit button at the bottom */}
      <div className="w-full max-w-md px-4 pb-4 mt-12">
        <Button
          type="submit"
          className="w-full"
          data-testid="login-button"
          disabled={isPending}
          onClick={form.handleSubmit(handleSubmit)}
        >
          {isPending ? 'Logging in...' : 'Login'}
        </Button>
      </div>
    </div>
  );
}

export default LoginForm;