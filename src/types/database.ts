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
  created_at: string;
}

export type DbStockMovementInsert = Omit<DbStockMovement, 'id' | 'created_at'>;

export interface DbSale {
  id: string;
  user_id: string;
  total: number;
  payment_method: 'cash' | 'card';
  created_at: string;
}

export type DbSaleInsert = Omit<DbSale, 'id' | 'created_at'>;

export interface DbSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_cost: number;
  quantity: number;
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
