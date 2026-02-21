import { useQuery } from '@tanstack/react-query';
import { orderApi, Order, OrderStatus } from '../../api/order';
import { Loader2, Package, Clock, CheckCircle2, XCircle, ArrowRight, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';

export default function OrderHistoryPage() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: orderApi.getOrders,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('orders.loadingOrders')}</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t('orders.emptyTitle')}</h2>
          <p className="text-muted-foreground max-w-sm">
            {t('orders.emptySubtitle')}
          </p>
        </div>
        <Link to="/products" className="btn-primary mt-2">
          {t('orders.browseProducts')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const dateLocale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('orders.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('orders.orderCount', { count: orders.length })}
        </p>
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const statusConfig = getStatusConfig(order.status, t);
          const totalPrice = getOrderTotal(order);
          const currency = order.orderProducts?.[0]?.part?.currency ?? 'EUR';
          const currencySymbol = currency === 'EUR' ? '\u20AC' : currency === 'USD' ? '$' : currency;

          return (
            <div
              key={order.id}
              className="card-hover p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                {/* Left: Order Info */}
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${statusConfig.bgClass}`}>
                    <statusConfig.icon className={`h-5 w-5 ${statusConfig.iconClass}`} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">
                      {t('orders.orderNumber', { number: order.number })}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdTs).toLocaleDateString(dateLocale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {' ' + t('orders.at') + ' '}
                      {new Date(order.createdTs).toLocaleTimeString(dateLocale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {order.orderProducts && order.orderProducts.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('orders.productCount', { count: order.orderProducts.length })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status & Price */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                  <span className={`badge ${statusConfig.badgeClass}`}>
                    {statusConfig.label}
                  </span>
                  <span className="font-bold text-lg">
                    {currencySymbol}{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Products Preview */}
              {order.orderProducts && order.orderProducts.length > 0 && (
                <div className="border-t mt-4 pt-4">
                  <div className="space-y-2">
                    {order.orderProducts.slice(0, 3).map((op) => (
                      <div key={op.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[60%]">
                          {op.part.name} <span className="font-mono text-xs">({op.part.article})</span>
                        </span>
                        <span className="text-muted-foreground">
                          x{op.partsCount} &middot; {currencySymbol}{(op.part.price * op.partsCount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.orderProducts.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        {t('orders.moreItems', { count: order.orderProducts.length - 3 })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getOrderTotal(order: Order): number {
  if (!order.orderProducts) return 0;
  return order.orderProducts.reduce(
    (sum, op) => sum + op.part.price * op.partsCount,
    0
  );
}

function getStatusConfig(status: OrderStatus, t: (key: string) => string) {
  switch (status) {
    case OrderStatus.COMPLETED:
      return {
        label: t('orders.statusCompleted'),
        icon: CheckCircle2,
        bgClass: 'bg-success/10',
        iconClass: 'text-success',
        badgeClass: 'bg-success/10 text-success border-success/20',
      };
    case OrderStatus.PROCESSING:
      return {
        label: t('orders.statusProcessing'),
        icon: RotateCw,
        bgClass: 'bg-primary/10',
        iconClass: 'text-primary',
        badgeClass: 'bg-primary/10 text-primary border-primary/20',
      };
    case OrderStatus.CANCELLED:
      return {
        label: t('orders.statusCancelled'),
        icon: XCircle,
        bgClass: 'bg-destructive/10',
        iconClass: 'text-destructive',
        badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
      };
    case OrderStatus.CREATED:
      return {
        label: t('orders.statusCreated'),
        icon: Clock,
        bgClass: 'bg-muted',
        iconClass: 'text-muted-foreground',
        badgeClass: 'bg-muted text-muted-foreground border-border',
      };
    default:
      return {
        label: status,
        icon: Clock,
        bgClass: 'bg-muted',
        iconClass: 'text-muted-foreground',
        badgeClass: 'bg-muted text-muted-foreground border-border',
      };
  }
}
