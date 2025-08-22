// src/components/Register.tsx
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRegister } from '../hooks/useRegister';

interface RegisterProps {
  className?: string;
  onSwitchToLogin: () => void;
}

function Register({ className, onSwitchToLogin }: RegisterProps) {
  const { form, isRegistering, handleRegister, handleSwitchToLogin, message } = useRegister(onSwitchToLogin);

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card>
        <CardHeader className="px-6">
          <CardTitle role="heading" aria-level={1}>
            Create an account
          </CardTitle>
          <CardDescription>
            Enter your email and password to register
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-0">
          {message && (
            <div data-testid="register-message" className="mb-4 text-center text-sm text-red-500">
              {message}
            </div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleRegister)}
              data-testid="register-form"
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
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    data-testid="register-button"
                    disabled={isRegistering}
                  >
                    {isRegistering ? 'Registering...' : 'Register'}
                  </Button>
                </div>
              </div>
              <div className="mt-8 text-center text-sm">
                Already have an account?{' '}
                <a
                  href="#"
                  role="link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSwitchToLogin();
                  }}
                  className="underline underline-offset-4"
                  data-testid="login-link"
                >
                  Log in
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Register;