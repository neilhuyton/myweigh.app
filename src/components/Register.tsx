import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRegister } from '../hooks/useRegister';
import { useRouter } from '@tanstack/react-router';
import { Logo } from './Logo'; // Adjust the import path based on your project structure

interface RegisterProps {
  className?: string;
}

function Register({ className }: RegisterProps) {
  const router = useRouter();
  const { form, message, isRegistering, handleRegister } = useRegister(() =>
    router.navigate({ to: '/login' })
  );

  return (
    <div className={cn('min-h-[100dvh] flex flex-col items-center p-1 sm:p-2 lg:p-3', className)}>
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
            Create an account
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            Enter your details below to create an account
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleRegister)}
              data-testid="register-form"
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
                            disabled={isRegistering}
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
                        <Label htmlFor="password" data-testid="password-label">
                          Password
                        </Label>
                        <FormControl>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            data-testid="password-input"
                            disabled={isRegistering}
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
                    data-testid="register-message"
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
                Already have an account?{' '}
                <a
                  href="#"
                  role="link"
                  onClick={(e) => {
                    e.preventDefault();
                    router.navigate({ to: '/login' });
                  }}
                  className="underline underline-offset-4"
                  data-testid="login-link"
                >
                  Login
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
          data-testid="register-button"
          disabled={isRegistering}
          onClick={form.handleSubmit(handleRegister)}
        >
          {isRegistering ? 'Registering...' : 'Register'}
        </Button>
      </div>
    </div>
  );
}

export default Register;