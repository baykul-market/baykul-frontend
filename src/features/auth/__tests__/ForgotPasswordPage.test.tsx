import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ForgotPasswordPage from '../ForgotPasswordPage';
import { authApi } from '../../../api/auth';

// Mock translations
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'auth.forgotPassword.title': 'Forgot Password?',
          'auth.forgotPassword.subtitle': 'Enter your login or email',
          'auth.forgotPassword.identifierLabel': 'Login or Email',
          'auth.forgotPassword.identifierPlaceholder': 'Enter your login or email',
          'auth.forgotPassword.sendButton': 'Send Temporary Password',
          'auth.forgotPassword.sending': 'Sending...',
          'auth.forgotPassword.backToLogin': 'Back to login',
          'auth.forgotPassword.successModal.title': 'Email Sent',
          'auth.forgotPassword.successModal.description': 'A temporary password has been sent.',
          'auth.forgotPassword.successModal.button': 'Back to Login',
        };
        return translations[key] || key;
      },
    }),
  };
});

// Mock API
vi.mock('../../../api/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../api/auth')>();
    return {
        ...actual,
        authApi: {
            ...actual.authApi,
            forgotPassword: vi.fn(),
        },
    };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the forgot password form', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByLabelText('Login or Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Temporary Password' })).toBeInTheDocument();
  });

  it('shows validation error if identifier is empty', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send Temporary Password' }));

    await waitFor(() => {
      expect(screen.getByText('Login or Email is required')).toBeInTheDocument();
    });
  });

  it('successfully submits and shows success modal', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue({ message: 'Success' });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your login or email'), {
      target: { value: 'testuser' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Temporary Password' }));

    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith({ identifier: 'testuser' });
    });

    await waitFor(() => {
      expect(screen.getByText('Email Sent')).toBeInTheDocument();
      expect(screen.getByText('A temporary password has been sent.')).toBeInTheDocument();
    });
  });

  it('navigates back to login when clicking the back button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/forgot-password']}>
          <ForgotPasswordPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const backLink = screen.getByText('Back to login');
    expect(backLink).toHaveAttribute('href', '/login');
  });
});
