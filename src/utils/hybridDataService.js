/**
 * src/utils/hybridDataService.js
 * 
 * BBA Hybrid Analytics Engine
 * Unifies 100% reliable FIP Official Data with Supabase Advanced Scouting Data.
 * 
 * Hierarchy of Truth:
 * - FIP is King: Points, Scores, Partials, Record, Minutes, Starting %, FG%/FT%, Fouls.
 * - Supabase is King: Assists (AST), Turnovers (TOV), Rebounds (OREB, DREB, DRB%), Steals, Blocks, eFG%.
 */

import { DEFAULT_MASTER_ROSTER } from '../data/roster.js';
import { calculateMatchAnalytics } from './basketballAnalytics.js';

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

  // If array of active matches (dynamically filtered)
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

  // Fallback to legacy fipTrends object
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

  // If firstName already includes or ends with lastName, avoid duplication
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
 * Extracts per-player aggregates and efficiency from Supabase raw scouting logs
 */
export function aggregateSupabasePlayerStats(scoutingLogs = []) {
  const playerStatsMap = {};

  (scoutingLogs || []).forEach(row => {
    const num = String(row.Number || '').trim();
    const name = (row.Player || '').trim();
    if (!num && !name) return;

    const key = num || name;
    if (!playerStatsMap[key]) {
      playerStatsMap[key] = {
        number: num,
        name: name,
        matches: new Set(),
        ast: 0,
        tov: 0,
        dreb: 0,
        oreb: 0,
        stl: 0,
        blk: 0,
        fg2m: 0, fg2a: 0,
        fg3m: 0, fg3a: 0,
        ftm: 0, fta: 0
      };
    }

    if (row.Match_Name) playerStatsMap[key].matches.add(row.Match_Name);

    const act = (row.Action || '').trim();
    const cat = (row.Category || '').trim();

    if (act.includes('Assist') || cat === 'Passing') playerStatsMap[key].ast++;
    else if (act.includes('Turnover') || cat === 'Turnover') playerStatsMap[key].tov++;
    else if (act.includes('Def Rebound')) playerStatsMap[key].dreb++;
    else if (act.includes('Off Rebound')) playerStatsMap[key].oreb++;
    else if (act.includes('Steal') || (cat === 'Defense' && act === 'Steal')) playerStatsMap[key].stl++;
    else if (act.includes('Block') || (cat === 'Defense' && act === 'Block')) playerStatsMap[key].blk++;
    else if (act === '2PT Made' || act === '2PT Fatto') { playerStatsMap[key].fg2m++; playerStatsMap[key].fg2a++; }
    else if (act === '2PT Missed' || act === '2PT Sbagliato') { playerStatsMap[key].fg2a++; }
    else if (act === '3PT Made' || act === '3PT Fatto') { playerStatsMap[key].fg3m++; playerStatsMap[key].fg3a++; }
    else if (act === '3PT Missed' || act === '3PT Sbagliato') { playerStatsMap[key].fg3a++; }
    else if (act === 'FT Made' || act === 'TL Fatto' || act === 'Tiro Libero Fatto') { playerStatsMap[key].ftm++; playerStatsMap[key].fta++; }
    else if (act === 'FT Missed' || act === 'TL Sbagliato' || act === 'Tiro Libero Sbagliato') { playerStatsMap[key].fta++; }
  });

  // Calculate per-game averages & efficiency percentages
  const aggregatedMap = {};
  for (const [key, p] of Object.entries(playerStatsMap)) {
    const gp = p.matches.size || 1;
    const totalReb = p.dreb + p.oreb;
    const astAvg = Number((p.ast / gp).toFixed(1));
    const rebAvg = Number((totalReb / gp).toFixed(1));
    const drebAvg = Number((p.dreb / gp).toFixed(1));
    const orebAvg = Number((p.oreb / gp).toFixed(1));
    const tovAvg = Number((p.tov / gp).toFixed(1));
    const stlAvg = Number((p.stl / gp).toFixed(1));
    const blkAvg = Number((p.blk / gp).toFixed(1));
    const astTovRatio = p.tov > 0 ? Number((p.ast / p.tov).toFixed(2)) : (p.ast > 0 ? Number(p.ast.toFixed(2)) : 0.0);

    const fga = p.fg2a + p.fg3a;
    const fgm = p.fg2m + p.fg3m;
    const efgPct = fga > 0 ? Math.round(((fgm + 0.5 * p.fg3m) / fga) * 100) : null;
    const twoPct = p.fg2a > 0 ? Math.round((p.fg2m / p.fg2a) * 100) : null;
    const threePct = p.fg3a > 0 ? Math.round((p.fg3m / p.fg3a) * 100) : null;
    const ftPct = p.fta > 0 ? Math.round((p.ftm / p.fta) * 100) : null;

    const dataObj = {
      number: p.number,
      name: p.name,
      gpSupabase: gp,
      astAvg,
      rebAvg,
      drebAvg,
      orebAvg,
      tovAvg,
      stlAvg,
      blkAvg,
      astTovRatio,
      twoPct,
      threePct,
      ftPct,
      efgPct,
      fg2m: p.fg2m,
      fg2a: p.fg2a,
      fg3m: p.fg3m,
      fg3a: p.fg3a,
      ftm: p.ftm,
      fta: p.fta
    };

    aggregatedMap[key] = dataObj;
    if (p.number) aggregatedMap[`num_${p.number}`] = dataObj;
    if (p.name) aggregatedMap[`name_${p.name.toLowerCase()}`] = dataObj;
  }

  return aggregatedMap;
}

/**
 * Merges BBA Roster from FIP with Supabase Advanced Playmaking & Hustle stats.
 * Applies the Truth Hierarchy (FIP for Volume, Supabase for Efficiency).
 * 
 * - PG (Presenze/Games): Counts games player was on roster (convocato), NOT just MIN > 0.
 * - START %: (Games Started / PG) * 100. Never divided by total team games.
 * - Global Filter: When filterType is 'OFFICIAL' or 'FRIENDLY', metrics reflect only matches of that type.
 */
export function buildSuperchargedBbaRoster(
  fipRoster = [], 
  supabaseLogs = [], 
  startersData = null, 
  filterType = 'ALL',
  matchMetadataMap = {}
) {
// 1. Filter Supabase logs according to global matchType filter
  let activeLogs = supabaseLogs || [];
  if (normalizeFilterType(filterType) !== 'ALL') {
    activeLogs = activeLogs.filter(row => {
      const mName = row.Match_Name || row.match_name || row.nome_partita || '';
      
      // Cerchiamo i metadati della partita reale passati dal database
      const meta = matchMetadataMap[mName] || 
                   Object.values(matchMetadataMap).find(m => m.name === mName) || 
                   {};
      
      // Leggiamo il tipo di partita REALE dal DB. 
      // Se non lo troviamo, il fallback logico per i dati di scouting interni è 'Friendly', 
      // non 'Official' (visto che i dati FIP ufficiali entrano da un altro flusso).
      const mType = meta.matchType || meta.match_type || 'Friendly'; 
      
      return matchesFilterType(mType, filterType);
    });
  }

  const supabaseMap = aggregateSupabasePlayerStats(activeLogs);
  const baseList = (fipRoster && fipRoster.length > 0) ? fipRoster : DEFAULT_MASTER_ROSTER;

  // Build indexed starters lookup maps
  const startersPlayers = startersData?.players || (Array.isArray(startersData) ? startersData : []);
  const startersByFid = new Map();
  const startersByName = new Map();
  const startersByNum = new Map();

  startersPlayers.forEach(s => {
    if (s.fid) startersByFid.set(String(s.fid), s);
    const fullName = `${s.name || ''} ${s.lastName || ''}`.trim().toLowerCase();
    if (fullName) startersByName.set(fullName, s);
    if (s.number) startersByNum.set(String(s.number), s);
  });

  return baseList.map((player, idx) => {
    const num = String(player.number || (idx + 1)).trim();
    const cleanName = formatPlayerFullName(player.name, player.lastName) || `Giocatore #${num}`;

    // Lookup in Supabase map
    const supaData = supabaseMap[num] || 
                     supabaseMap[`num_${num}`] || 
                     supabaseMap[`name_${cleanName.toLowerCase()}`] || 
                     null;

    const fipStats = player.stats || {};
    
    // Strict lookup for starter entry: fid > full name > number (only if not belonging to another fid)
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

    // Case A: Friendly filter (FIP has zero friendly games - Supabase priority)
    if (matchesFilterType('FRIENDLY', filterType) && !matchesFilterType('OFFICIAL', filterType)) {
      const gp = supaData?.gpSupabase || 0;
      const ptsTotal = supaData ? (supaData.fg2m * 2 + supaData.fg3m * 3 + supaData.ftm) : 0;
      const ptsAvg = gp > 0 ? Number((ptsTotal / gp).toFixed(1)) : 0.0;

      return {
        ...player,
        fid: player.fid || `bba_p_${num}`,
        number: num,
        name: cleanName,
        captain: Boolean(player.captain),
        starting: false,
        startPercentage: '—', // FIP-exclusive -> explicitly rendered as —
        startsCount: 0,
        games: gp,
        timePlayedAVG: null, // FIP-exclusive -> explicitly rendered as —
        pointsAVG: ptsAvg,
        twoMadeAVG: gp > 0 && supaData ? Number((supaData.fg2m / gp).toFixed(1)) : 0,
        threeMadeAVG: gp > 0 && supaData ? Number((supaData.fg3m / gp).toFixed(1)) : 0,
        foulsAVG: 0,
        plusMinusAVG: 0,

        // Efficiency strictly from Supabase friendly logs
        twoPct: supaData?.twoPct ?? null,
        threePct: supaData?.threePct ?? null,
        ftPct: supaData?.ftPct ?? null,
        rebAvg: supaData ? supaData.rebAvg : null,
        astAvg: supaData ? supaData.astAvg : null,
        tovAvg: supaData ? supaData.tovAvg : null,
        drebAvg: supaData ? supaData.drebAvg : null,
        orebAvg: supaData ? supaData.orebAvg : null,
        stlAvg: supaData ? supaData.stlAvg : null,
        blkAvg: supaData ? supaData.blkAvg : null,
        efgPct: supaData ? supaData.efgPct : null,

        fipVerified: false,
        hasSupabaseStats: Boolean(supaData && gp > 0),
        stats: {
          games: gp,
          timePlayedAVG: 0,
          pointsAVG: ptsAvg || 0
        }
      };
    }

    // Case B: Default (ALL or OFFICIAL)
    // PG (Presenze/Convocazioni): Count of official matches player appears in FIP roster
    const rawPg = Number(fipStats.games ?? player.games ?? 0);
    // IGNORIAMO il flag nativo player.starting della FIP (che genera 8 titolari finti).
    // Ci fidiamo ESCLUSIVAMENTE del nostro incrocio col boxscore Q1 (starterEntry).
    const startsCount = Number(starterEntry?.startsCount ?? (player.startPercentage !== '—' && player.startsCount ? player.startsCount : 0));    // Ensure PG is always at least equal to startsCount to prevent percentages > 100%
    const pg = Math.max(rawPg, startsCount);

    // START %: Strictly (Games Started / PG) * 100, capped at 100%
    let startPct = '0%';
    if (pg > 0) {
      startPct = `${Math.min(100, Math.round((startsCount / pg) * 100))}%`;
    }

    return {
      ...player,
      fid: player.fid || `bba_p_${num}`,
      number: num,
      name: cleanName,
      captain: Boolean(player.captain),
      starting: Boolean(player.starting || (startsCount > 0)),
      startPercentage: startPct,
      startsCount,

      // FIP Official Columns (Truth for Volume, Points & Minutes)
      games: pg,
      timePlayedAVG: fipStats.timePlayedAVG ?? player.timePlayedAVG ?? 0,
      pointsAVG: fipStats.pointsAVG ?? player.pointsAVG ?? 0,
      twoMadeAVG: fipStats.inArcThrowsAVG ?? fipStats.twoMadeAVG ?? player.twoMadeAVG ?? 0,
      threeMadeAVG: fipStats.outArcThrowsAVG ?? fipStats.threeMadeAVG ?? player.threeMadeAVG ?? 0,
      foulsAVG: fipStats.foulsAVG ?? player.foulsAVG ?? 0,
      plusMinusAVG: fipStats.plusMinusAVG ?? player.plusMinusAVG ?? 0,

      // Supabase Proprietary Columns (Truth for Efficiency, Playmaking & Hustle)
      // STRICT RULE: Efficiency metrics come EXCLUSIVELY from Supabase.
      // If Supabase scouting is absent, they are null ('—') - NEVER FIP 100%.
      twoPct: supaData?.twoPct ?? null,
      threePct: supaData?.threePct ?? null,
      ftPct: supaData?.ftPct ?? null,
      rebAvg: supaData ? supaData.rebAvg : null,
      astAvg: supaData ? supaData.astAvg : null,
      tovAvg: supaData ? supaData.tovAvg : null,
      drebAvg: supaData ? supaData.drebAvg : null,
      orebAvg: supaData ? supaData.orebAvg : null,
      stlAvg: supaData ? supaData.stlAvg : null,
      blkAvg: supaData ? supaData.blkAvg : null,
      efgPct: supaData ? supaData.efgPct : null,

      // Badging & Verification Status
      fipVerified: true,
      hasSupabaseStats: Boolean(supaData),
      stats: {
        ...fipStats,
        games: pg,
        assistsAVG: supaData ? supaData.astAvg : (fipStats.assistsAVG || 0),
        reboundsAVG: supaData ? supaData.rebAvg : (fipStats.reboundsAVG || 0)
      }
    };
  });
}

/**
 * Builds a unified list of matches combining FIP official matches and Supabase matches.
 * - FIP matches are inherently and immutably tagged as matchType: 'Official'.
 * - When merging FIP with Supabase, FIP 'Official' status, Date, and Final Score override Supabase metadata.
 * - If Supabase has events, they are attached for playmaking & hustle calculations.
 * - Non-FIP matches (e.g. Friendlies) are retained with their own metadata.
 */
export function buildUnifiedMatchList(fipLog = [], supabaseMatches = [], metaMap = {}) {
  const unified = [];
  const matchedSupaNames = new Set();

  // 1. Process FIP official matches (FIP is King and Official status is IMMUTABLE)
  (fipLog || []).forEach((fipMatch, idx) => {
    const fipDate = (fipMatch.date || '').slice(0, 10);
    const homeTeam = (fipMatch.homeTeam || '').trim();
    const awayTeam = (fipMatch.awayTeam || '').trim();
    const isHome = Boolean(fipMatch.isHomeGame);
    const oppName = isHome ? awayTeam : homeTeam;
    const oppLower = oppName.toLowerCase();

    // Find corresponding match in Supabase
    const matchedSupa = (supabaseMatches || []).find(sm => {
      if (matchedSupaNames.has(sm.name)) return false;
      const sDate = (sm.matchDate || sm.createdAt || '').slice(0, 10);
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
    
    // Check if Supabase has a score override (scouting_matches home_score/away_score or metaMap)
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

    // SUPABASE OVERRIDES FIP FOR FINAL SCORE IF OVERRIDE EXISTS
    const finalScored = (hasSupaScoreOverride && supaTeamScore !== null) ? supaTeamScore : fipScored;
    const finalConceded = (hasSupaScoreOverride && supaOppScore !== null) ? supaOppScore : fipConceded;
    const diff = finalScored - finalConceded;
    const isWin = finalScored > finalConceded;

    // Date override: Supabase manual date overrides FIP date
    const manualDate = matchedSupa?.matchDate || supaMeta?.matchDate;
    const finalDate = (manualDate && manualDate !== 'n.a.') ? manualDate : (fipDate || 'n.a.');

    const displayName = matchedSupa?.name || (isHome ? `BBA vs ${oppName}` : `${oppName} vs BBA`);

    // Quarter Partials: Normalized with scored, conceded, diff (FIP remains source for partials)
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
      matchType: 'Official', // FIP = Official (IMMUTABLE)
      matchDate: finalDate, // Supabase manual date overrides
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
      fipVerified: true,
      hasSupabaseScout: Boolean(matchedSupa),
      isScoreOverridden: hasSupaScoreOverride,
      rawFip: fipMatch,
      rawSupa: matchedSupa
    });
  });

  // 2. Add remaining non-FIP Supabase matches (e.g. Friendlies / Scrimmages)
  (supabaseMatches || []).forEach((sm, smIdx) => {
    if (matchedSupaNames.has(sm.name)) return;

    const meta = metaMap[sm.name] || {};
    const matchType = sm.match_type || sm.matchType || meta.matchType || 'Friendly';
    const sDate = sm.match_date ? String(sm.match_date).split('T')[0] : (sm.matchDate || meta.matchDate || sm.createdAt || '').slice(0, 10);

    // Single source of truth for scores
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

  // 1. Process FIP logs (FIP official matches)
  if (matchesFilterType('OFFICIAL', filterType)) {
    (fipLog || []).forEach((fipMatch, idx) => {
      const fipDate = (fipMatch.date || '').slice(0, 10);
      const homeTeam = fipMatch.homeTeam || '';
      const awayTeam = fipMatch.awayTeam || '';
      const isHome = Boolean(fipMatch.isHomeGame);
      const oppName = isHome ? awayTeam : homeTeam;
      const oppLower = oppName.toLowerCase();

      // Search for match in Supabase by date or opponent name keyword
      const matchedSupa = (supabaseMatches || []).find(sm => {
        const sDate = (sm.matchDate || sm.createdAt || '').slice(0, 10);
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

      // SUPABASE OVERRIDES FIP IF SCORE OVERRIDE EXISTS
      const finalPts = (hasSupaScoreOverride && supaTeamScore !== null) ? supaTeamScore : fipPts;
      const finalOppPts = (hasSupaScoreOverride && supaOppScore !== null) ? supaOppScore : fipOppPts;
      const diff = finalPts - finalOppPts;
      const isWin = finalPts > finalOppPts;

      const manualDate = matchedSupa?.matchDate || supaMeta?.matchDate;
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

        // Supabase Hustle & Playmaking (Graceful fallback to null / '-')
        ast: supaAnalytics?.teamOverview?.ast ?? null,
        tov: supaAnalytics?.teamOverview?.tov ?? null,
        astTovRatio: supaAnalytics?.ballControlAnalysis?.astTovRatio ?? null,
        rebTotal: supaAnalytics ? ((supaAnalytics.teamOverview?.dreb || 0) + (supaAnalytics.teamOverview?.oreb || 0)) : null,
        drbPct: supaAnalytics?.reboundingAnalysis?.drbPct ?? null,
        efgPct: supaAnalytics?.shootingPercentages?.efgPct ?? null,
        pir: supaAnalytics?.teamOverview?.pir ?? null,

        fipVerified: true,
        hasSupabaseScout: Boolean(matchedSupa && Array.isArray(matchedSupa.events) && matchedSupa.events.length > 0),
        isScoreOverridden: hasSupaScoreOverride,
        rawFip: fipMatch,
        rawSupa: matchedSupa
      });
    });
  }

  // 2. Add remaining matches from Supabase (Official not in FIP, or Friendlies)
  (supabaseMatches || []).forEach((sm, smIdx) => {
    const sType = sm.match_type || sm.matchType || 'Friendly';
    if (!matchesFilterType(sType, filterType)) return;

    // Check if this Supabase match was already incorporated via FIP match in Part 1
    const alreadyIncorporatedInFip = mergedLogs.some(ml => 
      (sm.id && ml.id === sm.id) ||
      (sm.name && ml.rawSupa?.name === sm.name)
    );
    if (alreadyIncorporatedInFip) return;

    const supaMeta = (sm.name && metaMap && metaMap[sm.name]) ? metaMap[sm.name] : {};
    
    // Strict Single Source of Truth for final match scores:
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

    // NEVER dynamically reduce events if match has official scores
    const pts = supaHome ?? metaHome ?? directPts ?? (a?.teamOverview?.pts || 0);
    const oppPts = supaAway ?? metaAway ?? directOppPts ?? (a?.teamOverview?.opponentScore || 0);
    const diff = pts - oppPts;
    const isWin = pts > oppPts;

    // Strict date from scouting_matches: match_date takes absolute priority over createdAt
    const rawDate = sm.match_date || sm.matchDate || supaMeta.matchDate || (sm.createdAt ? sm.createdAt.split('T')[0] : 'n.a.');
    const sDate = rawDate && rawDate !== 'n.a.' ? String(rawDate).slice(0, 10) : 'n.a.';
    const sName = sm.name || sm.match_name || `Partita ${smIdx + 1}`;
    const oppName = sm.opponent || sm.opponentName || sm.opponent_name || sName.replace(/^BBA\s*(vs|contro|-)\s*/i, '').trim() || sName;
    const isHome = sm.is_home !== undefined ? Boolean(sm.is_home) : (sm.isHomeGame !== undefined ? Boolean(sm.isHomeGame) : true);

    mergedLogs.push({
      id: sm.id || `supa_${sName}_${smIdx}`,
      matchFid: null,
      date: sDate,
      match_date: sDate,
      matchDate: sDate,
      round: sType === 'Official' ? `G${mergedLogs.length + 1}` : 'AMICH.',
      gameLabel: sType === 'Official' ? `G${mergedLogs.length + 1}` : `A${smIdx + 1}`,
      opponent: oppName,
      isHomeGame: isHome,
      location: isHome ? 'Casa' : 'Trasferta',
      matchType: sType,

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
      hasSupabaseScout: Boolean(sm && Array.isArray(sm.events) && sm.events.length > 0),
      rawFip: null,
      rawSupa: sm,
      events: sm.events || []
    });
  });

  // Sort chronologically (oldest to newest for charts, or newest to oldest for tables)
  return mergedLogs.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}
