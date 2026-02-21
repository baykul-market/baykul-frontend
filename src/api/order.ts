import { api } from './client';
import type { Part } from './product';

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

export enum OrderStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderProductStatus {
  ORDERED = 'ORDERED',
  IN_WAREHOUSE = 'IN_WAREHOUSE',
  ON_WAY = 'ON_WAY',
  ARRIVED = 'ARRIVED',
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

  searchBoxes: async (params: { number?: number; status?: string; page?: number; size?: number; sort?: string[] }): Promise<{ content: OrderProduct[]; totalElements: number; totalPages: number }> => {
    const response = await api.get('/order/product/search', { params });
    return response.data;
  },
};
