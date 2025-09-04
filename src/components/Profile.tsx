import { Link } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import EmailUpdateForm from "./EmailUpdateForm";
import PasswordResetForm from "./PasswordResetForm";

function Profile() {
  const { handleLogout } = useProfile();

  return (
    <div className="p-4 sm:p-6 bg-background text-foreground flex flex-col items-center overflow-auto">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-2xl font-bold text-center">User Profile</h1>
        <EmailUpdateForm />
        <PasswordResetForm />
        <div className="flex justify-between items-center">
          <Link
            to="/weight"
            className="text-primary hover:underline"
            aria-label="Back to Home"
            data-testid="back-to-weight-link"
          >
            Back to Weight
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors"
            data-testid="logout-button"
          >
            <LogOutIcon className="h-5 w-5 mr-2" data-testid="logout-icon" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
