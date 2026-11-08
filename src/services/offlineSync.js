import { supabase } from './supabase.js';
import { generateUUID } from '../utils/uuid.js';

const OFFLINE_QUEUE_KEY = 'scouting_offline_queue';
let isSyncInProgress = false;

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
    const rawQueue = getOfflineQueue();
    // Enforce client-side idempotency: every event MUST have a fixed UUIDv4
    const id = eventData.id || generateUUID();

    // Prevent duplicate entries by id or by identical (timestamp + action + number)
    const exists = rawQueue.some(item => {
      if (item && item.id && String(item.id) === String(id)) return true;
      const ts = item.Timestamp || item.timestamp;
      const act = item.Action || item.action;
      const num = String(item.Number ?? item.number ?? '');
      const evTs = eventData.Timestamp || eventData.timestamp;
      const evAct = eventData.Action || eventData.action;
      const evNum = String(eventData.Number ?? eventData.number ?? '');
      return ts && act && ts === evTs && act === evAct && num === evNum;
    });

    if (exists) {
      console.warn('[OfflineSync] Event already in offline queue, skipping duplicate:', id);
      return;
    }

    // Normalize to exact schema columns before storing in queue
    const match_id = eventData.match_id || eventData.matchId || null;
    const Timestamp = eventData.Timestamp || eventData.timestamp || '';
    const Quarter = eventData.Quarter || eventData.quarter || eventData.Quarto || eventData.quarto || '';
    const NumberVal = String(eventData.Number ?? eventData.number ?? eventData.Numero ?? eventData.numero ?? '');
    const Player = eventData.Player || eventData.player || eventData.Giocatore || eventData.giocatore || '';
    const Action = eventData.Action || eventData.action || eventData.Azione || eventData.azione || '';
    const Category = eventData.Category || eventData.category || eventData.Categoria || eventData.categoria || '';
    const Zone = eventData.Zone || eventData.zone || eventData.Zona || eventData.zona || '';
    const Match_Name = eventData.Match_Name || eventData.match_name || eventData.nome_partita || eventData.Nome_Partita || '';

    const onCourtPlayerIds = eventData.on_court || eventData.onCourtPlayerIds || eventData.onCourtNums || null;
    const isTransition = Boolean(eventData.isTransition);
    const defenseType = eventData.defenseType || null;

    rawQueue.push({
      id,
      match_id,
      Timestamp,
      Quarter,
      Number: NumberVal,
      Player,
      Action,
      Category,
      Zone,
      Match_Name,
      on_court: Array.isArray(onCourtPlayerIds) ? onCourtPlayerIds.map(String) : [],
      onCourtPlayerIds: Array.isArray(onCourtPlayerIds) ? onCourtPlayerIds.map(String) : [],
      isTransition,
      defenseType,
      _queuedAt: new Date().toISOString()
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(rawQueue));
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
  if (isSyncInProgress) {
    console.log('[OfflineSync] Sync already in flight, skipping concurrent trigger.');
    return { syncedCount: 0, inFlight: true };
  }

  const rawQueue = getOfflineQueue();
  if (!rawQueue || rawQueue.length === 0) return { syncedCount: 0, queueEmpty: true };

  if (!navigator.onLine) {
    console.warn('Network offline. Postponing Supabase queue sync.');
    return { syncedCount: 0, offline: true };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('your-supabase-project')) {
    return { syncedCount: 0, unconfigured: true, message: 'Supabase API keys not configured in .env file' };
  }

  isSyncInProgress = true;
  try {
    // 1. Ensure EVERY single item in rawQueue has a persistent ID in localStorage before dispatch
    let queueDirty = false;
    const queueWithIds = rawQueue.map(item => {
      if (!item || typeof item !== 'object') return null;
      if (!item.id) {
        item.id = generateUUID();
        queueDirty = true;
      }
      return item;
    }).filter(Boolean);

    if (queueDirty) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queueWithIds));
    }

    if (queueWithIds.length === 0) {
      clearOfflineQueue();
      return { syncedCount: 0, queueEmpty: true };
    }

    // 2. Prepare sanitized payload using fixed client-side UUIDs
    const payload = queueWithIds.map(item => {
      const id = String(item.id);
      const match_id = item.match_id || item.matchId || null;
      const Timestamp = item.Timestamp || item.timestamp || '';
      const Quarter = item.Quarter || item.quarter || item.Quarto || item.quarto || '';
      const NumberVal = String(item.Number ?? item.number ?? item.Numero ?? item.numero ?? '');
      const Player = item.Player || item.player || item.Giocatore || item.giocatore || '';
      const Action = item.Action || item.action || item.Azione || item.azione || '';
      const Category = item.Category || item.category || item.Categoria || item.categoria || '';
      const Zone = item.Zone || item.zone || item.Zona || item.zona || null;
      const Match_Name = item.Match_Name || item.match_name || item.nome_partita || item.Nome_Partita || '';
      const on_court = Array.isArray(item.on_court) ? item.on_court.map(String) : (Array.isArray(item.onCourtPlayerIds) ? item.onCourtPlayerIds.map(String) : []);

      const p = {
        id,
        Timestamp,
        Quarter,
        Number: NumberVal,
        Player,
        Action,
        Category,
        Zone,
        Match_Name
      };
      if (match_id) {
        p.match_id = match_id;
      }
      if (on_court && on_court.length > 0) {
        p.on_court = on_court;
      }
      return p;
    });
    
    // 3. Backfill match_id for any queued rows missing it by querying scouting_matches
    const missingMatches = [...new Set(payload.filter(p => !p.match_id && p.Match_Name).map(p => p.Match_Name))];
    if (missingMatches.length > 0) {
      try {
        const { data: matchedRows } = await supabase
          .from('scouting_matches')
          .select('id, match_name')
          .in('match_name', missingMatches);
        if (matchedRows && matchedRows.length > 0) {
          const map = Object.fromEntries(matchedRows.map(m => [m.match_name, m.id]));
          payload.forEach(p => {
            if (!p.match_id && map[p.Match_Name]) {
              p.match_id = map[p.Match_Name];
            }
          });
        }
      } catch (err) {}
    }
    
    // 4. Perform idempotent upsert by primary key id (ignoreDuplicates: true prevents any duplicate rows)
    let { data, error } = await supabase
      .from('scouting_log')
      .upsert(payload, { onConflict: 'id', ignoreDuplicates: true });

    // Graceful fallback if on_court column does not exist yet in DB schema cache
    if (error && (error.code === '42703' || String(error.message || '').includes('on_court'))) {
      console.warn('[OfflineSync] Column on_court pending in DB schema, retrying batch without on_court column:', error.message);
      const fallbackPayload = payload.map(({ on_court, ...rest }) => rest);
      const retryRes = await supabase
        .from('scouting_log')
        .upsert(fallbackPayload, { onConflict: 'id', ignoreDuplicates: true });
      data = retryRes.data;
      error = retryRes.error;
    }

    // If success OR error code 23505 (unique_violation / already exists in DB):
    if (!error || error.code === '23505') {
      // STRICT SAFEGUARD: Aggressively filter successfully synced events out of local offline queue the millisecond Promise resolves
      const syncedIds = new Set(payload.map(p => String(p.id)));
      const latestQueue = getOfflineQueue();
      const remainingQueue = latestQueue.filter(item => {
        if (!item || !item.id) return false;
        return !syncedIds.has(String(item.id));
      });

      if (remainingQueue.length === 0) {
        clearOfflineQueue();
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
      }

      const syncedCount = payload.length;
      if (onSyncSuccess) {
        onSyncSuccess(syncedCount);
      }
      
      return { syncedCount, data };
    } else {
      console.error('Supabase batch sync error:', error);
      return { syncedCount: 0, error: error.message || JSON.stringify(error) };
    }
  } catch (err) {
    console.error('Unexpected error during offline queue sync:', err);
    return { syncedCount: 0, error: err.message || 'Connection error' };
  } finally {
    isSyncInProgress = false;
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

export function removeFromOfflineQueue(eventId, eventObj) {
  try {
    const queue = getOfflineQueue();
    if (!queue || queue.length === 0) return;

    const targetIdStr = eventId ? String(eventId) : null;
    const targetTs = eventObj?.Timestamp || eventObj?.timestamp || null;
    const targetNum = String(eventObj?.Number ?? eventObj?.number ?? '');
    const targetAction = eventObj?.Action || eventObj?.action || null;

    const filtered = queue.filter(item => {
      if (!item) return false;
      const itemIdStr = item.id ? String(item.id) : null;
      if (targetIdStr && itemIdStr && targetIdStr === itemIdStr) {
        return false;
      }
      const ts = item.Timestamp || item.timestamp;
      const num = String(item.Number ?? item.number ?? '');
      const action = item.Action || item.action;
      
      if (targetTs && targetAction && ts === targetTs && action === targetAction && num === targetNum) {
        return false;
      }
      return true;
    });

    if (filtered.length !== queue.length) {
      if (filtered.length === 0) {
        clearOfflineQueue();
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
      }
    }
  } catch (err) {
    console.error('Error removing from offline queue:', err);
  }
}

export function setupStandbyRefocusListener(onFocusOrWake) {
  let wasHidden = false;
  let lastTriggerTime = 0;

  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      wasHidden = true;
    } else if (document.visibilityState === 'visible' && wasHidden) {
      wasHidden = false;
      const now = Date.now();
      if (now - lastTriggerTime > 3000) {
        lastTriggerTime = now;
        console.log('App returned from standby / tab refocus! Triggering sync & re-fetch...');
        if (onFocusOrWake) onFocusOrWake();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
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
