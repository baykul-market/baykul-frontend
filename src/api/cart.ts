import { api } from './client';
import type { AxiosRequestConfig } from 'axios';
import type { Part } from './product';

export interface CartProduct {
  id: string;
  createdTs?: string;
  updatedTs?: string;
  part: Part;
  partsCount: number;
}

export interface Cart {
  id: string;
  createdTs: string;
  updatedTs: string;
  user: { id: string; login: string };
  cartProducts: CartProduct[];
}

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const response = await api.get<Cart>('/cart/user');
    return response.data;
  },

  createCart: async (): Promise<{ create_cart: string; id: string; warn?: string }> => {
    const response = await api.post('/cart/user');
    return response.data;
  },

  addToCart: async (partId: string, config?: AxiosRequestConfig): Promise<{ add_cart: string; id?: string; storage_empty?: string; error?: string }> => {
    const response = await api.post('/cart/user/add', null, {
      ...config,
      params: { partId, ...config?.params },
    });
    return response.data;
  },

  updateCartProduct: async (cartProductId: string, partsCount: number, config?: AxiosRequestConfig): Promise<{ update_cart: string }> => {
    const response = await api.patch('/cart/user/update', { partsCount }, {
      ...config,
      params: { id: cartProductId, ...config?.params },
    });
    return response.data;
  },

  removeFromCart: async (cartProductId: string, config?: AxiosRequestConfig): Promise<{ delete_cart_product: string }> => {
    const response = await api.delete('/cart/user/product', {
      ...config,
      params: { id: cartProductId, ...config?.params },
    });
    return response.data;
  },

  clearCart: async (): Promise<{ clear_cart: string }> => {
    const response = await api.post('/cart/user/clear');
    return response.data;
  },

  deleteCart: async (): Promise<{ delete_cart: string }> => {
    const response = await api.delete('/cart/user');
    return response.data;
  },
};
