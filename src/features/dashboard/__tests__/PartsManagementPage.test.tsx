import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PartsManagementPage from '../PartsManagementPage';
import { productApi } from '../../../api/product';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, _opts: any) => typeof _opts === 'string' ? _opts : key }),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { role: 'ADMIN' } }),
}));

vi.mock('../../../api/product', () => ({
  productApi: {
    getAll: vi.fn().mockResolvedValue({
      content: [],
      totalPages: 0,
      last: true,
    }),
    search: vi.fn().mockResolvedValue([
      { id: '1', name: 'Test Part', article: '123', brand: 'Test Brand', price: 100, currency: 'EUR', realPrice: 85.50, realCurrency: 'USD', minCount: 1, storageCount: 5 }
    ]),
    uploadCsv: vi.fn(),
  }
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PartsManagementPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('PartsManagementPage', () => {
  it('renders the header and search prompt when no search is active', () => {
    renderPage();
    expect(screen.getByText(/Parts Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Search for Parts/i)).toBeInTheDocument();
  });

  it('shows parts after a search is submitted', async () => {
    renderPage();

    const input = screen.getByPlaceholderText(/Search by article/i);
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    const partName = await screen.findByText('Test Part');
    expect(partName).toBeInTheDocument();
  });

  it('displays realPrice and realCurrency when available', async () => {
    renderPage();

    const input = screen.getByPlaceholderText(/Search by article/i);
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    const realPrice = await screen.findByText(/85.5 USD/);
    expect(realPrice).toBeInTheDocument();

    const calcPrice = await screen.findByText(/Calc: 100 EUR/);
    expect(calcPrice).toBeInTheDocument();
  });

  it('opens add part modal on button click', async () => {
    renderPage();

    const addButton = screen.getByText(/Add Part/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Create Part/i)).toBeInTheDocument();
    });
  });

  describe('CSV Upload', () => {
    it('shows success summary after successful upload', async () => {
      vi.mocked(productApi.uploadCsv).mockResolvedValue({
        saved: 5,
        updated: 2,
        skipped: 0,
        skippedDetails: []
      });

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /Upload CSV\/TXT/i }));

      const file = new File(['article;name\n123;Part'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]');
      fireEvent.change(input!, { target: { files: [file] } });

      fireEvent.click(screen.getByText('dashboard.partsUpload.uploadButton'));

      await waitFor(() => {
        const savedCard = screen.getByText('Saved').closest('.card');
        expect(savedCard).toHaveTextContent('5');
        
        const updatedCard = screen.getByText('Updated').closest('.card');
        expect(updatedCard).toHaveTextContent('2');
        
        const skippedCard = screen.getByText('Skipped').closest('.card');
        expect(skippedCard).toHaveTextContent('0');
      });
    });

    it('shows error details after partial success upload (207)', async () => {
      vi.mocked(productApi.uploadCsv).mockResolvedValue({
        saved: 1,
        updated: 0,
        skipped: 1,
        skippedDetails: [
          { rowNumber: 2, errorMessage: 'Missing price', rawData: '124;Broken Part;;' }
        ]
      });

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /Upload CSV\/TXT/i }));

      const file = new File(['article;name\n123;Part'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]');
      fireEvent.change(input!, { target: { files: [file] } });

      fireEvent.click(screen.getByText('dashboard.partsUpload.uploadButton'));

      await waitFor(() => {
        const savedCard = screen.getByText('Saved').closest('.card');
        expect(savedCard).toHaveTextContent('1');
        
        expect(screen.getByText('Missing price')).toBeInTheDocument();
        expect(screen.getByText(/124;Broken Part/)).toBeInTheDocument();
      });
    });
  });
});
