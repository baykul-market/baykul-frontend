import { api } from './client';
import type { Part } from './product';

export interface CartProduct {
  id: string;
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

  createCart: async (): Promise<{ create_cart: string; id: string }> => {
    const response = await api.post('/cart/user');
    return response.data;
  },

  addToCart: async (partId: string): Promise<{ add_cart: string; id?: string }> => {
    const response = await api.post(`/cart/user/add/${partId}`);
    return response.data;
  },

  removeFromCart: async (cartProductId: string): Promise<{ delete_cart_product: string }> => {
    const response = await api.delete(`/cart/user/product/${cartProductId}`);
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
