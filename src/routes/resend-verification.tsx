import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import {
  ResendVerificationForm,
  type ResendVerificationFormValues,
} from "@steel-cut/steel-lib";
import { useState } from "react";

export const Route = createFileRoute("/resend-verification")({
  component: ResendVerificationPage,
});

function ResendVerificationPage() {
  const navigate = Route.useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async (values: ResendVerificationFormValues) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: values.email,
      });

      if (error) {
        return { error };
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center p-1 sm:p-2 lg:p-3">
      <ResendVerificationForm
        onSubmit={handleResend}
        onLogin={() => navigate({ to: "/login" })}
        onSignUp={() => navigate({ to: "/register" })}
        isLoading={isLoading}
        className="mt-16 sm:mt-20"
      />
    </div>
  );
}