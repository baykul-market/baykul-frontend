import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billApi, Bill, BillStatus } from '../../api/bill';
import { orderApi } from '../../api/order';
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
    const [page, setPage] = useState(0);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Queries
    const { data, isLoading } = useQuery({
        queryKey: ['bills', page],
        queryFn: () => billApi.getAll(page, PAGE_SIZE, 'createdTs,desc'),
    });

    // Mutations
    const applyMutation = useMutation({
        mutationFn: billApi.apply,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.applySuccess'));
            setSelectedBill(null);
        },
        onError: () => toast.error(t('dashboard.billManagement.applyError')),
    });

    const deleteMutation = useMutation({
        mutationFn: billApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.deleteSuccess'));
            setSelectedBill(null);
        },
        onError: () => toast.error(t('dashboard.billManagement.deleteError')),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.billManagement.title')}</h2>
                    <p className="text-muted-foreground">{t('dashboard.billManagement.subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
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
                            ) : data?.content?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="font-medium text-foreground">{t('dashboard.billManagement.noBills')}</p>
                                        <p className="text-sm mt-1">{t('dashboard.billManagement.noBillsSubtitle')}</p>
                                    </td>
                                </tr>
                            ) : (
                                data?.content?.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-primary">#{bill.number}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {format(new Date(bill.createdTs), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn('badge text-[10px]', statusColor(bill.status))}>
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Box className="h-4 w-4" />
                                                <span>{bill.orderProducts?.length || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedBill(bill)}
                                                className="btn-ghost text-primary h-8 w-8 p-0"
                                                title={t('dashboard.billManagement.viewDetails')}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {t('dashboard.billManagement.page', { page: data.number + 1 })} of {data.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={data.first}
                                className="btn-secondary h-8 px-3 text-xs"
                            >
                                {t('dashboard.billManagement.prev')}
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                                disabled={data.last}
                                className="btn-secondary h-8 px-3 text-xs"
                            >
                                {t('dashboard.billManagement.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <CreateBillModal
                    onClose={() => setIsCreateModalOpen(false)}
                    t={t}
                />
            )}

            {selectedBill && (
                <BillDetailsModal
                    bill={selectedBill}
                    onClose={() => setSelectedBill(null)}
                    onApply={() => applyMutation.mutate(selectedBill.id)}
                    onDelete={() => deleteMutation.mutate(selectedBill.id)}
                    isApplying={applyMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                    t={t}
                />
            )}
        </div>
    );
}

function ProductSearch({
    onSelect,
    t,
}: {
    onSelect: (product: any) => void;
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
                            {data?.content?.map((product: any) => (
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

function CreateBillModal({
    onClose,
    t,
}: {
    onClose: () => void;
    t: any;
}) {
    const queryClient = useQueryClient();
    const [number, setNumber] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

    const createMutation = useMutation({
        mutationFn: billApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.createSuccess'));
            onClose();
        },
        onError: () => toast.error(t('dashboard.billManagement.createError')),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!number || isNaN(Number(number)) || Number(number) < 10000) return;
        createMutation.mutate({
            number: Number(number),
            orderProducts: selectedProducts.map(p => ({ id: p.id }))
        });
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-scale-in">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {t('dashboard.billManagement.createBill')}
                    </h3>
                    <button onClick={onClose} className="btn-ghost h-8 w-8 p-0 rounded-full">
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t('dashboard.billManagement.billNumber')}
                            </label>
                            <input
                                type="number"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                className="input w-full"
                                placeholder={t('dashboard.billManagement.enterBillNumber')}
                                min="10000"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t('dashboard.billManagement.orderProducts')}
                            </label>
                            <ProductSearch
                                t={t}
                                onSelect={(product) => {
                                    if (!selectedProducts.find(p => p.id === product.id)) {
                                        setSelectedProducts([...selectedProducts, product]);
                                    }
                                }}
                            />

                            {selectedProducts.length > 0 && (
                                <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto bg-secondary/20 p-2 rounded-lg border border-border">
                                    {selectedProducts.map(p => (
                                        <li key={p.id} className="flex justify-between items-center bg-card p-2 rounded border border-border text-sm">
                                            <div className="flex items-center gap-2">
                                                <Box className="h-4 w-4 text-muted-foreground" />
                                                <span>#{p.number} ({p.partsCount} parts)</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedProducts(selectedProducts.filter(x => x.id !== p.id))}
                                                className="text-destructive hover:bg-destructive/10 p-1 rounded"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !number || Number(number) < 10000}
                            className="btn-primary"
                        >
                            {createMutation.isPending ? t('common.loading') : t('dashboard.billManagement.createBill')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BillDetailsModal({
    bill,
    onClose,
    onApply,
    onDelete,
    isApplying,
    isDeleting,
    t,
}: {
    bill: Bill;
    onClose: () => void;
    onApply: () => void;
    onDelete: () => void;
    isApplying: boolean;
    isDeleting: boolean;
    t: any;
}) {
    const queryClient = useQueryClient();
    const [isApplyingConfirm, setIsApplyingConfirm] = useState(false);

    // We refetch the single bill to get the latest orderProducts list reliably
    const { data: billDetails, isLoading } = useQuery({
        queryKey: ['bill', bill.id],
        queryFn: () => billApi.getById(bill.id),
    });

    const removeProductMutation = useMutation({
        mutationFn: (productId: string) => billApi.removeOrderProduct(bill.id, productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bill', bill.id] });
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.removeProductSuccess'));
        },
        onError: () => toast.error(t('dashboard.billManagement.removeProductError')),
    });

    const addProductMutation = useMutation({
        mutationFn: (productId: string) => billApi.addOrderProduct(bill.id, productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bill', bill.id] });
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.addProductSuccess') || 'Product added to bill');
        },
        onError: () => toast.error(t('dashboard.billManagement.addProductError') || 'Failed to add product'),
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
                                    {bill.status}
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
                                onSelect={(product) => {
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

                <div className="p-6 border-t border-border bg-secondary/30 flex justify-between items-center rounded-b-xl">
                    <button
                        onClick={onDelete}
                        disabled={isDeleting || !isDraft}
                        className="btn-ghost text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                        {isDeleting ? t('common.loading') : t('common.cancel')} Bill
                    </button>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn-secondary">
                            {t('common.cancel')}
                        </button>
                        {isDraft && (
                            isApplyingConfirm ? (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <span className="text-sm font-medium mr-2">{t('dashboard.billManagement.applyConfirmTitle')}</span>
                                    <button
                                        onClick={() => setIsApplyingConfirm(false)}
                                        className="btn-secondary h-9"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsApplyingConfirm(false);
                                            onApply();
                                        }}
                                        disabled={isApplying || billDetails?.orderProducts?.length === 0}
                                        className="btn-primary h-9 bg-success hover:bg-success/90"
                                    >
                                        Yes, Apply
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsApplyingConfirm(true)}
                                    disabled={isApplying || billDetails?.orderProducts?.length === 0}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {t('dashboard.billManagement.apply')}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
