import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserManagementPage from '../UserManagementPage';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'dashboard.userManagement.title': 'User Management',
          'dashboard.userManagement.createUser': 'Create User',
          'dashboard.userManagement.emailLabel': 'Email',
          'dashboard.userManagement.loginLabel': 'Login',
          'dashboard.userManagement.passwordLabel': 'Password',
          'profile.edit.validation.emailRequired': 'Email is required',
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
      user: { id: 'admin', role: 'ADMIN', login: 'admin' },
      isAuthenticated: true,
    };
    return selector ? selector(state) : state;
  },
}));

// Mock API
vi.mock('../../api/user', () => ({
  userAdminApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  userSearchApi: {},
  balanceAdminApi: {},
}));

// Mock Pricing Config
vi.mock('../../api/config', () => ({
  configApi: {
    getConfig: vi.fn().mockResolvedValue({ markupPercentage: 0.1 }),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error if email is missing when creating user', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard/users']}>
          <Routes>
            <Route path="/dashboard/users" element={<UserManagementPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Open create modal - use the one in the header
    const openModalBtn = screen.getByRole('button', { name: /Create User/i });
    fireEvent.click(openModalBtn);

    // Now there should be another "Create User" button inside the modal
    // We can find the submit button which is type="submit"
    const submitBtn = screen.getAllByRole('button', { name: /Create User/i }).find(btn => btn.getAttribute('type') === 'submit');
    if (!submitBtn) throw new Error('Submit button not found');
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });
});
