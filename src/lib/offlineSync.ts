// Offline sync queue - stores pending operations when offline
// and processes them when back online

interface PendingOperation {
  id: string;
  type: 'insert_product' | 'update_product' | 'delete_product' | 'insert_movement' | 'insert_sale';
  payload: any;
  timestamp: number;
}

const QUEUE_KEY = 'stockpro_sync_queue';
const OFFLINE_DATA_KEY = 'stockpro_offline_data';

export function isOnline(): boolean {
  return navigator.onLine;
}

export function getQueue(): PendingOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToQueue(op: Omit<PendingOperation, 'id' | 'timestamp'>): void {
  const queue = getQueue();
  queue.push({
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((op) => op.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

// Offline data cache
export function getOfflineData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${OFFLINE_DATA_KEY}_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setOfflineData<T>(key: string, data: T): void {
  localStorage.setItem(`${OFFLINE_DATA_KEY}_${key}`, JSON.stringify(data));
}

export function hasPendingOps(): boolean {
  return getQueue().length > 0;
}
