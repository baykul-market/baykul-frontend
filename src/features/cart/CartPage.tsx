import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../../api/cart';
import { Trash2, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });

  const removeMutation = useMutation({
    mutationFn: (articleId: string) => cartApi.removeFromCart(articleId),
    onSuccess: () => {
      toast.success('Item removed');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Failed to remove item');
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: cartApi.checkout,
    onSuccess: (data) => {
      toast.success('Order placed successfully!');
      queryClient.setQueryData(['cart'], { items: [], totalPrice: 0 });
      // navigate(`/orders/${data.orderId}`); // Would go to order details in real app
      navigate('/orders'); // Go to order history for now
    },
    onError: () => {
      toast.error('Checkout failed');
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Looks like you haven't added any parts yet.</p>
        <Link to="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 inline-flex items-center gap-2">
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.detail.articleId} className="bg-card border rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{item.detail.name}</h3>
                <p className="text-sm text-muted-foreground">{item.detail.brand} - {item.detail.articleId}</p>
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-bold">${(item.detail.price * item.quantity).toFixed(2)}</span>
                <button
                  onClick={() => removeMutation.mutate(item.detail.articleId)}
                  disabled={removeMutation.isPending}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border rounded-lg p-6 sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${cart.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t pt-4 mt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${cart.totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md hover:bg-primary/90 font-medium disabled:opacity-50 transition-colors"
            >
              {checkoutMutation.isPending ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
