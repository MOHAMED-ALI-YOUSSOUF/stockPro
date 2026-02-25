import { supabase } from './supabase';
import type {
  DbProductInsert,
  DbSaleItem,
  DbSettings,
  DbSettingsInsert,
} from '@/types/database';
import type { Product, StockMovement, Sale, CartItem, Settings } from '@/types/models';

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

export async function insertProduct(
  product: DbProductInsert,
  userId: string
): Promise<Product> {

  const payload = {
    name: product.name,
    barcode: product.barcode,
    category: product.category,
    price: product.price,
    cost: product.cost,
    quantity: product.quantity,
    min_stock: product.min_stock, // ✅ conversion ici
    unit: product.unit,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Supabase insertProduct FULL error:", JSON.stringify(error, null, 2));
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
  let payload: any = {
    user_id: userId,
    product_id: movement.productId,
    product_name: movement.productName,
    type: movement.type,
    quantity: movement.quantity,
    note: movement.note || null,
    payment_method: (movement as any).paymentMethod || null,
    unit_cost: (movement as any).unitCost || null,
  };

  const { data, error } = await supabase
    .from('stock_movements')
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Graceful fallback for missing columns during migration
    if (error.code === '42703' || error.code === 'PGRST204') {
      console.warn("Database missing columns in 'stock_movements', retrying without them...");
      if (error.message?.includes('payment_method')) delete payload.payment_method;
      if (error.message?.includes('unit_cost')) delete payload.unit_cost;

      const { data: retryData, error: retryError } = await supabase
        .from('stock_movements')
        .insert(payload)
        .select()
        .single();

      if (retryError) throw retryError;
      return mapDbMovement(retryData!);
    }
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
          name: item.product_name_snapshot || item.product_name || 'Produit inconnu',
          barcode: '',
          category: '',
          price: item.price_snapshot || item.product_price || 0,
          cost: item.unit_cost_snapshot || item.product_cost || 0,
          quantity: 0,
          minStock: 0,
          unit: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: item.quantity,
        unitCost: item.unit_cost_snapshot || item.product_cost || 0,
      }));
    return {
      id: sale.id,
      items,
      total: sale.total_final || sale.total || 0,
      totalBrut: sale.total_brut || sale.total || 0,
      vatRate: sale.vat_rate_snapshot || 0,
      vatTotal: sale.tva_total || 0,
      discount: sale.remise || 0,
      totalFinal: sale.total_final || sale.total || 0,
      amountGiven: sale.montant_donne || 0,
      change: sale.reste || 0,
      date: new Date(sale.created_at),
      paymentMethod: sale.payment_method as any,
      userId: sale.user_id,
      storeName: sale.store_name || '',
    };
  });
}

export async function insertSale(
  sale: {
    items: CartItem[];
    totalBrut: number;
    vatRate: number;
    vatTotal: number;
    discount: number;
    totalFinal: number;
    amountGiven: number;
    change: number;
    paymentMethod: 'cash' | 'd-money' | 'waafi' | 'cac-pay' | 'saba-pay' | 'card';
    storeName?: string;
  },
  userId: string
): Promise<Sale> {
  const rpcParams = {
    p_items: sale.items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      name: item.product.name,
      unit_cost: item.unitCost || item.product.cost || 0,
    })),
    p_total_brut: sale.totalBrut,
    p_vat_rate: sale.vatRate,
    p_tva_total: sale.vatTotal,
    p_remise: sale.discount,
    p_total_final: sale.totalFinal,
    p_montant_donne: sale.amountGiven,
    p_reste: sale.change,
    p_payment_method: sale.paymentMethod,
    p_store_name: sale.storeName || '',
    p_user_id: userId,
  };

  const { data, error } = await supabase.rpc('create_sale', rpcParams);

  if (error) {
    console.error("RPC create_sale error:", error);
    throw error;
  }

  const saleId = (data as any).id;

  return {
    id: saleId,
    items: sale.items,
    total: sale.totalFinal,
    totalBrut: sale.totalBrut,
    vatRate: sale.vatRate,
    vatTotal: sale.vatTotal,
    discount: sale.discount,
    totalFinal: sale.totalFinal,
    amountGiven: sale.amountGiven,
    change: sale.change,
    date: new Date(),
    paymentMethod: sale.paymentMethod,
    userId,
    storeName: sale.storeName || '',
  };
}

// ============= SETTINGS =============

export async function fetchSettings(userId: string) {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return {
    storeName: data?.store_name || "",
    address: data?.address || "",
    phone: data?.phone || "",
    vatRate: data?.vat_rate || 0,
    categories: data?.categories || [],
    units: data?.units || [],
  };
}

export async function updateSettings(
  userId: string,
  settings: any
) {
  const { error } = await supabase
    .from("settings")
    .upsert(
      {
        user_id: userId,
        store_name: settings.storeName,
        address: settings.address,
        phone: settings.phone,
        vat_rate: settings.vatRate,
        categories: settings.categories,
        units: settings.units,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
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
    unitCost: row.unit_cost || undefined,
  };
}