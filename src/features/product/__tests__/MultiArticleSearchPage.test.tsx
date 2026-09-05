import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MultiArticleSearchPage from '../MultiArticleSearchPage';
import { productApi } from '../../../api/product';
import { cartApi } from '../../../api/cart';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../api/product', () => ({
  productApi: {
    searchByArticles: vi.fn(),
  }
}));

vi.mock('../../../api/cart', () => ({
  cartApi: {
    addToCart: vi.fn(),
  }
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MultiArticleSearchPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('MultiArticleSearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header and input area', () => {
    renderPage();
    expect(screen.getByText('products.multiSearch.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('products.multiSearch.inputPlaceholder')).toBeInTheDocument();
  });

  it('calls searchByArticles with correct articles when search button is clicked', async () => {
    const mockParts = [
      { id: '1', name: 'Part 1', article: 'ART1', brand: 'Brand A', price: 10, currency: 'EUR' },
      { id: '2', name: 'Part 2', article: 'ART2', brand: 'Brand B', price: 20, currency: 'EUR' },
    ] as any;
    vi.mocked(productApi.searchByArticles).mockResolvedValue(mockParts);

    renderPage();

    const textarea = screen.getByPlaceholderText('products.multiSearch.inputPlaceholder');
    fireEvent.change(textarea, { target: { value: 'ART1\nART2 ,  ART3' } });

    const searchButton = screen.getByText('products.multiSearch.searchButton');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(productApi.searchByArticles).toHaveBeenCalledWith(['ART1', 'ART2', 'ART3']);
    });

    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();
  });

  it('shows empty state when no results are found', async () => {
    vi.mocked(productApi.searchByArticles).mockResolvedValue([]);

    renderPage();

    const textarea = screen.getByPlaceholderText('products.multiSearch.inputPlaceholder');
    fireEvent.change(textarea, { target: { value: 'ART_NONE' } });

    fireEvent.click(screen.getByText('products.multiSearch.searchButton'));

    await waitFor(() => {
      expect(screen.getByText('products.noResults')).toBeInTheDocument();
    });
  });

  it('displays all manufacturers and adds the selected UUID for a repeated article', async () => {
    vi.mocked(productApi.searchByArticles).mockResolvedValue([
      { id: 'offer-bmw', name: 'BMW offer', article: 'A', brand: 'BMW', price: 10, currency: 'EUR' },
      { id: 'offer-bosch', name: 'Bosch offer', article: 'A', brand: 'BOSCH', price: 12, currency: 'EUR' },
    ] as any);
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('products.multiSearch.inputPlaceholder'), { target: { value: 'A\nA' } });
    fireEvent.click(screen.getByText('products.multiSearch.searchButton'));
    expect(await screen.findByText('BMW offer')).toBeInTheDocument();
    expect(screen.getByText('Bosch offer')).toBeInTheDocument();
    expect(productApi.searchByArticles).toHaveBeenCalledWith(['A']);
    const row = screen.getByText('Bosch offer').closest('tr')!;
    fireEvent.click(row.querySelector('button')!);
    await waitFor(() => expect(cartApi.addToCart).toHaveBeenCalledWith('offer-bosch', expect.anything()));
  });
});
