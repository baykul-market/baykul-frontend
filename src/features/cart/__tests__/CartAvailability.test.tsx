import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CartPage from '../CartPage';
import { cartApi } from '../../../api/cart';
import { orderApi } from '../../../api/order';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../../../api/client', () => ({ getLocalizedError: (message: string) => message }));
vi.mock('../../../api/cart', () => ({ cartApi: { getCart: vi.fn(), removeFromCart: vi.fn(), updateCartProduct: vi.fn(), addToCart: vi.fn() } }));
vi.mock('../../../api/order', () => ({ orderApi: { createOrder: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

beforeEach(() => vi.clearAllMocks());
it('retains unavailable items, blocks checkout and lets the customer remove them', async () => {
  vi.mocked(cartApi.getCart).mockResolvedValue({ id: 'cart', cartProducts: [{ id: 'line', partsCount: 1,
    part: { id: 'part', article: 'A', brand: 'BMW', name: 'Unavailable part', available: false, price: 10, currency: 'EUR' } }] } as any);
  vi.mocked(cartApi.removeFromCart).mockResolvedValue({ delete_cart_product: 'true' });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><CartPage /></MemoryRouter></QueryClientProvider>);
  expect(await screen.findByText('Unavailable part')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('sources.cartUnavailable');
  expect(screen.getByRole('button', { name: 'cart.checkout' })).toBeDisabled();
  expect(orderApi.createOrder).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'cart.remove' }));
  await waitFor(() => expect(cartApi.removeFromCart).toHaveBeenCalledWith('line', expect.anything()));
});
