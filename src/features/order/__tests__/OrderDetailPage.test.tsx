import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderDetailPage from '../OrderDetailPage';

// Mock translations
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'orders.loadingOrder': 'Loading order...',
          'orders.notFoundTitle': 'Order Not Found',
          'orders.notFoundSubtitle': 'The order you are looking for does not exist.',
          'orders.backToHistory': 'Back to History',
          'orders.payBox': 'Pay Box',
          'orders.payNow': 'Pay Now',
          'orders.total': 'Total',
          'orders.items': 'Items',
          'orders.summary': 'Summary',
          'orders.subtotal': 'Subtotal',
          'orders.shipping': 'Shipping',
          'orders.orderPaidTitle': 'Paid',
          'orders.paymentRequiredTitle': 'Payment Required',
        };
        return translations[key] || key;
      },
    }),
  };
});

// Mock API
const mockGetOrder = vi.fn();
const mockPayOrder = vi.fn();
const mockPayOrderProduct = vi.fn();

vi.mock('../../../api/order', () => ({
  orderApi: {
    getOrder: (...args: any[]) => mockGetOrder(...args),
    payOrder: (...args: any[]) => mockPayOrder(...args),
    payOrderProduct: (...args: any[]) => mockPayOrderProduct(...args),
  },
  OrderStatus: {
    CONFIRMATION_WAITING: 'CONFIRMATION_WAITING',
    PAYMENT_WAITING: 'PAYMENT_WAITING',
    ORDERED: 'ORDERED',
    ON_WAY: 'ON_WAY',
    IN_WAREHOUSE: 'IN_WAREHOUSE',
    READY_FOR_PICKUP: 'READY_FOR_PICKUP',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders order detail page and lists unpaid boxes with Pay Box buttons', async () => {
    mockGetOrder.mockResolvedValue({
      id: 'order-1',
      number: 123,
      status: 'PAYMENT_WAITING',
      paid: false,
      createdTs: new Date().toISOString(),
      orderProducts: [
        {
          id: 'prod-1',
          paid: false,
          partsCount: 1,
          price: 100.0,
          currency: 'EUR',
          status: 'CREATED',
          part: {
            name: 'Spark Plug',
            article: 'SP-999',
          },
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/orders/order-1']}>
          <Routes>
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Spark Plug')).toBeInTheDocument();
    });

    // Verify presence of box level payment button and text
    expect(screen.getByText('Pay Box')).toBeInTheDocument();
    expect(screen.getByText('Pay Now')).toBeInTheDocument();
  });

  it('calls payOrderProduct API when Pay Box button is clicked', async () => {
    mockGetOrder.mockResolvedValue({
      id: 'order-1',
      number: 123,
      status: 'PAYMENT_WAITING',
      paid: false,
      createdTs: new Date().toISOString(),
      orderProducts: [
        {
          id: 'prod-1',
          paid: false,
          partsCount: 1,
          price: 100.0,
          currency: 'EUR',
          status: 'CREATED',
          part: {
            name: 'Spark Plug',
            article: 'SP-999',
          },
        },
      ],
    });
    mockPayOrderProduct.mockResolvedValue({});

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/orders/order-1']}>
          <Routes>
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Spark Plug')).toBeInTheDocument();
    });

    const payBoxBtn = screen.getByText('Pay Box');
    fireEvent.click(payBoxBtn);

    await waitFor(() => {
      expect(mockPayOrderProduct).toHaveBeenCalledWith('prod-1', expect.any(Object));
    });
  });

  it('does not display Pay Box button if box is already paid', async () => {
    mockGetOrder.mockResolvedValue({
      id: 'order-1',
      number: 123,
      status: 'PAYMENT_WAITING',
      paid: false,
      createdTs: new Date().toISOString(),
      orderProducts: [
        {
          id: 'prod-1',
          paid: true,
          partsCount: 1,
          price: 100.0,
          currency: 'EUR',
          status: 'CREATED',
          part: {
            name: 'Spark Plug',
            article: 'SP-999',
          },
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/orders/order-1']}>
          <Routes>
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Spark Plug')).toBeInTheDocument();
    });

    expect(screen.queryByText('Pay Box')).not.toBeInTheDocument();
  });
});
