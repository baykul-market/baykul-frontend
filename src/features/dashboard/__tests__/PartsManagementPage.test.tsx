import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PartsManagementPage from '../PartsManagementPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, _opts: any) => typeof _opts === 'string' ? _opts : key }),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { role: 'ADMIN' } }),
}));

vi.mock('../../../api/product', () => ({
  productApi: {
    getAll: vi.fn().mockResolvedValue({ 
      content: [
        { id: '1', name: 'Test Part', article: '123', brand: 'Test Brand', price: 100, currency: 'EUR', realPrice: 85.50, realCurrency: 'USD', minCount: 1, storageCount: 5 }
      ], 
      totalPages: 1, 
      last: true 
    }),
    search: vi.fn(),
  }
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('PartsManagementPage', () => {
  it('renders the header and table with parts', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Parts Management/i)).toBeInTheDocument();
    
    const partName = await screen.findByText('Test Part');
    expect(partName).toBeInTheDocument();
  });

  it('displays realPrice and realCurrency when available', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // realPrice should be displayed as the primary price
    const realPrice = await screen.findByText(/85.5 USD/);
    expect(realPrice).toBeInTheDocument();

    // Calculated price should be shown as secondary info
    const calcPrice = await screen.findByText(/Calc: 100 EUR/);
    expect(calcPrice).toBeInTheDocument();
  });

  it('opens add part modal on button click', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    const addButton = screen.getByText(/Add Part/i);
    fireEvent.click(addButton);
    
    // Expect the modal header
  });
});
