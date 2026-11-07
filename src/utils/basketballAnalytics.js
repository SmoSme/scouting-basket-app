import { COURT_ZONES, DEFAULT_MASTER_ROSTER } from '../data/roster.js';

export const getAz = (e) => String(e?.Action || e?.action || e?.Azione || e?.azione || '');
export const getNum = (e) => String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '');
export const getZona = (e) => String(e?.Zone || e?.zone || e?.Zona || e?.zona || '');
export const getGiocatore = (e) => String(e?.Player || e?.player || e?.Giocatore || e?.giocatore || '');
export const getQtr = (e) => {
  const raw = String(e?.Quarter || e?.quarter || e?.Quarto || e?.quarto || 'Q1').trim().toUpperCase();
  if (raw.startsWith('Q1') || raw === '1') return 'Q1';
  if (raw.startsWith('Q2') || raw === '2') return 'Q2';
  if (raw.startsWith('Q3') || raw === '3') return 'Q3';
  if (raw.startsWith('Q4') || raw === '4') return 'Q4';
  if (raw.startsWith('OT')) return raw;
  return 'Q1';
};

/**
 * Check if an event represents an opponent score (MADE shot or positive point addition)
 * Strictly excludes opponent missed shots (OPP_2PT_MISSED, OPP_3PT_MISSED, OPP_FT_MISSED)
 * and opponent rebounds/turnovers/fouls.
 * Supports both new situational tags (OPP_FT_MADE, OPP_2PT_MADE, OPP_3PT_MADE)
 * and legacy tags (+1 OPP, +2 OPP, +3 OPP, OPP_SCORE).
 */
export const isOpponentScoreEvent = (e) => {
  const cat = String(e?.Category || e?.category || e?.Categoria || e?.categoria || '').toLowerCase();
  const az = getAz(e);
  const azUpper = az.toUpperCase().trim();
  const num = getNum(e);
  const player = getGiocatore(e);

  const isOpp = 
    cat === 'opponent' || 
    cat.includes('opp') ||
    azUpper.includes('OPP') || 
    az.toLowerCase().startsWith('opponent') ||
    azUpper.startsWith('OPP_') ||
    num === 'OPP' ||
    player.toUpperCase() === 'OPPONENT';

  if (!isOpp) return false;

  const azLower = az.toLowerCase();
  if (
    azLower.includes('miss') ||
    azLower.includes('sbagliato') ||
    azLower.includes('reb') ||
    azLower.includes('rimb') ||
    azLower.includes('tov') ||
    azLower.includes('persa') ||
    azLower.includes('foul') ||
    azLower.includes('fallo')
  ) {
    return false;
  }

  return getOpponentPoints(e) !== 0;
};

/**
 * Extract points from opponent score event:
 * - New tags: OPP_FT_MADE (=1), OPP_2PT_MADE (=2), OPP_3PT_MADE (=3), OPP_1PT_MADE (=1)
 * - Legacy tags: +1 OPP, +2 OPP, +3 OPP, OPP_SCORE, Opponent Scored +X
 * - Score corrections: -1, -2, -3
 * Returns 0 for missed shots, rebounds, turnovers, or fouls.
 */
export const getOpponentPoints = (e) => {
  const az = getAz(e);
  const azUpper = az.toUpperCase().trim();
  const azLower = az.toLowerCase().trim();

  // Exclude misses and non-scoring plays
  if (
    azLower.includes('miss') ||
    azLower.includes('sbagliato') ||
    azLower.includes('reb') ||
    azLower.includes('rimb') ||
    azLower.includes('tov') ||
    azLower.includes('persa') ||
    azLower.includes('foul') ||
    azLower.includes('fallo')
  ) {
    return 0;
  }

  // Score correction negative adjustment (explicitly match correction phrasing or -X OPP)
  if (
    azUpper.includes('CORRECTED -3') ||
    azUpper.includes('SCORE CORRECTED -3') ||
    azUpper.includes('-3 OPP') ||
    az.startsWith('-3') ||
    azUpper === '-3'
  ) {
    return -3;
  }

  if (
    azUpper.includes('CORRECTED -2') ||
    azUpper.includes('SCORE CORRECTED -2') ||
    azUpper.includes('-2 OPP') ||
    az.startsWith('-2') ||
    azUpper === '-2'
  ) {
    return -2;
  }

  if (
    azUpper.includes('CORRECTED -1') ||
    azUpper.includes('SCORE CORRECTED -1') ||
    azUpper.includes('-1 OPP') ||
    az.startsWith('-1') ||
    azUpper === '-1'
  ) {
    return -1;
  }

  // 3-point score checks
  if (
    azUpper.includes('OPP_3PT_MADE') ||
    azUpper.includes('3PT MADE') ||
    azUpper.includes('3 PT MADE') ||
    azUpper.includes('+3 OPP') ||
    azUpper.includes('OPP +3') ||
    azUpper.includes('OPP_SCORE +3') ||
    azUpper.includes('OPP_SCORE_3') ||
    azUpper.includes('+3')
  ) {
    return 3;
  }

  // 2-point score checks
  if (
    azUpper.includes('OPP_2PT_MADE') ||
    azUpper.includes('2PT MADE') ||
    azUpper.includes('2 PT MADE') ||
    azUpper.includes('+2 OPP') ||
    azUpper.includes('OPP +2') ||
    azUpper.includes('OPP_SCORE +2') ||
    azUpper.includes('OPP_SCORE_2') ||
    azUpper.includes('+2')
  ) {
    return 2;
  }

  // 1-point score checks (Free Throws)
  if (
    azUpper.includes('OPP_FT_MADE') ||
    azUpper.includes('OPP_1PT_MADE') ||
    azUpper.includes('FT MADE') ||
    azUpper.includes('1PT MADE') ||
    azUpper.includes('1 PT MADE') ||
    azUpper.includes('+1 OPP') ||
    azUpper.includes('OPP +1') ||
    azUpper.includes('OPP_SCORE +1') ||
    azUpper.includes('OPP_SCORE_1') ||
    azUpper.includes('+1')
  ) {
    return 1;
  }

  // Generic OPP_SCORE format with regex extraction: OPP_SCORE_X or OPP_SCORE X
  const match = az.match(/OPP_SCORE[_\s]*([123])/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 0;
};

/**
 * Compute total points scored by BBA team
 */
export const calculateTeamScore = (events = []) => {
  if (!Array.isArray(events)) return 0;
  return events.reduce((acc, ev) => {
    const az = getAz(ev);
    if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
    if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
    if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
    return acc;
  }, 0);
};

/**
 * Compute total points scored by Opponent
 */
export const calculateOpponentScore = (events = []) => {
  if (!Array.isArray(events)) return 0;
  return events.reduce((acc, ev) => {
    if (isOpponentScoreEvent(ev)) {
      return acc + getOpponentPoints(ev);
    }
    return acc;
  }, 0);
};

/**
 * Ensure an array has exactly 5 unique player numbers by filling from fallback players.
 * Guarantees that every scoring event is attributed to exactly 5 on-court players.
 */
export function ensureFivePlayers(lineup = [], fallbackPlayers = []) {
  const set = new Set();
  (lineup || []).forEach(n => {
    const s = String(n).trim();
    if (s && s !== '-' && s !== 'TEAM' && s !== 'SUB' && s !== 'OPP') {
      set.add(s);
    }
  });

  if (set.size < 5) {
    for (const p of fallbackPlayers) {
      const numStr = String(p?.number ?? p).trim();
      if (numStr && numStr !== '-' && numStr !== 'TEAM' && numStr !== 'SUB' && numStr !== 'OPP' && !set.has(numStr)) {
        set.add(numStr);
        if (set.size === 5) break;
      }
    }
  }

  return Array.from(set).slice(0, 5);
}

/**
 * Event-Driven Time-Independent Plus/Minus (+/-) Engine
 * 1. Every player starts at 0.
 * 2. Substitutions do NOT modify anyone's +/- (bench freezes accumulated +/-, entering player starts at 0 or previous stint).
 * 3. Only scoring events while a player is actively on court change +/-:
 *    - Team FT (+1), 2PT (+2), 3PT (+3) -> add to the 5 on-court players at that moment.
 *    - Opponent score (+1, +2, +3) -> subtract from the 5 on-court players at that moment.
 * 4. Derived purely from the chronological event stream (undo & delete safe).
 * 5. Mathematically guaranteed invariant: sum(plusMinus across all roster) === 5 * (teamScore - oppScore).
 */
export function calculatePlusMinus(events = [], startingOnCourtNums = [], customRoster = []) {
  const safeEvents = Array.isArray(events) ? events : [];

  // All known players to initialize plus/minus to 0
  const allKnownPlayers = [
    ...(Array.isArray(customRoster) ? customRoster : []),
    ...DEFAULT_MASTER_ROSTER
  ];

  const plusMinusMap = {};
  allKnownPlayers.forEach(p => {
    plusMinusMap[String(p.number)] = 0;
  });

  if (Array.isArray(startingOnCourtNums)) {
    startingOnCourtNums.forEach(n => {
      const s = String(n).trim();
      if (s && s !== '-' && s !== 'TEAM' && s !== 'SUB' && s !== 'OPP') {
        plusMinusMap[s] = plusMinusMap[s] || 0;
      }
    });
  }

  // Include any player appearing in event Number or onCourtPlayerIds
  safeEvents.forEach(e => {
    const num = getNum(e);
    if (num && num !== '-' && num !== 'TEAM' && num !== 'SUB' && num !== 'OPP') {
      if (plusMinusMap[num] === undefined) plusMinusMap[num] = 0;
    }
    const oc = e.onCourtPlayerIds || e.onCourtNums;
    if (Array.isArray(oc)) {
      oc.forEach(n => {
        const s = String(n).trim();
        if (s && s !== '-' && s !== 'TEAM' && s !== 'SUB' && s !== 'OPP') {
          if (plusMinusMap[s] === undefined) plusMinusMap[s] = 0;
        }
      });
    }
  });

  // Reconstruct active 5-man lineup chronologically from match start
  let runningLineup = [];
  if (Array.isArray(startingOnCourtNums) && startingOnCourtNums.length >= 5) {
    runningLineup = ensureFivePlayers(startingOnCourtNums, allKnownPlayers);
  } else if (safeEvents.length > 0 && Array.isArray(safeEvents[0].onCourtPlayerIds) && safeEvents[0].onCourtPlayerIds.length >= 5) {
    runningLineup = ensureFivePlayers(safeEvents[0].onCourtPlayerIds, allKnownPlayers);
  } else {
    // Collect active players from early plays before any substitution
    const earlyPlayers = [];
    for (const e of safeEvents) {
      const az = getAz(e);
      const cat = String(e?.Category || e?.category || '');
      if (cat === 'Substitution' || az.startsWith('SUB:') || az.startsWith('Sub:')) {
        break;
      }
      const num = getNum(e);
      if (num && num !== '-' && num !== 'TEAM' && num !== 'SUB' && num !== 'OPP' && !earlyPlayers.includes(num)) {
        earlyPlayers.push(num);
      }
    }

    const seedLineup = earlyPlayers.length >= 5
      ? earlyPlayers
      : [
          ...earlyPlayers,
          ...((Array.isArray(startingOnCourtNums) && startingOnCourtNums.length > 0)
            ? startingOnCourtNums
            : (Array.isArray(customRoster) && customRoster.length >= 5)
              ? customRoster.map(p => String(p.number))
              : DEFAULT_MASTER_ROSTER.map(p => String(p.number)))
        ];

    runningLineup = ensureFivePlayers(seedLineup, allKnownPlayers);
  }

  // Iterate chronologically through events
  safeEvents.forEach(ev => {
    const az = getAz(ev);
    const cat = String(ev?.Category || ev?.category || '');

    // Check for Substitution
    if (cat === 'Substitution' || az.startsWith('SUB:') || az.startsWith('Sub:')) {
      const match = az.match(/SUB:\s*#?([A-Za-z0-9_-]+).*?IN\s+for\s+#?([A-Za-z0-9_-]+)/i);
      if (match) {
        const inNum = match[1].trim();
        const outNum = match[2].trim();
        const set = new Set(runningLineup);
        set.delete(outNum);
        set.add(inNum);
        runningLineup = ensureFivePlayers(Array.from(set), allKnownPlayers);
        if (plusMinusMap[inNum] === undefined) plusMinusMap[inNum] = 0;
        if (plusMinusMap[outNum] === undefined) plusMinusMap[outNum] = 0;
      } else if (Array.isArray(ev.onCourtPlayerIds) && ev.onCourtPlayerIds.length >= 5) {
        runningLineup = ensureFivePlayers(ev.onCourtPlayerIds, allKnownPlayers);
      }
      return; // Substitutions do NOT award or deduct plus/minus
    }

    // Determine 5 players on court for this event
    let eventLineup = null;
    const rawOc = ev.onCourtPlayerIds || ev.onCourtNums;
    if (Array.isArray(rawOc) && rawOc.length >= 5) {
      eventLineup = ensureFivePlayers(rawOc, allKnownPlayers);
      runningLineup = eventLineup;
    } else {
      eventLineup = ensureFivePlayers(runningLineup, allKnownPlayers);
    }

    // Check for BBA Team Scoring
    let bbaPoints = 0;
    if (az === '2PT Made' || az === '2PT Fatto') bbaPoints = 2;
    else if (az === '3PT Made' || az === '3PT Fatto') bbaPoints = 3;
    else if (az === 'FT Made' || az === 'TL Fatto') bbaPoints = 1;

    // Check for Opponent Scoring
    let oppPoints = 0;
    if (isOpponentScoreEvent(ev)) {
      oppPoints = getOpponentPoints(ev);
    }

    if (bbaPoints > 0) {
      // Ensure scorer is inside eventLineup if known
      const scorerNum = getNum(ev);
      if (scorerNum && scorerNum !== '-' && scorerNum !== 'TEAM' && scorerNum !== 'OPP' && scorerNum !== 'SUB') {
        if (!eventLineup.includes(scorerNum)) {
          // Replace last non-scorer with scorer
          eventLineup = [scorerNum, ...eventLineup.filter(n => n !== scorerNum)].slice(0, 5);
          runningLineup = eventLineup;
        }
      }

      eventLineup.forEach(pNum => {
        plusMinusMap[pNum] = (plusMinusMap[pNum] || 0) + bbaPoints;
      });
    } else if (oppPoints > 0) {
      eventLineup.forEach(pNum => {
        plusMinusMap[pNum] = (plusMinusMap[pNum] || 0) - oppPoints;
      });
    }
  });

  return plusMinusMap;
}

/**
 * Sanity verification helper: checks sum(plusMinus across all roster) === 5 * (teamScore - oppScore)
 */
export function verifyPlusMinusInvariant(plusMinusMap, events) {
  const teamScore = calculateTeamScore(events);
  const oppScore = calculateOpponentScore(events);
  const targetTotal = 5 * (teamScore - oppScore);
  const actualTotal = Object.values(plusMinusMap).reduce((a, b) => a + (Number(b) || 0), 0);
  const isValid = actualTotal === targetTotal;
  return { isValid, actualTotal, targetTotal, teamScore, oppScore };
}

/**
 * Shared Shot Zone Analytics Selector
 * Strictly filters ONLY valid 2PT and 3PT Field Goal events (excluding FT, REB, TOV, PF, OPP, etc.)
 * Produces unified stats for both the SVG Court Map and the 9-Zone Ranking Table.
 */
export function computeZoneStats(events = []) {
  const safeEvents = Array.isArray(events) ? events : [];

  // Strictly filter only true 2PT and 3PT Field Goal attempts
  const validShotEvents = safeEvents.filter(e => {
    if (!e) return false;
    const az = String(e.Action || e.action || e.Azione || e.azione || '').trim();
    const is2P = az === '2PT Made' || az === '2PT Missed' || az === '2PT Fatto' || az === '2PT Sbagliato';
    const is3P = az === '3PT Made' || az === '3PT Missed' || az === '3PT Fatto' || az === '3PT Sbagliato';
    if (!is2P && !is3P) return false;

    // Must have a valid recognized court zone (reject null, undefined, Generic, Bench)
    const zName = String(e.Zone || e.zone || e.Zona || e.zona || '').trim();
    if (!zName || zName === 'null' || zName === 'undefined' || zName === 'Generic' || zName === 'Bench') {
      return false;
    }
    return true;
  });

  const totalShotsCount = validShotEvents.length;

  const byKey = {};
  const byName = {};
  const list = Object.entries(COURT_ZONES).map(([key, zoneInfo]) => {
    const zEvents = validShotEvents.filter(e => {
      const zName = String(e.Zone || e.zone || e.Zona || e.zona || '').trim();
      return zName === zoneInfo.name;
    });

    const made = zEvents.filter(e => {
      const az = String(e.Action || e.action || e.Azione || e.azione || '');
      return az.includes('Made') || az.includes('Fatto');
    }).length;

    const attempts = zEvents.length;
    const pct = attempts > 0 ? (made / attempts) * 100 : 0;
    const shotShare = totalShotsCount > 0 ? (attempts / totalShotsCount) * 100 : 0;
    const pps = attempts > 0 ? (made * zoneInfo.val) / attempts : 0;

    // SVG Map color
    let mapColor = '#F1F5F9';
    if (attempts > 0) {
      if (pct >= 50.0) mapColor = '#0CA17A'; // Emerald 50-100%
      else if (pct >= 33.0) mapColor = '#D97706'; // Amber 33-49%
      else mapColor = '#DC2626'; // Brick red 0-32%
    }

    // Table rating and color
    const efficiencyColor = pct >= 50 ? '#0CA17A' : pct >= 33 ? '#D97706' : attempts > 0 ? '#DC2626' : '#64748B';
    const ratingLabel = pct >= 50 ? 'HOT' : pct >= 33 ? 'SOLID' : attempts > 0 ? 'COLD' : 'NO ATTEMPTS';

    const label = attempts > 0 ? `${made}/${attempts} (${Math.round(pct)}%)` : zoneInfo.name.toUpperCase();

    const zoneStat = {
      key,
      name: zoneInfo.name,
      type: zoneInfo.type,
      val: zoneInfo.val,
      made,
      attempts,
      pct: Math.round(pct * 10) / 10,
      shotShare: Math.round(shotShare * 10) / 10,
      pps: Math.round(pps * 100) / 100,
      color: mapColor,
      efficiencyColor,
      ratingLabel,
      label
    };

    byKey[key] = zoneStat;
    byName[zoneInfo.name] = zoneStat;
    return zoneStat;
  });

  const sortedList = [...list].sort((a, b) => b.attempts - a.attempts);

  return {
    zones: sortedList, // sorted for ranking table
    rawZones: list,    // in standard definition order
    byKey,             // lookup by key (e.g. byKey['PAINT'])
    byName,            // lookup by name (e.g. byName['Paint / Key'])
    totalShotsCount,
    totalMadeCount: list.reduce((acc, z) => acc + z.made, 0)
  };
}

/**
 * Advanced Basketball Analytics Engine
 * Computes direct and derived metrics according to FIBA / EuroLeague analytical standards.
 */
export function calculateMatchAnalytics(events = [], customRoster = [], startingOnCourtNums = [], scoreOverrides = null) {
  const safeEvents = Array.isArray(events) ? events : [];

  // 1. Build comprehensive player map.
  // The actual match events recorded in the database are the primary ground truth!
  const rosterMap = {};

  // Step A: Extract player names directly from the match events (from database)
  safeEvents.forEach(e => {
    const num = getNum(e);
    const name = getGiocatore(e);
    if (num && num !== '-' && num !== 'TEAM' && num !== 'SUB' && num !== 'OPP' && name && name.trim()) {
      const cleanName = name.trim();
      if (!rosterMap[num] || !rosterMap[num].name) {
        rosterMap[num] = { number: num, name: cleanName, pos: 'N/A' };
      } else if (rosterMap[num].name.startsWith('Player #') && !cleanName.startsWith('Player #')) {
        rosterMap[num].name = cleanName;
      }
    }
  });

  // Step B: For any players in customRoster, fill missing players or enrich position
  if (Array.isArray(customRoster) && customRoster.length > 0) {
    customRoster.forEach(p => {
      const num = String(p.number);
      if (!rosterMap[num]) {
        rosterMap[num] = { ...p };
      } else if (p.pos && p.pos !== 'N/A' && (!rosterMap[num].pos || rosterMap[num].pos === 'N/A')) {
        rosterMap[num].pos = p.pos;
      }
    });
  }

  // Step C: Fallback to DEFAULT_MASTER_ROSTER for any player numbers not named in events
  DEFAULT_MASTER_ROSTER.forEach(p => {
    const num = String(p.number);
    if (!rosterMap[num]) {
      rosterMap[num] = { ...p };
    } else if (p.pos && p.pos !== 'N/A' && (!rosterMap[num].pos || rosterMap[num].pos === 'N/A')) {
      rosterMap[num].pos = p.pos;
    }
  });

  // Step D: Ensure all active players logged in events have a valid object
  safeEvents.forEach(e => {
    const num = getNum(e);
    if (num && num !== '-' && num !== 'TEAM' && num !== 'SUB' && num !== 'OPP' && !rosterMap[num]) {
      rosterMap[num] = { number: num, name: `Player #${num}`, pos: 'N/A' };
    }
  });

  // Filter individual player vs team vs opponent/substitution events
  const individualEvents = safeEvents.filter(e => {
    const num = getNum(e);
    const az = getAz(e);
    const cat = String(e?.Category || e?.category || '');
    return num !== '-' && num !== 'TEAM' && num !== 'SUB' && num !== 'OPP' && 
      az !== 'Stagger' && az !== 'Ghost' && cat !== 'Substitution' && cat !== 'Opponent';
  });

  const tacticEvents = safeEvents.filter(e => {
    const az = getAz(e);
    return az === 'Stagger' || az === 'Ghost';
  });

  // Helper calculation for shooting counts
  const computeShooting = (evList) => {
    const fg2m = evList.filter(e => { const a = getAz(e); return a === '2PT Made' || a === '2PT Fatto'; }).length;
    const fg2miss = evList.filter(e => { const a = getAz(e); return a === '2PT Missed' || a === '2PT Sbagliato'; }).length;
    const fg2a = fg2m + fg2miss;

    const fg3m = evList.filter(e => { const a = getAz(e); return a === '3PT Made' || a === '3PT Fatto'; }).length;
    const fg3miss = evList.filter(e => { const a = getAz(e); return a === '3PT Missed' || a === '3PT Sbagliato'; }).length;
    const fg3a = fg3m + fg3miss;

    const ftm = evList.filter(e => { const a = getAz(e); return a === 'FT Made' || a === 'TL Fatto'; }).length;
    const ftmiss = evList.filter(e => { const a = getAz(e); return a === 'FT Missed' || a === 'TL Sbagliato'; }).length;
    const fta = ftm + ftmiss;

    const fgm = fg2m + fg3m;
    const fga = fg2a + fg3a;
    const pts = (fg2m * 2) + (fg3m * 3) + (ftm * 1);

    const pct2p = fg2a > 0 ? (fg2m / fg2a) * 100 : 0;
    const pct3p = fg3a > 0 ? (fg3m / fg3a) * 100 : 0;
    const pctFg = fga > 0 ? (fgm / fga) * 100 : 0;
    const pctFt = fta > 0 ? (ftm / fta) * 100 : 0;

    // Advanced: eFG% and TS%
    const efgPct = fga > 0 ? ((fgm + 0.5 * fg3m) / fga) * 100 : 0;
    const trueShootingAttempts = 2 * (fga + 0.44 * fta);
    const tsPct = trueShootingAttempts > 0 ? (pts / trueShootingAttempts) * 100 : 0;

    return {
      pts, fg2m, fg2miss, fg2a, pct2p,
      fg3m, fg3miss, fg3a, pct3p,
      fgm, fga, pctFg,
      ftm, ftmiss, fta, pctFt,
      efgPct, tsPct
    };
  };

  // Helper for non-shooting events
  const computeOtherStats = (evList) => {
    const oreb = evList.filter(e => { const a = getAz(e); return a === 'Off Rebound' || a === 'Rimb Offensivo'; }).length;
    const dreb = evList.filter(e => { const a = getAz(e); return a === 'Def Rebound' || a === 'Rimb Difensivo'; }).length;
    const reb = oreb + dreb;
    const ast = evList.filter(e => { const a = getAz(e); return a === 'Assist'; }).length;
    const stl = evList.filter(e => { const a = getAz(e); return a === 'Steal' || a === 'Palla Recuperata'; }).length;
    const tov = evList.filter(e => { const a = getAz(e); return a === 'Turnover' || a === 'Palla Persa'; }).length;
    const blk = evList.filter(e => { const a = getAz(e); return a === 'Block' || a === 'Stoppata Data'; }).length;
    const blka = evList.filter(e => { const a = getAz(e); return a === 'Block Allowed' || a === 'Stoppata Subita'; }).length;
    const pf = evList.filter(e => { const a = getAz(e); return a === 'Personal Foul' || a === 'Fallo Fatto'; }).length;
    const fd = evList.filter(e => { const a = getAz(e); return a === 'Foul Drawn' || a === 'Fallo Subito'; }).length;

    return { oreb, dreb, reb, ast, stl, tov, blk, blka, pf, fd };
  };

  // =========================================================================
  // 1. TEAM TOTALS & DERIVED ADVANCED STATS
  // =========================================================================
  const teamShooting = computeShooting(safeEvents);
  const teamOthers = computeOtherStats(safeEvents);

  const teamStagger = tacticEvents.filter(e => getAz(e) === 'Stagger').length;
  const teamGhost = tacticEvents.filter(e => getAz(e) === 'Ghost').length;
  const totalTactics = teamStagger + teamGhost;

  // FIBA Performance Index Rating (PIR)
  const teamPir = (teamShooting.pts + teamOthers.reb + teamOthers.ast + teamOthers.stl + teamOthers.blk + teamOthers.fd) -
    ((teamShooting.fg2miss + teamShooting.fg3miss) + teamShooting.ftmiss + teamOthers.tov + teamOthers.pf + teamOthers.blka);

  // Advanced: Possessions, Pace & Efficiency
  const estimatedPossessions = Math.max(1, (teamShooting.fga + (0.44 * teamShooting.fta) - teamOthers.oreb + teamOthers.tov));
  const ortg = (teamShooting.pts / estimatedPossessions) * 100;
  const ppp = teamShooting.pts / estimatedPossessions;
  const tovPct = (teamOthers.tov / estimatedPossessions) * 100;
  const ftRate = teamShooting.fga > 0 ? (teamShooting.fta / teamShooting.fga) : 0;
  const astTovRatio = teamOthers.tov > 0 ? teamOthers.ast / teamOthers.tov : teamOthers.ast;
  const astRatio = teamShooting.fgm > 0 ? (teamOthers.ast / teamShooting.fgm) * 100 : 0;
  const orebShare = (teamOthers.reb > 0) ? (teamOthers.oreb / teamOthers.reb) * 100 : 0;
  const tacticsPerPoss = (totalTactics / estimatedPossessions) * 100;

  // Opponent Scoring and Point Differential (respecting strict scores from scouting_matches/overrides)
  const opponentScore = (scoreOverrides?.oppScore !== undefined && scoreOverrides?.oppScore !== null && Number(scoreOverrides.oppScore) > 0)
    ? Number(scoreOverrides.oppScore)
    : calculateOpponentScore(safeEvents);

  const finalTeamPts = (scoreOverrides?.teamScore !== undefined && scoreOverrides?.teamScore !== null && Number(scoreOverrides.teamScore) > 0)
    ? Number(scoreOverrides.teamScore)
    : teamShooting.pts;

  const pointDifferential = finalTeamPts - opponentScore;

  // Shot Profile Distribution: Paint vs Mid vs 3PT
  const totalFga = teamShooting.fga > 0 ? teamShooting.fga : 1;
  const teamPaintShots = safeEvents.filter(e => getZona(e) === COURT_ZONES.PAINT.name && getAz(e).includes('PT')).length;
  const teamMidShots = safeEvents.filter(e => {
    const z = getZona(e);
    return (z === COURT_ZONES.MID_L.name || z === COURT_ZONES.MID_C.name || z === COURT_ZONES.MID_R.name) && getAz(e).includes('PT');
  }).length;
  const teamThreeShots = safeEvents.filter(e => {
    const z = getZona(e);
    return (z === COURT_ZONES.C3_L.name || z === COURT_ZONES.C3_R.name || z === COURT_ZONES.W3_L.name || z === COURT_ZONES.W3_R.name || z === COURT_ZONES.ARC3_C.name) && getAz(e).includes('PT');
  }).length;

  const pctPaint = Math.round((teamPaintShots / totalFga) * 100);
  const pctMid = Math.round((teamMidShots / totalFga) * 100);
  const pctThree = Math.round((teamThreeShots / totalFga) * 100);

  // Ball Security & Margin
  const stealTovMargin = teamOthers.stl - teamOthers.tov;
  const assistedFgmPct = teamShooting.fgm > 0 ? Math.round((teamOthers.ast / teamShooting.fgm) * 100) : 0;

  // =========================================================================
  // OPPONENT ADVANCED SHOT & REBOUND TRACKING
  // =========================================================================
  const isOppEvent = (e) => isOpponentScoreEvent(e) || String(e?.Category || e?.category || '').toLowerCase() === 'opponent' || getAz(e).toUpperCase().includes('OPP');

  const opp2pm = safeEvents.filter(e => isOpponentScoreEvent(e) && getOpponentPoints(e) === 2).length;
  const opp2pmiss = safeEvents.filter(e => {
    const a = getAz(e).toUpperCase();
    return a.includes('OPP_2PT_MISSED') || (isOppEvent(e) && (a.includes('2PT MISSED') || a.includes('2PT SBAGLIATO')));
  }).length;
  const opp2pa = opp2pm + opp2pmiss;

  const opp3pm = safeEvents.filter(e => isOpponentScoreEvent(e) && getOpponentPoints(e) === 3).length;
  const opp3pmiss = safeEvents.filter(e => {
    const a = getAz(e).toUpperCase();
    return a.includes('OPP_3PT_MISSED') || (isOppEvent(e) && (a.includes('3PT MISSED') || a.includes('3PT SBAGLIATO')));
  }).length;
  const opp3pa = opp3pm + opp3pmiss;

  const oppFtm = safeEvents.filter(e => isOpponentScoreEvent(e) && getOpponentPoints(e) === 1).length;
  const oppFtmiss = safeEvents.filter(e => {
    const a = getAz(e).toUpperCase();
    return a.includes('OPP_FT_MISSED') || a.includes('OPP_1PT_MISSED') || (isOppEvent(e) && (a.includes('FT MISSED') || a.includes('TL SBAGLIATO')));
  }).length;
  const oppFta = oppFtm + oppFtmiss;

  const oppFgm = opp2pm + opp3pm;
  const oppFga = opp2pa + opp3pa;
  const oppEfgPct = oppFga > 0 ? Math.round(((opp2pm + opp3pm + 0.5 * opp3pm) / oppFga) * 1000) / 10 : 0;
  const oppPct2p = opp2pa > 0 ? Math.round((opp2pm / opp2pa) * 1000) / 10 : 0;
  const oppPct3p = opp3pa > 0 ? Math.round((opp3pm / opp3pa) * 1000) / 10 : 0;
  const oppPctFt = oppFta > 0 ? Math.round((oppFtm / oppFta) * 1000) / 10 : 0;

  const opponentShooting = {
    opp2pm,
    opp2pmiss,
    opp2pa,
    opp3pm,
    opp3pmiss,
    opp3pa,
    oppFtm,
    oppFtmiss,
    oppFta,
    oppFgm,
    oppFga,
    oppEfgPct,
    oppPct2p,
    oppPct3p,
    oppPctFt
  };

  // Defensive Rebound Percentage (DRB%): Total BBA DEF REB / (Total BBA DEF REB + Total OPP OFF REB) * 100
  const bbaDefReb = teamOthers.dreb;
  const oppOffReb = safeEvents.filter(e => {
    const a = getAz(e);
    const cat = String(e?.Category || e?.category || '').toLowerCase();
    return a === 'OPP_OFF_REBOUND' || a === 'Opponent Off Rebound' || (cat === 'opponent' && a.toLowerCase().includes('off reb'));
  }).length;
  const drbOpportunities = bbaDefReb + oppOffReb;
  const drbPct = drbOpportunities > 0 ? Math.round((bbaDefReb / drbOpportunities) * 1000) / 10 : null;

  const reboundingAnalysis = {
    bbaDefReb,
    bbaOffReb: teamOthers.oreb,
    oppOffReb,
    drbOpportunities,
    drbPct
  };

  // =========================================================================
  // SITUATIONAL TRANSITION VS HALF-COURT ANALYTICS
  // =========================================================================
  const transitionEvents = safeEvents.filter(e => {
    if (e.isTransition !== true) return false;
    const cat = String(e?.Category || e?.category || '').toLowerCase();
    const az = getAz(e);
    return cat !== 'opponent' && !az.startsWith('OPP_') && cat !== 'substitution' && !az.startsWith('SUB:');
  });

  const halfCourtEvents = safeEvents.filter(e => {
    if (e.isTransition === true) return false;
    const cat = String(e?.Category || e?.category || '').toLowerCase();
    const az = getAz(e);
    return cat !== 'opponent' && !az.startsWith('OPP_') && cat !== 'substitution' && !az.startsWith('SUB:');
  });

  const calcSituational = (evList) => {
    const fg2m = evList.filter(e => { const a = getAz(e); return a === '2PT Made' || a === '2PT Fatto'; }).length;
    const fg2miss = evList.filter(e => { const a = getAz(e); return a === '2PT Missed' || a === '2PT Sbagliato'; }).length;
    const fg3m = evList.filter(e => { const a = getAz(e); return a === '3PT Made' || a === '3PT Fatto'; }).length;
    const fg3miss = evList.filter(e => { const a = getAz(e); return a === '3PT Missed' || a === '3PT Sbagliato'; }).length;
    const ftm = evList.filter(e => { const a = getAz(e); return a === 'FT Made' || a === 'TL Fatto'; }).length;
    const ftmiss = evList.filter(e => { const a = getAz(e); return a === 'FT Missed' || a === 'TL Sbagliato'; }).length;
    const tov = evList.filter(e => { const a = getAz(e); return a === 'Turnover' || a === 'Palla Persa'; }).length;

    const fga = fg2m + fg2miss + fg3m + fg3miss;
    const fgm = fg2m + fg3m;
    const fta = ftm + ftmiss;
    const pts = (fg2m * 2) + (fg3m * 3) + ftm;
    const poss = fga + tov + (0.44 * fta);
    const ppp = poss > 0 ? (pts / poss) : 0;
    const efgPct = fga > 0 ? ((fgm + 0.5 * fg3m) / fga) * 100 : 0;

    return {
      pts,
      fga,
      fgm,
      fta,
      ftm,
      tov,
      poss: Math.round(poss * 10) / 10,
      ppp: Math.round(ppp * 100) / 100,
      efgPct: Math.round(efgPct * 10) / 10
    };
  };

  const transition = calcSituational(transitionEvents);
  const halfCourt = calcSituational(halfCourtEvents);

  // =========================================================================
  // OFFENSIVE EFFICIENCY VS OPPONENT DEFENSIVE SCHEMES (MAN, ZONE, PRESS)
  // Evaluates BBA's offensive execution (PTS, eFG%, AST, TOV, O-REB, AST/TOV)
  // =========================================================================
  const isBbaOffensive = (e) => {
    if (isOpponentScoreEvent(e) || isOppEvent(e)) return false;
    const num = getNum(e);
    if (num === 'OPP' || num === 'SUB') return false;
    const cat = String(e?.Category || e?.category || '').toLowerCase();
    if (cat === 'opponent' || cat === 'substitution') return false;
    return true;
  };

  const getEventDefenseScheme = (e) => {
    // 1. Check Zone column (which stores scheme: Man, Zone, Press)
    const z = String(e?.Zone || e?.zone || e?.Zona || e?.zona || '').trim().toUpperCase();
    if (z.includes('PRESS')) return 'PRESS';
    if (z === 'ZONE' || z === 'ZONA' || z.startsWith('ZONE') || z.startsWith('ZONA')) return 'ZONE';
    if (z === 'MAN' || z.includes('MAN') || z.includes('UOMO')) return 'MAN';

    // 2. Check defenseType attribute
    const d = String(e?.defenseType || e?.Defense_Type || e?.defense_type || '').trim().toUpperCase();
    if (d.includes('PRESS')) return 'PRESS';
    if (d === 'ZONE' || d === 'ZONA' || d.startsWith('ZONE') || d.startsWith('ZONA')) return 'ZONE';
    if (d === 'MAN' || d.includes('MAN') || d.includes('UOMO')) return 'MAN';

    return null;
  };

  const calcSchemeEfficiency = (schemeName) => {
    const schemeEvents = safeEvents.filter(e => {
      const scheme = getEventDefenseScheme(e);
      if (scheme) return scheme === schemeName;
      // Default un-categorized events to baseline MAN
      return schemeName === 'MAN';
    });

    let ptsScored = 0;
    let fg2m = 0, fg2miss = 0;
    let fg3m = 0, fg3miss = 0;
    let ftm = 0, ftmiss = 0;
    let ast = 0, tov = 0, oreb = 0;

    schemeEvents.forEach(ev => {
      if (!isBbaOffensive(ev)) return;
      const az = getAz(ev);

      if (az === '2PT Made' || az === '2PT Fatto') {
        fg2m++;
        ptsScored += 2;
      } else if (az === '2PT Missed' || az === '2PT Sbagliato') {
        fg2miss++;
      } else if (az === '3PT Made' || az === '3PT Fatto') {
        fg3m++;
        ptsScored += 3;
      } else if (az === '3PT Missed' || az === '3PT Sbagliato') {
        fg3miss++;
      } else if (az === 'FT Made' || az === 'TL Fatto') {
        ftm++;
        ptsScored += 1;
      } else if (az === 'FT Missed' || az === 'TL Sbagliato') {
        ftmiss++;
      } else if (az === 'Assist') {
        ast++;
      } else if (az === 'Turnover' || az === 'Palla Persa') {
        tov++;
      } else if (az === 'Off Rebound' || az === 'Rimb Offensivo') {
        oreb++;
      }
    });

    const fg2a = fg2m + fg2miss;
    const fg3a = fg3m + fg3miss;
    const fgm = fg2m + fg3m;
    const fga = fg2a + fg3a;
    const fta = ftm + ftmiss;
    const efg = fga > 0 ? Math.round(((fgm + 0.5 * fg3m) / fga) * 1000) / 10 : 0;
    const astTovRatio = tov > 0 ? Math.round((ast / tov) * 100) / 100 : (ast > 0 ? ast : null);

    return {
      schemeName,
      eventsCount: schemeEvents.filter(isBbaOffensive).length,
      ptsScored,
      pts: ptsScored,
      ptsAllowed: ptsScored, // legacy fallback
      fg2m,
      fg2miss,
      fg2a,
      fg3m,
      fg3miss,
      fg3a,
      fgm,
      fga,
      ftm,
      ftmiss,
      fta,
      efg,
      ast,
      tov,
      oreb,
      astTovRatio
    };
  };

  const defensiveSchemes = {
    MAN: calcSchemeEfficiency('MAN'),
    ZONE: calcSchemeEfficiency('ZONE'),
    PRESS: calcSchemeEfficiency('PRESS')
  };

  const teamOverview = {
    ...teamShooting,
    pts: finalTeamPts,
    ...teamOthers,
    opponentScore,
    pointDifferential,
    pir: teamPir,
    possessions: Math.round(estimatedPossessions * 10) / 10,
    ortg: Math.round(ortg * 10) / 10,
    ppp: Math.round(ppp * 100) / 100,
    tovPct: Math.round(tovPct * 10) / 10,
    ftRate: Math.round(ftRate * 100) / 100,
    astTovRatio: Math.round(astTovRatio * 100) / 100,
    astRatio: Math.round(astRatio * 10) / 10,
    orebShare: Math.round(orebShare * 10) / 10,
    drbPct,
    oppOffReb,
    oppEfgPct,
    pctPaint,
    pctMid,
    pctThree,
    teamPaintShots,
    teamMidShots,
    teamThreeShots,
    stealTovMargin,
    assistedFgmPct,
    staggerCount: teamStagger,
    ghostCount: teamGhost,
    totalTactics,
    tacticsPerPoss: Math.round(tacticsPerPoss * 10) / 10,
    transition,
    halfCourt,
    opponentShooting,
    reboundingAnalysis,
    defensiveSchemes
  };

  // Rebounding status rating: Strong Glass (if OREB >= 10 or OREB% >= 28%), Solid (7-9 OREB), Passive (< 7 OREB)
  const orebRating = (teamOthers.oreb >= 10 || orebShare >= 28)
    ? 'Strong Glass'
    : teamOthers.oreb >= 7
      ? 'Solid'
      : 'Passive';
  const orebColor = orebRating === 'Strong Glass' ? 'emerald' : orebRating === 'Solid' ? 'amber' : 'slate';

  // Ball Movement status rating: Great Flow (>= 1.3), Balanced (0.9 - 1.29), High Turnovers (< 0.9)
  const ballRating = astTovRatio >= 1.3
    ? 'Great Flow'
    : astTovRatio >= 0.9
      ? 'Balanced'
      : 'High Turnovers';
  const ballColor = ballRating === 'Great Flow' ? 'emerald' : ballRating === 'Balanced' ? 'amber' : 'rose';

  // Practical Regional Coaching Pillars: GAME CONTROL & EFFICIENCY PILLARS
  const efficiencyPillars = {
    shooting: {
      key: 'shooting',
      title: '1. SHOOTING EFFICIENCY',
      value: teamShooting.efgPct.toFixed(1) + '%',
      numeric: teamShooting.efgPct,
      subtext: `2P: ${teamShooting.fg2m}/${teamShooting.fg2a} (${teamShooting.pct2p.toFixed(0)}%) | 3P: ${teamShooting.fg3m}/${teamShooting.fg3a} (${teamShooting.pct3p.toFixed(0)}%)`,
      rating: teamShooting.efgPct >= 52 ? 'Elite' : teamShooting.efgPct >= 47 ? 'Solid' : 'Low',
      color: teamShooting.efgPct >= 52 ? 'emerald' : teamShooting.efgPct >= 47 ? 'amber' : 'rose'
    },
    shotProfile: {
      key: 'shotProfile',
      title: '2. SHOT PROFILE BALANCE',
      value: `Paint ${pctPaint}% | 3PT ${pctThree}%`,
      numeric: pctPaint,
      subtext: `Mid: ${pctMid}% (${teamMidShots} FGA) • FT: ${teamShooting.ftm}/${teamShooting.fta} (${teamShooting.pctFt.toFixed(0)}%)`,
      rating: pctPaint >= 40 ? 'Heavy Rim Attack' : pctThree >= 40 ? 'Perimeter Heavy' : 'Balanced',
      color: pctPaint >= 35 ? 'emerald' : 'sky'
    },
    rebounding: {
      key: 'rebounding',
      title: '3. REBOUNDING & EXTRA POSSESSIONS',
      value: `${teamOthers.oreb} OFF | ${teamOthers.dreb} DEF`,
      numeric: teamOthers.oreb,
      subtext: `${teamOthers.reb} Total REB • ${Math.round(orebShare)}% OFF Share${drbPct !== null ? ` • ${drbPct}% DRB%` : ''}`,
      drbPct,
      oppOffReb,
      rating: orebRating,
      color: orebColor
    },
    ballControl: {
      key: 'ballControl',
      title: '4. BALL MOVEMENT & SECURITY',
      value: `${teamOthers.ast} AST / ${teamOthers.tov} TOV`,
      numeric: teamOthers.ast,
      subtext: `Assisted FGs: ${assistedFgmPct}% (${teamOthers.ast} of ${teamShooting.fgm} FGM) • ${teamOthers.stl} Steals (STL)`,
      rating: ballRating,
      color: ballColor
    }
  };

  // Backward compatibility alias
  const fourFactors = {
    ...efficiencyPillars,
    turnovers: efficiencyPillars.ballControl,
    freeThrows: efficiencyPillars.shotProfile
  };

  // Compute Plus/Minus for all players
  const plusMinusMap = calculatePlusMinus(safeEvents, startingOnCourtNums, customRoster);

  // =========================================================================
  // 2. PERIOD / QUARTER-BY-QUARTER STATS
  // =========================================================================
  const allQuarterKeys = ['Q1', 'Q2', 'Q3', 'Q4'];
  const otQuarterKeys = Array.from(new Set(
    safeEvents.map(e => getQtr(e)).filter(q => q.startsWith('OT'))
  )).sort();
  const quarterSequence = [...allQuarterKeys, ...otQuarterKeys];

  const quarters = quarterSequence.map(qKey => {
    const qEvents = safeEvents.filter(e => getQtr(e) === qKey);
    const qShooting = computeShooting(qEvents);
    const qOthers = computeOtherStats(qEvents);
    const qStag = qEvents.filter(e => getAz(e) === 'Stagger').length;
    const qGhost = qEvents.filter(e => getAz(e) === 'Ghost').length;
    const qOpp = calculateOpponentScore(qEvents);

    const qPir = (qShooting.pts + qOthers.reb + qOthers.ast + qOthers.stl + qOthers.blk + qOthers.fd) -
      ((qShooting.fg2miss + qShooting.fg3miss) + qShooting.ftmiss + qOthers.tov + qOthers.pf + qOthers.blka);

    const pctShare = teamShooting.pts > 0 ? (qShooting.pts / teamShooting.pts) * 100 : 0;

    return {
      quarter: qKey,
      pts: qShooting.pts,
      oppPts: qOpp,
      diff: qShooting.pts - qOpp,
      fg2m: qShooting.fg2m,
      fg2a: qShooting.fg2a,
      pct2p: qShooting.pct2p,
      fg3m: qShooting.fg3m,
      fg3a: qShooting.fg3a,
      pct3p: qShooting.pct3p,
      fgm: qShooting.fgm,
      fga: qShooting.fga,
      pctFg: qShooting.pctFg,
      ftm: qShooting.ftm,
      fta: qShooting.fta,
      pctFt: qShooting.pctFt,
      efgPct: qShooting.efgPct,
      tsPct: qShooting.tsPct,
      ...qOthers,
      pir: qPir,
      stagger: qStag,
      ghost: qGhost,
      totalTactics: qStag + qGhost,
      pctShare: Math.round(pctShare * 10) / 10,
      eventsCount: qEvents.length
    };
  });

  // =========================================================================
  // 3. INDIVIDUAL PLAYER STATS & PROFILES
  // =========================================================================
  const activePlayerNums = Array.from(new Set(
    individualEvents.map(e => getNum(e)).filter(Boolean)
  ));

  const playerStats = activePlayerNums.map(num => {
    const pEvents = individualEvents.filter(e => getNum(e) === num);
    const pInfo = rosterMap[num] || { number: num, name: `Player #${num}`, pos: 'N/A' };
    
    const pShooting = computeShooting(pEvents);
    const pOthers = computeOtherStats(pEvents);

    const pir = (pShooting.pts + pOthers.reb + pOthers.ast + pOthers.stl + pOthers.blk + pOthers.fd) -
      ((pShooting.fg2miss + pShooting.fg3miss) + pShooting.ftmiss + pOthers.tov + pOthers.pf + pOthers.blka);

    // GameScore formula
    const gameScore = pShooting.pts + 
      (0.4 * pShooting.fgm) - 
      (0.7 * pShooting.fga) - 
      (0.4 * (pShooting.fta - pShooting.ftm)) + 
      (0.7 * pOthers.oreb) + 
      (0.3 * pOthers.dreb) + 
      pOthers.stl + 
      (0.7 * pOthers.ast) + 
      (0.7 * pOthers.blk) - 
      (0.4 * pOthers.pf) - 
      pOthers.tov;

    const plusMinus = plusMinusMap[String(num)] || 0;

    // Quarter progression for this specific player
    const pQuarters = {};
    quarterSequence.forEach(qKey => {
      const qEvents = pEvents.filter(e => getQtr(e) === qKey);
      const qShoot = computeShooting(qEvents);
      const qOth = computeOtherStats(qEvents);
      pQuarters[qKey] = {
        pts: qShoot.pts,
        fgm: qShoot.fgm,
        fga: qShoot.fga,
        pctFg: qShoot.pctFg,
        reb: qOth.reb,
        ast: qOth.ast,
        tov: qOth.tov,
        pf: qOth.pf,
        eventsCount: qEvents.length
      };
    });

    // Shot distribution: Paint vs Mid vs 3PT
    const paintShots = pEvents.filter(e => getZona(e) === COURT_ZONES.PAINT.name && getAz(e).includes('PT'));
    const midShots = pEvents.filter(e => {
      const z = getZona(e);
      return (z === COURT_ZONES.MID_L.name || z === COURT_ZONES.MID_C.name || z === COURT_ZONES.MID_R.name) && getAz(e).includes('PT');
    });
    const threeShots = pEvents.filter(e => {
      const z = getZona(e);
      return (z === COURT_ZONES.C3_L.name || z === COURT_ZONES.C3_R.name || z === COURT_ZONES.W3_L.name || z === COURT_ZONES.W3_R.name || z === COURT_ZONES.ARC3_C.name) && getAz(e).includes('PT');
    });

    const totalFga = pShooting.fga || 1;
    const shotDist = {
      paintAttempts: paintShots.length,
      paintMade: paintShots.filter(e => getAz(e).includes('Made') || getAz(e).includes('Fatto')).length,
      pctPaint: Math.round((paintShots.length / totalFga) * 100),

      midAttempts: midShots.length,
      midMade: midShots.filter(e => getAz(e).includes('Made') || getAz(e).includes('Fatto')).length,
      pctMid: Math.round((midShots.length / totalFga) * 100),

      threeAttempts: threeShots.length,
      threeMade: threeShots.filter(e => getAz(e).includes('Made') || getAz(e).includes('Fatto')).length,
      pctThree: Math.round((threeShots.length / totalFga) * 100),

      totalShots: pShooting.fga
    };

    return {
      number: num,
      name: pInfo.name,
      pos: pInfo.pos,
      ...pShooting,
      ...pOthers,
      pir,
      plusMinus,
      gameScore: Math.round(gameScore * 10) / 10,
      quarters: pQuarters,
      shotDist,
      eventsCount: pEvents.length,
      events: pEvents
    };
  }).sort((a, b) => b.pir - a.pir || b.pts - a.pts);

  // =========================================================================
  // 4. TEAM LEADERS
  // =========================================================================
  const getLeader = (metric) => {
    if (playerStats.length === 0) return null;
    return [...playerStats].sort((a, b) => b[metric] - a[metric])[0];
  };

  const teamLeaders = {
    scoring: getLeader('pts'),
    rebounding: getLeader('reb'),
    playmaking: getLeader('ast'),
    efficiency: getLeader('pir'),
    steals: getLeader('stl')
  };

  // =========================================================================
  // 5. SHOT ZONE EFFICIENCY & BREAKDOWN
  // =========================================================================
  const zoneStats = computeZoneStats(safeEvents);
  const zoneSummary = zoneStats.zones;

  return {
    teamOverview,
    efficiencyPillars,
    fourFactors,
    quarters,
    playerStats,
    teamLeaders,
    zoneSummary,
    zoneStats,
    plusMinusMap,
    totalEvents: safeEvents.length,
    quarterSequence,
    opponentShooting,
    reboundingAnalysis,
    situational: { transition, halfCourt },
    defensiveSchemes
  };
}
