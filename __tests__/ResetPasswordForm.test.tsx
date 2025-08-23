// __tests__/ResetPasswordForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetPasswordForm from '../src/components/ResetPasswordForm';
import '@testing-library/jest-dom';

describe('ResetPasswordForm Component', () => {
  const setup = (onSwitchToLogin = vi.fn()) => {
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
});