// src/components/VerifyEmail.tsx
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useVerifyEmail } from "../hooks/useVerifyEmail";
import { LoadingSpinner } from "./LoadingSpinner";

function VerifyEmail() {
  const { message, isVerifying, isSuccess } = useVerifyEmail();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-1 sm:p-2 lg:p-3">
      <div className="pt-14">
        <Logo />
      </div>
      <div className="w-full max-w-md bg-background rounded-lg p-4 flex flex-col items-center mt-16 sm:mt-20">
        <h1
          className="text-2xl font-bold text-center mb-4"
          role="heading"
          aria-level={1}
        >
          Email Verification
        </h1>
        <div className="flex flex-col gap-6 w-full">
          {isVerifying && (
            <div className="py-4">
              <LoadingSpinner size="md" testId="verify-email-loading" />
            </div>
          )}
          {message && (
            <p
              className={cn(
                "text-sm text-center",
                isSuccess ? "text-green-500" : "text-red-500"
              )}
              data-testid="verify-message"
            >
              {message}
            </p>
          )}
          {isSuccess && (
            <Button
              asChild
              className="w-full mt-4"
              data-testid="go-to-login-button"
            >
              <Link to="/login">Go to Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
