import { supabase } from './supabase.js';

/**
 * Service for centralizing Match Management & Metadata (scouting_matches & scouting_log)
 * Single Source of Truth in Supabase.
 */

const CACHE_INVALIDATION_EVENT = 'bba:match-cache-invalidated';

/**
 * Explicitly invalidates client match cache, notifying all mounted components to re-fetch
 */
export function invalidateMatchCache(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CACHE_INVALIDATION_EVENT, { detail }));
  }
}

/**
 * Subscribes to match cache invalidation events (e.g. on metadata, date, or score update)
 */
export function subscribeToMatchCache(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {};
  }
  const handler = (e) => callback(e.detail);
  window.addEventListener(CACHE_INVALIDATION_EVENT, handler);
  return () => window.removeEventListener(CACHE_INVALIDATION_EVENT, handler);
}

/**
 * Parses opponent name and home/away status from standard match naming (e.g., "BBA vs Solofra")
 */
export function parseMatchNameComponents(matchName) {
  if (!matchName) return { opponent: 'Avversario', isHome: true };
  const str = String(matchName).trim();
  if (/^bba\s*(vs|-)\s*/i.test(str)) {
    return {
      opponent: str.replace(/^bba\s*(vs|-)\s*/i, '').trim() || 'Avversario',
      isHome: true
    };
  }
  if (/\s*(vs|-)\s*bba$/i.test(str)) {
    return {
      opponent: str.replace(/\s*(vs|-)\s*bba$/i, '').trim() || 'Avversario',
      isHome: false
    };
  }
  return { opponent: str, isHome: true };
}

/**
 * Formats any incoming date representation into YYYY-MM-DD for HTML5 date inputs
 */
export function formatDateForInput(dateStr) {
  if (!dateStr || dateStr === 'n.a.') return '';
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD/MM/YYYY or DD-MM-YYYY
  const itMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (itMatch) {
    const day = itMatch[1].padStart(2, '0');
    const month = itMatch[2].padStart(2, '0');
    const year = itMatch[3];
    return `${year}-${month}-${day}`;
  }

  // ISO string or standard parseable Date
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {}

  return '';
}

/**
 * Fetches all normalized match records directly from the `scouting_matches` table.
 * Returns null if table does not yet exist to trigger graceful fallback.
 */
export async function fetchScoutingMatches() {
  try {
    const { data, error } = await supabase
      .from('scouting_matches')
      .select('*')
      .order('match_date', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn('[Supabase] scouting_matches query failed, using legacy fallback:', e);
  }
  return null;
}

/**
 * Fetches all scouting_log events strictly by match_id (UUID relational foreign key).
 * Completely eliminates legacy string-matching on Match_Name or dates.
 */
export async function getMatchEvents(matchId) {
  if (!matchId) return [];

  try {
    const { data, error } = await supabase
      .from('scouting_log')
      .select('*')
      .eq('match_id', matchId)
      .order('id', { ascending: true });

    if (error) {
      console.error('[Supabase] getMatchEvents query error for matchId:', matchId, error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[Supabase] getMatchEvents exception for matchId:', matchId, err);
    return [];
  }
}

export const fetchMatchEvents = getMatchEvents;

/**
 * Executes direct UPDATE on the normalized `scouting_matches` table.
 * Upon success, broadcasts cache invalidation so BBA Hub updates immediately.
 */
export async function updateScoutingMatchInSupabase(idOrName, updates = {}) {
  if (!idOrName) return null;

  const payload = {};
  if (updates.match_date !== undefined || updates.matchDate !== undefined) {
    payload.match_date = formatDateForInput(updates.match_date || updates.matchDate);
  }
  if (updates.match_type !== undefined || updates.matchType !== undefined) {
    const rawType = updates.match_type || updates.matchType;
    payload.match_type = rawType === 'Friendly' ? 'Friendly' : 'Official';
  }
  if (updates.opponent_name !== undefined) payload.opponent_name = updates.opponent_name;
  if (updates.home_score !== undefined) payload.home_score = updates.home_score;
  if (updates.away_score !== undefined) payload.away_score = updates.away_score;
  if (updates.is_home !== undefined) payload.is_home = updates.is_home;
  payload.updated_at = new Date().toISOString();

  let updatedMatch = null;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(idOrName));
    let query = supabase.from('scouting_matches').update(payload);
    if (isUuid) {
      query = query.eq('id', idOrName);
    } else {
      query = query.eq('match_name', idOrName);
    }
    const { data, error } = await query.select();
    if (!error && data && data.length > 0) {
      updatedMatch = data[0];
    }
  } catch (err) {
    console.warn('[Supabase] Could not update scouting_matches directly:', err);
  }

  // Also mirror to legacy scouting_log CONFIG row to guarantee backward compatibility
  try {
    const matchName = updatedMatch?.match_name || (typeof idOrName === 'string' ? idOrName : '');
    if (matchName) {
      await saveLegacyMatchMetadata(matchName, updates);
    }
  } catch (e) {}

  // Explicitly notify all client caches
  invalidateMatchCache({ idOrName, updates, updatedMatch });

  return updatedMatch || updates;
}

/**
 * Parses match metadata from a list of scouting_log items
 * Returns an object map keyed by Match_Name.
 * Ensures the latest record (highest id or newest timestamp) always wins.
 */
export function extractMatchMetadataMap(scoutingLogs = []) {
  const metaMap = {};

  (scoutingLogs || []).forEach(row => {
    const matchName = row.Match_Name || row.match_name || row.nome_partita;
    if (!matchName) return;

    if (row.Action === 'MATCH_METADATA' || row.Player === 'METADATA') {
      try {
        const parsed = JSON.parse(row.Zone || '{}');
        const rowTime = new Date(row.created_at || row.Timestamp || 0).getTime();
        const rowId = Number(row.id) || 0;
        const existing = metaMap[matchName];

        // Never let an older row overwrite a newer entry
        if (existing) {
          if (existing._rowId && rowId && rowId < existing._rowId) return;
          if (existing._timestamp && rowTime && rowTime < existing._timestamp) return;
        }

        const rawDate = parsed.matchDate || (row.created_at ? row.created_at.split('T')[0] : null);
        const normalizedDate = formatDateForInput(rawDate);

        metaMap[matchName] = {
          matchId: row.match_id || parsed.matchId || null,
          matchDate: normalizedDate || rawDate,
          matchType: parsed.matchType === 'Friendly' ? 'Friendly' : 'Official',
          overrideTeamScore: parsed.overrideTeamScore ?? null,
          overrideOppScore: parsed.overrideOppScore ?? null,
          updatedAt: row.created_at || row.Timestamp,
          _rowId: rowId,
          _timestamp: rowTime
        };
      } catch (e) {}
    }
  });

  return metaMap;
}

/**
 * Helper to update legacy CONFIG row in scouting_log
 */
async function saveLegacyMatchMetadata(matchName, partialMetadata = {}) {
  if (!matchName) return null;

  try {
    let existingRows = null;
    const { data: d1 } = await supabase
      .from('scouting_log')
      .select('id, Zone, created_at, match_id')
      .eq('Match_Name', matchName)
      .eq('Action', 'MATCH_METADATA');

    if (d1 && d1.length > 0) {
      existingRows = d1;
    } else {
      const { data: d2 } = await supabase
        .from('scouting_log')
        .select('id, Zone, created_at, match_id')
        .eq('nome_partita', matchName)
        .eq('Action', 'MATCH_METADATA');
      if (d2 && d2.length > 0) existingRows = d2;
    }

    let currentMeta = {
      matchDate: null,
      matchType: 'Official',
      overrideTeamScore: null,
      overrideOppScore: null
    };

    let primaryId = null;
    if (existingRows && existingRows.length > 0) {
      existingRows.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
      primaryId = existingRows[0].id;
      try {
        currentMeta = { ...currentMeta, ...JSON.parse(existingRows[0].Zone || '{}') };
      } catch (e) {}
    }

    if (partialMetadata.matchDate || partialMetadata.match_date) {
      partialMetadata.matchDate = formatDateForInput(partialMetadata.matchDate || partialMetadata.match_date);
    }
    if (partialMetadata.matchType || partialMetadata.match_type) {
      const t = partialMetadata.matchType || partialMetadata.match_type;
      partialMetadata.matchType = t === 'Friendly' ? 'Friendly' : 'Official';
    }

    const merged = { ...currentMeta, ...partialMetadata };

    if (primaryId) {
      await supabase
        .from('scouting_log')
        .update({
          Zone: JSON.stringify(merged),
          Timestamp: new Date().toISOString()
        })
        .eq('id', primaryId);
    } else {
      await supabase
        .from('scouting_log')
        .insert([{
          Match_Name: matchName,
          Quarter: 'CONFIG',
          Number: '0',
          Player: 'METADATA',
          Category: 'Metadata',
          Action: 'MATCH_METADATA',
          Zone: JSON.stringify(merged),
          Timestamp: new Date().toISOString()
        }]);
    }
    return merged;
  } catch (e) {
    return null;
  }
}

/**
 * Synchronizes home_score and away_score to scouting_matches.
 * Ensures the normalized table always reflects the true score.
 */
export async function syncMatchScores(matchIdOrName, homeScore = 0, awayScore = 0) {
  if (!matchIdOrName) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(matchIdOrName));
  const payload = {
    home_score: Math.max(0, Number(homeScore) || 0),
    away_score: Math.max(0, Number(awayScore) || 0),
    updated_at: new Date().toISOString()
  };

  try {
    let query = supabase.from('scouting_matches').update(payload);
    if (isUuid) {
      query = query.eq('id', matchIdOrName);
    } else {
      query = query.eq('match_name', matchIdOrName);
    }
    const { data, error } = await query.select();
    if (!error && data && data.length > 0) {
      invalidateMatchCache({ matchIdOrName, homeScore, awayScore });
      return data[0];
    }
  } catch (err) {
    console.warn('[Supabase] syncMatchScores failed:', err);
  }
  return null;
}

/**
 * Finds or creates a normalized record in scouting_matches table.
 * Returns the match object containing { id, match_name, match_date, match_type, home_score, away_score, is_home }
 * 
 * STRICT IMMUTABILITY (Phase 4.16):
 * If the match already exists in scouting_matches, NEVER update or overwrite match_date!
 * The date must only be set on INITIAL creation, or modified via an explicit edit in Archive.
 */
export async function findOrCreateScoutingMatch({
  matchName,
  matchDate,
  matchType = 'Official',
  opponentName,
  isHome = true
}) {
  if (!matchName) return null;

  try {
    // 1. Try to find existing match by match_name
    const { data: existing, error: findError } = await supabase
      .from('scouting_matches')
      .select('*')
      .eq('match_name', matchName)
      .maybeSingle();

    if (existing && existing.id) {
      // STRICT IMMUTABILITY RULE (Phase 4.16):
      // The match already exists! NEVER overwrite or mutate its match_date during event tracking.
      // Postgres retains the persistent original value chosen by the coach.
      return existing;
    }

    // 2. Insert new match record ONLY upon INITIAL creation
    const normalizedDate = formatDateForInput(matchDate) || new Date().toISOString().split('T')[0];
    const normalizedType = matchType === 'Friendly' ? 'Friendly' : 'Official';
    const { opponent, isHome: parsedIsHome } = parseMatchNameComponents(matchName);
    const finalOpponent = opponentName || opponent || 'Avversario';
    const finalIsHome = isHome !== undefined ? Boolean(isHome) : parsedIsHome;

    const newRecord = {
      match_name: matchName,
      match_date: normalizedDate,
      opponent_name: finalOpponent,
      match_type: normalizedType,
      home_score: 0,
      away_score: 0,
      is_home: finalIsHome
    };

    const { data: created, error: insertError } = await supabase
      .from('scouting_matches')
      .insert([newRecord])
      .select()
      .maybeSingle();

    if (!insertError && created) {
      invalidateMatchCache({ matchName, created });
      return created;
    }

    // If duplicate race condition, fetch again and return without modifying date
    if (insertError) {
      const { data: fallback } = await supabase
        .from('scouting_matches')
        .select('*')
        .eq('match_name', matchName)
        .maybeSingle();
      if (fallback) return fallback;
    }
  } catch (err) {
    console.warn('[Supabase] findOrCreateScoutingMatch error:', err);
  }

  return null;
}

/**
 * Persists match metadata changes (Date, Match Type, Score Overrides) to Supabase.
 * Updates the normalized scouting_matches table AND legacy fallback, then invalidates cache.
 */
export async function saveMatchMetadataToSupabase(matchName, partialMetadata = {}) {
  if (!matchName) return null;

  try {
    // 1. Try to update or upsert in the normalized scouting_matches table
    const explicitDate = partialMetadata.matchDate || partialMetadata.match_date;
    const normalizedDate = explicitDate ? formatDateForInput(explicitDate) : null;
    const normalizedType = (partialMetadata.matchType || partialMetadata.match_type) === 'Friendly' ? 'Friendly' : 'Official';
    const { opponent, isHome } = parseMatchNameComponents(matchName);

    try {
      const { data: existingMatch } = await supabase
        .from('scouting_matches')
        .select('*')
        .eq('match_name', matchName)
        .maybeSingle();

      if (existingMatch) {
        const updatePayload = {
          updated_at: new Date().toISOString()
        };
        // STRICT RULE (Phase 4.16): ONLY update match_date if explicitly passed in partialMetadata!
        if (normalizedDate) {
          updatePayload.match_date = normalizedDate;
        }
        if (partialMetadata.matchType || partialMetadata.match_type) {
          updatePayload.match_type = normalizedType;
        }
        if (Object.keys(updatePayload).length > 1) { // more than just updated_at
          await supabase
            .from('scouting_matches')
            .update(updatePayload)
            .eq('id', existingMatch.id);
        }
      } else {
        await supabase
          .from('scouting_matches')
          .insert([{
            match_name: matchName,
            match_date: normalizedDate || new Date().toISOString().split('T')[0],
            opponent_name: opponent,
            match_type: normalizedType,
            home_score: 0,
            away_score: 0,
            is_home: isHome
          }]);
      }
    } catch (dbErr) {
      console.warn('[Supabase] Could not sync to scouting_matches table directly:', dbErr);
    }

    // 2. Also update legacy scouting_log CONFIG row
    const merged = await saveLegacyMatchMetadata(matchName, partialMetadata);

    // 3. Invalidate client cache across the entire app
    invalidateMatchCache({ matchName, partialMetadata });

    return merged || partialMetadata;
  } catch (err) {
    console.error('[Supabase Match Metadata] Failed to update:', err);
    throw err;
  }
}
