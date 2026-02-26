// This file is kept for backwards compatibility
// All types and constants have been moved to @/types/models
export type { Product, StockMovement, CartItem, Sale } from '@/types/models';
export { generateBarcode } from '@/types/models';

export const generateId = (): string => {
  return crypto.randomUUID();
};
