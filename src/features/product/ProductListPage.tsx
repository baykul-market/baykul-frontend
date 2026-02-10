import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi, Detail } from '../../api/product';
import { cartApi } from '../../api/cart';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingCart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => productApi.search(searchTerm),
  });

  const addToCartMutation = useMutation({
    mutationFn: (product: Detail) => cartApi.addToCart(product, 1),
    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Failed to add to cart');
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <input
            type="search"
            className="block w-full p-2 pl-10 text-sm border rounded-lg bg-background focus:ring-primary focus:border-primary"
            placeholder="Search by name, brand, or article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <div key={product.articleId} className="bg-card border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  </div>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {product.articleId}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className={product.countOnStorage > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {product.countOnStorage > 0 ? `${product.countOnStorage} units` : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight:</span>
                    <span>{product.weight} kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCartMutation.mutate(product)}
                    disabled={product.countOnStorage <= 0 || addToCartMutation.isPending}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addToCartMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No products found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
