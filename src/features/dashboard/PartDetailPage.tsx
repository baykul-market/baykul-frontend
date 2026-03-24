import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { productApi, type PartUpdateInput } from '../../api/product';
import {
  ArrowLeft, Package, Loader2, Save, AlertCircle,
  Calendar, Tag, Scale, Hash, DollarSign, Warehouse, Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function PartDetailPage() {
  const { t } = useTranslation();
  const { partId } = useParams<{ partId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  if (!user || user.role === 'USER') {
    navigate('/products');
    return null;
  }

  const { data: part, isLoading, error } = useQuery({
    queryKey: ['part-detail', partId],
    queryFn: () => productApi.getById(partId!),
    enabled: !!partId,
  });

  // Editable state – initialized once part loads
  const [price, setPrice] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [storageCount, setStorageCount] = useState<string | null>(null);
  const [minCount, setMinCount] = useState<string | null>(null);
  const [returnPart, setReturnPart] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derive effective values (use local state if user has edited, otherwise use fetched data)
  const effectivePrice = price ?? part?.price?.toString() ?? '0';
  const effectiveCurrency = currency ?? part?.currency ?? 'EUR';
  const effectiveStorageCount = storageCount ?? part?.storageCount?.toString() ?? '0';
  const effectiveMinCount = minCount ?? part?.minCount?.toString() ?? '1';
  const effectiveReturnPart = returnPart ?? part?.returnPart?.toString() ?? '';

  const updateMutation = useMutation({
    mutationFn: (data: PartUpdateInput) => productApi.update(partId!, data),
    onSuccess: () => {
      toast.success(t('dashboard.partsManagement.updateSuccess', 'Part updated successfully'));
      queryClient.invalidateQueries({ queryKey: ['part-detail', partId] });
      queryClient.invalidateQueries({ queryKey: ['admin-parts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-parts-search'] });
      // Reset local state so it re-syncs with fetched data
      setPrice(null);
      setCurrency(null);
      setStorageCount(null);
      setMinCount(null);
      setReturnPart(null);
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (error?.response?.status === 400 || error?.response?.status === 409) {
        setErrors(data ?? {});
      }
      toast.error(t('dashboard.partsManagement.updateError', 'Failed to update part'));
    },
  });

  const handleSave = () => {
    setErrors({});
    const data: PartUpdateInput = {
      price: parseFloat(effectivePrice) || 0,
      currency: effectiveCurrency,
      storageCount: effectiveStorageCount ? parseInt(effectiveStorageCount, 10) : null,
      minCount: parseInt(effectiveMinCount, 10) || 1,
      returnPart: effectiveReturnPart ? parseFloat(effectiveReturnPart) : null,
    };
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {t('dashboard.partsManagement.loadingParts', 'Loading part details...')}
        </p>
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center animate-fade-in">
        <AlertCircle className="h-16 w-16 text-destructive/20" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            {t('dashboard.partsManagement.partNotFound', 'Part Not Found')}
          </h2>
          <p className="text-muted-foreground max-w-sm">
            {t('dashboard.partsManagement.partNotFoundDesc', 'The part you are looking for does not exist or has been removed.')}
          </p>
        </div>
        <button onClick={() => navigate('/dashboard/parts')} className="btn-secondary mt-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('dashboard.partsManagement.backToParts', 'Back to Parts')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-10 space-y-6">
      {/* Back Navigation */}
      <div>
        <button
          onClick={() => navigate('/dashboard/parts')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('dashboard.partsManagement.backToParts', 'Back to Parts')}
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{part.name}</h1>
            <p className="text-muted-foreground text-sm">
              {part.brand} • #{part.article}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="btn-primary px-6"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {t('common.save', 'Save Changes')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content: Editable Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {t('dashboard.partsManagement.editableFields', 'Editable Fields')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Price + Currency */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('dashboard.partsManagement.price', 'Price')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="input-base flex-1"
                    value={effectivePrice}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-base w-24"
                    value={effectiveCurrency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>
                {errors.error_price && <p className="mt-1 text-xs text-destructive">{errors.error_price}</p>}
              </div>

              {/* Storage Count */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('dashboard.partsManagement.storageCount', 'Storage Count')}
                </label>
                <input
                  type="number"
                  className="input-base"
                  value={effectiveStorageCount}
                  onChange={(e) => setStorageCount(e.target.value)}
                />
              </div>

              {/* Min Count */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('dashboard.partsManagement.minCount', 'Min Count')}
                </label>
                <input
                  type="number"
                  className="input-base"
                  value={effectiveMinCount}
                  onChange={(e) => setMinCount(e.target.value)}
                />
                {errors.error_minCount && <p className="mt-1 text-xs text-destructive">{errors.error_minCount}</p>}
              </div>

              {/* Return Part Multiplier */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('dashboard.partsManagement.returnPart', 'Return Part Multiplier')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-base"
                  value={effectiveReturnPart}
                  onChange={(e) => setReturnPart(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Read-only Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              {t('dashboard.partsManagement.partInfo', 'Part Information')}
            </h2>
            <div className="space-y-4 text-sm">
              <InfoRow
                icon={<Tag className="w-4 h-4" />}
                label={t('common.article', 'Article')}
                value={part.article}
              />
              <InfoRow
                icon={<Package className="w-4 h-4" />}
                label={t('common.name', 'Name')}
                value={part.name}
              />
              <InfoRow
                icon={<Hash className="w-4 h-4" />}
                label={t('common.brand', 'Brand')}
                value={part.brand}
              />
              <InfoRow
                icon={<Scale className="w-4 h-4" />}
                label={t('dashboard.partsManagement.weight', 'Weight')}
                value={part.weight != null ? `${part.weight} kg` : '—'}
              />
              {part.realPrice != null && (
                <InfoRow
                  icon={<DollarSign className="w-4 h-4" />}
                  label={t('dashboard.partsManagement.realPrice', 'Real Price')}
                  value={`${part.realPrice} ${part.realCurrency || ''}`}
                />
              )}
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label={t('common.created', 'Created')}
                value={part.createdTs ? format(new Date(part.createdTs), 'dd.MM.yyyy HH:mm') : '—'}
              />
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label={t('common.updated', 'Updated')}
                value={part.updatedTs ? format(new Date(part.updatedTs), 'dd.MM.yyyy HH:mm') : '—'}
              />
            </div>
          </div>

          {/* Current Values Card */}
          <div className="card p-6 border-primary/20 bg-primary/5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-primary" />
              {t('dashboard.partsManagement.stock', 'Stock')}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">{part.storageCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Count</span>
                <span className="font-medium">{part.minCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.partsManagement.returnPart', 'Return Part')}</span>
                <span className="font-medium">{part.returnPart ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">{label}</span>
        <span className="font-medium break-words">{value}</span>
      </div>
    </div>
  );
}
