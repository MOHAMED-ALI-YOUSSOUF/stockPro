import { supabase } from './supabase';
import type { Product, StockMovement, Sale, CartItem } from '@/types/models';

// ============= PRODUCTS =============

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Supabase fetchProducts error:", error);
    throw error;
  }
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

  if (error) {
    console.error("Supabase insertProduct error:", error);
    throw error;
  }
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
  if (error) {
    console.error("Supabase updateProduct error:", error);
    throw error;
  }
}

export async function deleteProductDb(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error("Supabase deleteProduct error:", error);
    throw error;
  }
}

// ============= STOCK MOVEMENTS =============

export async function fetchMovements(): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase fetchMovements error:", error);
    throw error;
  }
  return (data || []).map(mapDbMovement);
}

export async function insertMovement(
  movement: Omit<StockMovement, 'id' | 'date'>,
  userId: string
): Promise<StockMovement> {
  // Validation des données avant insertion
  if (!movement.productId || typeof movement.productId !== 'string') {
    const error = new Error('Invalid movement: productId is required and must be a string');
    console.error("Movement validation error:", error, movement);
    throw error;
  }

  if (!movement.productName || typeof movement.productName !== 'string') {
    const error = new Error('Invalid movement: productName is required and must be a string');
    console.error("Movement validation error:", error, movement);
    throw error;
  }

  if (!['in', 'out', 'sale'].includes(movement.type)) {
    const error = new Error(`Invalid movement: type must be 'in', 'out', or 'sale', got ${movement.type}`);
    console.error("Movement validation error:", error, movement);
    throw error;
  }

  if (typeof movement.quantity !== 'number' || movement.quantity <= 0) {
    const error = new Error(`Invalid movement: quantity must be a positive number, got ${movement.quantity}`);
    console.error("Movement validation error:", error, movement);
    throw error;
  }

  if (!userId || typeof userId !== 'string') {
    const error = new Error('Invalid movement: userId is required and must be a string');
    console.error("Movement validation error:", error, movement);
    throw error;
  }

  // Préparer le payload pour Supabase
  let payload: any = {
    user_id: userId,
    product_id: movement.productId,
    product_name: movement.productName,
    type: movement.type,
    quantity: movement.quantity,
    note: movement.note || null,
    payment_method: (movement as any).paymentMethod || null,
  };

  // Valider payment_method si présent
  if (payload.payment_method) {
    const validMethods = ['cash', 'd-money', 'waafi', 'cac-pay', 'saba-pay', 'card'];
    if (!validMethods.includes(payload.payment_method)) {
      const error = new Error(`Invalid payment_method: ${payload.payment_method}. Must be one of: ${validMethods.join(', ')}`);
      console.error("Movement validation error:", error, movement);
      throw error;
    }
  }

  console.log("Inserting movement with validated payload:", payload);

  // Tentative d'insertion
  const { data, error } = await supabase
    .from('stock_movements')
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Si la colonne payment_method n'existe pas (erreur 42703 ou PGRST204), réessayer sans
    if ((error.code === '42703' || error.code === 'PGRST204') && error.message?.includes('payment_method')) {
      console.warn("Database missing 'payment_method' column in 'stock_movements', retrying without it...");
      delete payload.payment_method;

      const { data: retryData, error: retryError } = await supabase
        .from('stock_movements')
        .insert(payload)
        .select()
        .single();

      if (retryError) {
        console.error("Supabase insertMovement retry error:", {
          error: retryError,
          code: retryError.code,
          message: retryError.message,
          details: retryError.details,
          hint: retryError.hint,
          payload: payload,
        });
        throw retryError;
      }

      return mapDbMovement(retryData!);
    }

    // Pour toute autre erreur, logger et throw
    console.error("Supabase insertMovement error (stringified):", JSON.stringify(error, null, 2));
    console.error("Supabase insertMovement error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload: payload,
    });
    throw error;
  }

  return mapDbMovement(data!);
}

// ============= SALES =============

export async function fetchSales(): Promise<Sale[]> {
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (salesError) {
    console.error("Supabase fetchSales error:", salesError);
    throw salesError;
  }

  const saleIds = (salesData || []).map((s: any) => s.id);
  if (saleIds.length === 0) return [];

  const { data: itemsData, error: itemsError } = await supabase
    .from('sale_items')
    .select('*')
    .in('sale_id', saleIds);

  if (itemsError) {
    console.error("Supabase fetchSaleItems error:", itemsError);
    throw itemsError;
  }

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
      total: sale.total_final || sale.total,
      totalBrut: sale.total_brut || sale.total,
      vatRate: sale.vat_rate_snapshot || 0,
      vatTotal: sale.tva_total || 0,
      discount: sale.remise || 0,
      totalFinal: sale.total_final || sale.total,
      amountGiven: sale.montant_donne || 0,
      change: sale.reste || 0,
      date: new Date(sale.created_at),
      paymentMethod: sale.payment_method as any,
      userId: sale.user_id,
    };
  });
}

export async function insertSale(
  saleData: {
    items: CartItem[];
    totalBrut: number;
    vatRate: number;
    vatTotal: number;
    discount: number;
    totalFinal: number;
    amountGiven: number;
    change: number;
    paymentMethod: 'cash' | 'd-money' | 'waafi' | 'cac-pay' | 'saba-pay' | 'card';
  },
  userId: string
): Promise<Sale> {
  const {
    items,
    totalBrut,
    vatRate,
    vatTotal,
    discount,
    totalFinal,
    amountGiven,
    change,
    paymentMethod,
  } = saleData;

  // Validation des données
  if (!items || items.length === 0) {
    const error = new Error('Invalid sale: items array is empty');
    console.error("Sale validation error:", error, saleData);
    throw error;
  }

  if (!userId) {
    const error = new Error('Invalid sale: userId is required');
    console.error("Sale validation error:", error, saleData);
    throw error;
  }

  const validMethods = ['cash', 'd-money', 'waafi', 'cac-pay', 'saba-pay', 'card'];
  if (!validMethods.includes(paymentMethod)) {
    const error = new Error(`Invalid sale: payment_method must be one of: ${validMethods.join(', ')}, got ${paymentMethod}`);
    console.error("Sale validation error:", error, saleData);
    throw error;
  }

  const rpcParams = {
    p_items: items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      name: item.product.name,
    })),
    p_total_brut: totalBrut,
    p_vat_rate: vatRate,
    p_tva_total: vatTotal,
    p_remise: discount,
    p_total_final: totalFinal,
    p_montant_donne: amountGiven,
    p_reste: change,
    p_payment_method: paymentMethod,
    p_user_id: userId,
  };

  console.log("Calling create_sale RPC with params:", rpcParams);

  const { data, error } = await supabase.rpc('create_sale', rpcParams);

  if (error) {
    console.error("Supabase insertSale (RPC) error (stringified):", JSON.stringify(error, null, 2));
    console.error("Supabase insertSale (RPC) error details:", JSON.stringify({
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      rpcParams,
    }, null, 2));
    throw error;
  }

  // Since RPC returns just ID, we construct the Sale object to return
  const saleId = (data as any).id;

  return {
    id: saleId,
    items,
    total: totalFinal,
    totalBrut,
    vatRate,
    vatTotal,
    discount,
    totalFinal,
    amountGiven,
    change,
    date: new Date(),
    paymentMethod: paymentMethod,
    userId,
  };
}

// ============= SETTINGS =============

export async function fetchSettings(userId: string): Promise<{ vatRate: number }> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Supabase fetchSettings error:", error);
    throw error;
  }

  if (!data) {
    // Create default settings if not exists
    const { data: newData, error: newError } = await supabase
      .from('settings')
      .insert({ user_id: userId, vat_rate: 0 } as any)
      .select()
      .single();

    if (newError) {
      console.error("Supabase createSettings error:", newError);
      throw newError;
    }
    return { vatRate: newData.vat_rate };
  }

  return { vatRate: data.vat_rate };
}

export async function updateSettings(userId: string, vatRate: number): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ user_id: userId, vat_rate: vatRate } as any, { onConflict: 'user_id' });

  if (error) {
    console.error("Supabase updateSettings error:", error);
    throw error;
  }
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
    paymentMethod: row.payment_method || undefined,
  };
}