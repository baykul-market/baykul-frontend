import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Box, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { orderApi, OrderProductStatus, type OrderProduct } from '../../api/order';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function BoxTrackingPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderProductStatus | ''>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Parse search term as number for searchBoxes call, but keep string for input
  const searchNumber = searchTerm && !isNaN(parseInt(searchTerm)) ? parseInt(searchTerm) : undefined;

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['box-tracking', searchNumber, statusFilter, page, pageSize],
    queryFn: () => orderApi.searchBoxes({
      number: searchNumber,
      status: statusFilter || undefined,
      page,
      size: pageSize
    }),
    enabled: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderProductStatus }) =>
      orderApi.updateOrderProduct(id, { status }),
    onSuccess: () => {
      toast.success(t('dashboard.boxTracking.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['box-tracking'] });
    },
    onError: () => toast.error(t('dashboard.boxTracking.updateError')),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const getNextStatuses = (currentStatus: OrderProductStatus): OrderProductStatus[] => {
    switch (currentStatus) {
      case OrderProductStatus.CREATED:
        return [OrderProductStatus.TO_ORDER, OrderProductStatus.CANCELLED];
      case OrderProductStatus.TO_ORDER:
        return [OrderProductStatus.ON_WAY, OrderProductStatus.CANCELLED];
      case OrderProductStatus.ON_WAY:
        return [OrderProductStatus.ARRIVED, OrderProductStatus.IN_WAREHOUSE, OrderProductStatus.RETURNED];
      case OrderProductStatus.ARRIVED:
      case OrderProductStatus.IN_WAREHOUSE:
        return [OrderProductStatus.SHIPPED, OrderProductStatus.RETURNED];
      case OrderProductStatus.SHIPPED:
        return [OrderProductStatus.DELIVERED, OrderProductStatus.RETURNED];
      case OrderProductStatus.DELIVERED:
        return [OrderProductStatus.RETURNED];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Box className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.boxTracking.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('dashboard.boxTracking.subtitle')}</p>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1.5">{t('dashboard.boxTracking.boxNumber')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="number"
                className="input-base pl-9"
                placeholder={t('dashboard.boxTracking.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full sm:w-[200px]">
            <label htmlFor="status-filter" className="block text-sm font-medium mb-1.5">{t('dashboard.boxTracking.status')}</label>
            <select
              id="status-filter"
              className="input-base"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderProductStatus | '');
                setPage(0);
              }}
            >
              <option value="">{t('dashboard.userManagement.searchAll')}</option>
              {Object.values(OrderProductStatus).map((s) => (
                <option key={s} value={s}>{t(`status.product.${s}`)}</option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t('dashboard.boxTracking.boxNumber')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t('dashboard.boxTracking.part')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t('dashboard.boxTracking.status')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t('dashboard.boxTracking.quantity')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t('dashboard.boxTracking.order')}</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">{t('dashboard.boxTracking.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {searchResults?.content?.length ? (
                  (() => {
                    let lastOrderId = '';
                    let isGrey = false;
                    // Cache to store full order objects encountered in the list
                    const ordersMap = new Map<string, { id: string; number: number }>();

                    return searchResults.content.map((box: OrderProduct) => {
                      // Resolve the order: it can be a full object or just a string ID
                      let orderObj: { id: string; number?: number } | undefined = undefined;

                      if (typeof box.order === 'string') {
                        // If it's a string, try to find the full object in our cache
                        orderObj = ordersMap.get(box.order) || { id: box.order };
                      } else if (box.order && typeof box.order === 'object') {
                        // If it's an object, store it in the cache for future references
                        orderObj = box.order as { id: string; number: number };
                        ordersMap.set(orderObj.id, orderObj as { id: string; number: number });
                      }

                      const currentOrderId = orderObj?.id || `no-order-${box.id}`;
                      if (currentOrderId !== lastOrderId && lastOrderId !== '') {
                        isGrey = !isGrey;
                      } else if (lastOrderId === '') {
                        // For the very first row, start with grey
                        isGrey = true;
                      }
                      lastOrderId = currentOrderId;

                      return (
                        <tr key={box.id} className={cn(
                          "transition-colors",
                          isGrey ? "bg-muted" : "bg-background box-white-row"
                        )}>
                          <td className="px-5 py-4 font-mono font-medium text-sm">
                            {box.number || '-'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-sm">{box.part.brand} - {box.part.article}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{box.part.name}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "badge text-[10px]",
                              box.status === OrderProductStatus.DELIVERED ? "bg-success/10 text-success border-success/20" :
                                box.status === OrderProductStatus.CANCELLED || box.status === OrderProductStatus.RETURNED ? "bg-destructive/10 text-destructive border-destructive/20" :
                                  "bg-primary/10 text-primary border-primary/20"
                            )}>
                              {t(`status.product.${box.status}`)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm">{box.partsCount}</td>
                          <td className="px-5 py-4 text-sm">
                            {orderObj ? (
                              <Link to={`/dashboard/orders/${orderObj.id}`} className="text-primary hover:underline flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                #{orderObj.number || '...'}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2 flex-wrap max-w-[300px] ml-auto">
                              {getNextStatuses(box.status).map((nextStatus) => (
                                <button
                                  key={nextStatus}
                                  onClick={() => updateStatusMutation.mutate({ id: box.id, status: nextStatus })}
                                  className="btn-ghost cursor-pointer px-2 py-1 text-[10px] border border-border hover:bg-secondary h-auto disabled:cursor-not-allowed"
                                  disabled={updateStatusMutation.isPending}
                                >
                                  {t(`status.product.${nextStatus}`)}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Box className="h-8 w-8 opacity-20" />
                        <p>{t('dashboard.boxTracking.noBoxes')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(page > 0 || (searchResults?.content?.length === pageSize)) && (
            <div className="flex items-center justify-between px-5 py-4 border-t bg-secondary/10 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {t('dashboard.userManagement.page', { page: page + 1 })}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t('common.pageSize')}:</span>
                  <select
                    className="input-base py-1 px-2 text-sm w-auto cursor-pointer"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary px-3 py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('dashboard.userManagement.prev')}
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!searchResults || (searchResults.content?.length ?? 0) < pageSize}
                  className="btn-secondary px-3 py-2"
                >
                  {t('dashboard.userManagement.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
