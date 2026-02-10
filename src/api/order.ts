import { Detail } from './product';

export enum OrderStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Box {
  uniqueNumber: string;
  status: string; // BoxStatus enum in schema
  detail: Detail;
  priceSnapshot: number;
}

export interface Order {
  orderId: string;
  createdDate: string;
  status: OrderStatus;
  totalPrice: number;
  boxes: Box[];
}

// Mock Data
let MOCK_ORDERS: Order[] = [
  {
    orderId: 'ORD-2023-001',
    createdDate: new Date().toISOString(),
    status: OrderStatus.COMPLETED,
    totalPrice: 150.00,
    boxes: [
      { 
        uniqueNumber: 'BOX-001', 
        status: 'DELIVERED', 
        detail: { articleId: 'A001', name: 'Brake Pad', weight: 1.2, minCount: 1, countOnStorage: 50, isReturnPart: false, price: 45.00, brand: 'Bosch' }, 
        priceSnapshot: 45.00 
      }
    ]
  }
];

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...MOCK_ORDERS];
  },
  
  getOrder: async (id: string): Promise<Order | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_ORDERS.find(o => o.orderId === id);
  },

  createOrder: async (items: any[]): Promise<Order> => { // Used by checkout internally usually
     await new Promise(resolve => setTimeout(resolve, 800));
     const newOrder: Order = {
       orderId: `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
       createdDate: new Date().toISOString(),
       status: OrderStatus.CREATED,
       totalPrice: items.reduce((acc, item) => acc + (item.detail.price * item.quantity), 0),
       boxes: [] // In real app, boxes are created here
     };
     MOCK_ORDERS.unshift(newOrder);
     return newOrder;
  }
};
