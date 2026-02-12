export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  minStock: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'sale';
  quantity: number;
  date: Date;
  note?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  date: Date;
  paymentMethod: 'cash' | 'card';
}

export const categories = [
  'Électronique',
  'Alimentation',
  'Vêtements',
  'Maison',
  'Beauté',
  'Sports',
  'Jouets',
  'Autres',
];

export const units = ['pièce', 'kg', 'litre', 'mètre', 'paquet', 'boîte'];

export const generateBarcode = (): string => {
  const prefix = '200';
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return prefix + random;
};
