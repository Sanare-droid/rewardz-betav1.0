import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../utils';
import Login from '@/pages/Login';

// Mock the useUser hook
const mockLogin = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('@/context/UserContext', () => ({
  useUser: () => ({
    login: mockLogin,
    resetPassword: mockResetPassword,
  }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<Login />);
    
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('janedoe@gmail.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    render(<Login />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Enter your email to reset password')).toBeInTheDocument();
    });
  });

  it('calls login function with correct credentials', async () => {
    mockLogin.mockResolvedValue(undefined);
    
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('janedoe@gmail.com');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValue(new Error(errorMessage));
    
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('janedoe@gmail.com');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles password reset', async () => {
    mockResetPassword.mockResolvedValue(undefined);
    
    render(<Login />);
    
    const forgotPasswordLink = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordLink);

    const emailInput = screen.getByPlaceholderText('janedoe@gmail.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(forgotPasswordLink);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });
});
