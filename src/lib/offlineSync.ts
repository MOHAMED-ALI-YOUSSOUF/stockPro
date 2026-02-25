import { supabase } from './supabase';

// Offline sync queue - stores pending operations when offline
// and processes them when back online

export interface PendingOperation {
  id: string;
  type: 'insert_product' | 'update_product' | 'delete_product' | 'insert_movement' | 'insert_sale' | 'update_settings';
  payload: any;
  timestamp: number;
  retries?: number; // Compteur de tentatives
}

const QUEUE_KEY = 'stockpro_sync_queue';
const OFFLINE_DATA_KEY = 'stockpro_offline_data';
const MAX_RETRIES = 3; // Nombre maximum de tentatives par opération

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export function getQueue(): PendingOperation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToQueue(op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  const queue = getQueue();
  const id = generateId();
  queue.push({
    ...op,
    id,
    timestamp: Date.now(),
    retries: 0,
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

  // Update Zustand Store dynamically to avoid circular dependency
  const { useStore } = await import('@/store/useStore');
  useStore.getState().setPendingOps(queue.length);
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = getQueue().filter((op) => op.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

  // Update Zustand Store dynamically
  const { useStore } = await import('@/store/useStore');
  useStore.getState().setPendingOps(queue.length);
}

export async function updateQueueItemRetries(id: string): Promise<void> {
  const queue = getQueue().map((op) =>
    op.id === id ? { ...op, retries: (op.retries || 0) + 1 } : op
  );
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function clearQueue(): Promise<void> {
  localStorage.removeItem(QUEUE_KEY);

  // Update Zustand Store dynamically
  const { useStore } = await import('@/store/useStore');
  useStore.getState().setPendingOps(0);
}

// Offline data cache
export function getOfflineData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${OFFLINE_DATA_KEY}_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setOfflineData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${OFFLINE_DATA_KEY}_${key}`, JSON.stringify(data));
}

export function hasPendingOps(): boolean {
  return getQueue().length > 0;
}

/**
 * Maps frontend payment methods to database constraint values
 * Frontend: 'cash', 'd-money', 'waafi', 'cac-pay', 'saba-pay', 'card'
 * Database: 'cash', 'd-money', 'waafi', 'cac-pay', 'saba-pay', 'card'
 */
function normalizePaymentMethod(method: string): string {
  const normalized = method?.toLowerCase().trim();

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

/**
 * Valide le payload d'un mouvement de stock
 */
function validateMovementPayload(payload: any): boolean {
  if (!payload) {
    console.error("Movement payload is null or undefined");
    return false;
  }

  const required = ['productId', 'productName', 'type', 'quantity'];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null) {
      console.error(`Movement payload missing required field: ${field}`, payload);
      return false;
    }
  }

  if (!['in', 'out', 'sale'].includes(payload.type)) {
    console.error(`Invalid movement type: ${payload.type}`, payload);
    return false;
  }

  if (typeof payload.quantity !== 'number' || payload.quantity <= 0) {
    console.error(`Invalid movement quantity: ${payload.quantity}`, payload);
    return false;
  }

  return true;
}

/**
 * Valide le payload d'une vente
 */
function validateSalePayload(payload: any): boolean {
  if (!payload) {
    console.error("Sale payload is null or undefined");
    return false;
  }

  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    console.error("Sale payload missing or invalid items array", payload);
    return false;
  }

  if (!payload.paymentMethod) {
    console.error("Sale payload missing payment method", payload);
    return false;
  }

  const validMethods = ['cash', 'd-money', 'waafi', 'cac-pay', 'saba-pay', 'card'];
  if (!validMethods.includes(payload.paymentMethod)) {
    console.error(`Invalid payment method: ${payload.paymentMethod}`, payload);
    return false;
  }

  return true;
}

/**
 * Processes the offline queue sequentially.
 */
export async function processQueue() {
  const queue = getQueue();
  if (!queue.length) return;

  // Dynamically import store to avoid circular dependency
  const { useStore } = await import('@/store/useStore');
  const store = useStore.getState();
  const userId = store.userId;

  if (!userId) {
    console.warn("Cannot sync: No userId found in store. Waiting for auth...");
    return;
  }

  if (store.isSyncing) {
    console.log("Sync already in progress, skipping...");
    return;
  }

  store.setIsSyncing(true);

  let syncedCount = 0;
  let failedCount = 0;
  let consecutiveFailures = 0; // Compteur d'échecs consécutifs
  const maxConsecutiveFailures = 3; // Limite pour éviter la boucle infinie

  while (true) {
    const currentQueue = getQueue();
    if (!currentQueue.length) break;

    // Protection contre les boucles infinies
    if (consecutiveFailures >= maxConsecutiveFailures) {
      console.error(`Arrêt de la synchronisation après ${maxConsecutiveFailures} échecs consécutifs`);
      break;
    }

    const op = currentQueue[0];

    try {
      // Validate operation structure
      if (!op || !op.type) {
        console.warn("Invalid operation found in queue, removing:", op);
        await removeFromQueue(op?.id);
        failedCount++;
        consecutiveFailures++;
        continue;
      }

      // Validate payload exists
      if (!op.payload) {
        console.error("Operation missing payload:", op);
        await removeFromQueue(op.id);
        failedCount++;
        consecutiveFailures++;
        continue;
      }

      // Vérifier le nombre de tentatives
      if ((op.retries || 0) >= MAX_RETRIES) {
        console.error(`Operation ${op.type} (${op.id}) exceeded max retries, removing from queue`);
        await removeFromQueue(op.id);
        failedCount++;
        consecutiveFailures++;
        continue;
      }

      // Check if still online
      if (!navigator.onLine) {
        console.log("Device went offline during sync - pausing");
        break;
      }

      console.log(`Syncing operation: ${op.type} (${op.id}) - Attempt ${(op.retries || 0) + 1}/${MAX_RETRIES}`);

      switch (op.type) {
        case 'insert_product': {
          try {
            const { insertProduct } = await import('./database');
            await insertProduct(op.payload, userId);
          } catch (err: any) {
            console.error("insert_product failed:", err);
            throw err;
          }
          break;
        }
        case 'update_product': {
          try {
            const { updateProductDb } = await import('./database');
            await updateProductDb(op.payload.id, op.payload.updates);
          } catch (err: any) {
            console.error("update_product failed:", err);
            throw err;
          }
          break;
        }
        case 'delete_product': {
          try {
            const { deleteProductDb } = await import('./database');
            await deleteProductDb(op.payload.id);
          } catch (err: any) {
            console.error("delete_product failed:", err);
            throw err;
          }
          break;
        }
        case 'insert_movement': {
          try {
            // Valider le payload avant l'insertion
            if (!validateMovementPayload(op.payload)) {
              console.error("Invalid movement payload, removing from queue:", op.payload);
              await removeFromQueue(op.id);
              failedCount++;
              consecutiveFailures++;
              continue;
            }

            const { insertMovement } = await import('./database');
            // Ensure payment method is normalized
            const movementPayload = {
              ...op.payload,
              paymentMethod: normalizePaymentMethod(op.payload.paymentMethod || op.payload.payment_method)
            };
            await insertMovement(movementPayload, userId);
          } catch (err: any) {
            console.error("insert_movement failed:", err);
            throw err;
          }
          break;
        }
        case 'insert_sale': {
          try {
            // Valider le payload avant l'insertion
            if (!validateSalePayload(op.payload)) {
              console.error("Invalid sale payload, removing from queue:", op.payload);
              await removeFromQueue(op.id);
              failedCount++;
              consecutiveFailures++;
              continue;
            }

            // Normalize payment method and ensure correct property name for insertSale
            const normalizedPayload = {
              ...op.payload,
              paymentMethod: normalizePaymentMethod(op.payload.payment_method || op.payload.paymentMethod)
            };

            // Remove snake_case if it exists to avoid confusion
            if ((normalizedPayload as any).payment_method) {
              delete (normalizedPayload as any).payment_method;
            }

            console.log("Inserting sale - Original:", op.payload.payment_method || op.payload.paymentMethod, "→ Normalized:", normalizedPayload.paymentMethod);

            const { insertSale } = await import('./database');
            await insertSale(normalizedPayload, userId);
          } catch (err: any) {
            console.error("insert_sale failed:", err);

            // If it's a constraint violation, log the payload for debugging
            if (err?.code === 'P0001' || err?.message?.includes('check constraint')) {
              console.error("Sale payload that failed:", op.payload);
            }

            throw err;
          }
          break;
        }
        case 'update_settings': {
          try {
            const { updateSettings } = await import('./database');
            // Passe le payload complet (storeName, vatRate, address, phone, categories, units)
            // au lieu de l'ancienne signature (rate, store_name) -- aligné avec useStore v2
            await updateSettings(userId, op.payload);
          } catch (err: any) {
            console.error("update_settings failed:", err);
            throw err;
          }
          break;
        }
        default: {
          console.warn(`Unknown operation type: ${op.type}`);
          await removeFromQueue(op.id);
          failedCount++;
          consecutiveFailures++;
          continue;
        }
      }

      // Si succès, réinitialiser le compteur d'échecs consécutifs
      await removeFromQueue(op.id);
      syncedCount++;
      consecutiveFailures = 0; // Réinitialiser les échecs consécutifs
      console.log(`✓ Synced ${op.type} successfully (${syncedCount}/${syncedCount + failedCount})`);

    } catch (error: any) {
      console.error("Sync failed for operation:", {
        type: op?.type,
        id: op?.id,
        timestamp: op?.timestamp,
        retries: op?.retries || 0,
        message: error?.message || String(error),
        code: error?.code,
        details: error?.details,
        statusCode: error?.statusCode,
        hint: error?.hint,
        stack: error?.stack,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
      });

      // Handle authentication errors
      if (
        error?.message?.includes('JWT') ||
        error?.message?.includes('auth') ||
        error?.code === 'PGRST301' ||
        error?.statusCode === 401
      ) {
        console.error("Authentication error detected - stopping sync");
        store.setIsSyncing(false);
        return;
      }

      // Handle network errors
      if (!navigator.onLine) {
        console.error("Network disconnected - stopping sync");
        break;
      }

      // Handle constraint violations or schema mismatches - remove invalid data from queue
      // P0001: check_violation
      // 42703: undefined_column
      // 23502: not_null_violation
      // 23505: unique_violation
      const isTerminalError =
        error?.code === 'P0001' ||
        error?.code === '42703' ||
        error?.code === 'PGRST204' ||
        error?.code === '23502' ||
        error?.code === '23505' ||
        error?.message?.includes('check constraint') ||
        error?.message?.includes('column') && error?.message?.includes('does not exist') ||
        error?.message?.includes('schema cache');

      if (isTerminalError) {
        console.error("Terminal data error - removing invalid operation from queue", {
          type: op.type,
          id: op.id,
          error: error?.message || error
        });
        await removeFromQueue(op.id);
        failedCount++;
        consecutiveFailures++;
        continue; // Try next operation
      }

      // For other errors, increment retry counter
      await updateQueueItemRetries(op.id);
      failedCount++;
      consecutiveFailures++;

      // Si on a atteint le max de tentatives, passer à l'opération suivante
      if ((op.retries || 0) + 1 >= MAX_RETRIES) {
        console.error(`Operation exceeded max retries, will be removed on next attempt`, {
          type: op.type,
          id: op.id,
        });
      }

      console.error("Stopping sync due to temporary error. Will retry later.", {
        errorCode: error?.code,
        message: error?.message,
        consecutiveFailures,
      });
      break;
    }
  }

  store.setIsSyncing(false);

  // Log sync results
  const remainingOps = getQueue().length;
  if (syncedCount > 0 || failedCount > 0) {
    console.log(`Sync completed: ${syncedCount} successful, ${failedCount} failed, ${remainingOps} remaining`);
  }

  // Final refresh to ensure UI and server are in sync
  if (remainingOps === 0 && syncedCount > 0) {
    console.log("Queue cleared, refreshing data...");
    try {
      await store.loadData();
    } catch (error) {
      console.error("Failed to refresh data after sync:", error);
    }
  }
}