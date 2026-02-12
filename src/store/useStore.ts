import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, StockMovement, Sale, CartItem } from '@/types/models';
import { generateBarcode } from '@/types/models';
import {
  fetchProducts,
  insertProduct,
  updateProductDb,
  deleteProductDb,
  fetchMovements,
  insertMovement,
  fetchSales,
  insertSale,
} from '@/lib/database';
import {
  isOnline,
  addToQueue,
  getQueue,
  removeFromQueue,
  setOfflineData,
  getOfflineData,
} from '@/lib/offlineSync';

interface StoreState {
  products: Product[];
  movements: StockMovement[];
  sales: Sale[];
  cart: CartItem[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  userId: string | null;

  // Init
  setUserId: (id: string | null) => void;
  loadData: () => Promise<void>;
  syncPendingOps: () => Promise<void>;

  // Products
  addProduct: (product: Omit<Product, 'id' | 'barcode' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductByBarcode: (barcode: string) => Product | undefined;

  // Stock movements
  addMovement: (movement: Omit<StockMovement, 'id' | 'date'>) => Promise<void>;

  // Cart
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  // Sales
  completeSale: (paymentMethod: 'cash' | 'card') => Promise<Sale | null>;

  // Stats
  getLowStockProducts: () => Product[];
  getTotalInventoryValue: () => number;
  getTodaySales: () => number;
  getRecentMovements: (limit?: number) => StockMovement[];
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [],
      movements: [],
      sales: [],
      cart: [],
      isLoading: false,
      isSyncing: false,
      lastSyncAt: null,
      userId: null,

      setUserId: (id) => set({ userId: id }),

      loadData: async () => {
        set({ isLoading: true });
        try {
          if (isOnline()) {
            const [products, movements, sales] = await Promise.all([
              fetchProducts(),
              fetchMovements(),
              fetchSales(),
            ]);
            set({ products, movements, sales, lastSyncAt: Date.now() });
            // Cache for offline
            setOfflineData('products', products);
            setOfflineData('movements', movements);
            setOfflineData('sales', sales);
          } else {
            // Load from cache
            const products = getOfflineData<Product[]>('products') || [];
            const movements = getOfflineData<StockMovement[]>('movements') || [];
            const sales = getOfflineData<Sale[]>('sales') || [];
            set({ products, movements, sales });
          }
        } catch (error) {
          console.error('Failed to load data:', error);
          // Fallback to cache
          const products = getOfflineData<Product[]>('products') || [];
          const movements = getOfflineData<StockMovement[]>('movements') || [];
          const sales = getOfflineData<Sale[]>('sales') || [];
          set({ products, movements, sales });
        } finally {
          set({ isLoading: false });
        }
      },

      syncPendingOps: async () => {
        const queue = getQueue();
        if (queue.length === 0 || !isOnline()) return;

        const userId = get().userId;
        if (!userId) return;

        set({ isSyncing: true });
        for (const op of queue) {
          try {
            switch (op.type) {
              case 'insert_product':
                await insertProduct(op.payload, userId);
                break;
              case 'update_product':
                await updateProductDb(op.payload.id, op.payload.updates);
                break;
              case 'delete_product':
                await deleteProductDb(op.payload.id);
                break;
              case 'insert_movement':
                await insertMovement(op.payload, userId);
                break;
              case 'insert_sale':
                await insertSale(op.payload.items, op.payload.total, op.payload.paymentMethod, userId);
                break;
            }
            removeFromQueue(op.id);
          } catch (error) {
            console.error('Sync failed for op:', op, error);
            break; // Stop on first error to maintain order
          }
        }
        set({ isSyncing: false });

        // Reload fresh data after sync
        if (getQueue().length === 0) {
          await get().loadData();
        }
      },

      addProduct: async (productData) => {
        const userId = get().userId;
        const barcode = generateBarcode();
        const tempProduct: Product = {
          ...productData,
          id: crypto.randomUUID(),
          barcode,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Optimistic update
        set((state) => ({ products: [tempProduct, ...state.products] }));
        setOfflineData('products', get().products);

        if (isOnline() && userId) {
          try {
            const dbProduct = await insertProduct({ ...productData, barcode }, userId);
            // Replace temp with real
            set((state) => ({
              products: state.products.map((p) => (p.id === tempProduct.id ? dbProduct : p)),
            }));
            setOfflineData('products', get().products);
            return dbProduct;
          } catch (error) {
            console.error('Failed to insert product online:', error);
            addToQueue({ type: 'insert_product', payload: { ...productData, barcode } });
            return tempProduct;
          }
        } else {
          addToQueue({ type: 'insert_product', payload: { ...productData, barcode } });
          return tempProduct;
        }
      },

      updateProduct: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }));
        setOfflineData('products', get().products);

        if (isOnline()) {
          try {
            await updateProductDb(id, updates);
          } catch (error) {
            console.error('Failed to update product online:', error);
            addToQueue({ type: 'update_product', payload: { id, updates } });
          }
        } else {
          addToQueue({ type: 'update_product', payload: { id, updates } });
        }
      },

      deleteProduct: async (id) => {
        // Optimistic update
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
        setOfflineData('products', get().products);

        if (isOnline()) {
          try {
            await deleteProductDb(id);
          } catch (error) {
            console.error('Failed to delete product online:', error);
            addToQueue({ type: 'delete_product', payload: { id } });
          }
        } else {
          addToQueue({ type: 'delete_product', payload: { id } });
        }
      },

      getProductByBarcode: (barcode) => {
        return get().products.find((p) => p.barcode === barcode);
      },

      addMovement: async (movementData) => {
        const userId = get().userId;
        const tempMovement: StockMovement = {
          ...movementData,
          id: crypto.randomUUID(),
          date: new Date(),
        };

        const quantityChange = movementData.type === 'in'
          ? movementData.quantity
          : -movementData.quantity;

        // Optimistic update
        set((state) => ({
          movements: [tempMovement, ...state.movements],
          products: state.products.map((p) =>
            p.id === movementData.productId
              ? { ...p, quantity: Math.max(0, p.quantity + quantityChange), updatedAt: new Date() }
              : p
          ),
        }));
        setOfflineData('products', get().products);
        setOfflineData('movements', get().movements);

        // Also update the product quantity in DB
        const product = get().products.find((p) => p.id === movementData.productId);
        if (product) {
          if (isOnline() && userId) {
            try {
              await insertMovement(movementData, userId);
              await updateProductDb(movementData.productId, { quantity: product.quantity });
            } catch (error) {
              console.error('Failed to insert movement online:', error);
              addToQueue({ type: 'insert_movement', payload: movementData });
              addToQueue({ type: 'update_product', payload: { id: movementData.productId, updates: { quantity: product.quantity } } });
            }
          } else {
            addToQueue({ type: 'insert_movement', payload: movementData });
            addToQueue({ type: 'update_product', payload: { id: movementData.productId, updates: { quantity: product.quantity } } });
          }
        }
      },

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.cart.find((item) => item.product.id === product.id);
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        }));
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        return get().cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },

      completeSale: async (paymentMethod) => {
        const state = get();
        const userId = state.userId;
        if (state.cart.length === 0) return null;

        const total = state.getCartTotal();
        const cartItems = [...state.cart];

        const tempSale: Sale = {
          id: crypto.randomUUID(),
          items: cartItems,
          total,
          date: new Date(),
          paymentMethod,
        };

        // Optimistic: add sale, clear cart, update stock
        set((state) => ({ sales: [tempSale, ...state.sales], cart: [] }));

        // Add movements for each item
        for (const item of cartItems) {
          await state.addMovement({
            productId: item.product.id,
            productName: item.product.name,
            type: 'sale',
            quantity: item.quantity,
            note: `Vente #${tempSale.id.slice(-6)}`,
          });
        }

        setOfflineData('sales', get().sales);

        if (isOnline() && userId) {
          try {
            await insertSale(cartItems, total, paymentMethod, userId);
          } catch (error) {
            console.error('Failed to insert sale online:', error);
            addToQueue({
              type: 'insert_sale',
              payload: { items: cartItems, total, paymentMethod },
            });
          }
        } else {
          addToQueue({
            type: 'insert_sale',
            payload: { items: cartItems, total, paymentMethod },
          });
        }

        return tempSale;
      },

      getLowStockProducts: () => {
        return get().products.filter((p) => p.quantity <= p.minStock);
      },

      getTotalInventoryValue: () => {
        return get().products.reduce((total, p) => total + p.cost * p.quantity, 0);
      },

      getTodaySales: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get()
          .sales.filter((s) => new Date(s.date) >= today)
          .reduce((total, s) => total + s.total, 0);
      },

      getRecentMovements: (limit = 10) => {
        return get().movements.slice(0, limit);
      },
    }),
    {
      name: 'stockpro-store',
      partialize: (state) => ({
        cart: state.cart,
        // Don't persist products/movements/sales - they come from Supabase or offline cache
      }),
    }
  )
);
