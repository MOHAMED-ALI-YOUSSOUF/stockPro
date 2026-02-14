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
  pendingOps: number;
  isSyncing: boolean;
  setPendingOps: (count: number) => void;
  setIsSyncing: (value: boolean) => void;
  lastSyncAt: number | null;
  userId: string | null;
  vatRate: number;

  // Init
  setUserId: (id: string | null) => void;
  loadData: () => Promise<void>;

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
  completeSale: (paymentMethod: string, discount?: number, amountGiven?: number) => Promise<Sale | null>;

  // Stats
  getLowStockProducts: () => Product[];
  getTotalInventoryValue: () => number;
  getTodaySales: () => number;
  getRecentMovements: (limit?: number) => StockMovement[];

  // Settings
  updateVatRate: (rate: number) => Promise<void>;
}

/**
 * Maps frontend payment methods to specific backend values
 * Allowed: 'cash', 'd-money', 'waafi', 'cac-pay', 'saba-pay', 'card'
 */
function normalizePaymentMethod(method: string): 'cash' | 'd-money' | 'waafi' | 'cac-pay' | 'saba-pay' | 'card' {
  const normalized = method?.toLowerCase().trim() as any;

  const validMethods = ['cash', 'd-money', 'waafi', 'cac-pay', 'saba-pay', 'card'];

  if (validMethods.includes(normalized)) {
    return normalized;
  }

  // Legacy mapping compatibility
  if (normalized === 'mobile_money' || normalized === 'mobile') {
    return 'd-money'; // Default mobile to d-money if generic
  }

  // Default to cash if unknown
  console.warn(`Unknown payment method: "${method}", defaulting to "cash"`);
  return 'cash';
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
      pendingOps: 0,
      lastSyncAt: null,
      userId: null,
      vatRate: 0,

      setPendingOps: (count) => set({ pendingOps: count }),
      setIsSyncing: (value) => set({ isSyncing: value }),

      setUserId: (id) => set({ userId: id }),

      loadData: async () => {
        set({ isLoading: true, pendingOps: getQueue().length });
        try {
          if (isOnline()) {
            const [products, movements, sales] = await Promise.all([
              fetchProducts(),
              fetchMovements(),
              fetchSales(),
            ]);

            // Try fetch settings if userId is present, otherwise default 0
            let vatRate = 0;
            const currentUserId = get().userId;
            if (currentUserId) {
              try {
                const settings = await import('@/lib/database').then(m => m.fetchSettings(currentUserId));
                vatRate = settings.vatRate;
              } catch (e) {
                console.error("Failed to fetch settings", e);
              }
            }

            set({ products, movements, sales, vatRate, lastSyncAt: Date.now() });

            // Cache for offline
            setOfflineData('products', products);
            setOfflineData('movements', movements);
            setOfflineData('sales', sales);
            setOfflineData('vatRate', vatRate);
          } else {
            // Load from cache
            const products = getOfflineData<Product[]>('products') || [];
            const movements = getOfflineData<StockMovement[]>('movements') || [];
            const sales = getOfflineData<Sale[]>('sales') || [];
            const vatRate = getOfflineData<number>('vatRate') || 0;
            set({ products, movements, sales, vatRate });
          }
        } catch (error) {
          console.error('Failed to load data:', error);
          // Fallback to cache
          const products = getOfflineData<Product[]>('products') || [];
          const movements = getOfflineData<StockMovement[]>('movements') || [];
          const sales = getOfflineData<Sale[]>('sales') || [];
          const vatRate = getOfflineData<number>('vatRate') || 0;
          set({ products, movements, sales, vatRate });
        } finally {
          set({ isLoading: false });
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

        // Validation du payload
        if (!movementData.productId || !movementData.productName || !movementData.type || !movementData.quantity) {
          console.error("Invalid movement data:", movementData);
          throw new Error("Movement data is incomplete");
        }

        const normalizedPaymentMethod = movementData.paymentMethod
          ? normalizePaymentMethod(movementData.paymentMethod)
          : undefined;

        const sanitizedMovementData = {
          ...movementData,
          paymentMethod: normalizedPaymentMethod,
        };

        const tempMovement: StockMovement = {
          ...sanitizedMovementData,
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
              await insertMovement(sanitizedMovementData, userId);
              await updateProductDb(movementData.productId, { quantity: product.quantity });
            } catch (error) {
              console.error('Failed to insert movement online:', error);
              addToQueue({ type: 'insert_movement', payload: sanitizedMovementData });
              addToQueue({ type: 'update_product', payload: { id: movementData.productId, updates: { quantity: product.quantity } } });
            }
          } else {
            addToQueue({ type: 'insert_movement', payload: sanitizedMovementData });
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

      completeSale: async (paymentMethod, discount = 0, amountGiven = 0) => {
        const state = get();
        const userId = state.userId;
        if (state.cart.length === 0) {
          console.error("Cannot complete sale: cart is empty");
          return null;
        }

        const cartItems = [...state.cart];
        const totalBrut = state.getCartTotal();
        const vatRate = state.vatRate || 0;
        const vatTotal = totalBrut * (vatRate / 100);
        const totalAfterVat = totalBrut + vatTotal;
        const totalFinal = Math.max(0, totalAfterVat - discount);
        const change = Math.max(0, amountGiven - totalFinal);

        // Normalize payment method
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

        console.log("Completing sale with payment method:", paymentMethod, "→", normalizedPaymentMethod);

        const saleData = {
          items: cartItems,
          totalBrut,
          vatRate,
          vatTotal,
          discount,
          totalFinal,
          amountGiven,
          change,
          paymentMethod: normalizedPaymentMethod,
        };

        const tempSaleId = crypto.randomUUID();

        const tempSale: Sale = {
          id: tempSaleId,
          items: cartItems,
          total: totalFinal,
          totalBrut,
          vatRate,
          vatTotal,
          discount,
          totalFinal,
          amountGiven,
          change,
          date: new Date(),
          paymentMethod: normalizedPaymentMethod,
          userId: userId || undefined,
        };

        // Optimistic: add sale, clear cart
        set((state) => ({ sales: [tempSale, ...(state.sales || [])], cart: [] }));
        setOfflineData('sales', get().sales);

        // Add movements for each item APRÈS avoir créé la vente
        // Cela évite que les mouvements soient créés sans vente valide
        try {
          for (const item of cartItems) {
            const movementData = {
              productId: item.product.id,
              productName: item.product.name,
              type: 'sale' as const,
              quantity: item.quantity,
              note: `Vente #${tempSaleId.slice(-6)}`,
              paymentMethod: normalizedPaymentMethod,
            };

            // Valider les données avant d'appeler addMovement
            if (!movementData.productId || !movementData.productName || !movementData.quantity) {
              console.error("Invalid movement data for item:", item, movementData);
              continue;
            }

            await state.addMovement(movementData);
          }
        } catch (error) {
          console.error("Error adding movements for sale:", error);
        }

        // Enregistrer la vente
        if (isOnline() && userId) {
          try {
            const insertedSale = await insertSale(saleData, userId);
            // Mettre à jour avec la vente réelle
            set((state) => ({
              sales: state.sales.map((s) => (s.id === tempSale.id ? insertedSale : s)),
            }));
            setOfflineData('sales', get().sales);
            return insertedSale;
          } catch (error) {
            console.error('Failed to insert sale online:', error);
            addToQueue({
              type: 'insert_sale',
              payload: saleData,
            });
            return tempSale;
          }
        } else {
          addToQueue({
            type: 'insert_sale',
            payload: saleData,
          });
          return tempSale;
        }
      },

      updateVatRate: async (rate: number) => {
        set({ vatRate: rate });
        setOfflineData('vatRate', rate);
        const userId = get().userId;
        if (isOnline() && userId) {
          try {
            const { updateSettings } = await import('@/lib/database');
            await updateSettings(userId, rate);
          } catch (error) {
            console.error('Failed to update settings online:', error);
            addToQueue({ type: 'update_settings', payload: { rate } });
          }
        } else {
          addToQueue({ type: 'update_settings', payload: { rate } });
        }
      },

      getLowStockProducts: () => {
        const products = get().products || [];
        return products.filter((p) => p.quantity <= p.minStock);
      },

      getTotalInventoryValue: () => {
        const products = get().products || [];
        return products.reduce((total, p) => total + p.cost * p.quantity, 0);
      },

      getTodaySales: () => {
        const sales = get().sales || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return sales
          .filter((s) => new Date(s.date) >= today)
          .reduce((total, s) => total + (s.totalFinal || s.total), 0);
      },

      getRecentMovements: (limit = 10) => {
        const movements = get().movements || [];
        return movements.slice(0, limit);
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