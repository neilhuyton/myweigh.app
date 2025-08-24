// src/components/ConfirmResetPasswordForm.tsx
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useConfirmResetPassword } from '../hooks/useConfirmResetPassword';
import { router } from '../router';

interface ConfirmResetPasswordFormProps {
  className?: string;
}

function ConfirmResetPasswordForm({ className }: ConfirmResetPasswordFormProps) {
  const { form, message, isPending, handleSubmit } = useConfirmResetPassword();

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card>
        <CardHeader className="px-6">
          <CardTitle role="heading" aria-level={1}>
            Reset your password
          </CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => handleSubmit(data, () => router.navigate({ to: '/login' })))}
              role="form"
              data-testid="confirm-reset-password-form"
            >
              <div className="flex flex-col gap-6">
                {message && (
                  <p
                    role="alert"
                    data-testid="confirm-reset-password-message"
                    className={cn(
                      'text-sm',
                      message.toLowerCase().includes('failed') ? 'text-red-500' : 'text-green-500'
                    )}
                  >
                    {message}
                  </p>
                )}
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="newPassword" data-testid="password-label">
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
                            {...field}
                          />
                        </FormControl>
                        <FormMessage data-testid="password-error" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    data-testid="reset-password-button"
                    disabled={isPending}
                  >
                    {isPending ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
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
                  >
                    Back to login
                  </a>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConfirmResetPasswordForm;