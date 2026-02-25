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
  fetchSettings,
  updateSettings
} from '@/lib/database';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  isOnline,
  addToQueue,
  getQueue,
  setOfflineData,
  getOfflineData,
} from '@/lib/offlineSync';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

  // Store settings — toujours initialisées à des valeurs sûres
  vatRate: number;
  storeName: string;
  address: string;
  phone: string;
  categories: string[];
  units: string[];

  // Init
  setUserId: (id: string | null) => void;
  loadData: () => Promise<void>;

  // Products
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductByBarcode: (barcode: string) => Product | undefined;

  // Stock movements (mouvements manuels uniquement — pas pour les ventes)
  addMovement: (movement: Omit<StockMovement, 'id' | 'date'>) => Promise<void>;

  // Cart
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  // Sales
  completeSale: (paymentMethod: string, discount?: number, amountGiven?: number) => Promise<Sale | null>;
  getMonthlySales: () => { month: string; value: number }[];

  // Stats
  getLowStockProducts: () => Product[];
  getTotalInventoryValue: () => number;
  getTodaySales: () => number;
  getRecentMovements: (limit?: number) => StockMovement[];

  // Settings
  updateVatRate: (rate: number) => Promise<void>;
  updateStoreSettings: (settings: {
    name: string;
    rate: number;
    address?: string;
    phone?: string;
    categories?: string[];
    units?: string[];
  }) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function normalizePaymentMethod(method: string): 'cash' | 'd-money' | 'waafi' | 'cac-pay' | 'saba-pay' | 'card' {
  const normalized = method?.toLowerCase().trim() as any;
  const validMethods = ['cash', 'd-money', 'waafi', 'cac-pay', 'saba-pay', 'card'];
  if (validMethods.includes(normalized)) return normalized;
  if (normalized === 'mobile_money' || normalized === 'mobile') return 'd-money';
  return 'cash';
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

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

      // Valeurs par défaut sûres — évite les crash sur .map() ou [0]
      vatRate: 0,
      storeName: '',
      address: '',
      phone: '',
      categories: [],
      units: [],

      setPendingOps: (count) => set({ pendingOps: count }),
      setIsSyncing: (value) => set({ isSyncing: value }),
      setUserId: (id) => set({ userId: id }),

      // ───────────────────────────────────────────────────────────────────────
      // loadData — charge depuis Supabase (online) ou localStorage (offline)
      // ───────────────────────────────────────────────────────────────────────
      loadData: async () => {
        set({ isLoading: true, pendingOps: getQueue().length });
        try {
          if (isOnline()) {
            const [products, movements, sales] = await Promise.all([
              fetchProducts(),
              fetchMovements(),
              fetchSales(),
            ]);

            let vatRate = 0;
            let storeName = '';
            let address = '';
            let phone = '';
            let categories: string[] = [];
            let units: string[] = [];

            const currentUserId = get().userId;
            if (currentUserId) {
              try {
                const settings = await fetchSettings(currentUserId);
                vatRate = settings.vatRate ?? 0;
                storeName = settings.storeName ?? '';
                address = settings.address ?? '';
                phone = settings.phone ?? '';
                categories = Array.isArray(settings.categories) ? settings.categories : [];
                units = Array.isArray(settings.units) ? settings.units : [];
              } catch (e) {
                console.error('Failed to fetch settings', e);
              }
            }

            set({ products, movements, sales, vatRate, storeName, address, phone, categories, units, lastSyncAt: Date.now() });

            setOfflineData('products', products);
            setOfflineData('movements', movements);
            setOfflineData('sales', sales);
            setOfflineData('vatRate', vatRate);
            setOfflineData('storeName', storeName);
            setOfflineData('address', address);
            setOfflineData('phone', phone);
            setOfflineData('categories', categories);
            setOfflineData('units', units);
          } else {
            const products = getOfflineData<Product[]>('products') || [];
            const movements = getOfflineData<StockMovement[]>('movements') || [];
            const sales = getOfflineData<Sale[]>('sales') || [];
            const vatRate = getOfflineData<number>('vatRate') || 0;
            const storeName = getOfflineData<string>('storeName') || '';
            const address = getOfflineData<string>('address') || '';
            const phone = getOfflineData<string>('phone') || '';
            const categories = Array.isArray(getOfflineData('categories')) ? getOfflineData<string[]>('categories')! : [];
            const units = Array.isArray(getOfflineData('units')) ? getOfflineData<string[]>('units')! : [];
            set({ products, movements, sales, vatRate, storeName, address, phone, categories, units });
          }
        } catch (error) {
          console.error('Failed to load data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // Products
      // ───────────────────────────────────────────────────────────────────────

      addProduct: async (productData) => {
        const userId = get().userId;
        const barcode = productData.barcode || generateBarcode();

        if (productData.barcode && get().products.some(p => p.barcode === productData.barcode)) {
          throw new Error(`Le code-barres ${productData.barcode} existe déjà.`);
        }

        const tempProduct: Product = {
          ...productData,
          id: crypto.randomUUID(),
          barcode,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({ products: [tempProduct, ...state.products] }));
        setOfflineData('products', get().products);

        if (isOnline() && userId) {
          try {
            const dbProduct = await insertProduct({ ...productData, barcode } as any, userId);
            set((state) => ({
              products: state.products.map((p) => (p.id === tempProduct.id ? dbProduct : p)),
            }));
            setOfflineData('products', get().products);
            return dbProduct;
          } catch (error) {
            addToQueue({ type: 'insert_product', payload: { ...productData, barcode } });
            return tempProduct;
          }
        } else {
          addToQueue({ type: 'insert_product', payload: { ...productData, barcode } });
          return tempProduct;
        }
      },

      updateProduct: async (id, updates) => {
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
            addToQueue({ type: 'update_product', payload: { id, updates } });
          }
        } else {
          addToQueue({ type: 'update_product', payload: { id, updates } });
        }
      },

      deleteProduct: async (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
        setOfflineData('products', get().products);

        if (isOnline()) {
          try {
            await deleteProductDb(id);
          } catch (error) {
            addToQueue({ type: 'delete_product', payload: { id } });
          }
        } else {
          addToQueue({ type: 'delete_product', payload: { id } });
        }
      },

      getProductByBarcode: (barcode) => {
        return get().products.find((p) => p.barcode === barcode);
      },

      // ───────────────────────────────────────────────────────────────────────
      // Stock movements (manuels — entrées / sorties uniquement)
      // ───────────────────────────────────────────────────────────────────────

      addMovement: async (movementData) => {
        const userId = get().userId;
        const normalizedPaymentMethod = movementData.paymentMethod
          ? normalizePaymentMethod(movementData.paymentMethod)
          : undefined;

        const sanitizedMovementData = {
          ...movementData,
          paymentMethod: normalizedPaymentMethod,
          unitCost: get().products.find(p => p.id === movementData.productId)?.cost || 0
        };

        const tempMovement: StockMovement = {
          ...sanitizedMovementData,
          id: crypto.randomUUID(),
          date: new Date(),
        };

        set((state) => {
          return {
            movements: [tempMovement, ...state.movements],
            products: state.products.map((p) => {
              if (p.id !== movementData.productId) return p;

              let newQuantity = p.quantity;

              if (movementData.type === 'in') {
                newQuantity = p.quantity + movementData.quantity;
              }

              if (movementData.type === 'sale' || movementData.type === 'out') {
                newQuantity = Math.max(0, p.quantity - movementData.quantity);
              }

              return {
                ...p,
                quantity: newQuantity,
                updatedAt: new Date(),
              };
            }),
          };
        });

        const product = get().products.find((p) => p.id === movementData.productId);
        if (product) {
          if (isOnline() && userId) {
            try {
              await insertMovement(sanitizedMovementData, userId);
              await updateProductDb(movementData.productId, { quantity: product.quantity });
            } catch (error) {
              addToQueue({ type: 'insert_movement', payload: sanitizedMovementData });
              addToQueue({ type: 'update_product', payload: { id: movementData.productId, updates: { quantity: product.quantity } } });
            }
          } else {
            addToQueue({ type: 'insert_movement', payload: sanitizedMovementData });
            addToQueue({ type: 'update_product', payload: { id: movementData.productId, updates: { quantity: product.quantity } } });
          }
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // Cart
      // ───────────────────────────────────────────────────────────────────────

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
          return { cart: [...state.cart, { product, quantity, unitCost: product.cost }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({ cart: state.cart.filter((item) => item.product.id !== productId) }));
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
      getCartTotal: () => get().cart.reduce((total, item) => total + item.product.price * item.quantity, 0),

      // ───────────────────────────────────────────────────────────────────────
      // Sales
      // ───────────────────────────────────────────────────────────────────────

      completeSale: async (paymentMethod, discount = 0, amountGiven = 0) => {
        const state = get();
        const userId = state.userId;
        if (state.cart.length === 0) return null;

        const cartItems = [...state.cart];
        const totalBrut = state.getCartTotal();
        const vatRate = state.vatRate || 0;
        const vatTotal = totalBrut * (vatRate / 100);
        const totalAfterVat = totalBrut + vatTotal;
        const totalFinal = Math.max(0, totalAfterVat - discount);
        const change = Math.max(0, amountGiven - totalFinal);
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

        const saleData = {
          items: cartItems.map(item => ({ ...item, unitCost: item.product.cost })),
          totalBrut,
          vatRate,
          vatTotal,
          discount,
          totalFinal,
          amountGiven,
          change,
          paymentMethod: normalizedPaymentMethod,
          storeName: state.storeName,
        };

        const tempSaleId = crypto.randomUUID();
        const tempSale: Sale = {
          ...saleData,
          id: tempSaleId,
          total: totalFinal,
          date: new Date(),
          userId: userId || undefined,
        };

        // ─────────────────────────────────────────────────────────────────────
        // MISE À JOUR LOCALE UNIQUEMENT — sans appel DB ici.
        //
        // CORRECTION BUG DOUBLE INSERT :
        // La fonction Supabase `create_sale` (appelée dans insertSale) insère
        // DÉJÀ les stock_movements côté serveur dans sa transaction SQL.
        // Si on appelait addMovement() → insertMovement() ici en plus, chaque
        // mouvement serait inséré 2× en base.
        //
        // Solution : mise à jour directe de Zustand (UI instantanée),
        // DB exclusivement déléguée à insertSale → create_sale RPC.
        // ─────────────────────────────────────────────────────────────────────
        const now = new Date();

        // Crée les mouvements temporaires pour l'affichage local
        const tempMovements: StockMovement[] = cartItems.map(item => ({
          id: crypto.randomUUID(),
          productId: item.product.id,
          productName: item.product.name,
          type: 'sale' as const,
          quantity: item.quantity,
          date: now,
          note: `Vente #${tempSaleId.slice(-6)}`,
          paymentMethod: normalizedPaymentMethod,
          unitCost: item.product.cost,
        }));

        // Un seul set() atomique : panier vidé, vente + mouvements ajoutés, stocks décrémentés
        set((prevState) => ({
          cart: [],
          sales: [tempSale, ...(prevState.sales || [])],
          movements: [...tempMovements, ...prevState.movements],
          products: prevState.products.map((p) => {
            const soldItem = cartItems.find(i => i.product.id === p.id);
            if (!soldItem) return p;
            return {
              ...p,
              quantity: Math.max(0, p.quantity - soldItem.quantity),
              updatedAt: now,
            };
          }),
        }));

        // Persiste l'état local pour le mode offline
        setOfflineData('sales', get().sales);
        setOfflineData('movements', get().movements);
        setOfflineData('products', get().products);

        // ─────────────────────────────────────────────────────────────────────
        // DB — insertSale → create_sale RPC gère TOUT (sale + movements + stock)
        // On ne queue PAS insert_movement : create_sale s'en charge.
        // ─────────────────────────────────────────────────────────────────────
        if (isOnline() && userId) {
          try {
            const insertedSale = await insertSale(saleData, userId);
            // Remplace la vente temp par la vente confirmée (vrai ID Supabase)
            set((prevState) => ({
              sales: prevState.sales.map((s) => (s.id === tempSale.id ? insertedSale : s)),
            }));
            setOfflineData('sales', get().sales);
            return insertedSale;
          } catch (error) {
            console.error('[completeSale] insertSale failed, queuing:', error);
            // Mode dégradé : queue insert_sale uniquement
            // create_sale créera les mouvements lors du replay
            addToQueue({ type: 'insert_sale', payload: saleData });
            return tempSale;
          }
        } else {
          // Offline : queue insert_sale uniquement (pas insert_movement)
          addToQueue({ type: 'insert_sale', payload: saleData });
          return tempSale;
        }
      },

      getMonthlySales: () => {
        const sales = get().sales || [];
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return format(d, 'MMM', { locale: fr });
        });

        return months.map(month => {
          const monthSales = sales.filter(s => {
            const d = new Date(s.date);
            return format(d, 'MMM', { locale: fr }) === month && d.getFullYear() === new Date().getFullYear();
          });
          const total = monthSales.reduce((acc, s) => acc + (s.totalFinal || s.total), 0);
          return { month, value: total };
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // Settings
      // ───────────────────────────────────────────────────────────────────────

      updateVatRate: async (rate) => {
        const current = get();
        await current.updateStoreSettings({ name: current.storeName, rate });
      },

      updateStoreSettings: async ({ name, rate, address, phone, categories, units }) => {
        const current = get();
        const newAddress = address !== undefined ? address : current.address;
        const newPhone = phone !== undefined ? phone : current.phone;
        const newCategories = Array.isArray(categories) ? categories : current.categories;
        const newUnits = Array.isArray(units) ? units : current.units;

        // Optimistic update
        set({
          storeName: name,
          vatRate: rate,
          address: newAddress,
          phone: newPhone,
          categories: newCategories,
          units: newUnits,
        });

        // Persiste offline
        setOfflineData('storeName', name);
        setOfflineData('vatRate', rate);
        setOfflineData('address', newAddress);
        setOfflineData('phone', newPhone);
        setOfflineData('categories', newCategories);
        setOfflineData('units', newUnits);

        const userId = get().userId;
        const settingsPayload = {
          storeName: name,
          vatRate: rate,
          address: newAddress,
          phone: newPhone,
          categories: newCategories,
          units: newUnits,
        };

        if (isOnline() && userId) {
          try {
            await updateSettings(userId, settingsPayload);
          } catch (error) {
            addToQueue({ type: 'update_settings', payload: settingsPayload });
          }
        } else {
          addToQueue({ type: 'update_settings', payload: settingsPayload });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // Stats
      // ───────────────────────────────────────────────────────────────────────

      getLowStockProducts: () => (get().products || []).filter((p) => p.quantity <= p.minStock),

      getTotalInventoryValue: () =>
        (get().products || []).reduce((total, p) => total + p.price * p.quantity, 0),

      getTodaySales: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return (get().sales || [])
          .filter((s) => new Date(s.date) >= today)
          .reduce((acc, s) => acc + (s.totalFinal || s.total), 0);
      },

      getRecentMovements: (limit = 10) => (get().movements || []).slice(0, limit),
    }),
    {
      name: 'stockpro-store',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);