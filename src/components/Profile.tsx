// src/components/Profile.tsx
import { Link } from "@tanstack/react-router";

function Profile() {
  return (
    <div className="min-h-screen p-4 sm:p-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <p className="mb-4">This is your profile page.</p>
      <Link
        to="/"
        className="text-primary hover:underline"
        aria-label="Back to Home"
      >
        Back to Home
      </Link>
    </div>
  );
}

export default Profile;
