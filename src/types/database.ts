export interface Database {
  public: {
    Tables: {
      products: {
        Row: DbProduct;
        Insert: DbProductInsert;
        Update: Partial<DbProductInsert>;
      };
      stock_movements: {
        Row: DbStockMovement;
        Insert: DbStockMovementInsert;
        Update: Partial<DbStockMovementInsert>;
      };
      sales: {
        Row: DbSale;
        Insert: DbSaleInsert;
        Update: Partial<DbSaleInsert>;
      };
      sale_items: {
        Row: DbSaleItem;
        Insert: DbSaleItemInsert;
        Update: Partial<DbSaleItemInsert>;
      };
      profiles: {
        Row: DbProfile;
        Insert: DbProfileInsert;
        Update: Partial<DbProfileInsert>;
      };
      user_roles: {
        Row: DbUserRole;
        Insert: DbUserRoleInsert;
        Update: Partial<DbUserRoleInsert>;
      };
      settings: {
        Row: DbSettings;
        Insert: DbSettingsInsert;
        Update: Partial<DbSettingsInsert>;
      };
    };
  };
}

export interface DbProduct {
  id: string;
  user_id: string;
  name: string;
  barcode: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  min_stock: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export type DbProductInsert = Omit<DbProduct, 'id' | 'created_at' | 'updated_at'>;

export interface DbStockMovement {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  type: 'in' | 'out' | 'sale';
  quantity: number;
  note: string | null;
  payment_method: string | null;
  created_at: string;
}

export type DbStockMovementInsert = Omit<DbStockMovement, 'id' | 'created_at'>;

export interface DbSale {
  id: string;
  user_id: string;
  total: number; // legacy, kept for backward compat
  total_brut: number;
  vat_rate_snapshot: number;
  tva_total: number;
  remise: number;
  total_final: number;
  montant_donne: number;
  reste: number;
  payment_method: 'cash' | 'd-money' | 'waafi' | 'cac-pay' | 'saba-pay' | 'card'; // Updated
  created_at: string;
}

export type DbSaleInsert = Omit<DbSale, 'id' | 'created_at'>;

export interface DbSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string; // legacy
  product_name_snapshot: string;
  product_price: number; // legacy
  price_snapshot: number;
  unit_cost_snapshot: number;
  product_cost: number; // legacy
  quantity: number;
  tva_snapshot: number;
  subtotal: number;
}

export type DbSaleItemInsert = Omit<DbSaleItem, 'id'>;

export interface DbProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type DbProfileInsert = Omit<DbProfile, 'created_at' | 'updated_at'>;

export interface DbUserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'vendeur';
}

export type DbUserRoleInsert = Omit<DbUserRole, 'id'>;

export interface DbSettings {
  id: string;
  user_id: string;
  vat_rate: number;
  store_name: string;
  created_at: string;
  updated_at: string;
}

export type DbSettingsInsert = Omit<DbSettings, 'id' | 'created_at' | 'updated_at'>;
