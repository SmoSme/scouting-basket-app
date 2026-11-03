import { calculateMatchAnalytics } from './basketballAnalytics.js';
import { getScoreOverride } from './scoreOverride.js';

/**
 * Retrieve saved match type from localStorage or default to 'Official'
 */
export function getStoredMatchType(matchName) {
  if (!matchName) return 'Official';
  try {
    return localStorage.getItem(`match_type_${matchName}`) || 'Official';
  } catch (e) {
    return 'Official';
  }
}

/**
 * Retrieve saved match date from localStorage or fallback
 */
export function getStoredMatchDate(matchName, fallbackCreatedAt) {
  if (matchName) {
    try {
      const saved = localStorage.getItem(`match_date_${matchName}`);
      if (saved) return saved;
    } catch (e) {}
  }
  if (fallbackCreatedAt) {
    try {
      const d = new Date(fallbackCreatedAt);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (e) {}
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Multi-Match Aggregation Engine
 * Aggregates statistics across an array of historical matches and formats data for Recharts timelines.
 * 
 * @param {Array} rawMatches - Array of match objects { name, events, matchType?, matchDate?, createdAt? }
 * @param {Object} filter - Filter options { matchType: 'ALL'|'OFFICIAL'|'FRIENDLY'|'SCRIMMAGE', split: 'ALL'|'LAST_5'|'LAST_10' }
 * @returns {Object} Aggregated totals, averages, shooting splits, rebounding percentages, and chronological timeline.
 */
export function aggregateSeasonStats(rawMatches = [], filter = {}) {
  const matchTypeFilter = (filter.matchType || 'ALL').toUpperCase();
  const splitFilter = (filter.split || 'ALL').toUpperCase();

  if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
    return getEmptyAggregateResult();
  }

  // 1. Process and normalize each match with analytics
  const processedMatches = rawMatches.map(m => {
    const name = m.name || m.Match_Name || m.match_name || 'Unnamed Match';
    const matchType = m.matchType || getStoredMatchType(name);
    const matchDate = m.matchDate || getStoredMatchDate(name, m.createdAt);
    const events = Array.isArray(m.events) ? m.events : [];
    const analytics = m.analytics || calculateMatchAnalytics(events);

    return {
      name,
      matchType,
      matchDate,
      createdAt: m.createdAt || matchDate,
      events,
      analytics
    };
  });

  // 2. Sort chronologically (oldest to newest for trend curves)
  const sortedMatches = [...processedMatches].sort((a, b) => {
    const dateComp = (a.matchDate || '').localeCompare(b.matchDate || '');
    if (dateComp !== 0) return dateComp;
    const createdComp = (a.createdAt || '').localeCompare(b.createdAt || '');
    if (createdComp !== 0) return createdComp;
    return a.name.localeCompare(b.name);
  });

  // 3. Filter by Match Type
  let filtered = sortedMatches;
  if (matchTypeFilter !== 'ALL') {
    filtered = filtered.filter(m => String(m.matchType).toUpperCase() === matchTypeFilter);
  }

  // Count available by type for UI badges
  const typeCounts = {
    ALL: sortedMatches.length,
    OFFICIAL: sortedMatches.filter(m => String(m.matchType).toUpperCase() === 'OFFICIAL').length,
    FRIENDLY: sortedMatches.filter(m => String(m.matchType).toUpperCase() === 'FRIENDLY').length,
    SCRIMMAGE: sortedMatches.filter(m => String(m.matchType).toUpperCase() === 'SCRIMMAGE').length
  };

  // 4. Filter by Split (Last 5, Last 10, or All)
  if (splitFilter === 'LAST_5') {
    filtered = filtered.slice(-5);
  } else if (splitFilter === 'LAST_10') {
    filtered = filtered.slice(-10);
  }

  const gamesPlayed = filtered.length;
  if (gamesPlayed === 0) {
    const empty = getEmptyAggregateResult();
    empty.typeCounts = typeCounts;
    return empty;
  }

  // 5. Accumulate raw season totals
  let wins = 0;
  let losses = 0;
  let ties = 0;

  let totalPts = 0;
  let totalOppPts = 0;
  let totalDiff = 0;

  let totalFgm = 0;
  let totalFga = 0;
  let total2pm = 0;
  let total2pa = 0;
  let total3pm = 0;
  let total3pa = 0;
  let totalFtm = 0;
  let totalFta = 0;

  let totalDreb = 0;
  let totalOreb = 0;
  let totalOppOreb = 0;

  let totalAst = 0;
  let totalTov = 0;
  let totalStl = 0;
  let totalBlk = 0;
  let totalPf = 0;
  let totalFd = 0;
  let totalPir = 0;

  let totalOppFgm = 0;
  let totalOppFga = 0;
  let totalOpp3pm = 0;

  // Timeline array for Recharts
  const timeline = filtered.map((m, idx) => {
    const t = m.analytics.teamOverview;
    const reb = m.analytics.reboundingAnalysis;
    const opp = m.analytics.opponentShooting;

    // Check for manual score override (official table sync)
    const override = getScoreOverride(m.name);
    const pts = override?.overrideTeamScore !== null && override?.overrideTeamScore !== undefined 
      ? override.overrideTeamScore 
      : (t.pts || 0);
    const oppPts = override?.overrideOppScore !== null && override?.overrideOppScore !== undefined 
      ? override.overrideOppScore 
      : (t.opponentScore || 0);
    const diff = pts - oppPts;
    const isWin = diff > 0;
    const isLoss = diff < 0;

    if (isWin) wins++;
    else if (isLoss) losses++;
    else ties++;

    totalPts += pts;
    totalOppPts += oppPts;
    totalDiff += diff;

    totalFgm += (t.fgm || 0);
    totalFga += (t.fga || 0);
    total2pm += (t.fg2m || 0);
    total2pa += (t.fg2a || 0);
    total3pm += (t.fg3m || 0);
    total3pa += (t.fg3a || 0);
    totalFtm += (t.ftm || 0);
    totalFta += (t.fta || 0);

    totalDreb += (t.dreb || 0);
    totalOreb += (t.oreb || 0);
    totalOppOreb += (reb?.oppOffReb || 0);

    totalAst += (t.ast || 0);
    totalTov += (t.tov || 0);
    totalStl += (t.stl || 0);
    totalBlk += (t.blk || 0);
    totalPf += (t.pf || 0);
    totalFd += (t.fd || 0);
    totalPir += (t.pir || 0);

    totalOppFgm += (opp?.oppFgm || 0);
    totalOppFga += (opp?.oppFga || 0);
    totalOpp3pm += (opp?.opp3pm || 0);

    // Opponent name extraction: e.g. "BBA vs Virtus" -> "Virtus"
    let opponentName = m.name;
    if (m.name.includes(' vs ')) {
      opponentName = m.name.split(' vs ')[1].trim();
    } else if (m.name.includes(' VS ')) {
      opponentName = m.name.split(' VS ')[1].trim();
    }

    return {
      matchId: m.name,
      matchName: m.name,
      opponent: opponentName,
      gameIndex: idx + 1,
      gameLabel: `G${idx + 1}`,
      chartLabel: `G${idx + 1}: ${opponentName.length > 12 ? opponentName.slice(0, 10) + '..' : opponentName}`,
      date: m.matchDate,
      matchType: m.matchType,
      pts,
      oppPts,
      diff,
      isWin,
      isScoreOverridden: override !== null,
      resultText: isWin ? 'W' : (isLoss ? 'L' : 'T'),
      efgPct: typeof t.efgPct === 'number' ? Math.round(t.efgPct * 10) / 10 : 0,
      fg3Pct: typeof t.pct3p === 'number' ? Math.round(t.pct3p * 10) / 10 : 0,
      fg2Pct: typeof t.pct2p === 'number' ? Math.round(t.pct2p * 10) / 10 : 0,
      ftPct: typeof t.pctFt === 'number' ? Math.round(t.pctFt * 10) / 10 : 0,
      ast: t.ast || 0,
      tov: t.tov || 0,
      astTovRatio: typeof t.astTovRatio === 'number' ? Math.round(t.astTovRatio * 100) / 100 : 0,
      drbPct: reb?.drbPct !== null && reb?.drbPct !== undefined ? Math.round(reb.drbPct * 10) / 10 : null,
      oreb: t.oreb || 0,
      dreb: t.dreb || 0,
      rebTotal: (t.dreb || 0) + (t.oreb || 0),
      oppOffReb: reb?.oppOffReb || 0,
      stl: t.stl || 0,
      blk: t.blk || 0,
      pir: t.pir || 0,
      rawMatch: m
    };
  });

  // 6. Cumulative percentages and per-game averages
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 10 : 0;
  const avgPts = gamesPlayed > 0 ? Math.round((totalPts / gamesPlayed) * 10) / 10 : 0;
  const avgOppPts = gamesPlayed > 0 ? Math.round((totalOppPts / gamesPlayed) * 10) / 10 : 0;
  const avgDiff = gamesPlayed > 0 ? Math.round((totalDiff / gamesPlayed) * 10) / 10 : 0;

  const totalReb = totalDreb + totalOreb;
  const avgReb = gamesPlayed > 0 ? Math.round((totalReb / gamesPlayed) * 10) / 10 : 0;
  const avgDreb = gamesPlayed > 0 ? Math.round((totalDreb / gamesPlayed) * 10) / 10 : 0;
  const avgOreb = gamesPlayed > 0 ? Math.round((totalOreb / gamesPlayed) * 10) / 10 : 0;

  const fgPct = totalFga > 0 ? Math.round((totalFgm / totalFga) * 1000) / 10 : 0;
  const fg2Pct = total2pa > 0 ? Math.round((total2pm / total2pa) * 1000) / 10 : 0;
  const fg3Pct = total3pa > 0 ? Math.round((total3pm / total3pa) * 1000) / 10 : 0;
  const efgPct = totalFga > 0 ? Math.round(((totalFgm + 0.5 * total3pm) / totalFga) * 1000) / 10 : 0;
  const ftPct = totalFta > 0 ? Math.round((totalFtm / totalFta) * 1000) / 10 : 0;

  const drbOpportunities = totalDreb + totalOppOreb;
  const drbPct = drbOpportunities > 0 ? Math.round((totalDreb / drbOpportunities) * 1000) / 10 : null;
  const orebShare = totalReb > 0 ? Math.round((totalOreb / totalReb) * 1000) / 10 : 0;

  const avgAst = gamesPlayed > 0 ? Math.round((totalAst / gamesPlayed) * 10) / 10 : 0;
  const avgTov = gamesPlayed > 0 ? Math.round((totalTov / gamesPlayed) * 10) / 10 : 0;
  const astTovRatio = totalTov > 0 ? Math.round((totalAst / totalTov) * 100) / 100 : (totalAst > 0 ? totalAst : 0);
  const avgStl = gamesPlayed > 0 ? Math.round((totalStl / gamesPlayed) * 10) / 10 : 0;
  const avgBlk = gamesPlayed > 0 ? Math.round((totalBlk / gamesPlayed) * 10) / 10 : 0;
  const avgPf = gamesPlayed > 0 ? Math.round((totalPf / gamesPlayed) * 10) / 10 : 0;
  const avgPir = gamesPlayed > 0 ? Math.round((totalPir / gamesPlayed) * 10) / 10 : 0;

  const oppEfgPct = totalOppFga > 0 ? Math.round(((totalOppFgm + 0.5 * totalOpp3pm) / totalOppFga) * 1000) / 10 : 0;

  return {
    gamesPlayed,
    record: {
      wins,
      losses,
      ties,
      winRate
    },
    scoring: {
      totalPts,
      avgPts,
      totalOppPts,
      avgOppPts,
      totalDiff,
      avgDiff
    },
    shooting: {
      totalFgm,
      totalFga,
      fgPct,
      total2pm,
      total2pa,
      fg2Pct,
      total3pm,
      total3pa,
      fg3Pct,
      totalFtm,
      totalFta,
      ftPct,
      efgPct
    },
    rebounding: {
      totalDreb,
      totalOreb,
      totalReb,
      totalOppOreb,
      avgReb,
      avgDreb,
      avgOreb,
      drbPct,
      orebShare
    },
    ballControl: {
      totalAst,
      avgAst,
      totalTov,
      avgTov,
      astTovRatio,
      totalStl,
      avgStl,
      totalBlk,
      avgBlk,
      totalPf,
      avgPf,
      totalPir,
      avgPir
    },
    opponent: {
      totalOppFgm,
      totalOppFga,
      oppEfgPct
    },
    typeCounts,
    timeline,
    matches: filtered
  };
}

/**
 * Returns an empty aggregate structure with all fields safely set to 0/empty
 */
function getEmptyAggregateResult() {
  return {
    gamesPlayed: 0,
    record: { wins: 0, losses: 0, ties: 0, winRate: 0 },
    scoring: { totalPts: 0, avgPts: 0, totalOppPts: 0, avgOppPts: 0, totalDiff: 0, avgDiff: 0 },
    shooting: { totalFgm: 0, totalFga: 0, fgPct: 0, total2pm: 0, total2pa: 0, fg2Pct: 0, total3pm: 0, total3pa: 0, fg3Pct: 0, totalFtm: 0, totalFta: 0, ftPct: 0, efgPct: 0 },
    rebounding: { totalDreb: 0, totalOreb: 0, totalReb: 0, totalOppOreb: 0, avgReb: 0, avgDreb: 0, avgOreb: 0, drbPct: null, orebShare: 0 },
    ballControl: { totalAst: 0, avgAst: 0, totalTov: 0, avgTov: 0, astTovRatio: 0, totalStl: 0, avgStl: 0, totalBlk: 0, avgBlk: 0, totalPf: 0, avgPf: 0, totalPir: 0, avgPir: 0 },
    opponent: { totalOppFgm: 0, totalOppFga: 0, oppEfgPct: 0 },
    typeCounts: { ALL: 0, OFFICIAL: 0, FRIENDLY: 0, SCRIMMAGE: 0 },
    timeline: [],
    matches: []
  };
}
