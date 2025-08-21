// src/components/Home.tsx
import LoginForm from "./LoginForm";
import Register from "./Register";
import { useAuthView } from "../hooks/useAuthView";

function Home() {
  const { isLoggedIn, showLogin, switchToRegister, switchToLogin } =
    useAuthView();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {isLoggedIn ? (
          <p className="text-center text-lg text-gray-700">Login successful!</p>
        ) : (
          <div>
            {showLogin ? (
              <LoginForm onSwitchToRegister={switchToRegister} />
            ) : (
              <Register onSwitchToLogin={switchToLogin} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
