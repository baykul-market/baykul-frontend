import { api } from './client';
import type { PageResponse } from './types';
import type { Part } from './product';

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

export enum OrderStatus {
  CONFIRMATION_WAITING = 'CONFIRMATION_WAITING',
  PAYMENT_WAITING = 'PAYMENT_WAITING',
  ORDERED = 'ORDERED',
  ON_WAY = 'ON_WAY',
  IN_WAREHOUSE = 'IN_WAREHOUSE',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderProductStatus {
  CREATED = 'CREATED',
  TO_ORDER = 'TO_ORDER',
  ON_WAY = 'ON_WAY',
  ARRIVED = 'ARRIVED',
  IN_WAREHOUSE = 'IN_WAREHOUSE',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export interface OrderProduct {
  id: string;
  number: number | null;
  status: OrderProductStatus;
  part: Part;
  partsCount: number;
  order?: {
    id: string;
    number: number;
  };
}

export interface Order {
  id: string;
  createdTs: string;
  updatedTs: string;
  number: number;
  status: OrderStatus;
  user?: {
    id: string;
    login: string;
    email?: string;
    profile?: {
      id: string;
      surname: string;
      name: string;
      patronymic: string;
    };
  };
  orderProducts: OrderProduct[];
}

export interface CreateOrderResponse {
  create_order: string;
  id?: string;
  error?: string;
  unavailable_products?: { part_id: string }[];
}

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/order/user');
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get<Order>('/order/user/id', {
      params: { id },
    });
    return response.data;
  },

  createOrder: async (): Promise<CreateOrderResponse> => {
    const response = await api.post<CreateOrderResponse>('/order/user/create');
    return response.data;
  },

  payOrder: async (id: string): Promise<void> => {
    await api.post('/order/user/pay', null, {
      params: { id },
    });
  },

  // Admin endpoints
  getAllOrders: async (params?: Pageable): Promise<Order[]> => {
    const response = await api.get<Order[]>('/order', { params });
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>('/order/id', {
      params: { id },
    });
    return response.data;
  },

  updateOrder: async (id: string, data: Partial<Order>): Promise<void> => {
    await api.patch('/order', data, {
      params: { id },
    });
  },

  updateOrderProduct: async (id: string, data: Partial<OrderProduct>): Promise<void> => {
    await api.patch('/order/product', data, {
      params: { id },
    });
  },

  completeOrder: async (id: string): Promise<void> => {
    await api.post('/order/complete', null, {
      params: { id },
    });
  },

  searchBoxes: async (params: { number?: number; status?: string; forBill?: boolean; page?: number; size?: number; sort?: string[] }): Promise<PageResponse<OrderProduct>> => {
    const response = await api.get<any>('/order/product/search', { params });
    if (Array.isArray(response.data)) {
      return {
        content: response.data,
        pageable: { pageNumber: params.page || 0, pageSize: params.size || 20, sort: { sorted: false, unsorted: true }, offset: 0, unpaged: false, paged: true },
        last: response.data.length < (params.size || 20),
        totalElements: response.data.length,
        totalPages: response.data.length === (params.size || 20) ? (params.page || 0) + 2 : (params.page || 0) + 1,
        size: params.size || 20,
        number: params.page || 0,
        sort: { sorted: false, unsorted: true },
        first: (params.page || 0) === 0,
        numberOfElements: response.data.length,
        empty: response.data.length === 0
      };
    }
    return response.data;
  },
};
