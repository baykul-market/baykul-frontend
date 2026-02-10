import { Detail } from './product';

export interface CartItem {
  boxId: string; // Unique ID for the box in cart
  detail: Detail;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
}

// Mock In-Memory Cart Storage (resets on refresh if not persisted)
// In a real app with backend, this would be on server.
let mockCart: Cart = {
  items: [],
  totalPrice: 0
};

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { ...mockCart };
  },

  addToCart: async (detail: Detail, quantity: number = 1): Promise<Cart> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if item exists (in this simple model, we just add boxes)
    // But usually we group by articleId. 
    // The requirement mentions "Boxes". 
    // "Cart "1" o-- "*" Box : contains (temporary) >"
    
    // For simplicity, we'll treat items as grouped by article for UI, but backend creates boxes.
    // We'll simulate creating boxes.
    
    const existingItem = mockCart.items.find(i => i.detail.articleId === detail.articleId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      mockCart.items.push({
        boxId: Math.random().toString(36).substr(2, 9),
        detail,
        quantity
      });
    }
    
    mockCart.totalPrice = mockCart.items.reduce((sum, item) => sum + (item.detail.price * item.quantity), 0);
    return { ...mockCart };
  },

  removeFromCart: async (articleId: string): Promise<Cart> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    mockCart.items = mockCart.items.filter(i => i.detail.articleId !== articleId);
    mockCart.totalPrice = mockCart.items.reduce((sum, item) => sum + (item.detail.price * item.quantity), 0);
    return { ...mockCart };
  },
  
  clearCart: async (): Promise<Cart> => {
     await new Promise(resolve => setTimeout(resolve, 300));
     mockCart = { items: [], totalPrice: 0 };
     return { ...mockCart };
  },
  
  checkout: async (): Promise<{ orderId: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const orderId = Math.random().toString(36).substr(2, 9);
    mockCart = { items: [], totalPrice: 0 }; // Clear cart after checkout
    return { orderId };
  }
};
