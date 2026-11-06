/**
 * Utility functions to manage Manual Score Override (for official table synchronization)
 * Centralized in Supabase via matchMetadataService
 */
import { saveMatchMetadataToSupabase } from '../services/matchMetadataService.js';

export function getScoreOverride(matchName) {
  // Maintained for backward compatibility if called synchronously, but primary metadata
  // is now parsed directly from Supabase scouting_log records.
  return null;
}

export async function saveScoreOverride(matchName, overrideTeamScore, overrideOppScore) {
  if (!matchName) return;
  const hasTeam = overrideTeamScore !== null && overrideTeamScore !== undefined && overrideTeamScore !== '';
  const hasOpp = overrideOppScore !== null && overrideOppScore !== undefined && overrideOppScore !== '';

  return await saveMatchMetadataToSupabase(matchName, {
    overrideTeamScore: hasTeam ? Number(overrideTeamScore) : null,
    overrideOppScore: hasOpp ? Number(overrideOppScore) : null
  });
}

export async function clearScoreOverride(matchName) {
  if (!matchName) return;
  return await saveMatchMetadataToSupabase(matchName, {
    overrideTeamScore: null,
    overrideOppScore: null
  });
}
