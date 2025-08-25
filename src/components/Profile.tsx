// src/components/Profile.tsx
import { Link } from "@tanstack/react-router";
import { MailIcon, LockIcon, LogOutIcon } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "@tanstack/react-router";

function Profile() {
  const {
    emailForm,
    passwordForm,
    emailMessage,
    passwordMessage,
    isEmailPending,
    isPasswordPending,
    handleEmailSubmit,
    handlePasswordSubmit,
  } = useProfile();
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-background text-foreground flex flex-col items-center">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-2xl font-bold text-center">User Profile</h1>

        {/* Email Update Form */}
        <form
          onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
          className="space-y-4"
          data-testid="email-form"
        >
          <h2 className="text-lg font-semibold">Change Email</h2>
          <div className="flex items-center space-x-2">
            <MailIcon className="h-5 w-5 text-primary" />
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
          {emailMessage && (
            <p
              className={`text-sm ${
                emailMessage.includes("failed")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
              data-testid={
                emailMessage.includes("failed")
                  ? "email-error"
                  : "email-success"
              }
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

        {/* Password Reset Form */}
        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
          className="space-y-4"
          data-testid="password-form"
        >
          <h2 className="text-lg font-semibold">Change Password</h2>
          <div className="flex items-center space-x-2">
            <LockIcon className="h-5 w-5 text-primary" />
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
          {passwordMessage && (
            <p
              className={`text-sm ${
                passwordMessage.includes("failed")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
              data-testid={
                passwordMessage.includes("failed")
                  ? "password-error"
                  : "password-success"
              }
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

        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="text-primary hover:underline"
            aria-label="Back to Home"
          >
            Back to Home
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors"
            data-testid="logout-button"
          >
            <LogOutIcon className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
