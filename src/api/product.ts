import { api } from './client';

export interface Part {
  id: string;
  createdTs: string;
  updatedTs: string;
  article: string;
  name: string;
  weight: number | null;
  minCount: number;
  storageCount: number | null;
  returnPart: number | null;
  price: number;
  currency: string;
  brand: string;
}

export const productApi = {
  search: async (text: string): Promise<Part[]> => {
    if (!text) {
      // Return all products when no search text (search with empty yields nothing on backend)
      const response = await api.get<Part[]>('/product/search/ ');
      return response.data;
    }
    const response = await api.get<Part[]>(`/product/search/${encodeURIComponent(text)}`);
    return response.data;
  },

  getByArticle: async (article: string): Promise<Part[]> => {
    const response = await api.get<Part[]>(`/product/search/exact/article/${encodeURIComponent(article)}`);
    return response.data;
  },

  getById: async (id: string): Promise<Part> => {
    const response = await api.get<Part>(`/product/${id}`);
    return response.data;
  },
};
