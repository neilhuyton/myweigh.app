// src/components/ProfileIcon.tsx
import { Link } from "@tanstack/react-router";
import { UserIcon } from "lucide-react";

function ProfileIcon() {
  return (
    <Link
      to="/profile"
      className="fixed top-4 right-4 z-50 flex items-center justify-center rounded-full p-2 bg-gray-800 dark:bg-white text-white dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
      aria-label="User Profile"
      data-testid="profile-icon"
    >
      <UserIcon className="h-6 w-6" />
    </Link>
  );
}
export default ProfileIcon;
