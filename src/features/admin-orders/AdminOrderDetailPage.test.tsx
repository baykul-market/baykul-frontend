import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminOrderDetailPage from './AdminOrderDetailPage';

// Mock translations
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: any) => {
        const translations: Record<string, string> = {
          'dashboard.orderManagement.orderDetails': 'Order Details',
          'dashboard.orderManagement.confirmOrderAction': 'Confirm Order',
          'dashboard.orderManagement.confirmOrderInfo': 'Confirming this order will automatically check warehouse stock',
          'status.order.CONFIRMATION_WAITING': 'Awaiting Confirmation',
          'status.order.ORDERED': 'Ordered',
          'common.confirm': 'Confirm',
        };
        if (key === 'dashboard.orderManagement.updateBoxTo') return `Update to ${params.status}`;
        return translations[key] || key;
      },
    }),
  };
});

// Mock AuthStore
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    const state = {
      user: { id: 'admin', role: 'ADMIN', login: 'admin' },
      isAuthenticated: true,
    };
    return selector ? selector(state) : state;
  },
}));

// Mock API
const mockGetOrderById = vi.fn();
const mockConfirmOrder = vi.fn();

vi.mock('../../api/order', () => ({
  orderApi: {
    getOrderById: (...args: any[]) => mockGetOrderById(...args),
    confirmOrder: (...args: any[]) => mockConfirmOrder(...args),
    updateOrder: vi.fn(),
    completeOrder: vi.fn(),
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
  OrderProductStatus: {
    CREATED: 'CREATED',
    TO_ORDER: 'TO_ORDER',
  }
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('AdminOrderDetailPage - Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('shows Confirm Order button when status is CONFIRMATION_WAITING', async () => {
    mockGetOrderById.mockResolvedValue({
      id: 'order-1',
      number: 123,
      status: 'CONFIRMATION_WAITING',
      createdTs: new Date().toISOString(),
      orderProducts: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard/orders/order-1']}>
          <Routes>
            <Route path="/dashboard/orders/:orderId" element={<AdminOrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Confirm Order/i)).toBeInTheDocument();
    });
  });

  it('calls confirmOrder API when Confirm Order button is clicked', async () => {
    mockGetOrderById.mockResolvedValue({
      id: 'order-1',
      number: 123,
      status: 'CONFIRMATION_WAITING',
      createdTs: new Date().toISOString(),
      orderProducts: [],
    });
    mockConfirmOrder.mockResolvedValue({});

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard/orders/order-1']}>
          <Routes>
            <Route path="/dashboard/orders/:orderId" element={<AdminOrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const confirmBtn = screen.getByText(/Confirm Order/i);
      fireEvent.click(confirmBtn);
    });

    expect(mockConfirmOrder).toHaveBeenCalledWith('order-1', expect.any(Object));
  });

  it('shows "Confirm" badge on the ORDERED step in stepper when in CONFIRMATION_WAITING', async () => {
    mockGetOrderById.mockResolvedValue({
      id: 'order-1',
      number: 123,
      status: 'CONFIRMATION_WAITING',
      createdTs: new Date().toISOString(),
      orderProducts: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard/orders/order-1']}>
          <Routes>
            <Route path="/dashboard/orders/:orderId" element={<AdminOrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
  });
});
