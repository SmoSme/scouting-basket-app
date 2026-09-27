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

/**
 * Robust cleanup of stale, old (>24h), or mismatched match session offline queue items.
 */
export function cleanStaleOfflineQueue(currentMatchName) {
  try {
    const queue = getOfflineQueue();
    if (!queue || queue.length === 0) return [];

    const now = Date.now();
    const validQueue = queue.filter(item => {
      if (!item || typeof item !== 'object') return false;

      // 1. Filter out items older than 24 hours
      if (item._queuedAt) {
        const queuedTime = new Date(item._queuedAt).getTime();
        if (isNaN(queuedTime) || now - queuedTime > 86400000) {
          console.warn('Purging stale offline queue item (>24h):', item);
          return false;
        }
      }

      // 2. Filter out items belonging to a different/previous match session
      if (currentMatchName && item.nome_partita && item.nome_partita !== currentMatchName) {
        console.warn(`Purging offline queue item from previous session "${item.nome_partita}" (current: "${currentMatchName}"):`, item);
        return false;
      }

      return true;
    });

    if (validQueue.length !== queue.length) {
      if (validQueue.length === 0) {
        clearOfflineQueue();
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(validQueue));
      }
    }

    return validQueue;
  } catch (err) {
    console.error('Error cleaning stale offline queue:', err);
    clearOfflineQueue();
    return [];
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

/**
 * Listens for visibilitychange (tablet wake up / tab refocus) and window focus events.
 * Forces state re-fetch and queue flush when tablet comes back from standby.
 */
export function setupStandbyRefocusListener(onFocusOrWake) {
  const handleWake = () => {
    if (document.visibilityState === 'visible') {
      console.log('App returned from standby / tab refocus! Triggering sync & re-fetch...');
      if (onFocusOrWake) onFocusOrWake();
    }
  };

  window.addEventListener('visibilitychange', handleWake);
  window.addEventListener('focus', handleWake);

  return () => {
    window.removeEventListener('visibilitychange', handleWake);
    window.removeEventListener('focus', handleWake);
  };
}

/**
 * Safely unregisters stale PWA service workers if any exist in the browser.
 */
export function unregisterLegacyServiceWorkers() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('Unregistered legacy Service Worker:', registration);
      }
    }).catch(err => {
      console.warn('Service worker unregister error:', err);
    });
  }
}
