import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PartDetailPage from '../PartDetailPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { role: 'ADMIN' } }),
}));

// mockPart will be defined inside tests or vi.mock directly

vi.mock('../../../api/product', () => ({
  productApi: {
    getById: vi.fn().mockResolvedValue({
      id: '1',
      createdTs: '2024-01-15T10:30:00',
      updatedTs: '2024-01-20T14:45:30',
      article: 'ART-001',
      name: 'Test Engine Part',
      weight: 12.5,
      minCount: 3,
      storageCount: 10,
      returnPart: 2.5,
      price: 150,
      currency: 'EUR',
      realPrice: 120,
      realCurrency: 'USD',
      brand: 'TestBrand',
    }),
    update: vi.fn().mockResolvedValue(undefined),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithRouter(partId: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/dashboard/parts/${partId}`]}>
        <Routes>
          <Route path="/dashboard/parts/:partId" element={<PartDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PartDetailPage', () => {
  it('renders part name and article', async () => {
    renderWithRouter('1');

    const partNames = await screen.findAllByText('Test Engine Part');
    expect(partNames.length).toBeGreaterThan(0);

    expect(screen.getAllByText(/ART-001/).length).toBeGreaterThan(0);
  });

  it('displays read-only info fields', async () => {
    renderWithRouter('1');

    await screen.findAllByText('Test Engine Part');

    expect(screen.getByText('TestBrand')).toBeInTheDocument();
    expect(screen.getByText('12.5 kg')).toBeInTheDocument();
  });

  it('shows editable fields with current values', async () => {
    renderWithRouter('1');

    await screen.findAllByText('Test Engine Part');

    // Check that input fields exist with the part's values
    const priceInput = screen.getByDisplayValue('150');
    expect(priceInput).toBeInTheDocument();

    const currencyInput = screen.getByDisplayValue('EUR');
    expect(currencyInput).toBeInTheDocument();
  });

  it('shows save button', async () => {
    renderWithRouter('1');

    await screen.findAllByText('Test Engine Part');

    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeInTheDocument();
  });

  it('shows real price in sidebar when available', async () => {
    renderWithRouter('1');

    await screen.findAllByText('Test Engine Part');

    expect(screen.getByText('120 USD')).toBeInTheDocument();
  });
});
