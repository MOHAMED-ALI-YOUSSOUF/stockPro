import { supabase } from './supabase';
import type { Product, StockMovement, Sale, CartItem } from '@/types/models';

// ============= PRODUCTS =============

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbProduct);
}

export async function insertProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: userId,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      price: product.price,
      cost: product.cost,
      quantity: product.quantity,
      min_stock: product.minStock,
      unit: product.unit,
    } as any)
    .select()
    .single();
  if (error) throw error;
  return mapDbProduct(data!);
}

export async function updateProductDb(id: string, updates: Partial<Product>): Promise<void> {
  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
  if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
  if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function deleteProductDb(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ============= STOCK MOVEMENTS =============

export async function fetchMovements(): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbMovement);
}

export async function insertMovement(
  movement: Omit<StockMovement, 'id' | 'date'>,
  userId: string
): Promise<StockMovement> {
  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      user_id: userId,
      product_id: movement.productId,
      product_name: movement.productName,
      type: movement.type,
      quantity: movement.quantity,
      note: movement.note || null,
    } as any)
    .select()
    .single();
  if (error) throw error;
  return mapDbMovement(data!);
}

// ============= SALES =============

export async function fetchSales(): Promise<Sale[]> {
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });
  if (salesError) throw salesError;

  const saleIds = (salesData || []).map((s: any) => s.id);
  if (saleIds.length === 0) return [];

  const { data: itemsData, error: itemsError } = await supabase
    .from('sale_items')
    .select('*')
    .in('sale_id', saleIds);
  if (itemsError) throw itemsError;

  return (salesData || []).map((sale: any) => {
    const items = (itemsData || [])
      .filter((item: any) => item.sale_id === sale.id)
      .map((item: any) => ({
        product: {
          id: item.product_id,
          name: item.product_name,
          barcode: '',
          category: '',
          price: item.product_price,
          cost: item.product_cost,
          quantity: 0,
          minStock: 0,
          unit: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: item.quantity,
      }));
    return {
      id: sale.id,
      items,
      total: sale.total,
      date: new Date(sale.created_at),
      paymentMethod: sale.payment_method as 'cash' | 'card',
    };
  });
}

export async function insertSale(
  items: CartItem[],
  total: number,
  paymentMethod: 'cash' | 'card',
  userId: string
): Promise<Sale> {
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      user_id: userId,
      total,
      payment_method: paymentMethod,
    } as any)
    .select()
    .single();
  if (saleError) throw saleError;

  const saleItems = items.map((item) => ({
    sale_id: sale!.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_price: item.product.price,
    product_cost: item.product.cost,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems as any);
  if (itemsError) throw itemsError;

  return {
    id: sale!.id,
    items,
    total: (sale as any).total,
    date: new Date((sale as any).created_at),
    paymentMethod: (sale as any).payment_method as 'cash' | 'card',
  };
}

// ============= MAPPERS =============

function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    category: row.category,
    price: row.price,
    cost: row.cost,
    quantity: row.quantity,
    minStock: row.min_stock,
    unit: row.unit,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapDbMovement(row: any): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    type: row.type,
    quantity: row.quantity,
    date: new Date(row.created_at),
    note: row.note || undefined,
  };
}
