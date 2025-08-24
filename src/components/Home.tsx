// src/components/Home.tsx
import { useAuthStore } from '../store/authStore';

function Home() {
  const { isLoggedIn } = useAuthStore();

  return (
    <div>
      <h1>Welcome to Weight Tracker</h1>
      {isLoggedIn ? (
        <>
          <p data-testid="login-message">Login successful!</p>
        </>
      ) : (
        <p>Please log in to continue.</p>
      )}
    </div>
  );
}

export default Home;