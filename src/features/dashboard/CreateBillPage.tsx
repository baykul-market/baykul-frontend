import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { billApi } from '../../api/bill';
import { orderApi } from '../../api/order';

import {
    FileText,
    ArrowLeft,
    Search,
    X,
    Box,
    CheckSquare,
    Square,
    Minus,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;


export default function CreateBillPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Bill form state

    // Filter state
    const [numberFilter, setNumberFilter] = useState('');
    const [debouncedNumber, setDebouncedNumber] = useState('');

    const [page, setPage] = useState(0);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Debounce the number search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedNumber(numberFilter), 300);
        return () => clearTimeout(timer);
    }, [numberFilter]);

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [debouncedNumber]);

    // Build query params
    const queryParams = useMemo(() => {
        const params: Record<string, any> = {
            forBill: true,
            page,
            size: PAGE_SIZE,
            sort: ['number,asc'],
        };
        if (debouncedNumber && !isNaN(Number(debouncedNumber))) {
            params.number = Number(debouncedNumber);
        }

        return params;
    }, [debouncedNumber, page]);

    // Fetch unbilled order products
    const { data, isLoading } = useQuery({
        queryKey: ['unbilledProducts', queryParams],
        queryFn: () => orderApi.searchBoxes(queryParams),
    });

    const products = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;

    // Check if all products on current page are selected
    const allOnPageSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
    const someOnPageSelected = products.some(p => selectedIds.has(p.id));

    // Toggle single product selection
    const toggleProduct = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Toggle all products on current page
    const toggleAllOnPage = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allOnPageSelected) {
                products.forEach(p => next.delete(p.id));
            } else {
                products.forEach(p => next.add(p.id));
            }
            return next;
        });
    };

    // Clear all selections
    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    // Create bill mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => billApi.create(data, { customErrorToast: t('dashboard.billManagement.createError') }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success(t('dashboard.billManagement.createSuccess'));
            navigate('/dashboard/bills');
        },
    });

    const handleSubmit = () => {
        if (selectedIds.size === 0) {
            toast.error(t('dashboard.billManagement.selectAtLeastOne') || 'Select at least one product');
            return;
        }
        createMutation.mutate({
            orderProducts: Array.from(selectedIds).map(id => ({ id })),
        });
    };

    const hasActiveFilters = !!debouncedNumber;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/bills')}
                        className="btn-ghost h-10 w-10 p-0 rounded-full"
                        title={t('dashboard.billManagement.backToBills') || 'Back to Bills'}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {t('dashboard.billManagement.createBill')}
                        </h2>
                        <p className="text-muted-foreground">
                            {t('dashboard.billManagement.createBillSubtitle') || 'Select order products to include in the new bill'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Create Button */}
            <div className="card p-4">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <p className="text-sm text-muted-foreground flex-1">
                        {t('dashboard.billManagement.createBillSubtitle') || 'Select order products to include in the new bill'}
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || selectedIds.size === 0}
                        className="btn-primary h-10"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        {createMutation.isPending
                            ? t('common.loading')
                            : `${t('dashboard.billManagement.createBill')} (${selectedIds.size})`
                        }
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="number"
                            value={numberFilter}
                            onChange={(e) => setNumberFilter(e.target.value)}
                            placeholder={t('dashboard.billManagement.filterByNumber') || 'Filter by number...'}
                            className="input w-full pl-9"
                        />
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={() => setNumberFilter('')}
                            className="btn-ghost h-8 px-2 text-xs text-muted-foreground"
                        >
                            <X className="h-3 w-3 mr-1" />
                            {t('dashboard.billManagement.clearFilters') || 'Clear'}
                        </button>
                    )}
                </div>
            </div>

            {/* Selection summary */}
            {selectedIds.size > 0 && (
                <div className="card p-3 bg-primary/5 border-primary/20 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <CheckSquare className="h-4 w-4" />
                        {t('dashboard.billManagement.selectedCount', { count: selectedIds.size }) || `${selectedIds.size} products selected`}
                    </div>
                    <button
                        onClick={clearSelection}
                        className="btn-ghost h-7 px-2 text-xs text-muted-foreground"
                    >
                        {t('dashboard.billManagement.clearSelection') || 'Clear selection'}
                    </button>
                </div>
            )}

            {/* Products Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                            <tr>
                                <th className="px-4 py-4 w-12">
                                    <button
                                        onClick={toggleAllOnPage}
                                        className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                        title={allOnPageSelected ? 'Deselect all' : 'Select all'}
                                        disabled={products.length === 0}
                                    >
                                        {allOnPageSelected ? (
                                            <CheckSquare className="h-4 w-4 text-primary" />
                                        ) : someOnPageSelected ? (
                                            <Minus className="h-4 w-4 text-primary" />
                                        ) : (
                                            <Square className="h-4 w-4" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-4 font-medium">
                                    {t('dashboard.billManagement.productNumber')}
                                </th>
                                <th className="px-4 py-4 font-medium text-center">
                                    {t('dashboard.billManagement.partsCount')}
                                </th>
                                <th className="px-4 py-4 font-medium text-right">
                                    {t('dashboard.billManagement.price')}
                                </th>
                                <th className="px-4 py-4 font-medium">
                                    {t('dashboard.billManagement.status')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            {t('common.loading')}
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="font-medium text-foreground">
                                            {t('dashboard.billManagement.noBillableProducts') || 'No unbilled products found'}
                                        </p>
                                        <p className="text-sm mt-1">
                                            {hasActiveFilters
                                                ? (t('dashboard.billManagement.tryOtherFilters') || 'Try adjusting your filters')
                                                : (t('dashboard.billManagement.allProductsBilled') || 'All order products are already billed')
                                            }
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                (() => {
                                    let lastOrderId = '';
                                    let isGrey = false;
                                    // Cache to resolve identity references
                                    const ordersMap = new Map<string, any>();

                                    return products.map((product: any) => {
                                        // Resolve order reference
                                        let orderId = '';
                                        if (product.order) {
                                            if (typeof product.order === 'string') {
                                                orderId = product.order;
                                            } else {
                                                orderId = product.order.id;
                                                ordersMap.set(orderId, product.order);
                                            }
                                        }

                                        const currentOrderId = orderId || `no-order-${product.id}`;
                                        if (currentOrderId !== lastOrderId && lastOrderId !== '') {
                                            isGrey = !isGrey;
                                        } else if (lastOrderId === '') {
                                            // For the very first row, start with grey
                                            isGrey = true;
                                        }
                                        lastOrderId = currentOrderId;

                                        const isSelected = selectedIds.has(product.id);
                                        return (
                                            <tr
                                                key={product.id}
                                                className={cn(
                                                    'transition-colors',
                                                    isSelected
                                                        ? 'bg-primary/10'
                                                        : isGrey ? 'bg-muted' : 'bg-background'
                                                )}
                                            >
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => toggleProduct(product.id)}
                                                        className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity outline-none"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="h-4 w-4 text-primary" />
                                                        ) : (
                                                            <Square className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-primary">
                                                    <div className="flex flex-col">
                                                        <span>#{product.number ?? '—'}</span>
                                                        {orderId && (
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                Order: {ordersMap.get(orderId)?.number || orderId.substring(0, 8)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {product.partsCount}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {product.price != null
                                                        ? `${product.price.toLocaleString('ru-RU')} ₽`
                                                        : (product.part?.price != null ? `${product.part.price.toLocaleString('ru-RU')} ₽` : '—')
                                                    }
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        'badge text-[10px]',
                                                        product.status === 'ARRIVED' || product.status === 'DELIVERED'
                                                            ? 'bg-success/10 text-success border-success/20'
                                                            : product.status === 'IN_WAREHOUSE'
                                                                ? 'bg-info/10 text-info border-info/20'
                                                                : 'bg-warning/10 text-warning border-warning/20'
                                                    )}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {t('dashboard.billManagement.page', { page: page + 1 })} of {totalPages}
                            {' · '}
                            {totalElements} {t('dashboard.billManagement.products').toLowerCase()}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="btn-secondary h-8 px-3 text-xs"
                            >
                                {t('dashboard.billManagement.prev')}
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="btn-secondary h-8 px-3 text-xs"
                            >
                                {t('dashboard.billManagement.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
