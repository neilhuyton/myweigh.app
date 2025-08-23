// __tests__/ResetPasswordForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPasswordForm from '../src/components/ResetPasswordForm';
import '@testing-library/jest-dom';

describe('ResetPasswordForm Component', () => {
  const setup = (onSwitchToLogin: () => void = vi.fn()) => {
    render(<ResetPasswordForm onSwitchToLogin={onSwitchToLogin} />);
    return { onSwitchToLogin };
  };

  it('renders password reset form with email input, submit button, and back to login link', () => {
    const { onSwitchToLogin } = setup();

    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();
    expect(screen.getByText('Enter your email to receive a password reset link')).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to login' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Back to login' }));
    expect(onSwitchToLogin).toHaveBeenCalled();
  });

  it('submits email and displays success message', async () => {
    const { onSwitchToLogin } = setup();

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

    fireEvent.change(emailInput, { target: { value: 'testuser@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Reset link sent to your email');
    }, { timeout: 5000 });
  });
});