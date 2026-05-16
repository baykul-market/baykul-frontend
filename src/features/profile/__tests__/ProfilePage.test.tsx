import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '../ProfilePage';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'profile.tabs.edit': 'Edit Profile',
          'profile.edit.email': 'Email',
          'profile.edit.emailPlaceholder': 'your@email.com',
          'profile.edit.validation.emailRequired': 'Email is required',
          'profile.edit.saveChanges': 'Save Changes',
        };
        return translations[key] || key;
      },
    }),
  };
});

// Mock AuthStore
vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    const state = {
      user: {
        id: '1',
        login: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        createdTs: new Date().toISOString(),
        profile: { name: 'Test', surname: 'User' },
      },
      isAuthenticated: true,
      setUser: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error if email is invalid in edit tab', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/profile?tab=edit']}>
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (!emailInput) {
      screen.debug();
      throw new Error('Email input not found');
    }
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    
    // Attempt to save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // It might be translated or not, let's try both
      const errorMsg = screen.queryByText(/invalid email address|emailinvalid/i);
      expect(errorMsg).toBeInTheDocument();
    });
  });
});
