import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Box, Loader2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { orderApi, OrderProductStatus, type OrderProduct } from '../../api/order';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

export default function BoxTrackingPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderProductStatus | ''>('');
  const [page, setPage] = useState(0);

  // Parse search term as number for searchBoxes call, but keep string for input
  const searchNumber = searchTerm && !isNaN(parseInt(searchTerm)) ? parseInt(searchTerm) : undefined;

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['box-tracking', searchNumber, statusFilter, page],
    queryFn: () => orderApi.searchBoxes({
      number: searchNumber,
      status: statusFilter || undefined,
      page,
      size: PAGE_SIZE
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
      case OrderProductStatus.ORDERED:
        return [OrderProductStatus.IN_WAREHOUSE, OrderProductStatus.CANCELLED];
      case OrderProductStatus.IN_WAREHOUSE:
        return [OrderProductStatus.ON_WAY, OrderProductStatus.CANCELLED];
      case OrderProductStatus.ON_WAY:
        return [OrderProductStatus.ARRIVED, OrderProductStatus.RETURNED];
      case OrderProductStatus.ARRIVED:
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
                <option key={s} value={s}>{s}</option>
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
                {searchResults?.content && searchResults.content.length > 0 ? (
                  searchResults.content.map((box: OrderProduct) => (
                    <tr key={box.id} className="hover:bg-secondary/20 transition-colors">
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
                          {box.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">{box.partsCount}</td>
                      <td className="px-5 py-4 text-sm">
                        {box.order ? (
                          <Link to={`/dashboard/orders/${box.order.id}`} className="text-primary hover:underline flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            #{box.order.number}
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
                              className="btn-ghost px-2 py-1 text-[10px] border border-border hover:bg-secondary h-auto"
                              disabled={updateStatusMutation.isPending}
                            >
                              {nextStatus}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
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
          
          {/* Simple Pagination */}
          {searchResults && searchResults.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t bg-secondary/10">
              <p className="text-sm text-muted-foreground">
                {t('dashboard.userManagement.page', { page: page + 1 })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  {t('dashboard.userManagement.prev')}
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= searchResults.totalPages - 1}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  {t('dashboard.userManagement.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
