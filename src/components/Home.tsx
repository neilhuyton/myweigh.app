// src/components/Home.tsx
import LoginForm from './LoginForm';
import Register from './Register';
import ResetPasswordForm from './ResetPasswordForm'; // Add import
import { useAuthView } from '../hooks/useAuthView';

function Home() {
  const { isLoggedIn, showLogin, showReset, switchToRegister, switchToLogin, switchToReset } =
    useAuthView();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {isLoggedIn ? (
          <p className="text-center text-lg text-gray-700">Login successful!</p>
        ) : (
          <div>
            {showReset ? (
              <ResetPasswordForm onSwitchToLogin={switchToLogin} />
            ) : showLogin ? (
              <LoginForm
                onSwitchToRegister={switchToRegister}
                onSwitchToReset={switchToReset}
              />
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