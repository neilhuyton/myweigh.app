// src/components/ConfirmResetPasswordForm.tsx
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useConfirmResetPassword } from '../hooks/useConfirmResetPassword';
import { router } from '../router';
import { Logo } from './Logo';

function ConfirmResetPasswordForm() {
  const { form, message, isPending, handleSubmit } = useConfirmResetPassword();

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
            Reset your password
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            Enter your new password below
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                handleSubmit(data, () => router.navigate({ to: '/login' }))
              )}
              role="form"
              data-testid="confirm-reset-password-form"
            >
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <Label
                          htmlFor="newPassword"
                          data-testid="password-label"
                        >
                          New Password
                        </Label>
                        <FormControl>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Enter your new password"
                            required
                            data-testid="password-input"
                            disabled={isPending}
                            tabIndex={1}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage data-testid="password-error" />
                      </FormItem>
                    )}
                  />
                </div>
                {message && (
                  <p
                    role="alert"
                    data-testid="confirm-reset-password-message"
                    className={cn(
                      'text-sm text-center',
                      message.toLowerCase().includes('failed')
                        ? 'text-red-500'
                        : 'text-green-500'
                    )}
                  >
                    {message}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full mt-4"
                  data-testid="reset-password-button"
                  disabled={isPending}
                  tabIndex={2}
                >
                  {isPending ? 'Resetting...' : 'Reset Password'}
                </Button>
                <div className="mt-4 text-center text-sm">
                  <a
                    href="#"
                    role="link"
                    onClick={(e) => {
                      e.preventDefault();
                      router.navigate({ to: '/login' });
                    }}
                    className="underline underline-offset-4"
                    data-testid="back-to-login-link"
                    tabIndex={3}
                  >
                    Back to login
                  </a>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default ConfirmResetPasswordForm;