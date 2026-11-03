/**
 * Utility functions to manage Manual Score Override (for official table synchronization)
 */

export function getScoreOverride(matchName) {
  if (!matchName) return null;
  try {
    const saved = localStorage.getItem(`score_override_${matchName}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const teamScore = parsed.overrideTeamScore !== null && parsed.overrideTeamScore !== undefined && parsed.overrideTeamScore !== '' 
          ? Number(parsed.overrideTeamScore) 
          : null;
        const oppScore = parsed.overrideOppScore !== null && parsed.overrideOppScore !== undefined && parsed.overrideOppScore !== '' 
          ? Number(parsed.overrideOppScore) 
          : null;

        if (teamScore !== null || oppScore !== null) {
          return {
            overrideTeamScore: teamScore,
            overrideOppScore: oppScore
          };
        }
      }
    }
  } catch (e) {
    console.warn('Error reading score override:', e);
  }
  return null;
}

export function saveScoreOverride(matchName, overrideTeamScore, overrideOppScore) {
  if (!matchName) return;
  try {
    const hasTeam = overrideTeamScore !== null && overrideTeamScore !== undefined && overrideTeamScore !== '';
    const hasOpp = overrideOppScore !== null && overrideOppScore !== undefined && overrideOppScore !== '';

    if (!hasTeam && !hasOpp) {
      localStorage.removeItem(`score_override_${matchName}`);
    } else {
      localStorage.setItem(`score_override_${matchName}`, JSON.stringify({
        overrideTeamScore: hasTeam ? Number(overrideTeamScore) : null,
        overrideOppScore: hasOpp ? Number(overrideOppScore) : null
      }));
    }
  } catch (e) {
    console.warn('Error saving score override:', e);
  }
}

export function clearScoreOverride(matchName) {
  if (!matchName) return;
  try {
    localStorage.removeItem(`score_override_${matchName}`);
  } catch (e) {
    console.warn('Error clearing score override:', e);
  }
}
