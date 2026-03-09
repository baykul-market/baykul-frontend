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
    const response = await api.get<Part[]>('/product/search', {
      params: { text: text || undefined },
    });
    return response.data;
  },

  getByArticle: async (article: string): Promise<Part> => {
    const response = await api.get<Part>('/product/search/exact/article', {
      params: { article },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Part> => {
    const response = await api.get<Part>('/product/id', {
      params: { id },
    });
    return response.data;
  },

  uploadCsv: async (file: File): Promise<{ parsed: string }> => {
    const formData = new FormData();
    formData.append('csvFile', file);
    const response = await api.post<{ parsed: string }>('/product/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
