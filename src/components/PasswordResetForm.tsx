import { LockIcon } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { LoadingSpinner } from "./LoadingSpinner";

function PasswordResetForm() {
  const {
    passwordForm,
    passwordMessage,
    isPasswordPending,
    handlePasswordSubmit,
  } = useProfile();

  const isPasswordError =
    passwordMessage &&
    passwordForm.formState.isSubmitted &&
    !isPasswordPending &&
    passwordMessage !== "Reset link sent to your email";

  return (
    <form
      onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
      className="space-y-4"
      data-testid="password-form"
    >
      <h2 className="text-lg font-semibold">Change Password</h2>
      <div className="flex items-center space-x-2">
        <LockIcon className="h-5 w-5 text-primary" data-testid="lock-icon" />
        <input
          type="email"
          placeholder="Enter your email to reset password"
          {...passwordForm.register("email")}
          className="flex-1 p-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Email for password reset"
          data-testid="password-input"
        />
      </div>
      {passwordForm.formState.errors.email && (
        <p className="text-red-500 text-sm" data-testid="password-error">
          {passwordForm.formState.errors.email.message}
        </p>
      )}
      {isPasswordPending && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" testId="password-loading" />
        </div>
      )}
      {passwordMessage && !isPasswordPending && (
        <p
          className={`text-sm ${
            isPasswordError ? "text-red-500" : "text-green-500"
          }`}
          data-testid={isPasswordError ? "password-error" : "password-success"}
        >
          {passwordMessage}
        </p>
      )}
      <button
        type="submit"
        className="w-full p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors disabled:opacity-50"
        disabled={isPasswordPending}
        data-testid="password-submit"
      >
        {isPasswordPending ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}

export default PasswordResetForm;
