import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  orderApi,
  OrderStatus,
  OrderProductStatus,
  type Order,
} from '../../api/order';
import {
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Package,
  Calendar,
  User,
  CreditCard,
  Box,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

function statusColor(status: OrderStatus) {
  switch (status) {
    case OrderStatus.COMPLETED:
      return 'bg-success/10 text-success border-success/20';
    case OrderStatus.PAID:
      return 'bg-info/10 text-info border-info/20';
    case OrderStatus.PROCESSING:
      return 'bg-warning/10 text-warning border-warning/20';
    case OrderStatus.CANCELLED:
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-secondary text-muted-foreground border-border';
  }
}

function productStatusColor(status: OrderProductStatus) {
  switch (status) {
    case OrderProductStatus.DELIVERED:
      return 'bg-success/10 text-success border-success/20';
    case OrderProductStatus.ARRIVED:
      return 'bg-info/10 text-info border-info/20';
    case OrderProductStatus.ON_WAY:
    case OrderProductStatus.IN_WAREHOUSE:
      return 'bg-warning/10 text-warning border-warning/20';
    case OrderProductStatus.CANCELLED:
    case OrderProductStatus.RETURNED:
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-secondary text-muted-foreground border-border';
  }
}

export default function OrderManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    navigate('/products');
    return null;
  }

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', page],
    queryFn: () => orderApi.getAllOrders({ page, size: PAGE_SIZE, sort: ['createdTs,desc'] }),
  });

  const hasMore = (orders?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('dashboard.orderManagement.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('dashboard.orderManagement.subtitle')}
          </p>
        </div>
      </div>

      {/* Order List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {t('dashboard.orderManagement.loadingOrders')}
          </p>
        </div>
      ) : orders && orders.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.orderManagement.orderNumber')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.orderManagement.user')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.orderManagement.date')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.orderManagement.status')}
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.orderManagement.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-sm">#{order.number}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <p className="font-medium">
                                {order.user?.profile
                                    ? `${order.user.profile.name} ${order.user.profile.surname}`
                                    : order.user?.login}
                            </p>
                            <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(order.createdTs), 'dd.MM.yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'badge text-[10px] gap-1',
                            statusColor(order.status)
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn-ghost p-2 text-primary hover:bg-primary/10"
                          title={t('dashboard.orderManagement.viewDetails')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">#{order.number}</span>
                  <span
                    className={cn(
                      'badge text-[10px] gap-1',
                      statusColor(order.status)
                    )}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                    <p className="text-muted-foreground flex items-center gap-2">
                        <User className="w-3 h-3" />
                         {order.user?.profile
                            ? `${order.user.profile.name} ${order.user.profile.surname}`
                            : order.user?.login}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(order.createdTs), 'dd.MM.yyyy HH:mm')}
                    </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="btn-secondary w-full text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {t('dashboard.orderManagement.viewDetails')}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.orderManagement.page', { page: page + 1 })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary px-3 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('dashboard.orderManagement.prev')}
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="btn-secondary px-3 py-2"
              >
                {t('dashboard.orderManagement.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          <p className="text-muted-foreground">
            {t('dashboard.orderManagement.noOrders')}
          </p>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            setSelectedOrder(null);
          }}
          t={t}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
  onUpdate,
  t,
}: {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
    const queryClient = useQueryClient();
    
    // Fetch full order details to get products if not present in list view
    const { data: fullOrder, isLoading } = useQuery({
        queryKey: ['admin-order-details', order.id],
        queryFn: () => orderApi.getOrderById(order.id),
        initialData: order.orderProducts ? order : undefined,
    });

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus: OrderStatus) => orderApi.updateOrder(order.id, { status: newStatus }),
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.updateSuccess'));
            onUpdate();
        },
        onError: () => {
            toast.error(t('dashboard.orderManagement.updateError'));
        }
    });

    const updateProductStatusMutation = useMutation({
        mutationFn: ({ id, status, number, partsCount }: { id: string, status?: OrderProductStatus, number?: number, partsCount?: number }) => 
            orderApi.updateOrderProduct(id, { status, number: number || undefined, partsCount }),
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.productUpdateSuccess'));
            queryClient.invalidateQueries({ queryKey: ['admin-order-details', order.id] });
        },
        onError: (err: any) => {
             const msg = err?.response?.data?.error || t('dashboard.orderManagement.productUpdateError');
             toast.error(msg);
        }
    });

    const availableStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.CREATED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
        [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        [OrderStatus.COMPLETED]: [],
        [OrderStatus.CANCELLED]: [],
    };

    const availableProductStatusTransitions: Record<OrderProductStatus, OrderProductStatus[]> = {
        [OrderProductStatus.ORDERED]: [OrderProductStatus.IN_WAREHOUSE, OrderProductStatus.CANCELLED],
        [OrderProductStatus.IN_WAREHOUSE]: [OrderProductStatus.ON_WAY, OrderProductStatus.CANCELLED],
        [OrderProductStatus.ON_WAY]: [OrderProductStatus.ARRIVED, OrderProductStatus.RETURNED],
        [OrderProductStatus.ARRIVED]: [OrderProductStatus.DELIVERED, OrderProductStatus.RETURNED],
        [OrderProductStatus.DELIVERED]: [OrderProductStatus.RETURNED],
        [OrderProductStatus.RETURNED]: [],
        [OrderProductStatus.CANCELLED]: [],
    };

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl card p-0 animate-slide-up max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-background sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
                {t('dashboard.orderManagement.orderDetails')} #{order.number}
            </h2>
             <p className="text-sm text-muted-foreground">
                {format(new Date(order.createdTs), 'dd.MM.yyyy HH:mm')}
             </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            title={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Order Info & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('dashboard.orderManagement.customerInfo')}
                    </h3>
                    <div className="card p-4 text-sm space-y-2 bg-secondary/20">
                         <p><span className="text-muted-foreground">{t('common.login')}:</span> {order.user?.login}</p>
                         <p><span className="text-muted-foreground">{t('common.email')}:</span> {order.user?.email || '-'}</p>
                         <p><span className="text-muted-foreground">{t('dashboard.userManagement.nameLabel')}:</span> {order.user?.profile ? `${order.user.profile.name} ${order.user.profile.surname}` : '-'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t('dashboard.orderManagement.orderStatus')}
                    </h3>
                    <div className="card p-4 bg-secondary/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{t('dashboard.orderManagement.currentStatus')}:</span>
                            <span className={cn('badge', statusColor(order.status))}>
                                {order.status}
                            </span>
                        </div>
                        
                        {availableStatusTransitions[order.status]?.length > 0 && (
                             <div className="flex gap-2 flex-wrap pt-2 border-t border-border/50">
                                {availableStatusTransitions[order.status].map(nextStatus => (
                                    <button
                                        key={nextStatus}
                                        onClick={() => updateStatusMutation.mutate(nextStatus)}
                                        disabled={updateStatusMutation.isPending}
                                        className="btn-secondary text-xs py-1 h-auto"
                                    >
                                        {t('common.moveTo')} {nextStatus}
                                    </button>
                                ))}
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Products List */}
            <div className="space-y-4">
                 <h3 className="font-semibold flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    {t('dashboard.orderManagement.products')}
                </h3>
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="space-y-3">
                        {fullOrder?.orderProducts?.map((product) => (
                            <div key={product.id} className="card p-4 flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{product.part.name}</p>
                                        <p className="text-xs text-muted-foreground">{product.part.brand} - {product.part.article}</p>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="font-medium">{product.partsCount} x {product.part.price} {product.part.currency}</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
                                     <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{t('dashboard.orderManagement.productStatus')}:</span>
                                        <span className={cn('badge text-[10px]', productStatusColor(product.status))}>
                                            {product.status}
                                        </span>
                                        {product.number && <span className="text-xs text-muted-foreground">#{product.number}</span>}
                                     </div>
                                     
                                     <div className="flex gap-2 flex-wrap">
                                        {availableProductStatusTransitions[product.status]?.map(nextStatus => (
                                            <button
                                                key={nextStatus}
                                                onClick={() => updateProductStatusMutation.mutate({ id: product.id, status: nextStatus })}
                                                 className={cn(
                                                    "btn-secondary text-[10px] py-1 h-auto",
                                                    productStatusColor(nextStatus)
                                                 )}
                                            >
                                                {nextStatus}
                                            </button>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
