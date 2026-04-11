import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, Part } from '../../api/product';
import { cartApi } from '../../api/cart';
import { 
  Search, 
  ShoppingCart, 
  Loader2, 
  ArrowLeft, 
  Package, 
  FileText, 
  AlertCircle,
  XCircle,
  Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getCurrencySymbol } from '../../lib/currency';

export default function MultiArticleSearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: results, refetch, isFetching } = useQuery({
    queryKey: ['products', 'multi-search'],
    queryFn: () => {
      const articles = inputValue
        .split(/[\n,]+/)
        .map(a => a.trim())
        .filter(a => a.length > 0);
      
      if (articles.length === 0) return Promise.resolve([]);
      return productApi.searchByArticles(articles);
    },
    enabled: false,
  });

  const addToCartMutation = useMutation({
    mutationFn: (product: Part) => cartApi.addToCart(product.id, { skipErrorToast: true }),
    onSuccess: () => {
      toast.success(t('products.addedToCart'));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t('products.failedToAdd');
      toast.error(message);
    }
  });

  const handleSearch = async () => {
    const articles = inputValue
      .split(/[\n,]+/)
      .map(a => a.trim())
      .filter(a => a.length > 0);

    if (articles.length === 0) {
      toast.error(t('products.multiSearch.noArticlesEntered'));
      return;
    }

    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
  };

  const isLoading = isSearching || isFetching;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/products')}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t('products.multiSearch.backToProducts')}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {t('products.multiSearch.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('products.multiSearch.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-6 shadow-sm border-primary/10 relative overflow-hidden group">
             {/* Decorative background element */}
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-all group-hover:bg-primary/10" />
             
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Hash className="w-4 h-4 text-primary" />
              {t('common.article')}
            </label>
            
            <div className="relative">
              <textarea
                className="input-base min-h-[300px] font-mono text-sm leading-relaxed resize-none p-4 focus:ring-primary/10 transition-all border-dashed"
                placeholder={t('products.multiSearch.inputPlaceholder')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              {inputValue && (
                <button 
                  onClick={handleClear}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
                  title={t('common.clear')}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <button
              onClick={handleSearch}
              disabled={isLoading || !inputValue.trim()}
              className="btn-primary w-full mt-6 shadow-lg shadow-primary/20 h-12"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span className="font-semibold">{t('products.multiSearch.searchButton')}</span>
            </button>

            <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-secondary text-xs text-muted-foreground flex items-start gap-3">
               <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
               <p className="leading-relaxed">
                 {t('products.multiSearch.subtitle')}
                 <br />
                 <span className="text-primary font-medium">{t('common.article')}:</span> 2405947, 1234567...
               </p>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-8 space-y-4">
          {results && results.length > 0 ? (
            <div className="card overflow-hidden border-primary/5 shadow-md">
              <div className="px-6 py-4 border-b bg-secondary/20 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  {t('products.multiSearch.resultsTitle')}
                </h3>
                <span className="badge bg-primary/10 text-primary border-primary/20">
                  {results.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/10 border-b">
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t('products.multiSearch.articleColumn')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t('products.multiSearch.nameColumn')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t('products.multiSearch.stockColumn')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t('products.multiSearch.priceColumn')}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t('products.multiSearch.actionColumn')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((product) => {
                      const hasStock = (product.storageCount ?? 0) > 0;
                      return (
                        <tr key={product.id} className="hover:bg-secondary/30 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md border text-foreground/80 group-hover:border-primary/30 transition-colors">
                              {product.article}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors">
                                {product.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mt-0.5">
                                {product.brand}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                              hasStock 
                                ? 'bg-success/10 text-success border-success/20' 
                                : 'bg-warning/10 text-warning border-warning/20'
                            }`}>
                              {hasStock 
                                ? t('products.units', { count: product.storageCount ?? 0 }) 
                                : t('products.orderFromSupplier')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-sm">
                              {getCurrencySymbol(product.currency)}
                              {product.price.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => addToCartMutation.mutate(product)}
                              disabled={addToCartMutation.isPending}
                              className="btn-primary p-2 h-9 w-9 rounded-xl shadow-sm hover:shadow-primary/20 active:scale-95 transition-all"
                              title={hasStock ? t('products.add') : t('products.order')}
                            >
                              {addToCartMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : results ? (
            /* Results Empty state */
            <div className="card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed bg-secondary/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted border-2 border-dashed">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('products.noResults')}</h3>
                <p className="text-muted-foreground max-w-xs mt-2">
                  {t('products.noProductsSubtitle')}
                </p>
              </div>
            </div>
          ) : (
            /* Initial Empty state */
            <div className="card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed bg-secondary/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 border-2 border-dashed border-primary/10">
                <Search className="h-8 w-8 text-primary/30" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-muted-foreground/80">{t('products.multiSearch.resultsTitle')}</h3>
                <p className="text-muted-foreground max-w-xs mt-2 text-sm italic">
                  {t('products.multiSearch.subtitle')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
