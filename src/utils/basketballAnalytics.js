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
 * Advanced Basketball Analytics Engine
 * Computes direct and derived metrics according to FIBA / EuroLeague / NBA analytical standards.
 */
export function calculateMatchAnalytics(events = [], customRoster = []) {
  const safeEvents = Array.isArray(events) ? events : [];

  // 1. Build comprehensive player map from master roster and events
  const rosterMap = {};
  DEFAULT_MASTER_ROSTER.forEach(p => {
    rosterMap[String(p.number)] = { ...p };
  });
  if (Array.isArray(customRoster)) {
    customRoster.forEach(p => {
      rosterMap[String(p.number)] = { ...p };
    });
  }

  // Also collect any players logged in events not in master roster
  safeEvents.forEach(e => {
    const num = getNum(e);
    const name = getGiocatore(e);
    if (num && num !== '-' && num !== 'TEAM' && !rosterMap[num]) {
      rosterMap[num] = { number: num, name: name || `Player #${num}`, pos: 'N/A' };
    } else if (num && rosterMap[num] && name && (!rosterMap[num].name || rosterMap[num].name.startsWith('Player #'))) {
      rosterMap[num].name = name;
    }
  });

  // Filter individual player vs team events
  const individualEvents = safeEvents.filter(e => {
    const num = getNum(e);
    const az = getAz(e);
    return num !== '-' && num !== 'TEAM' && az !== 'Stagger' && az !== 'Ghost';
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
  // Standard possession formula: FGA + 0.44 * FTA - OREB + TOV
  const estimatedPossessions = Math.max(1, (teamShooting.fga + (0.44 * teamShooting.fta) - teamOthers.oreb + teamOthers.tov));
  const ortg = (teamShooting.pts / estimatedPossessions) * 100; // Points per 100 possessions
  const ppp = teamShooting.pts / estimatedPossessions; // Points per possession
  const tovPct = (teamOthers.tov / estimatedPossessions) * 100;
  const ftRate = teamShooting.fga > 0 ? (teamShooting.fta / teamShooting.fga) : 0;
  const astTovRatio = teamOthers.tov > 0 ? teamOthers.ast / teamOthers.tov : teamOthers.ast;
  const astRatio = teamShooting.fgm > 0 ? (teamOthers.ast / teamShooting.fgm) * 100 : 0;
  const orebShare = (teamOthers.reb > 0) ? (teamOthers.oreb / teamOthers.reb) * 100 : 0;
  const tacticsPerPoss = (totalTactics / estimatedPossessions) * 100;

  const teamOverview = {
    ...teamShooting,
    ...teamOthers,
    pir: teamPir,
    possessions: Math.round(estimatedPossessions * 10) / 10,
    ortg: Math.round(ortg * 10) / 10,
    ppp: Math.round(ppp * 100) / 100,
    tovPct: Math.round(tovPct * 10) / 10,
    ftRate: Math.round(ftRate * 100) / 100,
    astTovRatio: Math.round(astTovRatio * 100) / 100,
    astRatio: Math.round(astRatio * 10) / 10,
    orebShare: Math.round(orebShare * 10) / 10,
    staggerCount: teamStagger,
    ghostCount: teamGhost,
    totalTactics,
    tacticsPerPoss: Math.round(tacticsPerPoss * 10) / 10
  };

  // Four Factors Ratings
  const fourFactors = {
    shooting: {
      label: 'Effective FG% (eFG%)',
      value: teamShooting.efgPct.toFixed(1) + '%',
      numeric: teamShooting.efgPct,
      subtext: `FGM: ${teamShooting.fgm}/${teamShooting.fga} (3PM: ${teamShooting.fg3m})`,
      rating: teamShooting.efgPct >= 52 ? 'Elite' : teamShooting.efgPct >= 47 ? 'Solid' : 'Needs Improvement',
      color: teamShooting.efgPct >= 52 ? 'emerald' : teamShooting.efgPct >= 47 ? 'amber' : 'rose'
    },
    turnovers: {
      label: 'Turnover Rate (TOV%)',
      value: teamOverview.tovPct.toFixed(1) + '%',
      numeric: teamOverview.tovPct,
      subtext: `${teamOthers.tov} TOVs in ~${teamOverview.possessions} poss`,
      rating: teamOverview.tovPct <= 14 ? 'Elite Ball Care' : teamOverview.tovPct <= 18 ? 'Average' : 'High Turnover',
      color: teamOverview.tovPct <= 14 ? 'emerald' : teamOverview.tovPct <= 18 ? 'amber' : 'rose'
    },
    rebounding: {
      label: 'Off Rebound Share',
      value: teamOverview.orebShare.toFixed(1) + '%',
      numeric: teamOverview.orebShare,
      subtext: `${teamOthers.oreb} OREB / ${teamOthers.reb} Total REB`,
      rating: teamOverview.orebShare >= 32 ? 'Crashing Boards' : teamOverview.orebShare >= 22 ? 'Solid Second Chance' : 'Low OREB',
      color: teamOverview.orebShare >= 32 ? 'emerald' : teamOverview.orebShare >= 22 ? 'amber' : 'slate'
    },
    freeThrows: {
      label: 'Free Throw Rate (FTR)',
      value: teamOverview.ftRate.toFixed(2),
      numeric: teamOverview.ftRate,
      subtext: `${teamShooting.ftm}/${teamShooting.fta} FT (${teamShooting.pctFt.toFixed(0)}%)`,
      rating: teamOverview.ftRate >= 0.28 ? 'Aggressive at Rim' : teamOverview.ftRate >= 0.18 ? 'Balanced' : 'Low Foul Drawing',
      color: teamOverview.ftRate >= 0.28 ? 'emerald' : teamOverview.ftRate >= 0.18 ? 'amber' : 'slate'
    }
  };

  // =========================================================================
  // 2. PERIOD / QUARTER-BY-QUARTER STATS
  // =========================================================================
  const allQuarterKeys = ['Q1', 'Q2', 'Q3', 'Q4'];
  // Check if any OT quarters are in events
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

    const qPir = (qShooting.pts + qOthers.reb + qOthers.ast + qOthers.stl + qOthers.blk + qOthers.fd) -
      ((qShooting.fg2miss + qShooting.fg3miss) + qShooting.ftmiss + qOthers.tov + qOthers.pf + qOthers.blka);

    const pctShare = teamShooting.pts > 0 ? (qShooting.pts / teamShooting.pts) * 100 : 0;

    return {
      quarter: qKey,
      pts: qShooting.pts,
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
  // Find all players with events logged in this match
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
  const shotEvents = safeEvents.filter(e => {
    const az = getAz(e);
    return az.includes('2PT') || az.includes('3PT');
  });

  const totalShotsCount = shotEvents.length;

  const zoneSummary = Object.entries(COURT_ZONES).map(([key, zoneInfo]) => {
    const zEvents = shotEvents.filter(e => getZona(e) === zoneInfo.name);
    const made = zEvents.filter(e => {
      const az = getAz(e);
      return az.includes('Made') || az.includes('Fatto');
    }).length;
    const attempts = zEvents.length;
    const pct = attempts > 0 ? (made / attempts) * 100 : 0;
    const shotShare = totalShotsCount > 0 ? (attempts / totalShotsCount) * 100 : 0;
    const pps = attempts > 0 ? (made * zoneInfo.val) / attempts : 0; // Points Per Shot

    return {
      key,
      name: zoneInfo.name,
      type: zoneInfo.type,
      val: zoneInfo.val,
      made,
      attempts,
      pct: Math.round(pct * 10) / 10,
      shotShare: Math.round(shotShare * 10) / 10,
      pps: Math.round(pps * 100) / 100,
      efficiencyColor: pct >= 50 ? '#059669' : pct >= 33 ? '#D97706' : attempts > 0 ? '#DC2626' : '#334155'
    };
  }).sort((a, b) => b.attempts - a.attempts);

  return {
    teamOverview,
    fourFactors,
    quarters,
    playerStats,
    teamLeaders,
    zoneSummary,
    totalEvents: safeEvents.length,
    quarterSequence
  };
}
