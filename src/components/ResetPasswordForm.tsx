// src/components/ResetPasswordForm.tsx
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
import { useResetPassword } from '../hooks/useResetPassword';

interface ResetPasswordFormProps {
  className?: string;
  onSwitchToLogin: () => void;
}

function ResetPasswordForm({ className, onSwitchToLogin }: ResetPasswordFormProps) {
  const { form, message, isPending, handleSubmit } = useResetPassword();

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card>
        <CardHeader className="px-6">
          <CardTitle role="heading" aria-level={1}>
            Reset your password
          </CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              role="form"
            >
              <div className="flex flex-col gap-6">
                {message && (
                  <p
                    role="alert"
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
                        <Label htmlFor="email">
                          Email
                        </Label>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            disabled={isPending}
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
                    disabled={isPending}
                  >
                    {isPending ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <a
                    href="#"
                    role="link"
                    onClick={(e) => {
                      e.preventDefault();
                      onSwitchToLogin();
                    }}
                    className="underline underline-offset-4"
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

export default ResetPasswordForm;