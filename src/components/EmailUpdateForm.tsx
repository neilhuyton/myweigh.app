import { MailIcon } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { LoadingSpinner } from "./LoadingSpinner";

function EmailUpdateForm() {
  const { emailForm, emailMessage, isEmailPending, handleEmailSubmit } =
    useProfile();

  const isEmailError =
    emailMessage &&
    emailForm.formState.isSubmitted &&
    !isEmailPending &&
    emailMessage !== "Email updated successfully";

  return (
    <form
      onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
      className="space-y-4"
      data-testid="email-form"
    >
      <h2 className="text-lg font-semibold">Change Email</h2>
      <div className="flex items-center space-x-2">
        <MailIcon className="h-5 w-5 text-primary" data-testid="mail-icon" />
        <input
          type="email"
          placeholder="New email address"
          {...emailForm.register("email")}
          className="flex-1 p-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="New email address"
          data-testid="email-input"
        />
      </div>
      {emailForm.formState.errors.email && (
        <p className="text-red-500 text-sm" data-testid="email-error">
          {emailForm.formState.errors.email.message}
        </p>
      )}
      {isEmailPending && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" testId="email-loading" />
        </div>
      )}
      {emailMessage && !isEmailPending && (
        <p
          className={`text-sm ${
            isEmailError ? "text-red-500" : "text-green-500"
          }`}
          data-testid={isEmailError ? "email-error" : "email-success"}
        >
          {emailMessage}
        </p>
      )}
      <button
        type="submit"
        className="w-full p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors disabled:opacity-50"
        disabled={isEmailPending}
        data-testid="email-submit"
      >
        {isEmailPending ? "Updating..." : "Update Email"}
      </button>
    </form>
  );
}

export default EmailUpdateForm;
