import { useQuery } from '@tanstack/react-query';
import { orderApi, OrderStatus } from '../../api/order';
import { Loader2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrderHistoryPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: orderApi.getOrders,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">No orders found</h2>
        <p className="text-muted-foreground">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.orderId} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {order.orderId}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdDate).toLocaleDateString()} at {new Date(order.createdDate).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="font-bold text-lg">${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="border-t pt-4">
               {/* Link to details would go here */}
               <span className="text-sm text-muted-foreground">Details view coming soon</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case OrderStatus.COMPLETED:
      return 'bg-green-50 text-green-700 border-green-200';
    case OrderStatus.PROCESSING:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case OrderStatus.CANCELLED:
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
