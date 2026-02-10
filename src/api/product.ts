import { api } from './client';

export interface Detail {
  articleId: string;
  name: string;
  weight: number;
  minCount: number;
  countOnStorage: number;
  isReturnPart: boolean;
  price: number;
  brand: string;
}

// Mock Data
const MOCK_PRODUCTS: Detail[] = [
  { articleId: 'A001', name: 'Brake Pad', weight: 1.2, minCount: 1, countOnStorage: 50, isReturnPart: false, price: 45.00, brand: 'Bosch' },
  { articleId: 'A002', name: 'Oil Filter', weight: 0.5, minCount: 1, countOnStorage: 100, isReturnPart: false, price: 12.50, brand: 'Mann' },
  { articleId: 'A003', name: 'Spark Plug', weight: 0.1, minCount: 4, countOnStorage: 200, isReturnPart: false, price: 8.00, brand: 'NGK' },
  { articleId: 'A004', name: 'Alternator', weight: 5.5, minCount: 1, countOnStorage: 5, isReturnPart: true, price: 150.00, brand: 'Valeo' },
  { articleId: 'A005', name: 'Headlight Bulb', weight: 0.05, minCount: 2, countOnStorage: 50, isReturnPart: false, price: 5.00, brand: 'Philips' },
];

// Mock API
export const productApi = {
  search: async (text: string): Promise<Detail[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!text) return MOCK_PRODUCTS;
    
    const lowerText = text.toLowerCase();
    return MOCK_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(lowerText) || 
      p.articleId.toLowerCase().includes(lowerText) ||
      p.brand.toLowerCase().includes(lowerText)
    );
  },
  
  getByArticle: async (articleId: string): Promise<Detail | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_PRODUCTS.find(p => p.articleId === articleId);
  }
};
