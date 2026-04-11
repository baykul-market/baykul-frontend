import { api } from './client';
import type { AxiosRequestConfig } from 'axios';
import { PageResponse } from './types';

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
  realPrice: number | null;
  realCurrency: string | null;
  brand: string;
}

export interface PartCreateInput {
  article: string;
  name: string;
  weight?: number | null;
  minCount: number;
  storageCount?: number | null;
  returnPart?: number | null;
  price: number;
  currency: string;
  brand: string;
}

export type PartUpdateInput = Partial<PartCreateInput>;

export const productApi = {
  getAll: async (page = 0, size = 50, sort?: string): Promise<PageResponse<Part>> => {
    const response = await api.get<PageResponse<Part>>('/product', {
      params: { page, size, sort },
    });
    return response.data;
  },

  create: async (data: PartCreateInput, config?: AxiosRequestConfig): Promise<string> => {
    const response = await api.post<{ id: string }>('/product', data, config);
    return response.data.id;
  },

  update: async (id: string, data: PartUpdateInput, config?: AxiosRequestConfig): Promise<void> => {
    await api.patch('/product', data, { params: { id }, ...config });
  },

  delete: async (id: string, config?: AxiosRequestConfig): Promise<void> => {
    await api.delete('/product', { params: { id }, ...config });
  },

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

  searchByArticles: async (articles: string[]): Promise<Part[]> => {
    const response = await api.post<{ parts: Part[] }>('/product/search/articles', { articles });
    return response.data.parts;
  },

  uploadCsv: async (file: File, config?: AxiosRequestConfig): Promise<{ parsed: string }> => {
    const formData = new FormData();
    formData.append('csvFile', file);
    const response = await api.post<{ parsed: string }>('/product/upload', formData, {
      ...config,
      headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
