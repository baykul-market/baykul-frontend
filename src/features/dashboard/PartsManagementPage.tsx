import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  productApi,
  type Part,
  type PartCreateInput,
  type PartUpdateInput,
} from '../../api/product';
import {
  Package, Plus, Pencil, Trash2, CheckCircle, AlertCircle, X, Search,
  Loader2, ChevronLeft, ChevronRight, Upload, FileText, Download, Info, Database
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const CSV_HEADERS = 'article;name;weight;min_count;storage_count;return_part;price;brand';
const CSV_EXAMPLE = '2405947;Engine Oil LL01 5W30;150.4;3;5;3.01;7862.43;rolls royce';

export default function PartsManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [deletePart, setDeletePart] = useState<Part | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  if (!user || user.role === 'USER') {
    navigate('/products');
    return null;
  }

  const isSearching = activeSearch.trim().length > 0;

  const { data: pagedParts, isLoading: isLoadingPaged } = useQuery({
    queryKey: ['admin-parts', page],
    queryFn: () => productApi.getAll(page, PAGE_SIZE),
    enabled: !isSearching,
  });

  const { data: searchResults, isLoading: isLoadingSearch, isFetching: isFetchingSearch } = useQuery({
    queryKey: ['admin-parts-search', activeSearch],
    queryFn: () => productApi.search(activeSearch),
    enabled: isSearching,
  });

  const parts = isSearching ? searchResults : pagedParts?.content;
  const isLoading = isSearching ? (isLoadingSearch || isFetchingSearch) : isLoadingPaged;

  const handleSearch = () => {
    setActiveSearch(searchTerm.trim());
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
    setPage(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      toast.success(t('dashboard.partsManagement.deleteSuccess', 'Part deleted successfully'));
      queryClient.invalidateQueries({ queryKey: ['admin-parts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-parts-search'] });
      setDeletePart(null);
    },
    onError: () => toast.error(t('dashboard.partsManagement.deleteError', 'Failed to delete part')),
  });

  const hasMore = !isSearching && (pagedParts?.content?.length ?? 0) === PAGE_SIZE && !pagedParts?.last;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('dashboard.partsManagement.title', 'Parts Management')}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('dashboard.partsManagement.subtitle', 'Manage parts inventory, upload CSV, and edit part details.')}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="btn-secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t('dashboard.partsManagement.uploadCsv', 'Upload CSV')}
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.partsManagement.addPart', 'Add Part')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <input
              type="search"
              className="input-base pl-11 pr-4 py-2.5"
              placeholder={t('dashboard.partsManagement.searchPlaceholder', 'Search by article, name, or brand...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          {isSearching && (
            <button onClick={handleClearSearch} className="btn-secondary px-4" title={t('common.cancel')}>
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleSearch} className="btn-primary px-6" disabled={!searchTerm.trim()}>
            <Search className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('common.search')}</span>
          </button>
        </div>
      </div>

      {/* Parts List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {t('dashboard.partsManagement.loadingParts', 'Loading parts...')}
          </p>
        </div>
      ) : parts && parts.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.partsManagement.part', 'Part')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.partsManagement.stock', 'Stock')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.partsManagement.price', 'Price')}
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.partsManagement.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parts.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/dashboard/parts/${p.id}`)}
                      className="hover:bg-secondary/20 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.brand} • #{p.article}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="truncate">
                              Storage: {p.storageCount ?? 0} | Min: {p.minCount}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-sm">
                            {p.realPrice != null ? p.realPrice : p.price} {p.realCurrency || p.currency}
                          </span>
                          {p.realPrice != null && (
                            <p className="text-xs text-muted-foreground">
                              Calc: {p.price} {p.currency}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditPart(p)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title={t('common.edit')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletePart(p)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!isSearching && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('common.page', { page: page + 1 })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary px-3 py-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                  className="btn-secondary px-3 py-2"
                >
                  {t('common.next')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">
              {isSearching
                ? t('dashboard.partsManagement.noPartsFound', 'No Parts Found')
                : t('dashboard.partsManagement.noParts', 'No Parts Available')}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {t('dashboard.partsManagement.noPartsSubtitle', 'Add parts manually or upload from a CSV file.')}
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.partsManagement.addPart', 'Add Part')}
          </button>
        </div>
      )}

      {createModalOpen && (
        <PartFormModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-parts'] });
            queryClient.invalidateQueries({ queryKey: ['admin-parts-search'] });
          }}
          t={t}
        />
      )}

      {editPart && (
        <PartFormModal
          part={editPart}
          onClose={() => setEditPart(null)}
          onSuccess={() => {
            setEditPart(null);
            queryClient.invalidateQueries({ queryKey: ['admin-parts'] });
            queryClient.invalidateQueries({ queryKey: ['admin-parts-search'] });
          }}
          t={t}
        />
      )}

      {deletePart && (
        <DeleteConfirmModal
          part={deletePart}
          isDeleting={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deletePart.id)}
          onCancel={() => setDeletePart(null)}
          t={t}
        />
      )}

      {uploadModalOpen && (
        <CsvUploadModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
             queryClient.invalidateQueries({ queryKey: ['admin-parts'] });
             queryClient.invalidateQueries({ queryKey: ['admin-parts-search'] });
          }}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Modals ─────────────────────────────────────────────────────────

function PartFormModal({
  part,
  onClose,
  onSuccess,
  t,
}: {
  part?: Part;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string, _opts?: any) => string;
}) {
  const isEdit = !!part;
  const [article, setArticle] = useState(part?.article ?? '');
  const [name, setName] = useState(part?.name ?? '');
  const [brand, setBrand] = useState(part?.brand ?? '');
  const [weight, setWeight] = useState(part?.weight?.toString() ?? '');
  const [minCount, setMinCount] = useState(part?.minCount?.toString() ?? '1');
  const [storageCount, setStorageCount] = useState(part?.storageCount?.toString() ?? '0');
  const [price, setPrice] = useState(part?.price?.toString() ?? '0');
  const [currency, setCurrency] = useState(part?.currency ?? 'EUR');
  const [returnPart, setReturnPart] = useState(part?.returnPart?.toString() ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: PartCreateInput) => productApi.create(data),
    onSuccess: () => {
      toast.success(t('dashboard.partsManagement.createSuccess', 'Part created successfully'));
      onSuccess();
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (error?.response?.status === 400 || error?.response?.status === 409) {
        setErrors(data ?? {});
      }
      toast.error(t('dashboard.partsManagement.createError', 'Failed to create part'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PartUpdateInput) => productApi.update(part!.id, data),
    onSuccess: () => {
      toast.success(t('dashboard.partsManagement.updateSuccess', 'Part updated successfully'));
      onSuccess();
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (error?.response?.status === 400 || error?.response?.status === 409) {
        setErrors(data ?? {});
      }
      toast.error(t('dashboard.partsManagement.updateError', 'Failed to update part'));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: PartCreateInput = {
      article,
      name,
      brand,
      price: parseFloat(price) || 0,
      currency,
      minCount: parseInt(minCount, 10) || 1,
      storageCount: storageCount ? parseInt(storageCount, 10) : null,
      weight: weight ? parseFloat(weight) : null,
      returnPart: returnPart ? parseFloat(returnPart) : null,
    };

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl card p-0 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEdit ? t('dashboard.partsManagement.editPart', 'Edit Part') : t('dashboard.partsManagement.createPart', 'Create Part')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors" title={t('common.cancel')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.article', 'Article')}</label>
              <input type="text" className="input-base" value={article} onChange={(e) => setArticle(e.target.value)} required />
              {errors.error_article && <p className="mt-1 text-xs text-destructive">{errors.error_article}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.name', 'Name')}</label>
              <input type="text" className="input-base" value={name} onChange={(e) => setName(e.target.value)} required />
              {errors.error_name && <p className="mt-1 text-xs text-destructive">{errors.error_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.brand', 'Brand')}</label>
              <input type="text" className="input-base" value={brand} onChange={(e) => setBrand(e.target.value)} required />
              {errors.error_brand && <p className="mt-1 text-xs text-destructive">{errors.error_brand}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('dashboard.partsManagement.price', 'Price')}</label>
              <div className="flex gap-2">
                <input type="number" step="0.01" className="input-base" value={price} onChange={(e) => setPrice(e.target.value)} required />
                <input type="text" className="input-base w-24" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
              </div>
              {errors.error_price && <p className="mt-1 text-xs text-destructive">{errors.error_price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('dashboard.partsManagement.minCount', 'Min Count')}</label>
              <input type="number" className="input-base" value={minCount} onChange={(e) => setMinCount(e.target.value)} required />
              {errors.error_minCount && <p className="mt-1 text-xs text-destructive">{errors.error_minCount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('dashboard.partsManagement.storageCount', 'Storage Count')}</label>
              <input type="number" className="input-base" value={storageCount} onChange={(e) => setStorageCount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('dashboard.partsManagement.weight', 'Weight')}</label>
              <input type="number" step="0.01" className="input-base" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('dashboard.partsManagement.returnPart', 'Return Part Multiplier')}</label>
              <input type="number" step="0.01" className="input-base" value={returnPart} onChange={(e) => setReturnPart(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={onClose} className="btn-secondary px-6" disabled={isPending}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary px-6 w-32" disabled={isPending}>
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : t('common.save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  part,
  isDeleting,
  onConfirm,
  onCancel,
  t,
}: {
  part: Part;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string, _opts?: any) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm card p-6 animate-slide-up text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {t('dashboard.partsManagement.deleteConfirmTitle', 'Delete Part')}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('dashboard.partsManagement.deleteConfirmText', 'Are you sure you want to delete this part? This action cannot be undone.')}
          <br /><br />
          <span className="font-medium text-foreground">{part.name}</span>
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={isDeleting}>
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} className="btn-primary bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1" disabled={isDeleting}>
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CsvUploadModal({ onClose, onSuccess, t }: { onClose: () => void; onSuccess: () => void; t: (key: string) => string }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (csvFile: File) => productApi.uploadCsv(csvFile),
    onSuccess: () => {
      toast.success(t('dashboard.partsUpload.uploadSuccess'));
      setFile(null);
      setErrors(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (error?.response?.status === 400 && data) {
        setErrors(data);
        toast.error(t('dashboard.partsUpload.validationError'));
      } else if (error?.response?.status === 403) {
        toast.error(t('dashboard.partsUpload.forbidden'));
      } else {
        toast.error(t('dashboard.partsUpload.uploadError'));
      }
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (f: File): boolean => {
    if (!f.name.endsWith('.csv')) {
      toast.error(t('dashboard.partsUpload.invalidFileType'));
      return false;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error(t('dashboard.partsUpload.fileTooLarge'));
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setErrors(null);
    }
  }, [t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setErrors(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setErrors(null);
    uploadMutation.mutate(file);
  };

  const downloadTemplate = () => {
    const content = CSV_HEADERS + '\n' + CSV_EXAMPLE + '\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parts_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { onClose(); onSuccess(); }} />
      <div className="relative w-full max-w-2xl card p-0 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-lg font-semibold">
             <Upload className="w-5 h-5 text-primary" />
             {t('dashboard.partsUpload.title')}
          </div>
          <button onClick={() => { onClose(); onSuccess(); }} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors" title={t('common.cancel')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-muted-foreground text-sm mb-4">
              {t('dashboard.partsUpload.subtitle')}
            </p>
            <div className="flex items-start gap-3 bg-secondary/30 p-4 rounded-xl">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-2">{t('dashboard.partsUpload.formatTitle')}</h3>
                <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                  <li>{t('dashboard.partsUpload.formatUtf8')}</li>
                  <li>{t('dashboard.partsUpload.formatSemicolon')}</li>
                  <li>{t('dashboard.partsUpload.formatMaxSize')}</li>
                </ul>
                <div className="rounded-lg bg-background p-3 overflow-x-auto border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('dashboard.partsUpload.headerLabel')}</p>
                  <code className="text-xs text-foreground break-all">{CSV_HEADERS}</code>
                  <p className="text-xs font-medium text-muted-foreground mt-2 mb-1">{t('dashboard.partsUpload.exampleLabel')}</p>
                  <code className="text-xs text-foreground break-all">{CSV_EXAMPLE}</code>
                </div>
                <button onClick={downloadTemplate} className="btn-ghost text-sm mt-3 text-primary hover:text-primary/80">
                  <Download className="h-4 w-4 mr-1.5" />
                  {t('dashboard.partsUpload.downloadTemplate')}
                </button>
              </div>
            </div>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : file ? 'border-border bg-secondary/20' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            {!file ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background border">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('dashboard.partsUpload.dropzone')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.partsUpload.dropzoneHint')}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-background p-4 rounded-lg border">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setErrors(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleUpload} disabled={!file || uploadMutation.isPending} className="btn-primary">
              {uploadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {t('dashboard.partsUpload.uploadButton')}
            </button>
          </div>

          {uploadMutation.isSuccess && (
            <div className="mt-4 rounded-xl border border-success/20 bg-success/10 p-4 flex items-start gap-3 animate-fade-in">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-success">{t('dashboard.partsUpload.successTitle')}</p>
                <p className="text-xs text-success/80 mt-0.5">{t('dashboard.partsUpload.successDescription')}</p>
              </div>
            </div>
          )}

          {errors && (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 animate-fade-in">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-destructive">{errors.error || t('dashboard.partsUpload.errorsTitle')}</p>
              </div>
              <div className="ml-8 space-y-1">
                {Object.entries(errors).filter(([k]) => k !== 'error').map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2 text-xs">
                    <span className="font-mono text-destructive/80 flex-shrink-0">{k.replace('error_', '')}:</span>
                    <span className="text-destructive text-wrap overflow-hidden">{v as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
