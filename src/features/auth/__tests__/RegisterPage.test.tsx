import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterPage from '../RegisterPage';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'auth.register.title': 'Create an account',
          'auth.register.email': 'Email',
          'auth.register.emailPlaceholder': 'you@example.com',
          'auth.register.validation.emailRequired': 'Email is required',
          'profile.edit.validation.emailInvalid': 'Invalid email address',
          'auth.register.createAccount': 'Create Account',
        };
        return translations[key] || key;
      },
    }),
  };
});

// Mock PhoneInput since it might be complex to test here
vi.mock('../../components/PhoneInput', () => ({
  default: () => <div data-testid="phone-input" />,
  validatePhone: () => null,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error if email is empty', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('shows validation error if email is invalid', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const emailPlaceholder = 'you@example.com';
    fireEvent.change(screen.getByPlaceholderText(emailPlaceholder), {
      target: { value: 'not-an-email' },
    });
    
    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.queryByText(/invalid email address|emailinvalid/i)).toBeInTheDocument();
    });
  });
});
