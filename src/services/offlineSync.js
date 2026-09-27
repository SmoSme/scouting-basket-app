import { supabase } from './supabase.js';

const OFFLINE_QUEUE_KEY = 'scouting_offline_queue';

export function getOfflineQueue() {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (err) {
    console.error('Failed to read offline queue:', err);
    return [];
  }
}

export function saveToOfflineQueue(eventData) {
  try {
    const currentQueue = getOfflineQueue();
    currentQueue.push({
      ...eventData,
      _queuedAt: new Date().toISOString()
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(currentQueue));
  } catch (err) {
    console.error('Failed to save event to offline queue:', err);
  }
}

export function clearOfflineQueue() {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (err) {
    console.error('Failed to clear offline queue:', err);
  }
}

export async function syncOfflineQueue(onSyncSuccess) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, queueEmpty: true };

  if (!navigator.onLine) {
    console.warn('Network offline. Postponing Supabase queue sync.');
    return { syncedCount: 0, offline: true };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('your-supabase-project')) {
    return { syncedCount: 0, unconfigured: true, message: 'Chiavi Supabase non configurate nel file .env' };
  }

  try {
    const payload = queue.map(({ _queuedAt, ...item }) => item);
    
    const { data, error } = await supabase
      .from('scouting_log')
      .insert(payload);

    if (error) {
      console.error('Supabase batch sync error:', error);
      return { syncedCount: 0, error: error.message || JSON.stringify(error) };
    }

    const syncedCount = queue.length;
    clearOfflineQueue();
    
    if (onSyncSuccess) {
      onSyncSuccess(syncedCount);
    }
    
    return { syncedCount, data };
  } catch (err) {
    console.error('Unexpected error during offline queue sync:', err);
    return { syncedCount: 0, error: err.message || 'Errore di connessione' };
  }
}

export function setupOnlineSyncListener(onSyncSuccess) {
  const handleOnline = () => {
    console.log('Internet connection restored! Triggering Supabase queue sync...');
    syncOfflineQueue(onSyncSuccess);
  };

  window.addEventListener('online', handleOnline);

  if (navigator.onLine) {
    syncOfflineQueue(onSyncSuccess);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
