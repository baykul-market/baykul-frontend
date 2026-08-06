import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductListPage from '../ProductListPage';
import { productApi } from '../../../api/product';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../api/product', () => ({
  productApi: {
    search: vi.fn(),
  },
}));

vi.mock('../../../api/cart', () => ({
  cartApi: {
    addToCart: vi.fn(),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProductListPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('ProductListPage search debouncing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and initial products', async () => {
    const mockProducts = [
      { id: '1', name: 'Oil Filter', article: '123', brand: 'BMW', price: 20, currency: 'EUR' },
    ] as any;
    vi.mocked(productApi.search).mockResolvedValue(mockProducts);

    renderPage();

    await waitFor(() => {
      expect(productApi.search).toHaveBeenCalledWith('');
      expect(screen.getByText('Oil Filter')).toBeInTheDocument();
    });
  });

  it('debounces search input before firing API request', async () => {
    const mockProductsInitial = [
      { id: '1', name: 'Oil Filter', article: '123', brand: 'BMW', price: 20, currency: 'EUR' },
    ] as any;
    const mockProductsSearchResult = [
      { id: '2', name: 'Spark Plug', article: '456', brand: 'Bosch', price: 15, currency: 'EUR' },
    ] as any;

    vi.mocked(productApi.search)
      .mockResolvedValueOnce(mockProductsInitial)
      .mockResolvedValueOnce(mockProductsSearchResult);

    renderPage();

    await waitFor(() => {
      expect(productApi.search).toHaveBeenCalledWith('');
    });

    const searchInput = screen.getByPlaceholderText('products.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'spark' } });

    // Immediate check: search API should NOT be called again immediately
    expect(productApi.search).toHaveBeenCalledTimes(1);

    // Wait for debounced search API call (1.2s delay)
    await waitFor(
      () => {
        expect(productApi.search).toHaveBeenCalledWith('spark');
        expect(productApi.search).toHaveBeenCalledTimes(2);
      },
      { timeout: 2500 }
    );
  });
});
