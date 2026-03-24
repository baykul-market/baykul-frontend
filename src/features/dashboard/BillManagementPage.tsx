import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { billApi, Bill, BillStatus } from '../../api/bill';
import { orderApi, OrderProduct } from '../../api/order';
import {
    FileText,
    Plus,
    Eye,
    CheckCircle2,
    Box,
    Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ConfirmModal } from '../../components/ConfirmModal';

const PAGE_SIZE = 20;

function statusColor(status: BillStatus) {
    switch (status) {
        case 'APPLIED':
            return 'bg-success/10 text-success border-success/20';
        case 'DRAFT':
        default:
            return 'bg-warning/10 text-warning border-warning/20';
    }
}

export default function BillManagementPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    // Actions state
    const [applyConfirmId, setApplyConfirmId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Queries
    const { data, isLoading } = useQuery({
        queryKey: ['bills', page],
        queryFn: () => billApi.getAll(page, PAGE_SIZE, 'createdTs,desc'),
    });

    // Mutations
    const applyMutation = useMutation({
        mutationFn: (id: string) => billApi.apply(id, { customErrorToast: t('dashboard.billManagement.applyError') }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.applySuccess'));
            setSelectedBill(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => billApi.delete(id, { customErrorToast: t('dashboard.billManagement.deleteError') }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.deleteSuccess'));
            setSelectedBill(null);
        },
    });

    const billsList = Array.isArray(data) ? data : data?.content || [];
    const hasBills = billsList.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.billManagement.title')}</h2>
                    <p className="text-muted-foreground">{t('dashboard.billManagement.subtitle')}</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/bills/create')}
                    className="btn-primary"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('dashboard.billManagement.createBill')}
                </button>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">{t('dashboard.billManagement.billNumber')}</th>
                                <th className="px-6 py-4 font-medium">{t('dashboard.billManagement.date')}</th>
                                <th className="px-6 py-4 font-medium">{t('dashboard.billManagement.status')}</th>
                                <th className="px-6 py-4 font-medium">{t('dashboard.billManagement.products')}</th>
                                <th className="px-6 py-4 font-medium text-right">{t('dashboard.billManagement.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            {t('dashboard.billManagement.loadingBills')}
                                        </div>
                                    </td>
                                </tr>
                            ) : !hasBills ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="font-medium text-foreground">{t('dashboard.billManagement.noBills')}</p>
                                        <p className="text-sm mt-1">{t('dashboard.billManagement.noBillsSubtitle')}</p>
                                    </td>
                                </tr>
                            ) : (
                                billsList.map((bill: Bill) => (
                                    <tr key={bill.id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-primary">#{bill.number}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {format(new Date(bill.createdTs), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn('badge text-[10px]', statusColor(bill.status))}>
                                                {t(`status.bill.${bill.status}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Box className="h-4 w-4" />
                                                <span>{bill.orderProducts?.length || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedBill(bill)}
                                                    className="btn-ghost text-primary h-8 w-8 p-0"
                                                    title={t('dashboard.billManagement.viewDetails')}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {bill.status === 'DRAFT' && (
                                                    <>
                                                        <button
                                                            onClick={() => setApplyConfirmId(bill.id)}
                                                            className="btn-ghost text-success h-8 w-8 p-0"
                                                            title={t('dashboard.billManagement.apply')}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(bill.id)}
                                                            className="btn-ghost text-destructive h-8 w-8 p-0"
                                                            title={t('dashboard.billManagement.delete')}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && (data as any).totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {t('dashboard.billManagement.page', { page: (data as any).number + 1 })} of {(data as any).totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={(data as any).first}
                                className="btn-secondary h-8 px-3 text-xs"
                            >
                                {t('dashboard.billManagement.prev')}
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min((data as any).totalPages - 1, p + 1))}
                                disabled={(data as any).last}
                                className="btn-secondary h-8 px-3 text-xs"
                            >
                                {t('dashboard.billManagement.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>



            {selectedBill && (
                <BillDetailsModal
                    bill={selectedBill}
                    onClose={() => setSelectedBill(null)}
                    t={t}
                />
            )}

            <ConfirmModal
                isOpen={!!applyConfirmId}
                onClose={() => setApplyConfirmId(null)}
                onConfirm={() => {
                    if (applyConfirmId) applyMutation.mutate(applyConfirmId);
                }}
                title={t('dashboard.billManagement.applyBillTitle') || 'Apply Bill'}
                message={t('dashboard.billManagement.applyBillMessage') || 'Are you sure you want to apply this bill? This action cannot be undone.'}
                confirmText={t('dashboard.billManagement.applyConfirm') || 'Yes, Apply'}
            />

            <ConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => {
                    if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId);
                }}
                title={t('dashboard.billManagement.deleteBillTitle') || 'Delete Bill'}
                message={t('dashboard.billManagement.deleteBillMessage') || 'Are you sure you want to delete this draft bill?'}
                confirmText={t('dashboard.billManagement.deleteConfirm') || 'Delete'}
                isDestructive
            />
        </div>
    );
}


function ProductSearch({
    onSelect,
    t,
}: {
    onSelect: (product: OrderProduct) => void;
    t: any;
}) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ['orderProducts', 'search', debouncedSearch],
        queryFn: () => orderApi.searchBoxes({
            number: debouncedSearch ? Number(debouncedSearch) : undefined,
            size: 5
        }),
        enabled: debouncedSearch.length > 0 && !isNaN(Number(debouncedSearch)),
    });

    return (
        <div className="relative">
            <input
                type="number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('dashboard.billManagement.searchProductPlaceholder') || 'Search product by number...'}
                className="input w-full"
            />
            {debouncedSearch && (
                <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
                    {isLoading ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : data?.content?.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">No products found</div>
                    ) : (
                        <ul className="max-h-48 overflow-y-auto">
                            {data?.content?.map((product: OrderProduct) => (
                                <li key={product.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelect(product);
                                            setSearch('');
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-secondary/50 flex justify-between items-center"
                                    >
                                        <span className="font-medium">#{product.number}</span>
                                        <span className="text-xs text-muted-foreground">{product.partsCount} parts</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

function BillDetailsModal({
    bill,
    onClose,
    t,
}: {
    bill: Bill;
    onClose: () => void;
    t: any;
}) {
    const queryClient = useQueryClient();

    // We refetch the single bill to get the latest orderProducts list reliably
    const { data: billDetails, isLoading } = useQuery({
        queryKey: ['bill', bill.id],
        queryFn: () => billApi.getById(bill.id),
    });

    const removeProductMutation = useMutation({
        mutationFn: (productId: string) => (billApi.removeOrderProduct as any)(bill.id, productId, { customErrorToast: t('dashboard.billManagement.removeProductError') }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bill', bill.id] });
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.removeProductSuccess'));
        },
    });

    const addProductMutation = useMutation({
        mutationFn: (productId: string) => (billApi.addOrderProduct as any)(bill.id, productId, { customErrorToast: t('dashboard.billManagement.addProductError') || 'Failed to add product' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bill', bill.id] });
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.addProductSuccess') || 'Product added to bill');
        },
    });

    const isDraft = bill.status === 'DRAFT';

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                {t('dashboard.billManagement.billDetails')} #{bill.number}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn('badge text-[10px]', statusColor(bill.status))}>
                                    {t(`status.bill.${bill.status}`)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(bill.createdTs), 'MMM d, yyyy HH:mm')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-ghost h-8 w-8 p-0 rounded-full">
                        &times;
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{t('dashboard.billManagement.orderProducts')}</h4>
                    </div>

                    {isLoading ? (
                        <div className="py-8 flex justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : billDetails?.orderProducts?.length === 0 ? (
                        <div className="text-center py-8 border border-dashed rounded-lg border-border">
                            <Box className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">{t('dashboard.billManagement.noProducts')}</p>
                        </div>
                    ) : (
                        <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground bg-secondary/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">{t('dashboard.billManagement.productNumber')}</th>
                                        <th className="px-4 py-3 font-medium text-center">{t('dashboard.billManagement.partsCount')}</th>
                                        <th className="px-4 py-3 font-medium text-right">{t('dashboard.billManagement.price')}</th>
                                        {isDraft && <th className="px-4 py-3 font-medium w-12"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {billDetails?.orderProducts?.map((product) => (
                                        <tr key={product.id} className="hover:bg-secondary/20">
                                            <td className="px-4 py-3 font-medium">#{product.number}</td>
                                            <td className="px-4 py-3 text-center">{product.partsCount}</td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {product.price.toLocaleString('ru-RU')} ₽
                                            </td>
                                            {isDraft && (
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => removeProductMutation.mutate(product.id)}
                                                        disabled={removeProductMutation.isPending}
                                                        className="btn-ghost h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                                        title={t('dashboard.billManagement.removeProduct')}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {isDraft && (
                        <div className="mt-6 pt-4 border-t border-border">
                            <h5 className="font-medium text-sm mb-3">{t('dashboard.billManagement.addProductToBill') || 'Add Product to Bill'}</h5>
                            <ProductSearch
                                t={t}
                                onSelect={(product: OrderProduct) => {
                                    if (!billDetails?.orderProducts?.find((p: any) => p.id === product.id)) {
                                        addProductMutation.mutate(product.id);
                                    } else {
                                        toast.error(t('dashboard.billManagement.productAlreadyAdded') || 'Product already added');
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-secondary/30 flex justify-end items-center rounded-b-xl">
                    <button onClick={onClose} className="btn-primary">
                        {t('common.close') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
