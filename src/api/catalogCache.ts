import type { QueryClient } from '@tanstack/react-query';

export function invalidateCatalog(client: QueryClient) {
  return Promise.all(['part-sources', 'part-source', 'source-parts', 'source-imports', 'part-import',
    'admin-parts', 'admin-parts-search', 'part-detail', 'products', 'cart'].map(key =>
    client.invalidateQueries({ queryKey: [key] })));
}
