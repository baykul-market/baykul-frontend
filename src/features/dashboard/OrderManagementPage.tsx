import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  orderApi,
  OrderStatus,
} from '../../api/order';
import {
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Calendar,
  User,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

function statusColor(status: OrderStatus) {
  switch (status) {
    case OrderStatus.COMPLETED:
      return 'bg-success/10 text-success border-success/20';
    case OrderStatus.READY_FOR_PICKUP:
      return 'bg-info/10 text-info border-info/20';
    case OrderStatus.ON_WAY:
    case OrderStatus.IN_WAREHOUSE:
    case OrderStatus.ORDERED:
      return 'bg-primary/10 text-primary border-primary/20';
    case OrderStatus.PAYMENT_WAITING:
      return 'bg-warning/10 text-warning border-warning/20';
    case OrderStatus.CANCELLED:
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export default function OrderManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);

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
                          {t(`status.order.${order.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
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
                    {t(`status.order.${order.status}`)}
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
                  onClick={() => navigate(`/dashboard/orders/${order.id}`)}
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
    </div>
  );
}
