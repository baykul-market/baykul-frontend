import { api } from './client';
import { PageResponse } from './types';

export type BillStatus = 'DRAFT' | 'APPLIED';

export interface OrderProductBillView {
  id: string;
  createdTs: string;
  updatedTs: string;
  number: number;
  partsCount: number;
  price: number;
}

export interface Bill {
  id: string;
  createdTs: string;
  updatedTs: string;
  number: number;
  status: BillStatus;
  orderProducts: OrderProductBillView[];
}

export interface BillCreateRequest {
  number: number;
  orderProducts: { id: string }[];
}

export const billApi = {
  getAll: async (page = 0, size = 20, sort?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) {
      params.append('sort', sort);
    }
    const response = await api.get<PageResponse<Bill>>(`/bill?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Bill>(`/bill/id?id=${id}`);
    return response.data;
  },

  create: async (data: BillCreateRequest) => {
    const response = await api.post<{ create_bill: string, id: string }>('/bill/create', data);
    return response.data;
  },

  apply: async (id: string) => {
    const response = await api.post<{ apply_bill: string }>(`/bill/apply?id=${id}`);
    return response.data;
  },

  addOrderProduct: async (billId: string, orderProductId: string) => {
    const response = await api.post<{ add_orderProduct: string }>(
      `/bill/add?billId=${billId}&orderProductId=${orderProductId}`
    );
    return response.data;
  },

  removeOrderProduct: async (billId: string, orderProductId: string) => {
    const response = await api.post<{ remove_orderProduct: string }>(
      `/bill/remove?billId=${billId}&orderProductId=${orderProductId}`
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ delete_bill: string }>(`/bill?id=${id}`);
    return response.data;
  },
};
