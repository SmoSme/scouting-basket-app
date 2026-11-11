/**
 * src/utils/hybridDataService.js
 * 
 * BBA Hybrid Analytics Engine
 * Unifies 100% reliable FIP Official Data with Supabase Advanced Scouting Data.
 * 
 * Hierarchy of Truth (Bottom-Up Match-by-Match):
 * - Scouting (Supabase) is King for every match where scouting exists.
 * - FIP Official Data is used as fallback for Official matches without scouting (FIP ONLY),
 *   and for FIP-exclusive metrics (Minutes Played, Starting %).
 */

import { DEFAULT_MASTER_ROSTER } from '../data/roster.js';
import { calculateMatchAnalytics, calculatePlusMinus } from './basketballAnalytics.js';

export const BBA_TEAM_ID = '211634';

/**
 * Normalizes match type filter string (handles Italian and English variations)
 */
export function normalizeFilterType(filter) {
  if (!filter) return 'ALL';
  const clean = String(filter).trim().toUpperCase();
  if (clean === 'ALL' || clean === 'TUTTE' || clean === 'TUTTE LE PARTITE') return 'ALL';
  if (clean === 'FRIENDLY' || clean === 'AMICHEVOLI' || clean === 'AMICHEVOLE') return 'FRIENDLY';
  if (clean === 'OFFICIAL' || clean === 'UFFICIALI' || clean === 'UFFICIALE') return 'OFFICIAL';
  return clean;
}

/**
 * Checks whether an item matchType satisfies the current filter
 */
export function matchesFilterType(itemType, filter) {
  const normFilter = normalizeFilterType(filter);
  if (normFilter === 'ALL') return true;
  const normItem = normalizeFilterType(itemType);
  return normItem === normFilter;
}

/**
 * Normalizes raw FIP quarter partials [{ homeScore, awayScore, period }]
 * into standard [{ period, quarter, scored, conceded, diff, pts, oppPts, homeScore, awayScore }]
 * taking into account whether BBA is the home or away team.
 */
export function normalizeFipPartials(partialsList = [], isHome = true) {
  if (!Array.isArray(partialsList)) return [];
  return partialsList.map((p, idx) => {
    const periodNum = p.period || (idx + 1);
    const scored = (p.scored !== undefined)
      ? Number(p.scored)
      : (p.pts !== undefined
        ? Number(p.pts)
        : (isHome ? Number(p.homeScore ?? 0) : Number(p.awayScore ?? 0)));
    const conceded = (p.conceded !== undefined)
      ? Number(p.conceded)
      : (p.oppPts !== undefined
        ? Number(p.oppPts)
        : (isHome ? Number(p.awayScore ?? 0) : Number(p.homeScore ?? 0)));
    return {
      period: periodNum,
      quarter: `Q${periodNum}`,
      scored,
      conceded,
      diff: scored - conceded,
      pts: scored,
      oppPts: conceded,
      homeScore: p.homeScore !== undefined ? p.homeScore : (isHome ? scored : conceded),
      awayScore: p.awayScore !== undefined ? p.awayScore : (isHome ? conceded : scored)
    };
  });
}

/**
 * Calculates standard deviation (sigma) of a numeric array
 */
export function calculateStandardDeviation(numbers = []) {
  if (!numbers || numbers.length === 0) return 0;
  const mean = numbers.reduce((acc, v) => acc + v, 0) / numbers.length;
  const variance = numbers.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / numbers.length;
  return Number(Math.sqrt(variance).toFixed(1));
}

/**
 * Returns predictability badge and label based on standard deviation sigma
 */
export function getVolatilityBadge(sigma = 0, lang = 'it') {
  if (sigma < 7) {
    return {
      label: lang === 'it' ? 'Offensiva Costante' : 'Reliable Scoring',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      description: lang === 'it' ? 'Rendimento offensivo molto stabile e prevedibile' : 'Very consistent offensive output',
      tier: 'steady'
    };
  } else if (sigma <= 12) {
    return {
      label: lang === 'it' ? 'Offensiva Altalenante' : 'Fluctuating Scoring',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
      description: lang === 'it' ? 'Variazioni moderate nel flusso punti partita per partita' : 'Moderate game-to-game scoring variations',
      tier: 'fluctuating'
    };
  } else {
    return {
      label: lang === 'it' ? 'Offensiva Imprevedibile' : 'Streaky / Unpredictable',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
      description: lang === 'it' ? 'Forte varianza nel punteggio, elevata imprevedibilità' : 'High scoring variance, heavily streaky',
      tier: 'unpredictable'
    };
  }
}

/**
 * Computes First Half vs Second Half (Tenuta Fisica) derived metrics.
 * Supports either an array of active matches (for dynamic filtering) or legacy fipTrends object.
 */
export function calculatePhysicalStamina(target = null) {
  if (!target) {
    return {
      h1ScoredAvg: 0,
      h1ConcededAvg: 0,
      h1Diff: 0,
      h2ScoredAvg: 0,
      h2ConcededAvg: 0,
      h2Diff: 0,
      netSwing: 0,
      staminaSummaryIt: 'Nessun dato sufficiente sui quarti',
      staminaSummaryEn: 'Insufficient quarter data'
    };
  }

  if (Array.isArray(target)) {
    if (target.length === 0) {
      return {
        h1ScoredAvg: 0,
        h1ConcededAvg: 0,
        h1Diff: 0,
        h2ScoredAvg: 0,
        h2ConcededAvg: 0,
        h2Diff: 0,
        netSwing: 0,
        staminaSummaryIt: 'Nessuna partita per il filtro selezionato',
        staminaSummaryEn: 'No matches for the selected filter'
      };
    }

    let qCount = 0;
    let q1S = 0, q2S = 0, q3S = 0, q4S = 0;
    let q1C = 0, q2C = 0, q3C = 0, q4C = 0;

    target.forEach(m => {
      const isHome = Boolean(m.isHomeGame ?? (m.location === 'Casa'));
      if (Array.isArray(m.partials) && m.partials.length >= 4) {
        qCount++;
        const getScored = p => p?.scored !== undefined ? Number(p.scored) : (p?.pts !== undefined ? Number(p.pts) : (isHome ? Number(p?.homeScore ?? 0) : Number(p?.awayScore ?? 0)));
        const getConceded = p => p?.conceded !== undefined ? Number(p.conceded) : (p?.oppPts !== undefined ? Number(p.oppPts) : (isHome ? Number(p?.awayScore ?? 0) : Number(p?.homeScore ?? 0)));

        q1S += getScored(m.partials[0]);
        q1C += getConceded(m.partials[0]);
        q2S += getScored(m.partials[1]);
        q2C += getConceded(m.partials[1]);
        q3S += getScored(m.partials[2]);
        q3C += getConceded(m.partials[2]);
        q4S += getScored(m.partials[3]);
        q4C += getConceded(m.partials[3]);
      } else if (Array.isArray(m.analytics?.quarters) && m.analytics.quarters.length >= 4) {
        qCount++;
        const qs = m.analytics.quarters;
        q1S += Number(qs[0]?.pts ?? 0);
        q1C += Number(qs[0]?.oppPts ?? 0);
        q2S += Number(qs[1]?.pts ?? 0);
        q2C += Number(qs[1]?.oppPts ?? 0);
        q3S += Number(qs[2]?.pts ?? 0);
        q3C += Number(qs[2]?.oppPts ?? 0);
        q4S += Number(qs[3]?.pts ?? 0);
        q4C += Number(qs[3]?.oppPts ?? 0);
      }
    });

    if (qCount === 0) {
      return {
        h1ScoredAvg: 0,
        h1ConcededAvg: 0,
        h1Diff: 0,
        h2ScoredAvg: 0,
        h2ConcededAvg: 0,
        h2Diff: 0,
        netSwing: 0,
        staminaSummaryIt: 'Dati parziali per quarto non disponibili',
        staminaSummaryEn: 'Quarter breakdown not available'
      };
    }

    const h1ScoredAvg = Number(((q1S + q2S) / qCount).toFixed(1));
    const h1ConcededAvg = Number(((q1C + q2C) / qCount).toFixed(1));
    const h1Diff = Number((h1ScoredAvg - h1ConcededAvg).toFixed(1));

    const h2ScoredAvg = Number(((q3S + q4S) / qCount).toFixed(1));
    const h2ConcededAvg = Number(((q3C + q4C) / qCount).toFixed(1));
    const h2Diff = Number((h2ScoredAvg - h2ConcededAvg).toFixed(1));

    const netSwing = Number((h2Diff - h1Diff).toFixed(1));

    let staminaSummaryIt = 'Rendimento bilanciato tra i due tempi';
    let staminaSummaryEn = 'Balanced performance across halves';

    if (netSwing >= 5) {
      staminaSummaryIt = 'Squadra dominante nel 2° tempo (ottima tenuta fisica e mentale)';
      staminaSummaryEn = 'Dominant second-half team (strong physical and mental endurance)';
    } else if (netSwing <= -5) {
      staminaSummaryIt = 'Squadra da 1° tempo (calo fisico/mentale sensibile nella ripresa)';
      staminaSummaryEn = 'First-half team (significant drop in energy/focus in 2nd half)';
    }

    return {
      h1ScoredAvg,
      h1ConcededAvg,
      h1Diff,
      h2ScoredAvg,
      h2ConcededAvg,
      h2Diff,
      netSwing,
      staminaSummaryIt,
      staminaSummaryEn
    };
  }

  const q = target.quarters;
  if (!q) {
    return {
      h1ScoredAvg: 0,
      h1ConcededAvg: 0,
      h1Diff: 0,
      h2ScoredAvg: 0,
      h2ConcededAvg: 0,
      h2Diff: 0,
      netSwing: 0,
      staminaSummaryIt: 'Nessun dato sufficiente sui quarti',
      staminaSummaryEn: 'Insufficient quarter data'
    };
  }

  const games = target.global?.games || 1;

  const q1Scored = q.Q1?.scored || 0;
  const q2Scored = q.Q2?.scored || 0;
  const q3Scored = q.Q3?.scored || 0;
  const q4Scored = q.Q4?.scored || 0;

  const q1Conceded = q.Q1?.conceded || 0;
  const q2Conceded = q.Q2?.conceded || 0;
  const q3Conceded = q.Q3?.conceded || 0;
  const q4Conceded = q.Q4?.conceded || 0;

  const h1ScoredAvg = Number(((q1Scored + q2Scored) / games).toFixed(1));
  const h1ConcededAvg = Number(((q1Conceded + q2Conceded) / games).toFixed(1));
  const h1Diff = Number((h1ScoredAvg - h1ConcededAvg).toFixed(1));

  const h2ScoredAvg = Number(((q3Scored + q4Scored) / games).toFixed(1));
  const h2ConcededAvg = Number(((q3Conceded + q4Conceded) / games).toFixed(1));
  const h2Diff = Number((h2ScoredAvg - h2ConcededAvg).toFixed(1));

  const netSwing = Number((h2Diff - h1Diff).toFixed(1));

  let staminaSummaryIt = 'Rendimento bilanciato tra i due tempi';
  let staminaSummaryEn = 'Balanced performance across halves';

  if (netSwing >= 5) {
    staminaSummaryIt = 'Squadra dominante nel 2° tempo (ottima tenuta fisica e mentale)';
    staminaSummaryEn = 'Dominant second-half team (strong physical and mental endurance)';
  } else if (netSwing <= -5) {
    staminaSummaryIt = 'Squadra da 1° tempo (calo fisico/mentale sensibile nella ripresa)';
    staminaSummaryEn = 'First-half team (significant drop in energy/focus in 2nd half)';
  }

  return {
    h1ScoredAvg,
    h1ConcededAvg,
    h1Diff,
    h2ScoredAvg,
    h2ConcededAvg,
    h2Diff,
    netSwing,
    staminaSummaryIt,
    staminaSummaryEn
  };
}

/**
 * Sanitizes player names to prevent duplicate last names (e.g. "Davide Valente Valente")
 */
export function formatPlayerFullName(firstName = '', lastName = '') {
  const fName = String(firstName || '').trim();
  const lName = String(lastName || '').trim();
  if (!lName) return fName;
  if (!fName) return lName;

  const lowerF = fName.toLowerCase();
  const lowerL = lName.toLowerCase();

  if (lowerF.includes(lowerL) || lowerF.endsWith(lowerL)) {
    return fName;
  }
  return `${fName} ${lName}`.trim();
}

/**
 * Formats percentages with Math.round() or returns '—' for missing/empty values
 */
export function formatPercentage(val) {
  if (val === null || val === undefined || val === '' || val === '—' || val === 'N/A') return '—';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace('%', ''));
  if (isNaN(num)) return '—';
  return `${Math.round(num)}%`;
}

/**
 * Formats per-game averages to 1 decimal place (.toFixed(1)) or returns '—' for missing values
 */
export function formatAverage(val) {
  if (val === null || val === undefined || val === '' || val === '—' || val === 'N/A') return '—';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '—';
  return num.toFixed(1);
}

/**
 * Extracts per-player aggregates, efficiency, and court shoot zones from Supabase raw scouting logs.
 * Also stores a per-match breakdown (byMatch) so overlapping FIP+Scouting games can be reconciled with 100% integer precision.
 */
export function aggregateSupabasePlayerStats(scoutingLogs = []) {
  const playerStatsMap = {};
  const safeLogs = Array.isArray(scoutingLogs) ? scoutingLogs.filter(Boolean) : [];

  const plusMinusMap = calculatePlusMinus(safeLogs);
  const logsByMatch = {};

  const matchIdByName = {};
  const matchNameById = {};
  safeLogs.forEach(row => {
    const mid = row.match_id ? String(row.match_id).trim() : null;
    const mname = (row.Match_Name || row.match_name || row.nome_partita || '').trim();
    if (mid && mname) {
      matchIdByName[mname] = mid;
      matchNameById[mid] = mname;
    }
  });

  const getCanonicalMatchId = (row) => {
    const mid = row.match_id ? String(row.match_id).trim() : null;
    const mname = (row.Match_Name || row.match_name || row.nome_partita || '').trim();
    if (mid) return mid;
    if (mname && matchIdByName[mname]) return matchIdByName[mname];
    return mname || 'unknown_match';
  };

  safeLogs.forEach(row => {
    const mId = getCanonicalMatchId(row);
    if (!logsByMatch[mId]) logsByMatch[mId] = [];
    logsByMatch[mId].push(row);
  });

  const plusMinusByMatch = {};
  for (const [mId, mLogs] of Object.entries(logsByMatch)) {
    plusMinusByMatch[mId] = calculatePlusMinus(mLogs);
  }

  const getOrCreatePlayerStat = (num, name) => {
    const cleanNum = String(num || '').trim();
    const cleanName = String(name || '').trim();
    const key = cleanNum || cleanName;
    if (!playerStatsMap[key]) {
      playerStatsMap[key] = {
        number: cleanNum,
        name: cleanName,
        matches: new Set(),
        byMatch: {},
        ast: 0,
        tov: 0,
        dreb: 0,
        oreb: 0,
        stl: 0,
        blk: 0,
        fouls: 0,
        foulsDrawn: 0,
        fg2m: 0, fg2a: 0,
        fg3m: 0, fg3a: 0,
        ftm: 0, fta: 0,
        shotZones: {
          paint: { key: 'paint', name: 'Paint / Sotto Canestro', type: '2PT', made: 0, att: 0 },
          mid: { key: 'mid', name: 'Mid-Range / Media Distanza', type: '2PT', made: 0, att: 0 },
          top3: { key: 'top3', name: 'Top 3 / Arco Frontale', type: '3PT', made: 0, att: 0 },
          wing3: { key: 'wing3', name: 'Wing 3 / Ali da 3', type: '3PT', made: 0, att: 0 },
          corner3: { key: 'corner3', name: 'Corner 3 / Angoli da 3', type: '3PT', made: 0, att: 0 },
          other: { key: 'other', name: 'Altro / Perimetro', type: 'N/A', made: 0, att: 0 }
        },
        detailedZones: {}
      };
    } else if (cleanName && !playerStatsMap[key].name) {
      playerStatsMap[key].name = cleanName;
    }
    return playerStatsMap[key];
  };

  const ensureMatchBucket = (pStat, mId) => {
    if (!pStat.byMatch[mId]) {
      pStat.byMatch[mId] = {
        fg2m: 0, fg2a: 0,
        fg3m: 0, fg3a: 0,
        ftm: 0, fta: 0,
        fouls: 0,
        pts: 0
      };
    }
    return pStat.byMatch[mId];
  };

  safeLogs.forEach(row => {
    const num = String(row.Number || '').trim();
    const name = (row.Player || '').trim();
    if (!num && !name) return;
    if (name === 'METADATA' || row.Action === 'MATCH_METADATA' || name === 'OPPONENT' || num === 'OPP') return;

    const pStat = getOrCreatePlayerStat(num, name);
    const matchIdentifier = getCanonicalMatchId(row);
    if (matchIdentifier) {
      pStat.matches.add(matchIdentifier);
    }
    const mBucket = ensureMatchBucket(pStat, matchIdentifier);

    const act = (row.Action || '').trim();
    const cat = (row.Category || '').trim();
    const rawZone = String(row.ZoneName || row.Zone || row.zona || '').trim();
    const rawZoneLower = rawZone.toLowerCase();

    if (act.includes('Assist') || cat === 'Passing') {
      pStat.ast++;
    } else if (act.includes('Turnover') || cat === 'Turnover') {
      pStat.tov++;
    } else if (act.includes('Def Rebound')) {
      pStat.dreb++;
    } else if (act.includes('Off Rebound')) {
      pStat.oreb++;
    } else if (act.includes('Steal') || (cat === 'Defense' && act === 'Steal')) {
      pStat.stl++;
    } else if (act.includes('Block') || (cat === 'Defense' && act === 'Block')) {
      pStat.blk++;
    } else if (act.includes('Personal Foul') || act === 'Foul' || act.includes('Foul Committed') || act.includes('Fallo Commesso') || act === 'Fallo' || (cat === 'Foul' && !act.includes('Drawn') && !act.includes('Subito'))) {
      pStat.fouls++;
      mBucket.fouls++;
    } else if (act.includes('Foul Drawn') || act.includes('Subito Fallo') || act.includes('Fallo Subito')) {
      pStat.foulsDrawn++;
    } else if (act === '2PT Made' || act === '2PT Fatto') {
      pStat.fg2m++;
      pStat.fg2a++;
      mBucket.fg2m++;
      mBucket.fg2a++;
      mBucket.pts += 2;
      recordZoneShot(pStat, rawZone, rawZoneLower, true, '2PT');
    } else if (act === '2PT Missed' || act === '2PT Sbagliato') {
      pStat.fg2a++;
      mBucket.fg2a++;
      recordZoneShot(pStat, rawZone, rawZoneLower, false, '2PT');
    } else if (act === '3PT Made' || act === '3PT Fatto') {
      pStat.fg3m++;
      pStat.fg3a++;
      mBucket.fg3m++;
      mBucket.fg3a++;
      mBucket.pts += 3;
      recordZoneShot(pStat, rawZone, rawZoneLower, true, '3PT');
    } else if (act === '3PT Missed' || act === '3PT Sbagliato') {
      pStat.fg3a++;
      mBucket.fg3a++;
      recordZoneShot(pStat, rawZone, rawZoneLower, false, '3PT');
    } else if (act === 'FT Made' || act === 'TL Fatto' || act === 'Tiro Libero Fatto') {
      pStat.ftm++;
      pStat.fta++;
      mBucket.ftm++;
      mBucket.fta++;
      mBucket.pts += 1;
    } else if (act === 'FT Missed' || act === 'TL Sbagliato' || act === 'Tiro Libero Sbagliato') {
      pStat.fta++;
      mBucket.fta++;
    }
  });

  safeLogs.forEach(row => {
    const oc = row.on_court || row.onCourtPlayerIds || row.onCourtNums;
    const matchId = getCanonicalMatchId(row);
    if (matchId && Array.isArray(oc)) {
      oc.forEach(num => {
        const s = String(num).trim();
        if (s && s !== 'OPP' && s !== '-') {
          const pStat = getOrCreatePlayerStat(s, '');
          pStat.matches.add(matchId);
          ensureMatchBucket(pStat, matchId);
        }
      });
    }
  });

  function recordZoneShot(pStat, zName, zLower, isMade, defType) {
    if (!zName || zLower === 'man' || zLower === 'zone' || zLower === 'press') {
      return;
    }
    let target = pStat.shotZones.other;
    if (zLower.includes('paint') || zLower.includes('key') || zLower.includes('area') || zLower.includes('canestro')) {
      target = pStat.shotZones.paint;
    } else if (zLower.includes('mid') || zLower.includes('media')) {
      target = pStat.shotZones.mid;
    } else if (zLower.includes('top') || zLower.includes('arc') || zLower.includes('arco') || zLower.includes('frontale')) {
      target = pStat.shotZones.top3;
    } else if (zLower.includes('wing') || zLower.includes('ala')) {
      target = pStat.shotZones.wing3;
    } else if (zLower.includes('corner') || zLower.includes('angolo')) {
      target = pStat.shotZones.corner3;
    }

    target.att++;
    if (isMade) target.made++;

    if (!pStat.detailedZones[zName]) {
      pStat.detailedZones[zName] = { name: zName, type: defType, made: 0, att: 0 };
    }
    pStat.detailedZones[zName].att++;
    if (isMade) pStat.detailedZones[zName].made++;
  }

  const aggregatedMap = {};
  for (const [key, p] of Object.entries(playerStatsMap)) {
    const gp = p.matches.size || 1;
    const totalPts = p.fg2m * 2 + p.fg3m * 3 + p.ftm;
    const totalReb = p.dreb + p.oreb;
    const pmTotal = plusMinusMap[p.number] || 0;

    for (const mId of p.matches) {
      if (p.byMatch[mId]) {
        p.byMatch[mId].plusMinus = plusMinusByMatch[mId]?.[p.number] || 0;
      }
    }

    const pointsAVG = Number((totalPts / gp).toFixed(1));
    const twoMadeAVG = Number((p.fg2m / gp).toFixed(1));
    const twoAttAvg = Number((p.fg2a / gp).toFixed(1));
    const threeMadeAVG = Number((p.fg3m / gp).toFixed(1));
    const threeAttAvg = Number((p.fg3a / gp).toFixed(1));
    const ftMadeAvg = Number((p.ftm / gp).toFixed(1));
    const ftAttAvg = Number((p.fta / gp).toFixed(1));
    const astAvg = Number((p.ast / gp).toFixed(1));
    const rebAvg = Number((totalReb / gp).toFixed(1));
    const drebAvg = Number((p.dreb / gp).toFixed(1));
    const orebAvg = Number((p.oreb / gp).toFixed(1));
    const tovAvg = Number((p.tov / gp).toFixed(1));
    const stlAvg = Number((p.stl / gp).toFixed(1));
    const blkAvg = Number((p.blk / gp).toFixed(1));
    const foulsAVG = Number((p.fouls / gp).toFixed(1));
    const plusMinusAVG = Number((pmTotal / gp).toFixed(1));
    const astTovRatio = p.tov > 0 ? Number((p.ast / p.tov).toFixed(2)) : (p.ast > 0 ? Number(p.ast.toFixed(2)) : 0.0);

    const fga = p.fg2a + p.fg3a;
    const fgm = p.fg2m + p.fg3m;
    const efgPct = fga > 0 ? Math.round(((fgm + 0.5 * p.fg3m) / fga) * 100) : null;
    const twoPct = p.fg2a > 0 ? Math.round((p.fg2m / p.fg2a) * 100) : null;
    const threePct = p.fg3a > 0 ? Math.round((p.fg3m / p.fg3a) * 100) : null;
    const ftPct = p.fta > 0 ? Math.round((p.ftm / p.fta) * 100) : null;

    const shootZonesList = [
      p.shotZones.paint,
      p.shotZones.mid,
      p.shotZones.top3,
      p.shotZones.wing3,
      p.shotZones.corner3
    ].map(z => {
      const pct = z.att > 0 ? Math.round((z.made / z.att) * 100) : null;
      const share = fga > 0 ? Math.round((z.att / fga) * 100) : 0;
      return {
        ...z,
        pct,
        share,
        volume: `${z.made}/${z.att}`
      };
    });

    const dataObj = {
      number: p.number,
      name: p.name,
      matches: Array.from(p.matches),
      byMatch: p.byMatch,
      gpSupabase: p.matches.size,
      matchesCount: p.matches.size,
      scoutingGames: p.matches.size,

      totalPts,
      ptsTotal: totalPts,
      fg2m: p.fg2m,
      fg2a: p.fg2a,
      fg3m: p.fg3m,
      fg3a: p.fg3a,
      ftm: p.ftm,
      fta: p.fta,
      ftMade: p.ftm,
      ftAtt: p.fta,
      astTotal: p.ast,
      ast: p.ast,
      rebTotal: totalReb,
      reb: totalReb,
      drebTotal: p.dreb,
      dreb: p.dreb,
      orebTotal: p.oreb,
      oreb: p.oreb,
      tovTotal: p.tov,
      tov: p.tov,
      stlTotal: p.stl,
      stl: p.stl,
      blkTotal: p.blk,
      blk: p.blk,
      foulsTotal: p.fouls,
      fouls: p.fouls,
      foulsDrawnTotal: p.foulsDrawn,
      foulsDrawn: p.foulsDrawn,
      plusMinusTotal: pmTotal,

      pointsAVG,
      ppg: pointsAVG,
      twoMadeAVG,
      twoAttAvg,
      threeMadeAVG,
      threeAttAvg,
      ftMadeAvg,
      ftAttAvg,
      astAvg,
      rebAvg,
      drebAvg,
      orebAvg,
      tovAvg,
      stlAvg,
      blkAvg,
      foulsAVG,
      plusMinusAVG,
      astTovRatio,

      twoPct,
      threePct,
      ftPct,
      efgPct,

      shootZones: shootZonesList,
      shotZonesMap: p.shotZones,
      detailedZones: p.detailedZones
    };

    aggregatedMap[key] = dataObj;
    if (p.number) aggregatedMap[`num_${p.number}`] = dataObj;
    if (p.name) aggregatedMap[`name_${p.name.toLowerCase()}`] = dataObj;
  }

  return aggregatedMap;
}

/**
 * Merges BBA Roster from FIP with Supabase Advanced Playmaking, Hustle & Shoot Zones.
 * Strictly uses team-level `player.stats` (Divisione Regionale 2) and per-match FIP boxscores when available,
 * never `uniquePlayer.seasonStats` (which mixes U19 / other competitions).
 */
export function buildSuperchargedBbaRoster(
  fipRoster = [], 
  supabaseLogs = [], 
  startersData = null, 
  filterType = 'ALL',
  matchMetadataMap = {},
  activeMatchesList = []
) {
  let activeLogs = Array.isArray(supabaseLogs) ? supabaseLogs : [];
  if (normalizeFilterType(filterType) !== 'ALL') {
    activeLogs = activeLogs.filter(row => {
      if (!row) return false;
      const mId = row.match_id ? String(row.match_id).trim() : '';
      const mName = row.Match_Name || row.match_name || row.nome_partita || '';
      
      const unifiedMatch = Array.isArray(activeMatchesList) 
        ? activeMatchesList.find(m => m && (String(m.id) === mId || m.name === mName || String(m.rawSupa?.id) === mId || m.rawSupa?.name === mName))
        : null;
      if (unifiedMatch && unifiedMatch.matchType) {
        return matchesFilterType(unifiedMatch.matchType, filterType);
      }

      const meta = (matchMetadataMap && matchMetadataMap[mName]) || 
                   (matchMetadataMap && typeof matchMetadataMap === 'object' && Object.values(matchMetadataMap).find(m => m && (m.name === mName || String(m.id) === mId))) || 
                   {};
      const mType = meta.matchType || meta.match_type || 'Friendly'; 
      return matchesFilterType(mType, filterType);
    });
  }

  const supabaseMap = aggregateSupabasePlayerStats(activeLogs);
  const baseList = (Array.isArray(fipRoster) && fipRoster.length > 0) ? fipRoster : DEFAULT_MASTER_ROSTER;

  const startersPlayers = Array.isArray(startersData?.players) 
    ? startersData.players 
    : (Array.isArray(startersData) ? startersData : []);
  const startersByFid = new Map();
  const startersByName = new Map();
  const startersByNum = new Map();

  startersPlayers.forEach(s => {
    if (!s) return;
    if (s.fid) startersByFid.set(String(s.fid), s);
    const fullName = `${s.name || ''} ${s.lastName || ''}`.trim().toLowerCase();
    if (fullName) startersByName.set(fullName, s);
    if (s.number) startersByNum.set(String(s.number), s);
  });

  const fipVerifiedMatches = Array.isArray(activeMatchesList)
    ? activeMatchesList.filter(m => m && m.fipVerified && matchesFilterType(m.matchType || 'Official', filterType))
    : [];

  const missingScoutingMatches = fipVerifiedMatches.filter(m => !m.hasSupabaseScout);
  const missingScoutingMatchNames = missingScoutingMatches.map(
    m => m.name || (m.opponent ? `vs ${m.opponent}` : 'Partita FIP')
  );

  return baseList.filter(Boolean).map((player, idx) => {
    if (!player) return null;
    const num = String(player.number || (idx + 1)).trim();
    const cleanName = formatPlayerFullName(player.name, player.lastName) || `Giocatore #${num}`;

    const supaData = supabaseMap[num] || 
                     supabaseMap[`num_${num}`] || 
                     supabaseMap[`name_${cleanName.toLowerCase()}`] || 
                     null;

    // STRICT TEAM SCOPE: Only use player.stats (never uniquePlayer.seasonStats!)
    const fipStats = player.stats || {};

    let starterEntry = null;
    if (player.fid && startersByFid.has(String(player.fid))) {
      starterEntry = startersByFid.get(String(player.fid));
    } else if (startersByName.has(cleanName.toLowerCase())) {
      starterEntry = startersByName.get(cleanName.toLowerCase());
    } else if (startersByNum.has(num)) {
      const candidate = startersByNum.get(num);
      if (!candidate.fid || !player.fid || String(candidate.fid) === String(player.fid)) {
        starterEntry = candidate;
      }
    }

    const playerShotEvents = activeLogs.filter(e => {
      if (!e) return false;
      const eNum = String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '').trim();
      const eName = String(e?.Player ?? e?.player ?? '').toLowerCase();
      const isThisPlayer = (eNum && eNum === num) || (cleanName && eName.includes(cleanName.toLowerCase()));
      if (!isThisPlayer) return false;
      const act = String(e?.Action ?? e?.action ?? '');
      return act.includes('2PT') || act.includes('3PT') || act.includes('Tiro') || act.includes('Shot');
    });

    const isFriendlyOnly = matchesFilterType('FRIENDLY', filterType) && !matchesFilterType('OFFICIAL', filterType);
    
    // Raw FIP games strictly from team-level fipStats.games (capped by actual FIP matches if activeMatchesList is provided)
    let rawFipPg = isFriendlyOnly ? 0 : Number(fipStats?.games ?? 0);
    if (fipVerifiedMatches.length > 0 && rawFipPg > fipVerifiedMatches.length) {
      rawFipPg = fipVerifiedMatches.length;
    }

    const supaPg = supaData?.gpSupabase || 0;

    // 1. Team-Scope FIP Totals (uses exact integers if synced via updated build_league.js, otherwise Math.round(avg * rawFipPg))
    const fipTotal2m = rawFipPg > 0 
      ? (fipStats?.inArcThrowsMade != null ? Math.round(Number(fipStats.inArcThrowsMade)) : Math.round(Number(fipStats?.inArcThrowsAVG ?? 0) * rawFipPg))
      : 0;
    const fipTotal3m = rawFipPg > 0 
      ? (fipStats?.outArcThrowsMade != null ? Math.round(Number(fipStats.outArcThrowsMade)) : Math.round(Number(fipStats?.outArcThrowsAVG ?? 0) * rawFipPg))
      : 0;
    const fipTotalPts = rawFipPg > 0 
      ? (fipStats?.points != null ? Math.round(Number(fipStats.points)) : Math.round(Number(fipStats?.pointsPerGame ?? fipStats?.pointsAVG ?? 0) * rawFipPg))
      : 0;
    const fipTotalFtm = rawFipPg > 0
      ? (fipStats?.freeThrowsMade != null ? Math.round(Number(fipStats.freeThrowsMade)) : Math.max(0, fipTotalPts - (fipTotal2m * 2 + fipTotal3m * 3)))
      : 0;
    const fipTotalFouls = rawFipPg > 0 
      ? (fipStats?.fouls != null ? Math.round(Number(fipStats.fouls)) : Math.round(Number(fipStats?.foulsAVG ?? 0) * rawFipPg))
      : 0;
    const fipTotalPm = rawFipPg > 0 
      ? (fipStats?.plusMinus != null ? Math.round(Number(fipStats.plusMinus)) : Math.round(Number(fipStats?.plusMinusAVG ?? 0) * rawFipPg))
      : 0;

    // 2. Check if FIP-only matches have direct per-game player boxscores (from updated build_league.js)
    let hasDirectFipOnlyBoxscores = false;
    let directFipOnlyGames = 0;
    let directFipOnly2m = 0;
    let directFipOnly3m = 0;
    let directFipOnlyFtm = 0;
    let directFipOnlyFouls = 0;
    let directFipOnlyPm = 0;

    if (!isFriendlyOnly && missingScoutingMatches.length > 0) {
      const allHaveBoxscores = missingScoutingMatches.every(m => {
        const list = m.fipRoster || m.rawFip?.players || m.players;
        return Array.isArray(list) && list.length > 0;
      });

      if (allHaveBoxscores) {
        hasDirectFipOnlyBoxscores = true;
        missingScoutingMatches.forEach(m => {
          const list = m.fipRoster || m.rawFip?.players || m.players || [];
          const pEntry = list.find(p => {
            const pFid = p?.fid ? String(p.fid) : '';
            const pNum = String(p?.number ?? p?.Number ?? '').trim();
            const pName = formatPlayerFullName(p?.name, p?.lastName).toLowerCase();
            return (player.fid && pFid === String(player.fid)) || (pNum && pNum === num) || (cleanName && pName === cleanName.toLowerCase());
          });
          if (pEntry) {
            directFipOnlyGames++;
            const p2 = Math.round(Number(pEntry.fg2m ?? pEntry.inArcThrowsMade ?? 0));
            const p3 = Math.round(Number(pEntry.fg3m ?? pEntry.outArcThrowsMade ?? 0));
            const pts = Math.round(Number(pEntry.pts ?? pEntry.points ?? 0));
            const ft = pEntry.ftm != null ? Math.round(Number(pEntry.ftm)) : Math.max(0, pts - (p2 * 2 + p3 * 3));
            directFipOnly2m += p2;
            directFipOnly3m += p3;
            directFipOnlyFtm += ft;
            directFipOnlyFouls += Math.round(Number(pEntry.fouls ?? 0));
            directFipOnlyPm += Math.round(Number(pEntry.plusMinus ?? 0));
          }
        });
      }
    }

    // 3. Calculate Overlap & Exclusive FIP Stats
    let unifiedPg = 0;
    let exclusiveFip2m = 0;
    let exclusiveFip3m = 0;
    let exclusiveFipFtm = 0;
    let exclusiveFipFouls = 0;
    let exclusiveFipPm = 0;

    if (hasDirectFipOnlyBoxscores) {
      unifiedPg = supaPg + directFipOnlyGames;
      exclusiveFip2m = directFipOnly2m;
      exclusiveFip3m = directFipOnly3m;
      exclusiveFipFtm = directFipOnlyFtm;
      exclusiveFipFouls = directFipOnlyFouls;
      exclusiveFipPm = directFipOnlyPm;
    } else {
      let overlappingGames = 0;
      let overlap2m = 0;
      let overlap3m = 0;
      let overlapFtm = 0;
      let overlapFouls = 0;
      let overlapPm = 0;

      if (!isFriendlyOnly && supaData && supaData.matches) {
        if (Array.isArray(activeMatchesList) && activeMatchesList.length > 0) {
          supaData.matches.forEach(matchId => {
            const m = activeMatchesList.find(x => 
              x && (String(x.id) === String(matchId) || x.name === matchId || String(x.rawSupa?.id) === String(matchId) || x.rawSupa?.name === matchId)
            );
            if (m && (m.fipVerified || m.rawFip)) {
              overlappingGames++;
              const supaMatchBucket = supaData.byMatch?.[matchId];
              if (supaMatchBucket) {
                overlap2m += supaMatchBucket.fg2m;
                overlap3m += supaMatchBucket.fg3m;
                overlapFtm += supaMatchBucket.ftm;
                overlapFouls += supaMatchBucket.fouls;
                overlapPm += supaMatchBucket.plusMinus || 0;
              }
            }
          });
        } else if (rawFipPg > 0 && supaPg > 0) {
          overlappingGames = Math.min(rawFipPg, supaPg);
          overlap2m = supaData.fg2m || 0;
          overlap3m = supaData.fg3m || 0;
          overlapFtm = supaData.ftm || 0;
          overlapFouls = supaData.foulsTotal || 0;
          overlapPm = supaData.plusMinusTotal || 0;
        }
      }

      const exclusiveFipGames = Math.max(0, rawFipPg - overlappingGames);
      const exclusiveSupaGames = Math.max(0, supaPg - overlappingGames);
      unifiedPg = overlappingGames + exclusiveFipGames + exclusiveSupaGames;

      exclusiveFip2m = exclusiveFipGames > 0 ? Math.max(0, fipTotal2m - overlap2m) : 0;
      exclusiveFip3m = exclusiveFipGames > 0 ? Math.max(0, fipTotal3m - overlap3m) : 0;
      exclusiveFipFtm = exclusiveFipGames > 0 ? Math.max(0, fipTotalFtm - overlapFtm) : 0;
      exclusiveFipFouls = exclusiveFipGames > 0 ? Math.max(0, fipTotalFouls - overlapFouls) : 0;
      exclusiveFipPm = exclusiveFipGames > 0 ? (fipTotalPm - overlapPm) : 0;
    }

    // 4. Unified Hybrid Integer Totals (Scouting + FIP Exclusive)
    const hybridFg2m = Math.round((supaData?.fg2m || 0) + exclusiveFip2m);
    const hybridFg3m = Math.round((supaData?.fg3m || 0) + exclusiveFip3m);
    const hybridFtm = Math.round((supaData?.ftm || 0) + exclusiveFipFtm);

    // Mathematical Invariant: Total Points = 2*2PM + 3*3PM + FTM
    const finalPtsTotal = (hybridFg2m * 2) + (hybridFg3m * 3) + hybridFtm;
    const finalPtsAvg = unifiedPg > 0 ? Number((finalPtsTotal / unifiedPg).toFixed(1)) : 0;

    // 5. Shooting Volumes & Percentages (Scouting Priority)
    const scoutedFg2m = supaData?.fg2m || 0;
    const scoutedFg2a = supaData?.fg2a || 0;
    const scoutedFg3m = supaData?.fg3m || 0;
    const scoutedFg3a = supaData?.fg3a || 0;
    const scoutedFtm = supaData?.ftm || 0;
    const scoutedFta = supaData?.fta || 0;

    const final2PmMadeAvg = unifiedPg > 0 ? Number((hybridFg2m / unifiedPg).toFixed(1)) : 0;
    const final3PmMadeAvg = unifiedPg > 0 ? Number((hybridFg3m / unifiedPg).toFixed(1)) : 0;
    const finalFtMadeAvg = unifiedPg > 0 ? Number((hybridFtm / unifiedPg).toFixed(1)) : 0;

    const final2AttAvg = supaPg > 0 && scoutedFg2a > 0 ? Number((scoutedFg2a / supaPg).toFixed(1)) : null;
    const final3AttAvg = supaPg > 0 && scoutedFg3a > 0 ? Number((scoutedFg3a / supaPg).toFixed(1)) : null;
    const finalFtAttAvg = supaPg > 0 && scoutedFta > 0 ? Number((scoutedFta / supaPg).toFixed(1)) : null;

    const final2Pct = supaData?.twoPct ?? null;
    const final3Pct = supaData?.threePct ?? null;
    const finalFtPct = supaData?.ftPct ?? (fipStats?.freeThrowsPercentage != null ? Math.round(Number(fipStats.freeThrowsPercentage)) : null);

    // 6. Minutes & Starters (FIP Exclusive)
    const finalTimePlayedAvg = fipStats?.timePlayedAVG != null ? Number(fipStats.timePlayedAVG) : (player.timePlayedAVG != null ? Number(player.timePlayedAVG) : null);
    const startsCount = Number(starterEntry?.startsCount ?? (player.startPercentage !== '—' && player.startsCount ? player.startsCount : 0));
    let startPct = '0%';
    if (rawFipPg > 0 && startsCount > 0) {
      startPct = `${Math.min(100, Math.round((startsCount / rawFipPg) * 100))}%`;
    } else if (unifiedPg > 0 && startsCount > 0) {
      startPct = `${Math.min(100, Math.round((startsCount / unifiedPg) * 100))}%`;
    }

    const hasSupa = Boolean(supaData && supaData.gpSupabase > 0);
    const hasFewerScoutingGames = Boolean(unifiedPg > supaPg);
    const missingNamesStr = missingScoutingMatchNames.length > 0 
      ? ` (Mancano dati scouting per: ${missingScoutingMatchNames.join(', ')})`
      : '';
    const scoutingTooltip = hasFewerScoutingGames 
      ? `Calcolato su ${supaPg} partite con scouting disponibile su ${unifiedPg} totali${missingNamesStr}` 
      : null;

    // 7. Playmaking, Hustle & Defense (Scouting Exclusive)
    const finalAstAvg = hasSupa ? supaData.astAvg : null;
    const finalAstTotal = hasSupa ? supaData.astTotal : 0;
    const finalRebAvg = hasSupa ? supaData.rebAvg : null;
    const finalRebTotal = hasSupa ? supaData.rebTotal : 0;
    const finalOrebAvg = hasSupa ? supaData.orebAvg : null;
    const finalOrebTotal = hasSupa ? supaData.orebTotal : 0;
    const finalDrebAvg = hasSupa ? supaData.drebAvg : null;
    const finalDrebTotal = hasSupa ? supaData.drebTotal : 0;
    const finalTovAvg = hasSupa ? supaData.tovAvg : null;
    const finalTovTotal = hasSupa ? supaData.tovTotal : 0;
    const finalStlAvg = hasSupa ? supaData.stlAvg : null;
    const finalStlTotal = hasSupa ? supaData.stlTotal : 0;
    const finalBlkAvg = hasSupa ? supaData.blkAvg : null;
    const finalBlkTotal = hasSupa ? supaData.blkTotal : 0;

    // 8. Fouls & Plus/Minus
    const finalFoulsTotal = Math.round((supaData?.foulsTotal || 0) + exclusiveFipFouls);
    const finalFoulsAvg = unifiedPg > 0 ? Number((finalFoulsTotal / unifiedPg).toFixed(1)) : 0;

    const finalPlusMinusTotal = Math.round((supaData?.plusMinusTotal || 0) + exclusiveFipPm);
    const finalPlusMinusAvg = unifiedPg > 0 ? Number((finalPlusMinusTotal / unifiedPg).toFixed(1)) : 0;

    const finalAstTovRatio = hasSupa ? supaData.astTovRatio : null;
    const finalEfgPct = hasSupa ? supaData.efgPct : null;

    return {
      ...player,
      fid: player.fid || `bba_p_${num}`,
      number: num,
      name: cleanName,
      captain: Boolean(player.captain),
      starting: Boolean(player.starting || (startsCount > 0)),
      startPercentage: startPct,
      startsCount,

      games: unifiedPg,
      timePlayedAVG: finalTimePlayedAvg,

      pointsAVG: finalPtsAvg,
      pointsPerGame: finalPtsAvg,
      totalPts: finalPtsTotal,
      ptsTotal: finalPtsTotal,
      pointsTotal: finalPtsTotal,
      points: finalPtsTotal,

      // 2PT: Keep fg2m/fg2a strictly coherent with attempts in Roster Table (so makes never exceed attempts),
      // while exposing hybridFg2m / hybrid2MadeAvg for total season scoring breakdown
      twoMadeAVG: supaPg > 0 && scoutedFg2a > 0 ? Number((scoutedFg2m / supaPg).toFixed(1)) : final2PmMadeAvg,
      twoAttAvg: final2AttAvg,
      twoPct: final2Pct,
      fg2m: scoutedFg2a > 0 ? scoutedFg2m : hybridFg2m,
      fg2a: scoutedFg2a,
      hybridFg2m,
      hybrid2MadeAvg: final2PmMadeAvg,
      scoutedFg2m,
      scoutedFg2a,

      // 3PT
      threeMadeAVG: supaPg > 0 && scoutedFg3a > 0 ? Number((scoutedFg3m / supaPg).toFixed(1)) : final3PmMadeAvg,
      threeAttAvg: final3AttAvg,
      threePct: final3Pct,
      fg3m: scoutedFg3a > 0 ? scoutedFg3m : hybridFg3m,
      fg3a: scoutedFg3a,
      hybridFg3m,
      hybrid3MadeAvg: final3PmMadeAvg,
      scoutedFg3m,
      scoutedFg3a,

      // Free Throws
      ftMadeAvg: supaPg > 0 && scoutedFta > 0 ? Number((scoutedFtm / supaPg).toFixed(1)) : finalFtMadeAvg,
      ftAttAvg: finalFtAttAvg,
      ftPct: finalFtPct,
      ftm: scoutedFta > 0 ? scoutedFtm : hybridFtm,
      fta: scoutedFta,
      ftMade: scoutedFta > 0 ? scoutedFtm : hybridFtm,
      ftAtt: scoutedFta,
      hybridFtm,
      hybridFtMadeAvg: finalFtMadeAvg,
      scoutedFtm,
      scoutedFta,

      // Playmaking, Hustle & Defense
      astAvg: finalAstAvg,
      astTotal: finalAstTotal,
      ast: finalAstTotal,
      rebAvg: finalRebAvg,
      rebTotal: finalRebTotal,
      reb: finalRebTotal,
      orebAvg: finalOrebAvg,
      orebTotal: finalOrebTotal,
      oreb: finalOrebTotal,
      drebAvg: finalDrebAvg,
      drebTotal: finalDrebTotal,
      dreb: finalDrebTotal,
      stlAvg: finalStlAvg,
      stlTotal: finalStlTotal,
      stl: finalStlTotal,
      blkAvg: finalBlkAvg,
      blkTotal: finalBlkTotal,
      blk: finalBlkTotal,
      tovAvg: finalTovAvg,
      tovTotal: finalTovTotal,
      tov: finalTovTotal,
      foulsAVG: finalFoulsAvg,
      foulsTotal: finalFoulsTotal,
      fouls: finalFoulsTotal,
      plusMinusAVG: finalPlusMinusAvg,
      plusMinusTotal: finalPlusMinusTotal,
      astTovRatio: finalAstTovRatio,
      efgPct: finalEfgPct,

      shootZones: supaData?.shootZones || [],
      shotZonesMap: supaData?.shotZonesMap || {},
      detailedZones: supaData?.detailedZones || {},
      shotEvents: playerShotEvents,

      fipVerified: true,
      hasSupabaseStats: hasSupa,
      gpSupabase: supaPg,
      scoutingGamesCount: supaPg,
      fipGamesCount: rawFipPg,
      hasFewerScoutingGames,
      missingScoutingMatchNames,
      scoutingTooltip,
      stats: {
        ...fipStats,
        games: unifiedPg,
        points: finalPtsTotal,
        pointsAVG: finalPtsAvg,
        pointsPerGame: finalPtsAvg,
        inArcThrowsMade: hybridFg2m,
        inArcThrowsAVG: final2PmMadeAvg,
        outArcThrowsMade: hybridFg3m,
        outArcThrowsAVG: final3PmMadeAvg,
        freeThrowsMade: hybridFtm,
        freeThrowsPercentage: finalFtPct,
        fouls: finalFoulsTotal,
        foulsAVG: finalFoulsAvg,
        plusMinus: finalPlusMinusTotal,
        plusMinusAVG: finalPlusMinusAvg,
        assistsAVG: finalAstAvg || 0,
        reboundsAVG: finalRebAvg || 0
      }
    };
  });
}

/**
 * Builds a unified list of matches combining FIP official matches and Supabase matches.
 */
export function buildUnifiedMatchList(fipLog = [], supabaseMatches = [], metaMap = {}) {
  const unified = [];
  const matchedSupaNames = new Set();

  (fipLog || []).forEach((fipMatch, idx) => {
    const fipDate = (fipMatch.date || '').slice(0, 10);
    const homeTeam = (fipMatch.homeTeam || '').trim();
    const awayTeam = (fipMatch.awayTeam || '').trim();
    const isHome = Boolean(fipMatch.isHomeGame);
    const oppName = isHome ? awayTeam : homeTeam;
    const oppLower = oppName.toLowerCase();

    const matchedSupa = (supabaseMatches || []).find(sm => {
      if (matchedSupaNames.has(sm.name)) return false;
      const sDate = (sm.match_date ? String(sm.match_date).split('T')[0] : (sm.matchDate || sm.createdAt || '')).slice(0, 10);
      const sName = (sm.name || '').toLowerCase();
      const sOpp = (sm.opponentName || sm.opponent || '').toLowerCase();

      if (fipDate && sDate && fipDate === sDate) return true;

      if (oppLower && (sName.includes(oppLower) || (sOpp && sOpp.includes(oppLower)))) return true;
      if (oppLower.includes('solofra') && sName.includes('solofra')) return true;
      if (oppLower.includes('minori') && sName.includes('minori')) return true;
      if (oppLower.includes('montoro') && sName.includes('montoro')) return true;
      if (oppLower.includes('capaccio') && sName.includes('capaccio')) return true;
      if (oppLower.includes('eboli') && sName.includes('eboli')) return true;

      return false;
    });

    if (matchedSupa) {
      matchedSupaNames.add(matchedSupa.name);
    }

    const supaMeta = (matchedSupa?.name && metaMap) ? metaMap[matchedSupa.name] : {};
    
    const supaHomeScore = matchedSupa?.home_score !== undefined && matchedSupa?.home_score !== null ? Number(matchedSupa.home_score) : null;
    const supaAwayScore = matchedSupa?.away_score !== undefined && matchedSupa?.away_score !== null ? Number(matchedSupa.away_score) : null;
    const metaTeamScore = supaMeta?.overrideTeamScore !== undefined && supaMeta?.overrideTeamScore !== null ? Number(supaMeta.overrideTeamScore) : null;
    const metaOppScore = supaMeta?.overrideOppScore !== undefined && supaMeta?.overrideOppScore !== null ? Number(supaMeta.overrideOppScore) : null;

    const hasSupaScoreOverride = Boolean(
      (supaHomeScore !== null && supaHomeScore > 0) ||
      (supaAwayScore !== null && supaAwayScore > 0) ||
      metaTeamScore !== null ||
      metaOppScore !== null
    );

    const supaTeamScore = (supaHomeScore !== null && supaHomeScore > 0) ? supaHomeScore : metaTeamScore;
    const supaOppScore = (supaAwayScore !== null && supaAwayScore > 0) ? supaAwayScore : metaOppScore;

    const fipScored = isHome ? Number(fipMatch.homeScore ?? 0) : Number(fipMatch.awayScore ?? 0);
    const fipConceded = isHome ? Number(fipMatch.awayScore ?? 0) : Number(fipMatch.homeScore ?? 0);

    const finalScored = (hasSupaScoreOverride && supaTeamScore !== null) ? supaTeamScore : fipScored;
    const finalConceded = (hasSupaScoreOverride && supaOppScore !== null) ? supaOppScore : fipConceded;
    const diff = finalScored - finalConceded;
    const isWin = finalScored > finalConceded;

    const manualDate = matchedSupa?.match_date ? String(matchedSupa.match_date).split('T')[0] : (matchedSupa?.matchDate || supaMeta?.matchDate);
    const finalDate = (manualDate && manualDate !== 'n.a.') ? manualDate : (fipDate || 'n.a.');

    const displayName = matchedSupa?.name || (isHome ? `BBA vs ${oppName}` : `${oppName} vs BBA`);
    const normalizedPartials = normalizeFipPartials(fipMatch.partials || [], isHome);

    let analytics = matchedSupa?.analytics;
    if (!analytics && Array.isArray(matchedSupa?.events) && matchedSupa.events.length > 0) {
      analytics = calculateMatchAnalytics(matchedSupa.events);
    }

    if (analytics) {
      analytics = {
        ...analytics,
        teamOverview: {
          ...(analytics.teamOverview || {}),
          pts: finalScored,
          opponentScore: finalConceded
        }
      };
    } else {
      analytics = {
        teamOverview: {
          pts: finalScored,
          opponentScore: finalConceded,
          fgm: 0, fga: 0, fg2m: 0, fg2a: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0,
          dreb: 0, oreb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, fd: 0, pir: 0
        },
        shootingPercentages: { efgPct: 0, fg2Pct: 0, fg3Pct: 0, ftPct: 0 },
        reboundingAnalysis: { drbPct: 0, orbPct: 0 },
        ballControlAnalysis: { astTovRatio: 0 }
      };
    }

    unified.push({
      id: matchedSupa?.id || fipMatch.matchFid || `fip_${idx}`,
      name: displayName,
      matchType: 'Official',
      matchDate: finalDate,
      createdAt: fipMatch.date || matchedSupa?.createdAt,
      events: matchedSupa?.events || [],
      analytics,

      pts: finalScored,
      oppPts: finalConceded,
      diff,
      isWin,
      resultText: isWin ? 'V' : (finalScored === finalConceded ? 'P' : 'S'),
      isHomeGame: isHome,
      location: isHome ? 'Casa' : 'Trasferta',
      round: fipMatch.round ? `G${fipMatch.round}` : `G${idx + 1}`,
      gameLabel: fipMatch.round ? `G${fipMatch.round}` : `G${idx + 1}`,
      opponent: oppName,
      partials: normalizedPartials,
      fipRoster: fipMatch.players || [],
      fipVerified: true,
      hasSupabaseScout: Boolean(matchedSupa && ((Array.isArray(matchedSupa.events) && matchedSupa.events.length > 0) || matchedSupa.hasSupabaseScout || (matchedSupa.id && !String(matchedSupa.id).startsWith('fip_')))),
      isScoreOverridden: hasSupaScoreOverride,
      rawFip: fipMatch,
      rawSupa: matchedSupa
    });
  });

  (supabaseMatches || []).forEach((sm, smIdx) => {
    if (matchedSupaNames.has(sm.name)) return;

    const meta = metaMap[sm.name] || {};
    const rawType = sm.match_type || sm.matchType || meta.matchType || 'Friendly';
    const isOfficial = matchesFilterType(rawType, 'OFFICIAL');
    const matchType = isOfficial ? 'Official' : rawType;
    const sDate = sm.match_date ? String(sm.match_date).split('T')[0] : (sm.matchDate || meta.matchDate || sm.createdAt || '').slice(0, 10);

    const pts = (sm.home_score !== undefined && sm.home_score !== null && Number(sm.home_score) > 0)
      ? Number(sm.home_score)
      : (sm.pts !== undefined && sm.pts !== null && Number(sm.pts) > 0
        ? Number(sm.pts)
        : (meta.overrideTeamScore !== undefined && meta.overrideTeamScore !== null
          ? Number(meta.overrideTeamScore)
          : null));

    const oppPts = (sm.away_score !== undefined && sm.away_score !== null && Number(sm.away_score) > 0)
      ? Number(sm.away_score)
      : (sm.oppPts !== undefined && sm.oppPts !== null && Number(sm.oppPts) > 0
        ? Number(sm.oppPts)
        : (meta.overrideOppScore !== undefined && meta.overrideOppScore !== null
          ? Number(meta.overrideOppScore)
          : null));

    let a = sm.analytics;
    if (!a && Array.isArray(sm.events) && sm.events.length > 0) {
      a = calculateMatchAnalytics(sm.events, [], [], { teamScore: pts, oppScore: oppPts });
    }

    const finalPts = pts ?? (a?.teamOverview?.pts || 0);
    const finalOppPts = oppPts ?? (a?.teamOverview?.opponentScore || 0);
    const diff = finalPts - finalOppPts;
    const isWin = finalPts > finalOppPts;

    if (a) {
      a = {
        ...a,
        teamOverview: {
          ...(a.teamOverview || {}),
          pts: finalPts,
          opponentScore: finalOppPts,
          pointDifferential: diff
        }
      };
    }

    unified.push({
      id: sm.id || `supa_${sm.name || smIdx}`,
      name: sm.name,
      matchType,
      match_type: matchType,
      matchDate: sDate,
      match_date: sDate,
      createdAt: sm.createdAt,
      events: sm.events || [],
      analytics: a,

      home_score: finalPts,
      away_score: finalOppPts,
      pts: finalPts,
      oppPts: finalOppPts,
      diff,
      isWin,
      resultText: isWin ? 'V' : (finalPts === finalOppPts ? 'P' : 'S'),
      isHomeGame: sm.is_home !== undefined ? Boolean(sm.is_home) : true,
      location: (sm.is_home !== undefined ? Boolean(sm.is_home) : true) ? 'Casa' : 'Trasferta',
      round: matchType === 'Official' ? `G${unified.length + 1}` : 'AMICH.',
      gameLabel: matchType === 'Official' ? `G${unified.length + 1}` : `A${smIdx + 1}`,
      opponent: sm.opponentName || sm.opponent || sm.name.replace(/^BBA\s*(vs|contro|-)\s*/i, '').trim() || sm.name,
      partials: sm.partials || [],
      fipVerified: false,
      hasSupabaseScout: true,
      rawFip: null,
      rawSupa: sm
    });
  });

  return unified;
}

/**
 * Merges Chronological Game Logs:
 * Combines FIP match logs with Supabase match records using Match Date & Name.
 */
export function buildHybridGameLog(fipLog = [], supabaseMatches = [], filterType = 'ALL', metaMap = {}) {
  const mergedLogs = [];

  if (matchesFilterType('OFFICIAL', filterType)) {
    (fipLog || []).forEach((fipMatch, idx) => {
      const fipDate = (fipMatch.date || '').slice(0, 10);
      const homeTeam = fipMatch.homeTeam || '';
      const awayTeam = fipMatch.awayTeam || '';
      const isHome = Boolean(fipMatch.isHomeGame);
      const oppName = isHome ? awayTeam : homeTeam;
      const oppLower = oppName.toLowerCase();

      const matchedSupa = (supabaseMatches || []).find(sm => {
        const sDate = (sm.match_date ? String(sm.match_date).split('T')[0] : (sm.matchDate || sm.createdAt || '')).slice(0, 10);
        const sName = (sm.name || '').toLowerCase();
        const sOpp = (sm.opponentName || sm.opponent || '').toLowerCase();

        if (fipDate && sDate && fipDate === sDate) return true;

        if (oppLower && (sName.includes(oppLower) || (sOpp && sOpp.includes(oppLower)))) return true;
        if (oppLower.includes('solofra') && sName.includes('solofra')) return true;
        if (oppLower.includes('minori') && sName.includes('minori')) return true;
        if (oppLower.includes('montoro') && sName.includes('montoro')) return true;
        if (oppLower.includes('capaccio') && sName.includes('capaccio')) return true;
        if (oppLower.includes('eboli') && sName.includes('eboli')) return true;

        return false;
      });

      const supaMeta = (matchedSupa?.name && metaMap) ? metaMap[matchedSupa.name] : {};
      
      const supaHomeScore = matchedSupa?.home_score !== undefined && matchedSupa?.home_score !== null ? Number(matchedSupa.home_score) : null;
      const supaAwayScore = matchedSupa?.away_score !== undefined && matchedSupa?.away_score !== null ? Number(matchedSupa.away_score) : null;
      const metaTeamScore = supaMeta?.overrideTeamScore !== undefined && supaMeta?.overrideTeamScore !== null ? Number(supaMeta.overrideTeamScore) : null;
      const metaOppScore = supaMeta?.overrideOppScore !== undefined && supaMeta?.overrideOppScore !== null ? Number(supaMeta.overrideOppScore) : null;

      const hasSupaScoreOverride = Boolean(
        (supaHomeScore !== null && supaHomeScore > 0) ||
        (supaAwayScore !== null && supaAwayScore > 0) ||
        metaTeamScore !== null ||
        metaOppScore !== null
      );

      const supaTeamScore = (supaHomeScore !== null && supaHomeScore > 0) ? supaHomeScore : metaTeamScore;
      const supaOppScore = (supaAwayScore !== null && supaAwayScore > 0) ? supaAwayScore : metaOppScore;

      const fipPts = isHome ? Number(fipMatch.homeScore ?? 0) : Number(fipMatch.awayScore ?? 0);
      const fipOppPts = isHome ? Number(fipMatch.awayScore ?? 0) : Number(fipMatch.homeScore ?? 0);

      const finalPts = (hasSupaScoreOverride && supaTeamScore !== null) ? supaTeamScore : fipPts;
      const finalOppPts = (hasSupaScoreOverride && supaOppScore !== null) ? supaOppScore : fipOppPts;
      const diff = finalPts - finalOppPts;
      const isWin = finalPts > finalOppPts;

      const manualDate = matchedSupa?.match_date ? String(matchedSupa.match_date).split('T')[0] : (matchedSupa?.matchDate || supaMeta?.matchDate);
      const finalDate = (manualDate && manualDate !== 'n.a.') ? manualDate : (fipDate || 'n.a.');

      const normalizedPartials = normalizeFipPartials(fipMatch.partials || [], isHome);

      let supaAnalytics = matchedSupa?.analytics;
      if (!supaAnalytics && Array.isArray(matchedSupa?.events) && matchedSupa.events.length > 0) {
        supaAnalytics = calculateMatchAnalytics(matchedSupa.events);
      }

      mergedLogs.push({
        id: matchedSupa?.id || fipMatch.matchFid || `fip_${idx}`,
        matchFid: fipMatch.matchFid,
        date: finalDate,
        round: fipMatch.round || `G${idx + 1}`,
        gameLabel: `G${idx + 1}`,
        opponent: oppName,
        isHomeGame: isHome,
        location: isHome ? 'Casa' : 'Trasferta',
        matchType: 'Official',
        
        pts: finalPts,
        oppPts: finalOppPts,
        diff: diff,
        isWin: isWin,
        resultText: isWin ? 'V' : (finalPts === finalOppPts ? 'P' : 'S'),
        partials: normalizedPartials,
        fipRoster: fipMatch.players || [],

        ast: supaAnalytics?.teamOverview?.ast ?? null,
        tov: supaAnalytics?.teamOverview?.tov ?? null,
        astTovRatio: supaAnalytics?.ballControlAnalysis?.astTovRatio ?? null,
        rebTotal: supaAnalytics ? ((supaAnalytics.teamOverview?.dreb || 0) + (supaAnalytics.teamOverview?.oreb || 0)) : null,
        drbPct: supaAnalytics?.reboundingAnalysis?.drbPct ?? null,
        efgPct: supaAnalytics?.shootingPercentages?.efgPct ?? null,
        pir: supaAnalytics?.teamOverview?.pir ?? null,

        fipVerified: true,
        hasSupabaseScout: Boolean(matchedSupa && ((Array.isArray(matchedSupa.events) && matchedSupa.events.length > 0) || matchedSupa.hasSupabaseScout)),
        isScoreOverridden: hasSupaScoreOverride,
        rawFip: fipMatch,
        rawSupa: matchedSupa
      });
    });
  }

  (supabaseMatches || []).forEach((sm, smIdx) => {
    const sType = sm.match_type || sm.matchType || 'Friendly';
    if (!matchesFilterType(sType, filterType)) return;

    const alreadyIncorporatedInFip = mergedLogs.some(ml => 
      (sm.id && ml.id === sm.id) ||
      (sm.name && ml.rawSupa?.name === sm.name)
    );
    if (alreadyIncorporatedInFip) return;

    const supaMeta = (sm.name && metaMap && metaMap[sm.name]) ? metaMap[sm.name] : {};
    
    const supaHome = sm.home_score !== undefined && sm.home_score !== null && Number(sm.home_score) > 0 ? Number(sm.home_score) : null;
    const supaAway = sm.away_score !== undefined && sm.away_score !== null && Number(sm.away_score) > 0 ? Number(sm.away_score) : null;
    const metaHome = supaMeta.overrideTeamScore !== undefined && supaMeta.overrideTeamScore !== null ? Number(supaMeta.overrideTeamScore) : null;
    const metaAway = supaMeta.overrideOppScore !== undefined && supaMeta.overrideOppScore !== null ? Number(supaMeta.overrideOppScore) : null;
    const directPts = sm.pts !== undefined && sm.pts !== null && Number(sm.pts) > 0 ? Number(sm.pts) : null;
    const directOppPts = sm.oppPts !== undefined && sm.oppPts !== null && Number(sm.oppPts) > 0 ? Number(sm.oppPts) : null;

    let a = sm.analytics;
    if (!a && Array.isArray(sm.events) && sm.events.length > 0) {
      a = calculateMatchAnalytics(sm.events, [], [], { teamScore: supaHome ?? metaHome ?? directPts, oppScore: supaAway ?? metaAway ?? directOppPts });
    }

    const pts = supaHome ?? metaHome ?? directPts ?? (a?.teamOverview?.pts || 0);
    const oppPts = supaAway ?? metaAway ?? directOppPts ?? (a?.teamOverview?.opponentScore || 0);
    const diff = pts - oppPts;
    const isWin = pts > oppPts;

    const rawDate = sm.match_date ? String(sm.match_date).split('T')[0] : (sm.matchDate || supaMeta.matchDate || (sm.createdAt ? sm.createdAt.split('T')[0] : 'n.a.'));
    const sDate = rawDate && rawDate !== 'n.a.' ? String(rawDate).slice(0, 10) : 'n.a.';
    const sName = sm.name || sm.match_name || `Partita ${smIdx + 1}`;
    const oppName = sm.opponent || sm.opponentName || sm.opponent_name || sName.replace(/^BBA\s*(vs|contro|-)\s*/i, '').trim() || sName;
    const isHome = sm.is_home !== undefined ? Boolean(sm.is_home) : (sm.isHomeGame !== undefined ? Boolean(sm.isHomeGame) : true);

    const isOfficial = matchesFilterType(sType, 'OFFICIAL');
    const finalMatchType = isOfficial ? 'Official' : sType;

    mergedLogs.push({
      id: sm.id || `supa_${sName}_${smIdx}`,
      matchFid: null,
      date: sDate,
      match_date: sDate,
      matchDate: sDate,
      round: isOfficial ? `G${mergedLogs.length + 1}` : 'AMICH.',
      gameLabel: isOfficial ? `G${mergedLogs.length + 1}` : `A${smIdx + 1}`,
      opponent: oppName,
      isHomeGame: isHome,
      location: isHome ? 'Casa' : 'Trasferta',
      matchType: finalMatchType,

      home_score: pts,
      away_score: oppPts,
      pts,
      oppPts,
      diff,
      isWin,
      resultText: isWin ? 'V' : (pts === oppPts ? 'P' : 'S'),
      partials: sm.partials || [],

      ast: a?.teamOverview?.ast ?? null,
      tov: a?.teamOverview?.tov ?? null,
      astTovRatio: a?.ballControlAnalysis?.astTovRatio ?? null,
      rebTotal: a ? ((a.teamOverview?.dreb || 0) + (a.teamOverview?.oreb || 0)) : null,
      drbPct: a?.reboundingAnalysis?.drbPct ?? null,
      efgPct: a?.shootingPercentages?.efgPct ?? null,
      pir: a?.teamOverview?.pir ?? null,

      fipVerified: false,
      hasSupabaseScout: Boolean(sm && ((Array.isArray(sm.events) && sm.events.length > 0) || sm.hasSupabaseScout || true)),
      rawFip: null,
      rawSupa: sm,
      events: sm.events || []
    });
  });

  return mergedLogs.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}