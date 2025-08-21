// src/components/Register.tsx
import { useRegister } from "../hooks/useRegister";

interface RegisterProps {
  onSwitchToLogin: () => void;
}

function Register({ onSwitchToLogin }: RegisterProps) {
  const {
    email,
    password,
    isRegistering,
    isSuccess,
    isError,
    error,
    handleRegister,
    handleEmailChange,
    handlePasswordChange,
    handleSwitchToLogin,
  } = useRegister(onSwitchToLogin);

  return (
    <div className="form-container">
      <h2>User Registration</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your password"
          required
        />
        <button type="submit" disabled={isRegistering}>
          {isRegistering ? "Registering..." : "Register"}
        </button>
      </form>
      {isSuccess && <p>Registration successful!</p>}
      {isError && <p>Registration failed: {error?.message}</p>}
      <p>
        Already have an account?{" "}
        <button type="button" onClick={handleSwitchToLogin}>
          Log in
        </button>
      </p>
    </div>
  );
}

export default Register;
