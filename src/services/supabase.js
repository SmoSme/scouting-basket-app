import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches all scouting_log events strictly by match_id (UUID foreign key).
 */
export async function getMatchEvents(matchId) {
  if (!matchId) return [];
  const { data, error } = await supabase
    .from('scouting_log')
    .select('*')
    .eq('match_id', matchId)
    .order('id', { ascending: true });

  if (error) {
    console.error('[Supabase] getMatchEvents error for matchId:', matchId, error);
    return [];
  }
  return data || [];
}

export const fetchMatchEvents = getMatchEvents;
