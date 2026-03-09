import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { orderApi, Order, OrderStatus } from '../../api/order';
import { Loader2, ArrowLeft, Package, Clock, CheckCircle2, XCircle, RotateCw, CreditCard, Box, MapPin } from 'lucide-react';
import i18n from '../../i18n/i18n';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const payMutation = useMutation({
    mutationFn: (id: string) => orderApi.payOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOrder(orderId!),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('orders.loadingOrder')}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center animate-fade-in">
        <XCircle className="h-16 w-16 text-destructive/20" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t('orders.notFoundTitle')}</h2>
          <p className="text-muted-foreground max-w-sm">
            {t('orders.notFoundSubtitle')}
          </p>
        </div>
        <Link to="/orders" className="btn-secondary mt-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('orders.backToHistory')}
        </Link>
      </div>
    );
  }

  const dateLocale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
  const statusConfig = getStatusConfig(order.status, t);
  const totalPrice = getOrderTotal(order);
  const currency = order.orderProducts?.[0]?.part?.currency ?? 'EUR';
  const currencySymbol = currency === 'EUR' ? '\u20AC' : currency === 'USD' ? '$' : currency;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      {/* Breadcrumb / Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('orders.backToHistory')}
        </button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {t('orders.orderNumber', { number: order.number })}
            <span className={`badge ${statusConfig.badgeClass} text-base px-3 py-1 font-medium`}>
              {statusConfig.label}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date(order.createdTs).toLocaleDateString(dateLocale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Actions (Future: Cancel button, etc.) */}
        <div className="flex gap-2">
          {/* Placeholder for future actions */}
          {/* <button className="btn-outline text-destructive hover:bg-destructive/10 border-destructive/20">
             Cancel Order
           </button> */}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content: Order Items */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('orders.items')}
            </h2>

            <div className="divide-y">
              {order.orderProducts?.map((op) => (
                <div key={op.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  {/* Product Image Placeholder */}
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    <Box className="w-8 h-8 text-muted-foreground/50" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{op.part.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{op.part.article}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="badge bg-muted text-muted-foreground">
                        {/* Using order status as product status logic might be more complex in real app */}
                        {t(`status.product.${op.status}`)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">
                      {currencySymbol}{(op.part.price * op.partsCount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {op.partsCount} x {currencySymbol}{op.part.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Summary & Info */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">{t('orders.summary')}</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('orders.subtotal')}</span>
                <span>{currencySymbol}{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('orders.shipping')}</span>
                <span className="text-muted-foreground">--</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>{t('orders.total')}</span>
                <span>{currencySymbol}{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {order.status === OrderStatus.PAYMENT_WAITING && (
              <button
                className="btn-primary w-full mt-4"
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate(order.id)}
              >
                {payMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2 inline" />
                )}
                {t('orders.payNow')}
              </button>
            )}
          </div>

          {/* Customer Info (Optional/Future) */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('orders.shippingDetails')}
            </h2>
            <div className="text-sm text-muted-foreground">
              <p>{order.user?.profile?.name} {order.user?.profile?.surname}</p>
              <p>{order.user?.email}</p>
              {/* Add address if available in API */}
            </div>
          </div>
        </div>
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
        label: t(`status.order.${status}`),
        icon: CheckCircle2,
        bgClass: 'bg-success/10',
        iconClass: 'text-success',
        badgeClass: 'bg-success/10 text-success border-success/20',
      };
    case OrderStatus.READY_FOR_PICKUP:
      return {
        label: t(`status.order.${status}`),
        icon: CheckCircle2,
        bgClass: 'bg-info/10',
        iconClass: 'text-info',
        badgeClass: 'bg-info/10 text-info border-info/20',
      };
    case OrderStatus.ON_WAY:
    case OrderStatus.IN_WAREHOUSE:
    case OrderStatus.ORDERED:
      return {
        label: t(`status.order.${status}`),
        icon: RotateCw,
        bgClass: 'bg-primary/10',
        iconClass: 'text-primary',
        badgeClass: 'bg-primary/10 text-primary border-primary/20',
      };
    case OrderStatus.PAYMENT_WAITING:
      return {
        label: t(`status.order.${status}`),
        icon: CreditCard,
        bgClass: 'bg-warning/10',
        iconClass: 'text-warning',
        badgeClass: 'bg-warning/10 text-warning border-warning/20',
      };
    case OrderStatus.CANCELLED:
      return {
        label: t(`status.order.${status}`),
        icon: XCircle,
        bgClass: 'bg-destructive/10',
        iconClass: 'text-destructive',
        badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
      };
    case OrderStatus.CONFIRMATION_WAITING:
      return {
        label: t(`status.order.${status}`),
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
