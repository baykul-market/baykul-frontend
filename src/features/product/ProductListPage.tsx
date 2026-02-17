import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi, Part } from '../../api/product';
import { cartApi } from '../../api/cart';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingCart, Loader2, Package, Tag, Weight, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function ProductListPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => productApi.search(searchTerm),
  });

  const addToCartMutation = useMutation({
    mutationFn: (product: Part) => cartApi.addToCart(product.id),
    onSuccess: () => {
      toast.success(t('products.addedToCart'));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t('products.failedToAdd');
      toast.error(message);
    }
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border border-primary/10 p-6 md:p-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t('products.heroTitle')}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-6">
            {t('products.heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              type="search"
              className="input-base pl-11 pr-4 py-3 text-base shadow-sm"
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Header */}
      {!isLoading && products && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {products.length === 0
              ? t('products.noResults')
              : t('products.showingProducts', { count: products.length })}
            {searchTerm && (
              <span> {t('products.forQuery', { query: searchTerm })}</span>
            )}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('products.loadingProducts')}</p>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products?.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addToCartMutation.mutate(product)}
                isAdding={addToCartMutation.isPending}
              />
            ))}
          </div>

          {/* Empty State */}
          {products?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Box className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{t('products.noProductsTitle')}</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {t('products.noProductsSubtitle')}
                </p>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="btn-secondary text-sm"
                >
                  {t('products.clearSearch')}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
  isAdding,
}: {
  product: Part;
  onAddToCart: () => void;
  isAdding: boolean;
}) {
  const { t } = useTranslation();
  const inStock = (product.storageCount ?? 0) > 0;

  return (
    <div className="card-hover group flex flex-col overflow-hidden">
      {/* Image Placeholder */}
      <div className="relative bg-gradient-to-br from-secondary to-muted h-36 flex items-center justify-center overflow-hidden">
        <Package className="h-12 w-12 text-muted-foreground/30 transition-transform group-hover:scale-110" />
        {/* Stock Badge */}
        <span
          className={`badge absolute top-3 right-3 ${
            inStock
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {inStock ? t('products.inStock') : t('products.outOfStock')}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-base leading-snug mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>{product.brand}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm text-muted-foreground mb-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Box className="h-3 w-3" />
              {t('products.article')}
            </span>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md">{product.article}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Package className="h-3 w-3" />
              {t('products.stock')}
            </span>
            <span className={inStock ? 'text-success font-medium' : 'text-destructive font-medium'}>
              {inStock ? t('products.units', { count: product.storageCount ?? 0 }) : t('products.unavailable')}
            </span>
          </div>
          {product.weight != null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Weight className="h-3 w-3" />
                {t('products.weight')}
              </span>
              <span>{product.weight} kg</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-xl font-bold">
            {product.currency === 'EUR' ? '\u20AC' : product.currency === 'USD' ? '$' : product.currency}
            {product.price.toFixed(2)}
          </span>
          <button
            onClick={onAddToCart}
            disabled={!inStock || isAdding}
            className="btn-primary px-4 py-2 text-sm"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            <span>{inStock ? t('products.add') : t('products.soldOut')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
