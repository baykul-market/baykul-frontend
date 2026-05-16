import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { orderApi, OrderStatus, OrderProductStatus } from '../../api/order';
import { Loader2, ArrowLeft, User, CreditCard, Box, CheckCircle2, RotateCw, Clock, XCircle, Pencil, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getCurrencySymbol } from '../../lib/currency';

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
            cancelMutation.mutate();
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
        mutationFn: (newStatus: OrderStatus) => {
            if (newStatus === OrderStatus.COMPLETED) {
                return orderApi.completeOrder(orderId!, { customErrorToast: t('dashboard.orderManagement.updateError') });
            }
            if (newStatus === OrderStatus.ORDERED && order?.status === OrderStatus.CONFIRMATION_WAITING) {
                return orderApi.confirmOrder(orderId!, { customErrorToast: t('dashboard.orderManagement.updateError') });
            }
            // Fallback for other potential transitions if needed
            return orderApi.updateOrder(orderId!, { status: newStatus }, { customErrorToast: t('dashboard.orderManagement.updateError') });
        },
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.updateSuccess'));
            queryClient.invalidateQueries({ queryKey: ['admin-order-details', orderId] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
    });

    const cancelMutation = useMutation({
        mutationFn: () => orderApi.cancelOrder(orderId!, { customErrorToast: t('dashboard.orderManagement.cancelError') }),
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.cancelSuccess'));
            queryClient.invalidateQueries({ queryKey: ['admin-order-details', orderId] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
    });

    const payAdminMutation = useMutation({
        mutationFn: () => orderApi.payOrderAdmin(orderId!, { customErrorToast: t('dashboard.orderManagement.payError') }),
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.paySuccess'));
            queryClient.invalidateQueries({ queryKey: ['admin-order-details', orderId] });
        },
    });

    /*
    const { data: bills, isLoading: isLoadingBills } = useQuery({
        queryKey: ['admin-order-bills', orderId],
        queryFn: async () => {
            const response = await billApi.getAll(0, 100);
            // Since there is no direct filter by orderId in getAll, we filter manually here if needed.
            // But usually, orderProducts are linked to bills.
            // For now, we filter those that have products from this order.
            return response.content.filter(bill =>
                bill.orderProducts.some(op => order?.orderProducts.some(oop => oop.id === op.id))
            );
        },
        enabled: !!order,
    });
    */

    const updateProductStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: OrderProductStatus }) =>
            orderApi.updateOrderProduct(id, { status }, { customErrorToast: t('dashboard.orderManagement.productUpdateError') }),
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.productUpdateSuccess'));
            queryClient.invalidateQueries({ queryKey: ['admin-order-details', orderId] });
        },
    });

    const updateProductDataMutation = useMutation({
        mutationFn: ({ id, number }: { id: string, number: number }) =>
            orderApi.updateOrderProduct(id, { number }, { customErrorToast: t('dashboard.orderManagement.productUpdateError') }),
        onSuccess: () => {
            toast.success(t('dashboard.orderManagement.productUpdateSuccess'));
            queryClient.invalidateQueries({ queryKey: ['admin-order-details', orderId] });
            setEditingBoxId(null);
        },
    });

    const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
    const [editingBoxNumber, setEditingBoxNumber] = useState<string>('');

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
                <button onClick={() => navigate('/dashboard/orders')} className="btn-secondary mt-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('dashboard.orderManagement.backToOrders')}
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
                    {t('dashboard.orderManagement.backToOrders')}
                </button>
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        {t('dashboard.orderManagement.orderDetails')} #{order.number}
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {format(new Date(order.createdTs), 'dd.MM.yyyy HH:mm')}
                    </p>
                </div>

                {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.COMPLETED && (
                    <div className="flex gap-2">
                        {!order.paid && order.status !== OrderStatus.CONFIRMATION_WAITING && (
                            <button
                                onClick={() => payAdminMutation.mutate()}
                                disabled={payAdminMutation.isPending}
                                className="btn-primary"
                            >
                                <CreditCard className="w-4 h-4" />
                                {t('dashboard.orderManagement.markPaid')}
                            </button>
                        )}
                        {order.status === OrderStatus.CONFIRMATION_WAITING && (
                            <button
                                onClick={() => updateStatusMutation.mutate(OrderStatus.ORDERED)}
                                disabled={updateStatusMutation.isPending}
                                className="btn-primary shadow-lg shadow-primary/20 animate-pulse-subtle"
                                title={t('dashboard.orderManagement.confirmOrderInfo')}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {t('dashboard.orderManagement.confirmOrderAction')}
                            </button>
                        )}
                        <button
                            onClick={handleOrderCancel}
                            disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                            className="btn-outline text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                        >
                            <XCircle className="w-4 h-4" />
                            {t('dashboard.orderManagement.cancelOrderTitle')}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Content: Status & Products */}
                <div className="md:col-span-2 space-y-6">

                    {/* Order Status Stepper */}
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <RotateCw className="w-5 h-5 text-primary" />
                            {t('dashboard.orderManagement.orderStatus')}
                        </h2>

                        {order.status === OrderStatus.CANCELLED ? (
                            <div className="bg-destructive/10 text-destructive border-destructive/20 border rounded-lg p-4 flex items-center gap-3">
                                <XCircle className="w-6 h-6" />
                                <span className="font-semibold text-lg">{t(`status.order.${order.status}`)}</span>
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
                                        const isConfirmStep = order.status === OrderStatus.CONFIRMATION_WAITING && status === OrderStatus.ORDERED;

                                        return (
                                            <div key={status} className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 sm:flex-1 relative bg-background sm:bg-transparent">
                                                <div className="relative group">
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate(status)}
                                                        disabled={!isNext || updateStatusMutation.isPending || !((order.status === OrderStatus.CONFIRMATION_WAITING && status === OrderStatus.ORDERED) || (order.status === OrderStatus.READY_FOR_PICKUP && status === OrderStatus.COMPLETED))}
                                                        className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all font-bold text-sm shrink-0",
                                                            isCompleted ? "bg-success border-success text-success-foreground" :
                                                                isCurrent ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20" :
                                                                    "bg-background border-muted-foreground text-muted-foreground",
                                                            (isNext && ((order.status === OrderStatus.CONFIRMATION_WAITING && status === OrderStatus.ORDERED) || (order.status === OrderStatus.READY_FOR_PICKUP && status === OrderStatus.COMPLETED))) ? "hover:scale-110 hover:border-primary cursor-pointer shadow-md" : "cursor-not-allowed opacity-80",
                                                            isConfirmStep && "animate-pulse shadow-primary/40 border-primary"
                                                        )}
                                                        title={(!isConfirmStep && isNext) ? t('dashboard.orderManagement.updateBoxTo', { status: t(`status.order.${status}`) }) : undefined}
                                                    >
                                                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                                                    </button>

                                                    {isConfirmStep && (
                                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-background/20">
                                                            <div className="flex items-center gap-1.5">
                                                                <Info className="w-3 h-3 text-primary" />
                                                                {t('dashboard.orderManagement.confirmOrderInfo')}
                                                            </div>
                                                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-start sm:items-center">
                                                    <span className={cn(
                                                        "text-[10px] font-medium text-left sm:text-center max-w-[80px]",
                                                        (isCurrent || isCompleted) ? "text-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {t(`status.order.${status}`)}
                                                    </span>
                                                    {isConfirmStep && (
                                                        <span className="badge bg-primary/20 text-primary border-primary/30 text-[8px] py-0 px-1 mt-1 font-bold animate-bounce h-4">
                                                            {t('common.confirm')}
                                                        </span>
                                                    )}
                                                </div>
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
                            {t('dashboard.orderManagement.products')}
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
                                                {product.partsCount} x {product.price.toFixed(2)} {getCurrencySymbol(product.currency)}
                                            </p>
                                            {editingBoxId === product.id ? (
                                                <div className="flex items-center gap-2 mt-2 justify-end">
                                                    <input
                                                        type="number"
                                                        value={editingBoxNumber}
                                                        onChange={e => setEditingBoxNumber(e.target.value)}
                                                        className="border rounded px-2 py-1 w-24 text-sm bg-background text-foreground"
                                                        placeholder={t('dashboard.orderManagement.boxNumberPlaceholder', '≥100000')}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const num = parseInt(editingBoxNumber, 10);
                                                            if (isNaN(num) || num < 100000) {
                                                                toast.error(t('dashboard.orderManagement.boxNumberValidation'));
                                                                return;
                                                            }
                                                            updateProductDataMutation.mutate({ id: product.id, number: num });
                                                        }}
                                                        disabled={updateProductDataMutation.isPending}
                                                        className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
                                                    >
                                                        {t('dashboard.orderManagement.boxSave', 'Save')}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingBoxId(null)}
                                                        className="text-xs text-muted-foreground hover:underline"
                                                    >
                                                        {t('common.cancel', 'Cancel')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 mt-1">
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <span>{t('dashboard.orderManagement.boxNumber')}</span>
                                                        <span className={cn(product.number ? "font-medium text-foreground" : "italic")}>
                                                            {product.number ? product.number : t('dashboard.orderManagement.boxNotSet')}
                                                        </span>
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            setEditingBoxId(product.id);
                                                            setEditingBoxNumber(product.number ? String(product.number) : '');
                                                        }}
                                                        className="text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 p-1.5 rounded-md"
                                                        title={t('common.edit')}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Product Status Stepper */}
                                    {product.status === OrderProductStatus.CANCELLED ? (
                                        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
                                            <XCircle className="w-4 h-4" /> {t(`status.product.${product.status}`)}
                                        </div>
                                    ) : product.status === OrderProductStatus.RETURNED ? (
                                        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
                                            <RotateCw className="w-4 h-4" /> {t(`status.product.${product.status}`)}
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
                                                            title={isNext ? t('dashboard.orderManagement.updateBoxTo', { status: t(`status.product.${status}`) }) : ''}
                                                        >
                                                            {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                                            {!isCompleted && !isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>}
                                                            {t(`status.product.${status}`)}
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
                                                        <XCircle className="w-3 h-3" /> {t('dashboard.orderManagement.cancelBox')}
                                                    </button>
                                                )}
                                                {product.status !== OrderProductStatus.CREATED && product.status !== OrderProductStatus.TO_ORDER && (
                                                    <button
                                                        onClick={() => handleProductReturn(product.id)}
                                                        className="text-xs text-destructive hover:underline flex items-center gap-1"
                                                    >
                                                        <RotateCw className="w-3 h-3" /> {t('dashboard.orderManagement.markReturned')}
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
                            {t('dashboard.orderManagement.customerInfo')}
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">{t('common.login')}</span>
                                <span className="font-medium">{order.user?.login}</span>
                            </div>
                            {order.user?.email && (
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">{t('common.email')}</span>
                                    <span className="font-medium">{order.user.email}</span>
                                </div>
                            )}
                            {order.user?.profile && (
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">{t('nav.myProfile')}</span>
                                    <span className="font-medium">{order.user.profile.name} {order.user.profile.surname}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card p-6 border-primary/20 bg-primary/5">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            {t('dashboard.orderManagement.orderTotal')}
                        </h2>
                        <div className="text-3xl font-bold text-primary">
                            {order.orderProducts?.reduce((sum, op) => sum + (op.price * op.partsCount), 0).toFixed(2)} {getCurrencySymbol(order.orderProducts?.[0]?.currency || 'EUR')}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {t('dashboard.orderManagement.items', { count: order.orderProducts?.length || 0 })}
                        </p>
                    </div>

                    {/* Bills Section hidden for now */}
                    {/* <div className="card p-6 border-dashed border-2">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-primary" />
                            {t('dashboard.orderManagement.bills')}
                        </h2>
                        {isLoadingBills ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : bills && bills.length > 0 ? (
                            <div className="space-y-3">
                                {bills.map(bill => (
                                    <div key={bill.id} className="p-3 bg-secondary/10 rounded-lg flex justify-between items-center border border-border/50">
                                        <div>
                                            <p className="font-mono text-sm">#{bill.number}</p>
                                            <p className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block",
                                                bill.status === 'APPLIED' ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                                            )}>
                                                {t(`status.bill.${bill.status}`)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{bill.orderProducts.reduce((sum, p) => sum + p.price, 0).toFixed(2)}</p>
                                            <p className="text-[10px] text-muted-foreground">{format(new Date(bill.createdTs), 'dd.MM.yyyy')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                {t('dashboard.orderManagement.noBills')}
                            </p>
                        )}
                    </div> */}
                </div>

            </div>

            <ConfirmModal
                isOpen={confirmModalState.type !== null}
                onClose={closeConfirmModal}
                onConfirm={confirmAction}
                title={
                    confirmModalState.type === 'orderCancel' ? t('dashboard.orderManagement.cancelOrderTitle') :
                        confirmModalState.type === 'productCancel' ? t('dashboard.orderManagement.cancelProductTitle') :
                            t('dashboard.orderManagement.returnProductTitle')
                }
                message={
                    confirmModalState.type === 'orderCancel' ? t('dashboard.orderManagement.cancelOrderMsg') :
                        confirmModalState.type === 'productCancel' ? t('dashboard.orderManagement.cancelProductMsg') :
                            t('dashboard.orderManagement.returnProductMsg')
                }
                isDestructive={true}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
            />
        </div >
    );
}
