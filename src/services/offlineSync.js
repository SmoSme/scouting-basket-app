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
    // Normalize to exact schema columns before storing in queue
    const Timestamp = eventData.Timestamp || eventData.timestamp || '';
    const Quarter = eventData.Quarter || eventData.quarter || eventData.Quarto || eventData.quarto || '';
    const NumberVal = String(eventData.Number ?? eventData.number ?? eventData.Numero ?? eventData.numero ?? '');
    const Player = eventData.Player || eventData.player || eventData.Giocatore || eventData.giocatore || '';
    const Action = eventData.Action || eventData.action || eventData.Azione || eventData.azione || '';
    const Category = eventData.Category || eventData.category || eventData.Categoria || eventData.categoria || '';
    const Zone = eventData.Zone || eventData.zone || eventData.Zona || eventData.zona || '';
    const Match_Name = eventData.Match_Name || eventData.match_name || eventData.nome_partita || eventData.Nome_Partita || '';

    currentQueue.push({
      Timestamp,
      Quarter,
      Number: NumberVal,
      Player,
      Action,
      Category,
      Zone,
      Match_Name,
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
      const itemMatch = item.Match_Name || item.match_name || item.nome_partita || item.Nome_Partita;
      if (currentMatchName && itemMatch && itemMatch !== currentMatchName) {
        console.warn(`Purging offline queue item from previous session "${itemMatch}" (current: "${currentMatchName}"):`, item);
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
    return { syncedCount: 0, unconfigured: true, message: 'Supabase API keys not configured in .env file' };
  }

  try {
    // Sanitize payload: ONLY include exact columns that exist in the Supabase schema
    const payload = queue.map(item => {
      const Timestamp = item.Timestamp || item.timestamp || '';
      const Quarter = item.Quarter || item.quarter || item.Quarto || item.quarto || '';
      const NumberVal = String(item.Number ?? item.number ?? item.Numero ?? item.numero ?? '');
      const Player = item.Player || item.player || item.Giocatore || item.giocatore || '';
      const Action = item.Action || item.action || item.Azione || item.azione || '';
      const Category = item.Category || item.category || item.Categoria || item.categoria || '';
      const Zone = item.Zone || item.zone || item.Zona || item.zona || '';
      const Match_Name = item.Match_Name || item.match_name || item.nome_partita || item.Nome_Partita || '';

      return {
        Timestamp,
        Quarter,
        Number: NumberVal,
        Player,
        Action,
        Category,
        Zone,
        Match_Name
      };
    });
    
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
    return { syncedCount: 0, error: err.message || 'Connection error' };
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
