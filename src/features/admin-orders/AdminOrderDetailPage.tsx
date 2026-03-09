import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { orderApi, OrderStatus, OrderProductStatus } from '../../api/order';
import { Loader2, ArrowLeft, User, CreditCard, Box, CheckCircle2, RotateCw, Clock, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ORDER_STATUS_FLOW = [
    OrderStatus.PAYMENT_WAITING,
    OrderStatus.CONFIRMATION_WAITING,
    OrderStatus.ORDERED,
    OrderStatus.ON_WAY,
    OrderStatus.IN_WAREHOUSE,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.COMPLETED
];

// We simplify visual flow: ARRIVED is visually always treated as IN_WAREHOUSE
const BOX_STATUS_FLOW = [
    OrderProductStatus.CREATED,
    OrderProductStatus.TO_ORDER,
    OrderProductStatus.ON_WAY,
    OrderProductStatus.IN_WAREHOUSE,
    OrderProductStatus.SHIPPED,
    OrderProductStatus.DELIVERED
];

export default function AdminOrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [confirmModalState, setConfirmModalState] = useState<{
        type: 'orderCancel' | 'productCancel' | 'productReturn' | null;
        targetId?: string;
    }>({ type: null });

    const closeConfirmModal = () => setConfirmModalState({ type: null });

    const confirmAction = () => {
        if (confirmModalState.type === 'orderCancel') {
            updateStatusMutation.mutate(OrderStatus.CANCELLED);
        } else if (confirmModalState.type === 'productCancel' && confirmModalState.targetId) {
            updateProductStatusMutation.mutate({ id: confirmModalState.targetId, status: OrderProductStatus.CANCELLED });
        } else if (confirmModalState.type === 'productReturn' && confirmModalState.targetId) {
            updateProductStatusMutation.mutate({ id: confirmModalState.targetId, status: OrderProductStatus.RETURNED });
        }
        closeConfirmModal();
    };

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['admin-order-details', orderId],
        queryFn: () => orderApi.getOrderById(orderId!),
        enabled: !!orderId,
    });

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus: OrderStatus) =>
            newStatus === OrderStatus.COMPLETED
                ? orderApi.completeOrder(orderId!)
                : orderApi.updateOrder(orderId!, { status: newStatus }),
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.updateSuccess', 'Order status updated successfully'));
            queryClient.invalidateQueries({ queryKey: ['admin-order-details', orderId] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
        onError: () => {
            toast.error(t('dashboard.orderManagement.updateError', 'Failed to update order status'));
        }
    });

    const updateProductStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: OrderProductStatus }) =>
            orderApi.updateOrderProduct(id, { status }),
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.productUpdateSuccess', 'Product status updated successfully'));
            queryClient.invalidateQueries({ queryKey: ['admin-order-details', orderId] });
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.error || t('dashboard.orderManagement.productUpdateError', 'Failed to update product status');
            toast.error(msg);
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t('orders.loadingOrder', 'Loading order details...')}</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center animate-fade-in">
                <XCircle className="h-16 w-16 text-destructive/20" />
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Order Not Found</h2>
                    <p className="text-muted-foreground max-w-sm">
                        The order you are looking for does not exist or has been removed.
                    </p>
                </div>
                <button onClick={() => navigate('/dashboard/orders')} className="btn-secondary mt-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Orders
                </button>
            </div>
        );
    }

    const handleOrderCancel = () => {
        setConfirmModalState({ type: 'orderCancel' });
    };

    const handleProductCancel = (productId: string) => {
        setConfirmModalState({ type: 'productCancel', targetId: productId });
    };

    const handleProductReturn = (productId: string) => {
        setConfirmModalState({ type: 'productReturn', targetId: productId });
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-10 space-y-6">
            {/* Breadcrumb / Back Navigation */}
            <div>
                <button
                    onClick={() => navigate('/dashboard/orders')}
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t('dashboard.orderManagement.backToOrders', 'Back to Orders')}
                </button>
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        {t('dashboard.orderManagement.orderDetails', 'Order Details')} #{order.number}
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {format(new Date(order.createdTs), 'dd.MM.yyyy HH:mm')}
                    </p>
                </div>

                {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.COMPLETED && (
                    <button
                        onClick={handleOrderCancel}
                        disabled={updateStatusMutation.isPending}
                        className="btn-outline text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    >
                        <XCircle className="w-4 h-4" />
                        {t('common.cancelOrder', 'Cancel Order')}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Content: Status & Products */}
                <div className="md:col-span-2 space-y-6">

                    {/* Order Status Stepper */}
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <RotateCw className="w-5 h-5 text-primary" />
                            {t('dashboard.orderManagement.orderStatus', 'Order Status')}
                        </h2>

                        {order.status === OrderStatus.CANCELLED ? (
                            <div className="bg-destructive/10 text-destructive border-destructive/20 border rounded-lg p-4 flex items-center gap-3">
                                <XCircle className="w-6 h-6" />
                                <span className="font-semibold text-lg">{t('orders.statusCancelled', 'Cancelled')}</span>
                            </div>
                        ) : (
                            <div className="relative mt-2">
                                <div className="absolute top-4 left-0 w-full h-1 bg-secondary -translate-y-1/2 z-0 hidden sm:block rounded-full"></div>
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10 w-full">
                                    {ORDER_STATUS_FLOW.map((status, index) => {
                                        const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
                                        const isCompleted = index < currentIndex;
                                        const isCurrent = index === currentIndex;
                                        const isNext = index === currentIndex + 1;

                                        return (
                                            <div key={status} className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 sm:flex-1 relative bg-background sm:bg-transparent">
                                                <button
                                                    onClick={() => updateStatusMutation.mutate(status)}
                                                    disabled={!isNext || updateStatusMutation.isPending || !((order.status === OrderStatus.CONFIRMATION_WAITING && status === OrderStatus.ORDERED) || (order.status === OrderStatus.READY_FOR_PICKUP && status === OrderStatus.COMPLETED))}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all font-bold text-sm shrink-0",
                                                        isCompleted ? "bg-success border-success text-success-foreground" :
                                                            isCurrent ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20" :
                                                                "bg-background border-muted-foreground text-muted-foreground",
                                                        (isNext && ((order.status === OrderStatus.CONFIRMATION_WAITING && status === OrderStatus.ORDERED) || (order.status === OrderStatus.READY_FOR_PICKUP && status === OrderStatus.COMPLETED))) ? "hover:scale-110 hover:border-primary cursor-pointer shadow-md" : "cursor-not-allowed opacity-80"
                                                    )}
                                                    title={isNext ? `Move to ${status}` : ''}
                                                >
                                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                                                </button>
                                                <span className={cn(
                                                    "text-[10px] font-medium text-left sm:text-center max-w-[80px]",
                                                    (isCurrent || isCompleted) ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Products List */}
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Box className="w-5 h-5 text-primary" />
                            {t('dashboard.orderManagement.products', 'Products')}
                        </h2>

                        <div className="space-y-8">
                            {order.orderProducts?.map((product) => (
                                <div key={product.id} className="pt-4 first:pt-0 border-t first:border-0 border-border/50">
                                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{product.part.name}</h3>
                                            <p className="text-sm text-muted-foreground font-mono mt-1">
                                                {product.part.brand} - {product.part.article}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-lg">
                                                {product.partsCount} x {product.part.price} {product.part.currency}
                                            </p>
                                            {product.number && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Box #{product.number}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Product Status Stepper */}
                                    {product.status === OrderProductStatus.CANCELLED ? (
                                        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
                                            <XCircle className="w-4 h-4" /> Cancelled
                                        </div>
                                    ) : product.status === OrderProductStatus.RETURNED ? (
                                        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
                                            <RotateCw className="w-4 h-4" /> Returned
                                        </div>
                                    ) : (
                                        <div className="bg-secondary/20 p-4 rounded-lg">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {BOX_STATUS_FLOW.map((status, index) => {
                                                    const visualStatus = product.status === OrderProductStatus.ARRIVED ? OrderProductStatus.IN_WAREHOUSE : product.status;
                                                    const currentIndex = BOX_STATUS_FLOW.indexOf(visualStatus);
                                                    const isCompleted = index < currentIndex;
                                                    const isCurrent = index === currentIndex;
                                                    const isNext = index === currentIndex + 1;

                                                    const handleBoxStatusUpdate = () => {
                                                        let beStatus = status;
                                                        if (product.status === OrderProductStatus.ON_WAY) {
                                                            beStatus = OrderProductStatus.ARRIVED;
                                                        }
                                                        updateProductStatusMutation.mutate({ id: product.id, status: beStatus });
                                                    };

                                                    return (
                                                        <button
                                                            key={status}
                                                            onClick={handleBoxStatusUpdate}
                                                            disabled={!isNext || updateProductStatusMutation.isPending}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border",
                                                                isCompleted ? "bg-success/10 text-success border-success/30" :
                                                                    isCurrent ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 shadow-md" :
                                                                        "bg-background text-muted-foreground border-border",
                                                                isNext ? "hover:bg-primary/20 hover:text-primary hover:border-primary/50 cursor-pointer shadow-sm scale-105" : "cursor-not-allowed opacity-70"
                                                            )}
                                                            title={isNext ? `Update box to ${status}` : ''}
                                                        >
                                                            {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                                            {!isCompleted && !isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>}
                                                            {status.replace(/_/g, ' ')}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex gap-4 justify-end mt-4 pt-3 border-t border-border/50">
                                                {product.status !== OrderProductStatus.DELIVERED && (
                                                    <button
                                                        onClick={() => handleProductCancel(product.id)}
                                                        className="text-xs text-destructive hover:underline flex items-center gap-1"
                                                    >
                                                        <XCircle className="w-3 h-3" /> Cancel Box
                                                    </button>
                                                )}
                                                {product.status !== OrderProductStatus.CREATED && product.status !== OrderProductStatus.TO_ORDER && (
                                                    <button
                                                        onClick={() => handleProductReturn(product.id)}
                                                        className="text-xs text-destructive hover:underline flex items-center gap-1"
                                                    >
                                                        <RotateCw className="w-3 h-3" /> Mark Returned
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            {t('dashboard.orderManagement.customerInfo', 'Customer Info')}
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Login</span>
                                <span className="font-medium">{order.user?.login}</span>
                            </div>
                            {order.user?.email && (
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Email</span>
                                    <span className="font-medium">{order.user.email}</span>
                                </div>
                            )}
                            {order.user?.profile && (
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Full Name</span>
                                    <span className="font-medium">{order.user.profile.name} {order.user.profile.surname}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card p-6 border-primary/20 bg-primary/5">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            Order Total
                        </h2>
                        <div className="text-3xl font-bold text-primary">
                            {order.orderProducts?.reduce((sum, op) => sum + (op.part.price * op.partsCount), 0).toFixed(2)} {order.orderProducts?.[0]?.part?.currency || 'EUR'}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {order.orderProducts?.length || 0} items
                        </p>
                    </div>
                </div>

            </div>

            <ConfirmModal
                isOpen={confirmModalState.type !== null}
                onClose={closeConfirmModal}
                onConfirm={confirmAction}
                title={
                    confirmModalState.type === 'orderCancel' ? t('dashboard.orderManagement.cancelOrderTitle', 'Cancel Order') :
                        confirmModalState.type === 'productCancel' ? t('dashboard.orderManagement.cancelProductTitle', 'Cancel Product') :
                            t('dashboard.orderManagement.returnProductTitle', 'Return Product')
                }
                message={
                    confirmModalState.type === 'orderCancel' ? t('dashboard.orderManagement.cancelOrderMsg', 'Are you sure you want to cancel this order?') :
                        confirmModalState.type === 'productCancel' ? t('dashboard.orderManagement.cancelProductMsg', 'Are you sure you want to cancel this product?') :
                            t('dashboard.orderManagement.returnProductMsg', 'Are you sure you want to mark this product as returned?')
                }
                isDestructive={true}
                confirmText={t('common.confirm', 'Confirm')}
                cancelText={t('common.cancel', 'Cancel')}
            />
        </div>
    );
}
