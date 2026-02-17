import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../../api/cart';
import { orderApi } from '../../api/order';
import { Trash2, Loader2, ArrowRight, ShoppingCart, ArrowLeft, Package, Tag, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no cart yet)
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ cartProductId, partsCount }: { cartProductId: string; partsCount: number }) =>
      cartApi.updateCartProduct(cartProductId, partsCount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error(t('cart.updateError'));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (cartProductId: string) => cartApi.removeFromCart(cartProductId),
    onSuccess: () => {
      toast.success(t('cart.itemRemoved'));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error(t('cart.removeError'));
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: orderApi.createOrder,
    onSuccess: (data) => {
      if (data.create_order === 'true') {
        toast.success(t('cart.orderSuccess'));
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        navigate('/orders');
      } else {
        // Handle unavailable products (409 case)
        const msg = data.error || t('cart.unavailable');
        toast.error(msg);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t('cart.checkoutError');
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('cart.loadingCart')}</p>
      </div>
    );
  }

  // Handle 404 (no cart) or empty cart
  const cartProducts = cart?.cartProducts ?? [];
  const isCartEmpty = !cart || cartProducts.length === 0 || (error as any)?.response?.status === 404;

  if (isCartEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t('cart.emptyTitle')}</h2>
          <p className="text-muted-foreground max-w-sm">
            {t('cart.emptySubtitle')}
          </p>
        </div>
        <Link to="/products" className="btn-primary mt-2">
          {t('cart.startShopping')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const totalPrice = cartProducts.reduce(
    (sum, cp) => sum + cp.part.price * cp.partsCount,
    0
  );
  const itemCount = cartProducts.reduce((sum, cp) => sum + cp.partsCount, 0);
  const currency = cartProducts[0]?.part.currency ?? 'EUR';
  const currencySymbol = currency === 'EUR' ? '\u20AC' : currency === 'USD' ? '$' : currency;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('cart.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('cart.itemCount', { count: itemCount })}
          </p>
        </div>
        <Link to="/products" className="btn-ghost text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          {t('cart.continueShopping')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cartProducts.map((item) => (
            <div
              key={item.id}
              className="card p-4 sm:p-5 flex items-start sm:items-center gap-4"
            >
              {/* Product Icon */}
              <div className="hidden sm:flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Package className="h-7 w-7 text-muted-foreground/50" />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base leading-snug">{item.part.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Tag className="h-3 w-3" />
                  <span>{item.part.brand}</span>
                  <span className="text-border">|</span>
                  <span className="font-mono">{item.part.article}</span>
                </div>
                <div className="flex items-center gap-3 mt-2.5">
                  <span className="text-sm text-muted-foreground">
                    {currencySymbol}{item.part.price.toFixed(2)}
                  </span>
                  <div className="inline-flex items-center gap-1.5 rounded-md border px-1">
                    <button
                      onClick={() =>
                        item.partsCount > 1
                          ? updateMutation.mutate({ cartProductId: item.id, partsCount: item.partsCount - 1 })
                          : removeMutation.mutate(item.id)
                      }
                      disabled={updateMutation.isPending}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={t('cart.decreaseQuantity')}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium min-w-[1.25rem] text-center">{item.partsCount}</span>
                    <button
                      onClick={() => updateMutation.mutate({ cartProductId: item.id, partsCount: item.partsCount + 1 })}
                      disabled={updateMutation.isPending}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={t('cart.increaseQuantity')}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="font-bold text-base">
                  {currencySymbol}{(item.part.price * item.partsCount).toFixed(2)}
                </span>
                <button
                  onClick={() => removeMutation.mutate(item.id)}
                  disabled={removeMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors rounded-md px-2 py-1 hover:bg-destructive/5"
                  aria-label={t('cart.remove')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('cart.remove')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-lg font-semibold mb-5">{t('cart.orderSummary')}</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('cart.subtotal', { count: itemCount })}</span>
                <span className="font-medium">{currencySymbol}{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('cart.shipping')}</span>
                <span className="text-muted-foreground text-xs">{t('cart.shippingNote')}</span>
              </div>
            </div>

            <div className="border-t my-5" />

            <div className="flex justify-between items-baseline mb-6">
              <span className="text-base font-semibold">{t('cart.total')}</span>
              <span className="text-2xl font-bold">{currencySymbol}{totalPrice.toFixed(2)}</span>
            </div>

            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="btn-primary w-full py-3"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('cart.processing')}
                </>
              ) : (
                <>
                  {t('cart.checkout')}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              {t('cart.secureCheckout')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
