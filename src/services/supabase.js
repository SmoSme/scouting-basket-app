import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches all rows from scouting_log using PostgREST range pagination
 * so datasets > 1,000 rows are never silently truncated.
 */
export async function fetchAllScoutingLogs(selectCols = '*', orderCol = 'id', ascending = false, matchId = null) {
  const pageSize = 1000;
  let offset = 0;
  let allRows = [];

  while (true) {
    let query = supabase
      .from('scouting_log')
      .select(selectCols)
      .order(orderCol, { ascending })
      .range(offset, offset + pageSize - 1);

    if (matchId) {
      query = query.eq('match_id', matchId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase] fetchAllScoutingLogs error:', error);
      return allRows;
    }

    const batch = Array.isArray(data) ? data : [];
    allRows = allRows.concat(batch);

    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return allRows;
}

/**
 * Fetches all scouting_log events strictly by match_id (UUID foreign key).
 */
export async function getMatchEvents(matchId) {
  if (!matchId) return [];
  return fetchAllScoutingLogs('*', 'id', true, matchId);
}

export const fetchMatchEvents = getMatchEvents;
