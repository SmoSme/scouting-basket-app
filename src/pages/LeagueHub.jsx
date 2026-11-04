import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, Target, Upload, FileText, AlertTriangle, 
  RefreshCw, Search, ArrowLeft, Shield, Zap, ChevronRight, 
  X, User, HelpCircle, Loader2, Terminal, Flame, CheckCircle2,
  Users
} from 'lucide-react';

// =========================================================================
// BASELINE DATA (Divisione Regionale 2 - Girone F)
// =========================================================================
export const DEFAULT_STANDINGS = [
  {
    fid: "team_virtus_1960",
    name: "Virtus Roma 1960",
    position: 1,
    clubId: "club_virtus",
    continuityPct: 75,
    streak: ["W", "W", "W", "L", "W"],
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 14,
      lostMatches: 4,
      pointsPerGame: 76.5,
      opponentsPointsPerGame: 68.3,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_carver",
    name: "Carver Cinecittà",
    position: 2,
    clubId: "club_carver",
    continuityPct: 68,
    streak: ["W", "W", "L", "W", "W"],
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 13,
      lostMatches: 5,
      pointsPerGame: 75.2,
      opponentsPointsPerGame: 67.6,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_petriana",
    name: "Petriana Basket",
    position: 3,
    clubId: "club_petriana",
    continuityPct: 62,
    streak: ["L", "W", "W", "W", "L"],
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 12,
      lostMatches: 6,
      pointsPerGame: 71.4,
      opponentsPointsPerGame: 67.6,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_bba_academy",
    name: "BBA - Basketball Academy",
    position: 4,
    clubId: "club_bba",
    continuityPct: 70,
    streak: ["W", "L", "W", "W", "L"],
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 11,
      lostMatches: 7,
      pointsPerGame: 72.8,
      opponentsPointsPerGame: 69.4,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_san_paolo",
    name: "San Paolo Ostiense",
    position: 5,
    clubId: "club_san_paolo",
    continuityPct: 58,
    streak: ["W", "W", "L", "L", "W"],
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 10,
      lostMatches: 8,
      pointsPerGame: 68.9,
      opponentsPointsPerGame: 68.5,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_alfa_omega",
    name: "Alfa Omega Ostia",
    position: 6,
    clubId: "club_alfa_omega",
    continuityPct: 64,
    streak: ["L", "L", "W", "L", "W"],
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 8,
      lostMatches: 10,
      pointsPerGame: 66.2,
      opponentsPointsPerGame: 69.4,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_vis_nova",
    name: "Vis Nova Basket",
    position: 7,
    clubId: "club_vis_nova",
    continuityPct: 50,
    streak: ["L", "L", "L", "W", "L"],
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 6,
      lostMatches: 12,
      pointsPerGame: 64.0,
      opponentsPointsPerGame: 71.6,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_frascati",
    name: "Basket Frascati",
    position: 8,
    clubId: "club_frascati",
    continuityPct: 55,
    streak: ["L", "L", "W", "L", "L"],
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 4,
      lostMatches: 14,
      pointsPerGame: 60.2,
      opponentsPointsPerGame: 72.8,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  }
];

export const DEFAULT_ROSTERS = {
  "team_virtus_1960": [
    {
      player: { fid: "p1_1", name: "Marco Rossi", number: 8, position: "SG" },
      stats: {
        games: 18,
        pointsAVG: 18.6,
        foulsAVG: 2.1,
        inArcThrowsPercentage: 46.2,
        outArcThrowsPercentage: 38.5,
        inArcThrowsAVG: 4.8,
        outArcThrowsAVG: 2.8, // > 1.5 Primary Shooter
        freeThrowsPercentage: 84.1,
        plusMinusAVG: 5.4,
        reboundsAVG: 3.2,
        assistsAVG: 3.6
      }
    },
    {
      player: { fid: "p1_2", name: "Davide Moretti", number: 15, position: "C" },
      stats: {
        games: 17,
        pointsAVG: 14.2,
        foulsAVG: 4.1, // > 3.0 High Foul Target
        inArcThrowsPercentage: 54.8,
        outArcThrowsPercentage: 20.0,
        inArcThrowsAVG: 5.6,
        outArcThrowsAVG: 0.2,
        freeThrowsPercentage: 62.5,
        plusMinusAVG: 4.1,
        reboundsAVG: 8.9,
        assistsAVG: 1.1
      }
    },
    {
      player: { fid: "p1_3", name: "Lorenzo Santoro", number: 4, position: "PG" },
      stats: {
        games: 18,
        pointsAVG: 11.8,
        foulsAVG: 2.8,
        inArcThrowsPercentage: 42.0,
        outArcThrowsPercentage: 36.4,
        inArcThrowsAVG: 2.5,
        outArcThrowsAVG: 1.9, // > 1.5 Primary Shooter
        freeThrowsPercentage: 79.0,
        plusMinusAVG: 6.2,
        reboundsAVG: 2.4,
        assistsAVG: 5.2
      }
    },
    {
      player: { fid: "p1_4", name: "Andrea Bianchi", number: 11, position: "PF" },
      stats: {
        games: 16,
        pointsAVG: 9.4,
        foulsAVG: 3.8, // > 3.0 High Foul Target
        inArcThrowsPercentage: 48.5,
        outArcThrowsPercentage: 25.0,
        inArcThrowsAVG: 3.4,
        outArcThrowsAVG: 0.5,
        freeThrowsPercentage: 68.0,
        plusMinusAVG: 1.8,
        reboundsAVG: 6.1,
        assistsAVG: 1.4
      }
    },
    {
      player: { fid: "p1_5", name: "Federico Ferri", number: 23, position: "SF" },
      stats: {
        games: 18,
        pointsAVG: 10.2,
        foulsAVG: 1.9,
        inArcThrowsPercentage: 44.1,
        outArcThrowsPercentage: 35.8,
        inArcThrowsAVG: 2.6,
        outArcThrowsAVG: 1.8, // > 1.5 Primary Shooter
        freeThrowsPercentage: 75.0,
        plusMinusAVG: 3.5,
        reboundsAVG: 4.0,
        assistsAVG: 1.8
      }
    },
    {
      player: { fid: "p1_6", name: "Giulio Colasanti", number: 19, position: "G" },
      stats: {
        games: 15,
        pointsAVG: 6.5,
        foulsAVG: 3.4, // > 3.0 High Foul Target
        inArcThrowsPercentage: 39.5,
        outArcThrowsPercentage: 28.0,
        inArcThrowsAVG: 1.8,
        outArcThrowsAVG: 0.7,
        freeThrowsPercentage: 71.4,
        plusMinusAVG: -0.8,
        reboundsAVG: 2.1,
        assistsAVG: 1.5
      }
    }
  ],
  "team_carver": [
    {
      player: { fid: "p2_1", name: "Gianluca Martini", number: 10, position: "PG" },
      stats: {
        games: 18,
        pointsAVG: 21.4,
        foulsAVG: 2.3,
        inArcThrowsPercentage: 48.0,
        outArcThrowsPercentage: 41.2,
        inArcThrowsAVG: 4.2,
        outArcThrowsAVG: 3.8, // > 1.5 Primary Shooter
        freeThrowsPercentage: 88.5,
        plusMinusAVG: 6.8
      }
    },
    {
      player: { fid: "p2_2", name: "Roberto De Luca", number: 14, position: "C" },
      stats: {
        games: 18,
        pointsAVG: 13.5,
        foulsAVG: 3.9, // > 3.0 High Foul Target
        inArcThrowsPercentage: 52.0,
        outArcThrowsPercentage: 18.0,
        inArcThrowsAVG: 5.4,
        outArcThrowsAVG: 0.3,
        freeThrowsPercentage: 64.0,
        plusMinusAVG: 4.5
      }
    },
    {
      player: { fid: "p2_3", name: "Alessio Mancini", number: 7, position: "SG" },
      stats: {
        games: 18,
        pointsAVG: 12.1,
        foulsAVG: 3.2, // > 3.0 High Foul Target
        inArcThrowsPercentage: 43.0,
        outArcThrowsPercentage: 37.0,
        inArcThrowsAVG: 2.8,
        outArcThrowsAVG: 2.1, // > 1.5 Primary Shooter
        freeThrowsPercentage: 78.0,
        plusMinusAVG: 3.2
      }
    }
  ],
  "team_petriana": [
    {
      player: { fid: "p3_1", name: "Simone Costa", number: 7, position: "SG" },
      stats: {
        games: 17,
        pointsAVG: 16.8,
        foulsAVG: 2.4,
        inArcThrowsPercentage: 44.5,
        outArcThrowsPercentage: 37.1,
        inArcThrowsAVG: 3.8,
        outArcThrowsAVG: 2.4, // > 1.5 Primary Shooter
        freeThrowsPercentage: 81.0,
        plusMinusAVG: 4.2
      }
    },
    {
      player: { fid: "p3_2", name: "Claudio Rinaldi", number: 12, position: "PF" },
      stats: {
        games: 18,
        pointsAVG: 12.0,
        foulsAVG: 3.6, // > 3.0 High Foul Target
        inArcThrowsPercentage: 49.0,
        outArcThrowsPercentage: 22.0,
        inArcThrowsAVG: 4.6,
        outArcThrowsAVG: 0.4,
        freeThrowsPercentage: 65.0,
        plusMinusAVG: 2.5
      }
    }
  ],
  "team_san_paolo": [
    {
      player: { fid: "p5_1", name: "Daniele Ricci", number: 9, position: "SF" },
      stats: {
        games: 18,
        pointsAVG: 15.1,
        foulsAVG: 3.5, // > 3.0 High Foul Target
        inArcThrowsPercentage: 45.0,
        outArcThrowsPercentage: 36.0,
        inArcThrowsAVG: 3.5,
        outArcThrowsAVG: 1.9, // > 1.5 Primary Shooter
        freeThrowsPercentage: 74.0,
        plusMinusAVG: 1.1
      }
    }
  ],
  "team_alfa_omega": [
    {
      player: { fid: "p6_1", name: "Fabio Totti", number: 13, position: "C" },
      stats: {
        games: 17,
        pointsAVG: 14.5,
        foulsAVG: 4.2, // > 3.0 High Foul Target
        inArcThrowsPercentage: 51.0,
        outArcThrowsPercentage: 10.0,
        inArcThrowsAVG: 5.8,
        outArcThrowsAVG: 0.1,
        freeThrowsPercentage: 61.0,
        plusMinusAVG: -1.2
      }
    }
  ],
  "team_vis_nova": [
    {
      player: { fid: "p7_1", name: "Stefano Grimaldi", number: 5, position: "G" },
      stats: {
        games: 16,
        pointsAVG: 13.2,
        foulsAVG: 3.1, // > 3.0 High Foul Target
        inArcThrowsPercentage: 40.0,
        outArcThrowsPercentage: 35.0,
        inArcThrowsAVG: 2.8,
        outArcThrowsAVG: 1.8, // > 1.5 Primary Shooter
        freeThrowsPercentage: 70.0,
        plusMinusAVG: -3.5
      }
    }
  ],
  "team_frascati": [
    {
      player: { fid: "p8_1", name: "Valerio Piras", number: 6, position: "G" },
      stats: {
        games: 18,
        pointsAVG: 14.0,
        foulsAVG: 3.7, // > 3.0 High Foul Target
        inArcThrowsPercentage: 41.0,
        outArcThrowsPercentage: 33.0,
        inArcThrowsAVG: 3.2,
        outArcThrowsAVG: 1.6, // > 1.5 Primary Shooter
        freeThrowsPercentage: 69.0,
        plusMinusAVG: -5.4
      }
    }
  ]
};

// Formatting helpers for the CARRIERA statistics table
const formatFtPct = (val) => {
  if (val == null || val === '' || isNaN(val)) return '—';
  return `${Number(val).toFixed(2)}%`;
};

const formatTotMin = (timeVal, games = 1) => {
  if (timeVal == null || isNaN(timeVal) || Number(timeVal) === 0) return '0';
  const num = Number(timeVal);
  const mins = num > (games * 100) ? Math.round(num / 60) : Math.round(num);
  return mins.toString();
};

const formatMedMin = (stats) => {
  if (!stats) return '0.0';
  const games = Number(stats.games || 0);
  if (games <= 0) return '0.0';
  const num = Number(stats.timePlayed || 0);
  if (num === 0) return '0.0';
  const perGameMins = num > (games * 100) ? (num / 60 / games) : (num / games);
  return perGameMins.toFixed(1);
};

const formatMedVal = (val, games) => {
  if (val == null || isNaN(val)) return '0.0';
  const g = Number(games || 0);
  if (g <= 0) return '0.0';
  return (Number(val) / g).toFixed(1);
};

const formatTotPlusMinus = (pm) => {
  if (pm == null || isNaN(pm)) return <span className="text-slate-400">0</span>;
  const num = Number(pm);
  if (num > 0) return <span className="text-emerald-400">+{num}</span>;
  if (num < 0) return <span className="text-rose-400">{num}</span>;
  return <span className="text-slate-400">0</span>;
};

const formatMedPlusMinus = (stats) => {
  if (!stats) return <span className="text-slate-400">0.0</span>;
  const games = Number(stats.games || 0);
  if (games <= 0) return <span className="text-slate-400">0.0</span>;
  const pm = Number(stats.plusMinus || 0);
  const avg = pm / games;
  if (avg > 0) return <span className="text-emerald-400">+{avg.toFixed(1)}</span>;
  if (avg < 0) return <span className="text-rose-400">{avg.toFixed(1)}</span>;
  return <span className="text-slate-400">0.0</span>;
};

// Normalizes team names for continuity comparison
function normalizeTeamName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/basket|pallacanestro|asd|pol\.|polisportiva|sports?|bk/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function isSameTeam(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const a = normalizeTeamName(nameA);
  const b = normalizeTeamName(nameB);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

// Defensive helper to parse player lineup item
function normalizeLineupItem(item, idx) {
  const p = item.player || item;
  const s = item.stats || item;
  const rawName = [p.name, p.lastName].filter(Boolean).join(' ');
  const name = rawName || p.fullName || `Player #${idx + 1}`;

  const formatPct = (val) => {
    if (val == null || isNaN(val)) return 0;
    return Math.round(Number(val));
  };

  const uniquePlayer = p.uniquePlayer || item.uniquePlayer || null;
  const upStats = uniquePlayer?.stats || null;
  const playersList = Array.isArray(uniquePlayer?.players) ? uniquePlayer.players : [];
  const rawSeasonStats = Array.isArray(uniquePlayer?.seasonStats) ? uniquePlayer.seasonStats : [];

  // Build merged history array: map seasonStats to players
  let history = [];
  if (Array.isArray(item.history) && item.history.length > 0) {
    history = item.history;
  } else if (Array.isArray(uniquePlayer?.history) && uniquePlayer.history.length > 0) {
    history = uniquePlayer.history;
  } else if (Array.isArray(p.history) && p.history.length > 0) {
    history = p.history;
  } else if (rawSeasonStats.length > 0) {
    history = rawSeasonStats.map(stat => {
      const rawSeasonId = stat.seasonId != null ? String(stat.seasonId) : '';
      const matchedPlayer = playersList.find(pl => String(pl.season?.id) === rawSeasonId);
      const seasonName = matchedPlayer?.season?.name || stat.seasonName || rawSeasonId || '—';
      const teamName = (matchedPlayer?.team?.name || stat.teamName || p.team?.name || item.teamName || '—').trim();
      const games = Number(stat.games || 0);
      const ppg = stat.pointsPerGame != null 
        ? Number(stat.pointsPerGame) 
        : (games > 0 && stat.points != null ? Number((stat.points / games).toFixed(1)) : 0);
      const twoMade = stat.twoMadePerGame != null 
        ? Number(stat.twoMadePerGame) 
        : (stat.inArcThrowsMadePerGame != null ? Number(stat.inArcThrowsMadePerGame) : (games > 0 && stat.inArcThrowsMade != null ? Number((stat.inArcThrowsMade / games).toFixed(1)) : 0));
      const threeMade = stat.threeMadePerGame != null 
        ? Number(stat.threeMadePerGame) 
        : (stat.outArcThrowsMadePerGame != null ? Number(stat.outArcThrowsMadePerGame) : (games > 0 && stat.outArcThrowsMade != null ? Number((stat.outArcThrowsMade / games).toFixed(1)) : 0));
      const ftPct = stat.freeThrowsPercentage != null ? Number(stat.freeThrowsPercentage) : null;

      return {
        seasonId: rawSeasonId,
        seasonName,
        teamName,
        games,
        pointsPerGame: ppg,
        twoMadePerGame: twoMade,
        threeMadePerGame: threeMade,
        freeThrowsPercentage: ftPct
      };
    });
  }

  // Fallback to active season if history is still empty and player has games
  if (history.length === 0 && Number(s.games ?? s.gp ?? 0) > 0) {
    history = [
      {
        seasonId: '14544',
        seasonName: '2025/2026',
        teamName: (p.team?.name || item.teamName || '—').trim(),
        games: Number(s.games ?? s.gp ?? 0),
        pointsPerGame: Number(s.pointsPerGame ?? s.pointsAVG ?? s.ppg ?? 0),
        twoMadePerGame: Number(s.inArcThrowsAVG ?? s.inArcThrowsMadeAVG ?? 0),
        threeMadePerGame: Number(s.outArcThrowsAVG ?? s.outArcThrowsMadeAVG ?? 0),
        freeThrowsPercentage: s.freeThrowsPercentage != null ? Number(s.freeThrowsPercentage) : null
      }
    ];
  }

  return {
    fid: p.fid || `p_${idx}`,
    name,
    firstName: p.name || '',
    lastName: p.lastName || '',
    number: p.number != null ? p.number : (idx + 1),
    position: p.position || (p.captain ? 'Captain' : 'Player'),
    captain: Boolean(p.captain),
    starting: Boolean(p.starting),
    photo: p.photo || null,
    uniquePlayer: {
      id: uniquePlayer?.id || null,
      stats: upStats,
      players: playersList,
      seasonStats: rawSeasonStats,
      history: history
    },
    history: history,
    games: Number(s.games ?? s.gp ?? 0),
    pointsAVG: Number(s.pointsPerGame ?? s.pointsAVG ?? s.ppg ?? 0),
    foulsAVG: Number(s.foulsAVG ?? s.fouls ?? 0),
    threePct: formatPct(s.outArcThrowsPercentage ?? s.shotsOutArcPercent ?? s.three_pct ?? s.pct_3p),
    threeMadeAVG: Number(s.outArcThrowsAVG ?? s.outArcThrowsMadeAVG ?? s.threePtMadeAVG ?? 0),
    twoPct: formatPct(s.inArcThrowsPercentage ?? s.shotsInArcPercent ?? s.two_pct ?? s.pct_2p),
    twoMadeAVG: Number(s.inArcThrowsAVG ?? s.inArcThrowsMadeAVG ?? 0),
    ftPct: formatPct(s.freeThrowsPercentage ?? s.freeThrowsPercent ?? s.ft_pct),
    plusMinusAVG: Number(s.plusMinusAVG ?? s.plus_minus ?? 0),
    reboundsAVG: Number(s.reboundsAVG ?? s.totalRebounds ?? 0),
    assistsAVG: Number(s.assistsAVG ?? s.assistsPerGame ?? 0),
    stealsAVG: Number(s.stealsAVG ?? 0),
    blocksAVG: Number(s.blocksAVG ?? 0),
    turnoversAVG: Number(s.turnoversAVG ?? 0)
  };
}

export const DICTIONARY = {
  it: {
    title: "HUB CAMPIONATO",
    badgeSynced: "SINCRONIZZATO FIP",
    btnSync: "AGGIORNA DATI FIP",
    btnSyncing: "SINCRONIZZAZIONE...",
    btnDefault: "CARICA ESEMPIO",
    btnImport: "IMPORTA JSON",
    bestRecord: "MIGLIOR RECORD",
    topDiff: "MIGLIOR DIFF. CANESTRI",
    standingsTitle: "CLASSIFICA CAMPIONATO",
    standingsSubtitle: "Clicca su qualsiasi squadra per analizzare roster, statistiche e alert tattici",
    filterTeam: "Cerca squadra...",
    colRank: "POS",
    colTeam: "SQUADRA",
    colLast5: "ULTIME 5",
    colPts: "PUNTI",
    colRecord: "V - P",
    colGp: "PG",
    colDiff: "DIFF",
    colScout: "SCOUT",
    ourTeam: "NOSTRA SQUADRA",
    btnScout: "SCOUT",
    btnBack: "Torna alla Classifica",
    quickSwitch: "Cambia Squadra:",
    division: "Divisione Regionale 2 - Girone F",
    season: "Stagione 2025/2026",
    scoutProfileSubtitle: "Profilo Scouting Avversario",
    trackedPlayers: "giocatori monitorati",
    statRecord: "RECORD",
    statWinRate: "PERC. VITTORIE",
    statDiff: "DIFF. CANESTRI",
    statRosterSize: "ROSTER",
    playersCount: "Giocatori",
    alertFoulTitle: "⚠️ BERSAGLI DA FALLO (>3.0 FALLI/P)",
    alertFoulStrategy: "Strategia Coach: Attaccare l'area nei primi minuti dal palleggio per caricare di falli, entrare in bonus e forzare la panchina avversaria.",
    alertFoulBadge: "CANDIDATI",
    alertFoulEmpty: "Nessun giocatore con più di 3.0 falli di media.",
    alertShooterTitle: "🎯 TIRATORI PRIMARI (>1.5 TRIPLE A PARTITA)",
    alertShooterStrategy: "Strategia Coach: Uscite forti sul tiro da fuori, passare sopra i blocchi centrali e non aiutare mai staccandosi da loro sul lato debole.",
    alertShooterBadge: "TIRATORI",
    alertShooterEmpty: "Nessun tiratore primario ad alto volume perimetrale.",
    rosterTitle: "STATISTICHE ROSTER & LINEUP",
    rosterSubtitle: "Statistiche ufficiali FIP. Clicca su un giocatore per aprire la scheda dettagliata e lo storico carriera.",
    searchPlayer: "Cerca giocatore...",
    sortPpg: "Ordina: Punti/P",
    sortFouls: "Ordina: Falli/P",
    sortThree: "Ordina: Triple/P",
    sortPlusMinus: "Ordina: Plus/Minus",
    sortNumber: "Ordina: N. Maglia",
    colNumber: "#",
    colNamePos: "NOME & RUOLO",
    colPpg: "PUNTI/P",
    colFouls: "FALLI/P",
    colThree: "3PT% (3PM)",
    colTwo: "2PT%",
    colFt: "TL%",
    colPlusMinus: "+/-",
    colAlerts: "ALERT",
    badgeShooter: "TIRATORE",
    badgeFoulTarget: "BERSAGLIO FALLI",
    noPlayersTitle: "Nessun giocatore trovato",
    noPlayersDesc: "Nessun giocatore registrato su FIP Stats per questa squadra.",
    noPlayersSearch: "Nessun giocatore corrisponde a",
    // Modal
    modalPpg: "PUNTI/P",
    modalFouls: "FALLI/P",
    modalThree: "3PT%",
    modalPlusMinus: "+/-",
    modalRebounds: "RIMBALZI/P",
    modalAssists: "ASSIST/P",
    modalGames: "PARTITE",
    modalSplitsTitle: "PERCENTUALI DI TIRO",
    modal3pt: "3PT (DA TRE)",
    modal2pt: "2PT (DA DUE)",
    modalFt: "TIRI LIBERI",
    modalMadePerGame: "a partita",
    // Career history / Statistiche Totale
    continuityBadge: "Confermati dal 24/25: {pct}%",
    statContinuity: "CONTINUITÀ 24/25",
    colSeason: "STAGIONE",
    col2pm: "2PT/P",
    col3pm: "3PT/P",
    colFtPct: "%TL",
    historyTableTitle: "CARRIERA / STORICO FIP",
    historyTitle: "CARRIERA",
    historySeason: "STAGIONI",
    historyMin: "MIN",
    historyPts: "PT",
    historyFt: "TL",
    history2p: "2PT",
    history3p: "3PT",
    historyFouls: "FF",
    historyPlusMinus: "+/-",
    historyMed: "MED",
    historyTotale: "Totale",
    noHistory: "Nessun dato di carriera disponibile.",
    // Empty state
    emptyTitle: "Dati Campionato Non Sincronizzati",
    emptyDesc: "Dati campionato non presenti. Clicca su AGGIORNA DATI FIP per scaricare l'ultima classifica e i report scouting dal cloud, oppure carica il set di esempio.",
    emptyCmd: "npm run sync-league",
    syncSuccess: "✅ Dati FIP sincronizzati con successo",
    syncToast: "🏀 Dati Campionato Caricati",
    syncError: "Sincronizzazione fallita"
  },
  en: {
    title: "LEAGUE HUB",
    badgeSynced: "FIP GRAPHQL SYNCED",
    btnSync: "SYNC FIP DATA",
    btnSyncing: "SYNCING...",
    btnDefault: "LOAD SAMPLE LEAGUE",
    btnImport: "IMPORT JSON",
    bestRecord: "BEST RECORD",
    topDiff: "TOP POINT DIFFERENTIAL",
    standingsTitle: "CHAMPIONSHIP STANDINGS",
    standingsSubtitle: "Click any team row to inspect roster stats, shooting splits, and dynamic scouting alerts",
    filterTeam: "Filter team...",
    colRank: "RANK",
    colTeam: "TEAM",
    colLast5: "LAST 5",
    colPts: "PTS",
    colRecord: "W - L",
    colGp: "GP",
    colDiff: "DIFF",
    colScout: "SCOUT",
    ourTeam: "OUR TEAM",
    btnScout: "SCOUT",
    btnBack: "Back to Standings",
    quickSwitch: "Switch Team:",
    division: "Divisione Regionale 2 - Girone F",
    season: "Season 2025/2026",
    scoutProfileSubtitle: "Opponent Scouting Profile",
    trackedPlayers: "players tracked",
    statRecord: "RECORD",
    statWinRate: "WIN RATE",
    statDiff: "POINT DIFFERENTIAL",
    statRosterSize: "ROSTER SIZE",
    playersCount: "Players",
    alertFoulTitle: "⚠️ HIGH FOUL TARGETS (>3.0 FOULS/G)",
    alertFoulStrategy: "Coach Strategy: Attack in the paint early off the dribble to draw fouls, induce penalty, and force bench substitutions.",
    alertFoulBadge: "CANDIDATES",
    alertFoulEmpty: "No players averaging > 3.0 fouls.",
    alertShooterTitle: "🎯 PRIMARY SHOOTERS (>1.5 MADE 3PT/G)",
    alertShooterStrategy: "Coach Strategy: Contest tight on catch-and-shoot looks, fight over high ball screens, and do not help off them in corner rotations.",
    alertShooterBadge: "SHOOTERS",
    alertShooterEmpty: "No primary perimeter volume shooters.",
    rosterTitle: "ROSTER & LINEUP STATISTICS",
    rosterSubtitle: "Official FIP lineup statistics. Click any player row to view shooting splits and career history.",
    searchPlayer: "Search player...",
    sortPpg: "Sort: PPG",
    sortFouls: "Sort: Fouls/G",
    sortThree: "Sort: 3PM/G",
    sortPlusMinus: "Sort: Plus/Minus",
    sortNumber: "Sort: Jersey #",
    colNumber: "#",
    colNamePos: "NAME & POSITION",
    colPpg: "POINTS/G",
    colFouls: "FOULS/G",
    colThree: "3PT% (3PM)",
    colTwo: "2PT%",
    colFt: "FT%",
    colPlusMinus: "+/-",
    colAlerts: "ALERTS",
    badgeShooter: "SHOOTER",
    badgeFoulTarget: "FOUL TARGET",
    noPlayersTitle: "No players found",
    noPlayersDesc: "No lineup data registered on FIP Stats for this team.",
    noPlayersSearch: "No players matching",
    // Modal
    modalPpg: "POINTS/G",
    modalFouls: "FOULS/G",
    modalThree: "3PT%",
    modalPlusMinus: "+/-",
    modalRebounds: "REBOUNDS/G",
    modalAssists: "ASSISTS/G",
    modalGames: "GAMES PLAYED",
    modalSplitsTitle: "SHOOTING ACCURACY SPLITS",
    modal3pt: "3PT (OUT-ARC)",
    modal2pt: "2PT (IN-ARC)",
    modalFt: "FREE THROWS",
    modalMadePerGame: "made/G",
    // Career history / Statistiche Totale
    continuityBadge: "Core Retained from 24/25: {pct}%",
    statContinuity: "CORE CONTINUITY",
    colSeason: "SEASON",
    col2pm: "2PM/G",
    col3pm: "3PM/G",
    colFtPct: "FT%",
    historyTableTitle: "CAREER / FIP HISTORY",
    historyTitle: "CAREER",
    historySeason: "SEASONS",
    historyMin: "MIN",
    historyPts: "PT",
    historyFt: "TL",
    history2p: "2PT",
    history3p: "3PT",
    historyFouls: "FF",
    historyPlusMinus: "+/-",
    historyMed: "MED",
    historyTotale: "Totale",
    noHistory: "No career data available.",
    // Empty state
    emptyTitle: "League Data Not Synced",
    emptyDesc: "League data not synced. Tap SYNC FIP DATA to pull the latest standings and scouting reports directly from the cloud, or load the baseline sample.",
    emptyCmd: "npm run sync-league",
    syncSuccess: "✅ Live FIP league data synced successfully",
    syncToast: "🏀 League Hub Synced",
    syncError: "Sync failed"
  }
};

export default function LeagueHub({ showToast }) {
  // Language State: 'it' (default) | 'en'
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('bba_lang') || 'it';
    } catch (e) {
      return 'it';
    }
  });

  const t = DICTIONARY[lang] || DICTIONARY.it;

  const toggleLang = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('bba_lang', newLang);
    } catch (e) {}
  };

  // Navigation State: 'STANDINGS_VIEW' | 'TEAM_DETAIL_VIEW'
  const [currentView, setCurrentView] = useState('STANDINGS_VIEW');
  const [selectedTeamFid, setSelectedTeamFid] = useState(null);

  // Data states
  const [standings, setStandings] = useState(() => {
    try {
      const saved = localStorage.getItem('bba_fip_standings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [rosters, setRosters] = useState(() => {
    try {
      const saved = localStorage.getItem('bba_fip_rosters');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(!standings);
  const [fetchError, setFetchError] = useState(null);

  // Selected Player for slide-out inspection
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // UI Filters & Status
  const [standingsSearch, setStandingsSearch] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterSortBy, setRosterSortBy] = useState('ppg'); // 'ppg' | 'fouls' | 'three' | 'number'
  const [statusMsg, setStatusMsg] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');

  // -------------------------------------------------------------------------
  // Fetch /data/league_standings.json & /data/league_rosters.json directly
  // -------------------------------------------------------------------------
  const fetchFipData = async (isManual = false) => {
    setIsSyncing(true);
    setFetchError(null);
    try {
      let standingsData = null;
      let rostersData = null;

      // 1. Fetch /data/league_standings.json directly
      try {
        const fileRes = await fetch('/data/league_standings.json', { cache: 'no-store' });
        if (fileRes.ok) {
          const json = await fileRes.json();
          if (Array.isArray(json) && json.length > 0) {
            standingsData = json;
          }
        }
      } catch (fileErr) {
        console.warn('[League Hub] /data/league_standings.json fetch note:', fileErr.message);
      }

      // 2. Fetch /data/league_rosters.json directly
      try {
        const rostersRes = await fetch('/data/league_rosters.json', { cache: 'no-store' });
        if (rostersRes.ok) {
          const rostersJson = await rostersRes.json();
          if (rostersJson && typeof rostersJson === 'object' && Object.keys(rostersJson).length > 0) {
            rostersData = rostersJson;
          }
        }
      } catch (rostersErr) {
        console.warn('[League Hub] /data/league_rosters.json fetch note:', rostersErr.message);
      }

      // 3. If not found or if user clicked manual sync, fallback to /api/sync-fip
      if ((!standingsData || !rostersData) && isManual) {
        try {
          const apiRes = await fetch('/api/sync-fip', { cache: 'no-store' });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (Array.isArray(apiData.standings) && apiData.standings.length > 0) {
              standingsData = apiData.standings;
            } else if (Array.isArray(apiData) && apiData.length > 0) {
              standingsData = apiData;
            }
            if (apiData.rosters && typeof apiData.rosters === 'object') {
              rostersData = apiData.rosters;
            }
          }
        } catch (apiErr) {
          console.warn('[League Hub] API sync note:', apiErr.message);
        }
      }

      if (Array.isArray(standingsData) && standingsData.length > 0) {
        setStandings(standingsData);
        try {
          localStorage.setItem('bba_fip_standings', JSON.stringify(standingsData));
        } catch (e) {}
      }

      if (rostersData && typeof rostersData === 'object' && Object.keys(rostersData).length > 0) {
        setRosters(rostersData);
        try {
          localStorage.setItem('bba_fip_rosters', JSON.stringify(rostersData));
        } catch (e) {}
      }

      if (!standingsData && !rostersData) {
        throw new Error('No valid standings or roster data found in /data/');
      }

      if (isManual) {
        setStatusMsg('✅ Live FIP league data synced successfully');
        if (showToast) showToast('🏀 League Hub Synced');
      }
    } catch (err) {
      console.warn('[League Hub] Sync error:', err.message);
      setFetchError(err.message);
      if (isManual && showToast) {
        showToast(`⚠️ Sync failed: ${err.message}`);
      }
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFipData(false);
  }, []);

  // Safe navigation handlers
  const handleSelectTeam = (teamFid) => {
    setSelectedTeamFid(teamFid);
    setCurrentView('TEAM_DETAIL_VIEW');
    setSelectedPlayer(null);
    setRosterSearch('');
  };

  const handleBackToStandings = () => {
    setCurrentView('STANDINGS_VIEW');
    setSelectedTeamFid(null);
    setSelectedPlayer(null);
  };

  const handleResetToDefault = () => {
    setStandings(DEFAULT_STANDINGS);
    setRosters(DEFAULT_ROSTERS);
    setFetchError(null);
    try {
      localStorage.setItem('bba_fip_standings', JSON.stringify(DEFAULT_STANDINGS));
      localStorage.setItem('bba_fip_rosters', JSON.stringify(DEFAULT_ROSTERS));
    } catch (e) {}
    setStatusMsg('✅ Loaded baseline Divisione Regionale 2 dataset');
    if (showToast) showToast('🏆 Sample League Loaded');
    setCurrentView('STANDINGS_VIEW');
    setSelectedTeamFid(null);
    setSelectedPlayer(null);
  };

  // Selected Team Info
  const currentTeamStanding = useMemo(() => {
    if (!selectedTeamFid || !standings) return null;
    return standings.find(s => (s.fid || s.teamFid || s.id) === selectedTeamFid) || null;
  }, [selectedTeamFid, standings]);

  const rawLineups = useMemo(() => {
    if (!selectedTeamFid || !rosters) return [];
    return rosters[selectedTeamFid] || [];
  }, [selectedTeamFid, rosters]);

  const currentRoster = useMemo(() => {
    return rawLineups.map((item, idx) => normalizeLineupItem(item, idx));
  }, [rawLineups]);

  // Roster Continuity (core retained from 2024/2025)
  const continuityPct = useMemo(() => {
    if (currentTeamStanding?.continuityPct != null) {
      return Number(currentTeamStanding.continuityPct);
    }
    if (selectedTeamFid && rosters && rosters[selectedTeamFid]?.continuityPct != null) {
      return Number(rosters[selectedTeamFid].continuityPct);
    }
    if (Array.isArray(currentRoster) && currentRoster.length > 0) {
      const currentTeamName = currentTeamStanding?.name || '';
      let retained = 0;
      for (const player of currentRoster) {
        const history = player.history || player.uniquePlayer?.history || [];
        const prevSeason = history.find(h => {
          const sName = String(h.seasonName || '');
          return (sName.includes('2024') || sName === '2024/2025') && isSameTeam(h.teamName, currentTeamName);
        });
        if (prevSeason) retained++;
      }
      return Math.round((retained / currentRoster.length) * 100);
    }
    return 65;
  }, [currentTeamStanding, selectedTeamFid, rosters, currentRoster]);

  // -------------------------------------------------------------------------
  // Dynamic Tactical Alerts for Team Detail View
  // -------------------------------------------------------------------------
  // Alert 1: High Foul Targets (> 3.0 Fouls/G)
  const highFoulTargets = useMemo(() => {
    return currentRoster.filter(p => p.foulsAVG > 3.0);
  }, [currentRoster]);

  // Alert 2: Primary Shooters (> 1.5 Made Out-of-Arc Throws/G)
  const primaryShooters = useMemo(() => {
    return currentRoster.filter(p => p.threeMadeAVG > 1.5);
  }, [currentRoster]);

  // Filtered Standings
  const filteredStandings = useMemo(() => {
    if (!Array.isArray(standings)) return [];
    if (!standingsSearch.trim()) return standings;
    const q = standingsSearch.toLowerCase().trim();
    return standings.filter(s => (s.name || s.team?.name || '').toLowerCase().includes(q));
  }, [standings, standingsSearch]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    let list = currentRoster;
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || String(p.number).includes(q) || p.position.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (rosterSortBy === 'ppg') return b.pointsAVG - a.pointsAVG;
      if (rosterSortBy === 'fouls') return b.foulsAVG - a.foulsAVG;
      if (rosterSortBy === 'three') return b.threeMadeAVG - a.threeMadeAVG;
      if (rosterSortBy === 'plusMinus') return b.plusMinusAVG - a.plusMinusAVG;
      if (rosterSortBy === 'number') return Number(a.number) - Number(b.number);
      return 0;
    });
  }, [currentRoster, rosterSearch, rosterSortBy]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 max-w-7xl mx-auto w-full space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & GLOBAL CONTROLS                                           */}
      {/* ========================================================================= */}
      <div className="glass-card p-4 border-slate-700/60 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-none shadow-inner">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              {t.title}
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40">
                {t.badgeSynced}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              {t.division} • {t.season}
            </p>
          </div>
        </div>

        {/* Global Controls & Language Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => toggleLang('it')}
              className={`px-2 py-1 rounded text-[11px] font-black transition-all ${
                lang === 'it' 
                  ? 'bg-amber-500 text-slate-950 shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IT
            </button>
            <button
              type="button"
              onClick={() => toggleLang('en')}
              className={`px-2 py-1 rounded text-[11px] font-black transition-all ${
                lang === 'en' 
                  ? 'bg-amber-500 text-slate-950 shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchFipData(true)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Fetch latest league data from /api/sync-fip"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t.btnSyncing : t.btnSync}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Load default championship league dataset"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.btnDefault}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-md active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.btnImport}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-between animate-fade-in">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LOADING & EMPTY/UNSYNCED STATES                                        */}
      {/* ========================================================================= */}
      {isSyncing && (!standings || standings.length === 0) ? (
        <div className="glass-card p-12 text-center border-slate-800 bg-slate-900/90 rounded-2xl max-w-md mx-auto space-y-3 my-12 animate-pulse shadow-2xl">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-300">Syncing FIP League Data...</p>
          <p className="text-xs text-slate-500 font-mono">Querying cloud serverless endpoint (/api/sync-fip)</p>
        </div>
      ) : (!standings || standings.length === 0) ? (
        /* Empty / Unsynced State */
        <div className="glass-card p-8 sm:p-12 text-center border-slate-800 bg-slate-900/90 rounded-2xl max-w-xl mx-auto space-y-5 my-8 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-wide">
              {t.emptyTitle}
            </h2>
            <p className="text-sm text-slate-400">
              {t.emptyDesc}
            </p>
          </div>

          {/* Terminal Command Box */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left font-mono text-xs text-slate-300 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Terminal className="w-4 h-4 text-emerald-400 flex-none" />
              <span className="text-slate-200">{t.emptyCmd}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(t.emptyCmd);
                }
                if (showToast) showToast(`📋 Copied: ${t.emptyCmd}`);
              }}
              className="text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors flex-none text-[11px] font-sans font-bold active:scale-95"
              title="Copy command to clipboard"
            >
              Copy
            </button>
          </div>

          {fetchError && (
            <p className="text-xs text-slate-400 font-semibold bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
              Status: <span className="text-rose-400">{fetchError}</span>
            </p>
          )}

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fetchFipData(true)}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? t.btnSyncing : t.btnSync}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.btnDefault}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* VIEW A: STANDINGS VIEW (DEFAULT)                                          */}
          {/* ========================================================================= */}
          {currentView === 'STANDINGS_VIEW' && (
            <div className="space-y-4 animate-fade-in">
              {/* Top Leaders Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="glass-card p-3 border-amber-500/30 bg-slate-900/90 shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                    {t.standingsTitle}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-100">
                      {standings[0]?.name || standings[0]?.team?.name || 'N/A'}
                    </span>
                    <span className="font-mono text-sm font-black text-amber-400">
                      {standings[0]?.stats?.wonMatches != null
                        ? standings[0].stats.wonMatches * 2
                        : (standings[0]?.points ?? ((standings[0]?.won ?? 0) * 2))} {t.colPts}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-3 border-sky-500/30 bg-slate-900/90 shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
                    {t.bestRecord}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-100">
                      {standings[0]?.stats
                        ? `${standings[0].stats.wonMatches}W - ${standings[0].stats.lostMatches}L`
                        : `${standings[0]?.won ?? 0}W - ${standings[0]?.lost ?? 0}L`}
                    </span>
                    <span className="font-mono text-sm font-black text-sky-400">
                      {(() => {
                        const won = standings[0]?.stats?.wonMatches ?? standings[0]?.won ?? 0;
                        const played = standings[0]?.stats?.playedMatches ?? standings[0]?.played ?? 0;
                        return played > 0 ? `${Math.round((won / played) * 100)}% WIN` : '';
                      })()}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-3 border-emerald-500/30 bg-slate-900/90 shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                    {t.topDiff}
                  </span>
                  <div className="flex items-baseline justify-between">
                    {(() => {
                      const getDiff = (s) => {
                        if (s?.stats?.pointsPerGame != null && s?.stats?.opponentsPointsPerGame != null) {
                          return Number((s.stats.pointsPerGame - s.stats.opponentsPointsPerGame).toFixed(1));
                        }
                        return Number(s?.pointDiff ?? -999);
                      };
                      const topDiffTeam = standings.reduce((best, s) => (getDiff(s) > getDiff(best) ? s : best), standings[0]);
                      const diffVal = getDiff(topDiffTeam);
                      return (
                        <>
                          <span className="text-base font-black text-slate-100">
                            {topDiffTeam?.name || 'N/A'}
                          </span>
                          <span className="font-mono text-sm font-black text-emerald-400">
                            {diffVal > 0 ? `+${diffVal}` : diffVal}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Standings Table Card */}
              <div className="glass-card p-4 sm:p-5 border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      {t.standingsTitle} ({filteredStandings.length} {t.playersCount})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {t.standingsSubtitle}
                    </p>
                  </div>

                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder={t.filterTeam}
                      value={standingsSearch}
                      onChange={(e) => setStandingsSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 w-48"
                    />
                  </div>
                </div>

                {/* Standings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                        <th className="p-3 w-12 text-center">{t.colRank}</th>
                        <th className="p-3">{t.colTeam}</th>
                        <th className="p-3 text-center">{t.colLast5}</th>
                        <th className="p-3 text-center">{t.colPts}</th>
                        <th className="p-3 text-center">{t.colRecord}</th>
                        <th className="p-3 text-center">{t.colGp}</th>
                        <th className="p-3 text-center">{t.colDiff}</th>
                        <th className="p-3 text-right">{t.colScout}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredStandings.map((team, idx) => {
                        const tFid = team.fid || team.teamFid || `team_${idx + 1}`;
                        const tName = team.name || `Team #${idx + 1}`;
                        const bbaId = import.meta.env.VITE_BBA_TEAM_ID || '211634';
                        const isBBA = String(tFid) === String(bbaId) || tFid === 'team_bba_academy' || tName.toLowerCase().includes('bba') || tName.toLowerCase().includes('baronissi');
                        const rankNum = team.position ?? team.rank ?? (idx + 1);
                        const isPlayoff = rankNum <= 4;
                        const isPlayout = rankNum >= 7;

                        const won = team.stats?.wonMatches ?? team.won ?? 0;
                        const lost = team.stats?.lostMatches ?? team.lost ?? 0;
                        const gp = team.stats?.playedMatches ?? team.played ?? (won + lost);
                        const pts = won * 2;
                        const diff = (team.stats?.pointsPerGame != null && team.stats?.opponentsPointsPerGame != null)
                          ? (team.stats.pointsPerGame - team.stats.opponentsPointsPerGame).toFixed(1)
                          : (team.pointDiff != null ? Number(team.pointDiff).toFixed(1) : '0.0');

                        return (
                          <tr
                            key={tFid}
                            onClick={() => { if (!isBBA) handleSelectTeam(team.fid || tFid); }}
                            className={`transition-colors ${
                              isBBA 
                                ? 'bg-sky-950/20 border-l-2 border-sky-400 cursor-default' 
                                : 'hover:bg-slate-800/50 cursor-pointer'
                            }`}
                          >
                            <td className="p-3 text-center font-mono font-black">
                              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                                isPlayoff
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isPlayout
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-slate-800 text-slate-300'
                              }`}>
                                {rankNum}
                              </span>
                            </td>
                            <td className="p-3 font-black text-slate-100 flex items-center gap-2">
                              <span className="text-sm">{tName}</span>
                              {isBBA && (
                                <span className="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.5 rounded border border-sky-500/40">
                                  {t.ourTeam}
                                </span>
                              )}
                            </td>
                            {/* Streak / Last 5 */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {Array.isArray(team.streak) && team.streak.length > 0 ? (
                                  team.streak.slice(-5).map((res, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={`w-4 h-4 rounded-full font-mono text-[9px] font-black flex items-center justify-center border shadow-sm ${
                                        res === 'W'
                                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                          : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                      }`}
                                    >
                                      {res}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500 font-mono text-xs">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-black text-amber-400 text-sm">
                              {pts}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-200">
                              <span className="text-emerald-400">{won}</span>
                              <span className="text-slate-500 mx-1">-</span>
                              <span className="text-rose-400">{lost}</span>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-400">
                              {gp}
                            </td>
                            <td className="p-3 text-center font-mono font-black">
                              <span className={Number(diff) > 0 ? 'text-emerald-400' : (Number(diff) < 0 ? 'text-rose-400' : 'text-slate-400')}>
                                {Number(diff) > 0 ? `+${diff}` : diff}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {isBBA ? (
                                <span className="text-slate-600 font-bold px-2 py-1 select-none text-xs">
                                  —
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleSelectTeam(team.fid || tFid); }}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1 rounded text-xs transition-all inline-flex items-center gap-1 shadow-sm active:scale-95"
                                >
                                  <span>{t.btnScout}</span>
                                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW B: TEAM DETAIL VIEW (LINEUP STATS & DYNAMIC ALERTS)                  */}
          {/* ========================================================================= */}
          {currentView === 'TEAM_DETAIL_VIEW' && (
            <div className="space-y-4 animate-fade-in">
              {/* Back Navigation Bar */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBackToStandings}
                  className="bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-black px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400" />
                  <span>← {t.btnBack}</span>
                </button>

                {/* Team Switcher Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">{t.quickSwitch}</span>
                  <select
                    value={selectedTeamFid || ''}
                    onChange={(e) => handleSelectTeam(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold p-2 rounded-xl focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {standings.map(s => {
                      const fid = s.fid || s.teamFid || s.id;
                      const name = s.name || s.team?.name;
                      const pts = s.stats?.wonMatches != null ? s.stats.wonMatches * 2 : (s.points ?? ((s.won ?? 0) * 2));
                      const pos = s.position ?? s.rank ?? '-';
                      return (
                        <option key={fid} value={fid} className="bg-slate-900 text-slate-100">
                          #{pos} {name} ({pts} {t.colPts})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Team Profile Header Card */}
              <div className="glass-card p-4 sm:p-5 border-slate-800 bg-slate-900/90 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-xl sm:text-2xl font-black text-rose-400 uppercase tracking-wider">
                        {currentTeamStanding?.name || selectedTeamFid}
                      </h2>
                      <span className="text-[10px] bg-slate-950 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-800">
                        {t.division}
                      </span>
                      {continuityPct != null && (
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{(t.continuityBadge || 'Core Retained from 24/25: {pct}%').replace('{pct}', continuityPct)}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {t.scoutProfileSubtitle} • {currentRoster.length} {t.trackedPlayers}
                    </p>
                  </div>

                  {/* Standing points pill */}
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      {t.colRank}
                    </span>
                    <div className="font-mono text-xl font-black text-amber-400">
                      {currentTeamStanding?.stats?.wonMatches != null 
                        ? currentTeamStanding.stats.wonMatches * 2 
                        : (currentTeamStanding?.points ?? ((currentTeamStanding?.won ?? 0) * 2))} {t.colPts}
                      <span className="text-xs text-slate-300 font-semibold ml-1.5">
                        (#{currentTeamStanding?.position ?? currentTeamStanding?.rank ?? '-'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team Stats Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      {t.statRecord}
                    </span>
                    <span className="font-mono text-xl font-black text-slate-200">
                      {currentTeamStanding?.stats?.wonMatches ?? currentTeamStanding?.won ?? 0}W - {currentTeamStanding?.stats?.lostMatches ?? currentTeamStanding?.lost ?? 0}L
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      {t.statWinRate}
                    </span>
                    <span className="font-mono text-xl font-black text-sky-400">
                      {(() => {
                        const won = currentTeamStanding?.stats?.wonMatches ?? currentTeamStanding?.won ?? 0;
                        const played = currentTeamStanding?.stats?.playedMatches ?? currentTeamStanding?.played ?? 0;
                        return played > 0 ? `${Math.round((won / played) * 100)}%` : '-';
                      })()}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      {t.statDiff}
                    </span>
                    {(() => {
                      const diffVal = (currentTeamStanding?.stats?.pointsPerGame != null && currentTeamStanding?.stats?.opponentsPointsPerGame != null)
                        ? (currentTeamStanding.stats.pointsPerGame - currentTeamStanding.stats.opponentsPointsPerGame).toFixed(1)
                        : (currentTeamStanding?.pointDiff != null ? Number(currentTeamStanding.pointDiff).toFixed(1) : '0.0');
                      return (
                        <span className={`font-mono text-xl font-black ${Number(diffVal) > 0 ? 'text-emerald-400' : (Number(diffVal) < 0 ? 'text-rose-400' : 'text-slate-400')}`}>
                          {Number(diffVal) > 0 ? `+${diffVal}` : diffVal}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      {t.statRosterSize}
                    </span>
                    <span className="font-mono text-xl font-black text-amber-400">
                      {currentRoster.length} {t.playersCount}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      {t.statContinuity}
                    </span>
                    <span className="font-mono text-xl font-black text-emerald-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      {continuityPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* DYNAMIC ALERTS: SUMMARY BADGES ABOVE ROSTER TABLE                     */}
              {/* ===================================================================== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Alert 1: High Foul Targets (> 3.0 Fouls) */}
                <div className="glass-card p-4 border-rose-500/40 bg-slate-900/90 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      </div>
                      <h3 className="text-xs font-black text-rose-300 uppercase tracking-wider">
                        {t.alertFoulTitle}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                      {highFoulTargets.length} {t.alertFoulBadge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.alertFoulStrategy}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {highFoulTargets.length > 0 ? (
                      highFoulTargets.map(p => (
                        <button
                          key={p.fid}
                          type="button"
                          onClick={() => setSelectedPlayer(p)}
                          className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        >
                          <span>#{p.number} {p.name}</span>
                          <span className="font-mono text-rose-400 font-black">({p.foulsAVG.toFixed(1)} F/G)</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic bg-slate-950/60 px-3 py-1.5 rounded-lg w-full text-center">
                        {t.alertFoulEmpty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Alert 2: Primary Shooters (> 1.5 Made 3PT/G) */}
                <div className="glass-card p-4 border-amber-500/40 bg-slate-900/90 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                        <Target className="w-4 h-4 text-amber-400" />
                      </div>
                      <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                        {t.alertShooterTitle}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {primaryShooters.length} {t.alertShooterBadge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.alertShooterStrategy}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {primaryShooters.length > 0 ? (
                      primaryShooters.map(p => (
                        <button
                          key={p.fid}
                          type="button"
                          onClick={() => setSelectedPlayer(p)}
                          className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        >
                          <span>#{p.number} {p.name}</span>
                          <span className="font-mono text-amber-300 font-black">({p.threeMadeAVG.toFixed(1)} 3PM • {p.threePct}%)</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic bg-slate-950/60 px-3 py-1.5 rounded-lg w-full text-center">
                        {t.alertShooterEmpty}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Roster Table Card */}
              <div className="glass-card p-4 sm:p-5 border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      {t.rosterTitle} ({filteredRoster.length} {t.playersCount})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {t.rosterSubtitle}
                    </p>
                  </div>

                  {/* Filter & Sort Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder={t.searchPlayer}
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 w-44"
                      />
                    </div>

                    <select
                      value={rosterSortBy}
                      onChange={(e) => setRosterSortBy(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold p-1.5 rounded-lg focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="ppg">{t.sortPpg}</option>
                      <option value="fouls">{t.sortFouls}</option>
                      <option value="three">{t.sortThree}</option>
                      <option value="plusMinus">{t.sortPlusMinus}</option>
                      <option value="number">{t.sortNumber}</option>
                    </select>
                  </div>
                </div>

                {/* Roster Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                        <th className="p-3 w-12 text-center">{t.colNumber}</th>
                        <th className="p-3">{t.colNamePos}</th>
                        <th className="p-3 text-center">{t.colGp}</th>
                        <th className="p-3 text-center">{t.colPpg}</th>
                        <th className="p-3 text-center">{t.colFouls}</th>
                        <th className="p-3 text-center">{t.colThree}</th>
                        <th className="p-3 text-center">{t.colTwo}</th>
                        <th className="p-3 text-center">{t.colFt}</th>
                        <th className="p-3 text-center">{t.colPlusMinus}</th>
                        <th className="p-3 text-left">{t.colAlerts}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredRoster.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400">
                            <User className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                            <p className="font-bold text-slate-300">{t.noPlayersTitle}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {rosterSearch.trim() ? `${t.noPlayersSearch} "${rosterSearch}"` : t.noPlayersDesc}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredRoster.map((p) => {
                          const isFoulTarget = p.foulsAVG > 3.0;
                          const isShooter = p.threeMadeAVG > 1.5;

                          return (
                            <tr
                              key={p.fid}
                              onClick={() => setSelectedPlayer(p)}
                              className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                              <td className="p-3 text-center font-mono font-black text-rose-400">
                                #{p.number}
                              </td>
                              <td className="p-3">
                                <span className="font-black text-slate-100 block text-xs">{p.name}</span>
                                <span className="text-[10px] text-slate-400">{p.position}</span>
                              </td>
                              <td className="p-3 text-center font-mono text-slate-400">
                                {p.games}
                              </td>
                              <td className="p-3 text-center font-mono font-black text-rose-400 text-sm">
                                {p.pointsAVG.toFixed(1)}
                              </td>
                              <td className="p-3 text-center font-mono font-bold">
                                <span className={`px-2 py-0.5 rounded ${
                                  isFoulTarget ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black' : 'text-slate-300'
                                }`}>
                                  {p.foulsAVG.toFixed(1)}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold">
                                <span className={isShooter ? 'text-amber-300 font-black' : 'text-slate-300'}>
                                  {p.threePct}%
                                </span>
                                <span className="text-[10px] text-slate-500 ml-1">
                                  ({p.threeMadeAVG.toFixed(1)})
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-sky-400">
                                {p.twoPct}%
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-emerald-400">
                                {p.ftPct}%
                              </td>
                              <td className="p-3 text-center font-mono font-black">
                                <span className={`px-2 py-0.5 rounded ${
                                  p.plusMinusAVG > 0 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : p.plusMinusAVG < 0 
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                      : 'text-slate-400'
                                }`}>
                                  {p.plusMinusAVG > 0 ? `+${p.plusMinusAVG.toFixed(1)}` : p.plusMinusAVG.toFixed(1)}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {isShooter && (
                                    <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <Target className="w-2.5 h-2.5" /> {t.badgeShooter}
                                    </span>
                                  )}
                                  {isFoulTarget && (
                                    <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" /> {t.badgeFoulTarget}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. SLEEK PLAYER PROFILE SLIDE-OUT / MODAL                                 */}
      {/* ========================================================================= */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-2 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                {selectedPlayer.photo ? (
                  <img
                    src={selectedPlayer.photo}
                    alt={selectedPlayer.name}
                    className="w-12 h-12 rounded-xl object-cover border border-rose-500/40 bg-slate-950 flex-none"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-mono font-black text-rose-400 text-lg flex-none">
                    #{selectedPlayer.number}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                    {selectedPlayer.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                    <span>{selectedPlayer.position}</span>
                    <span>•</span>
                    <span className="text-rose-400">{currentTeamStanding?.name || selectedTeamFid}</span>
                    <span>•</span>
                    <span className="text-slate-400 font-mono">{selectedPlayer.games} GP</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Stats Strip */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t.modalPpg}</span>
                <span className="font-mono text-lg font-black text-rose-400">{selectedPlayer.pointsAVG.toFixed(1)}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t.modalFouls}</span>
                <span className={`font-mono text-lg font-black ${selectedPlayer.foulsAVG > 3.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {selectedPlayer.foulsAVG.toFixed(1)}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t.modalThree}</span>
                <span className="font-mono text-lg font-black text-amber-300">{selectedPlayer.threePct}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t.modalPlusMinus}</span>
                <span className={`font-mono text-lg font-black ${selectedPlayer.plusMinusAVG > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {selectedPlayer.plusMinusAVG > 0 ? `+${selectedPlayer.plusMinusAVG.toFixed(1)}` : selectedPlayer.plusMinusAVG.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Additional Season Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">{t.modalRebounds}</span>
                <span className="font-mono text-sm font-black text-slate-200">{selectedPlayer.reboundsAVG.toFixed(1)}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">{t.modalAssists}</span>
                <span className="font-mono text-sm font-black text-slate-200">{selectedPlayer.assistsAVG.toFixed(1)}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">{t.modalGames}</span>
                <span className="font-mono text-sm font-black text-sky-400">{selectedPlayer.games}</span>
              </div>
            </div>

            {/* Tactical Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedPlayer.threeMadeAVG > 1.5 && (
                <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 p-2.5 rounded-xl text-xs w-full flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400 flex-none" />
                  <div>
                    <strong className="block font-black">PRIMARY PERIMETER SHOOTER ({selectedPlayer.threeMadeAVG.toFixed(1)} 3PM/G)</strong>
                    <span className="text-[11px] text-slate-300">{t.alertShooterStrategy}</span>
                  </div>
                </div>
              )}
              {selectedPlayer.foulsAVG > 3.0 && (
                <div className="bg-rose-500/20 text-rose-300 border border-rose-500/40 p-2.5 rounded-xl text-xs w-full flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-none" />
                  <div>
                    <strong className="block font-black">HIGH FOUL TARGET ({selectedPlayer.foulsAVG.toFixed(1)} FOULS/G)</strong>
                    <span className="text-[11px] text-slate-300">{t.alertFoulStrategy}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Shooting Splits */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                {t.modalSplitsTitle}
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold block">{t.modal3pt}</span>
                  <span className="font-mono text-sm font-black text-amber-300">{selectedPlayer.threePct}%</span>
                  <span className="text-[9px] text-slate-500 block">{selectedPlayer.threeMadeAVG.toFixed(1)} {t.modalMadePerGame}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold block">{t.modal2pt}</span>
                  <span className="font-mono text-sm font-black text-sky-400">{selectedPlayer.twoPct}%</span>
                  <span className="text-[9px] text-slate-500 block">{selectedPlayer.twoMadeAVG.toFixed(1)} {t.modalMadePerGame}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold block">{t.modalFt}</span>
                  <span className="font-mono text-sm font-black text-emerald-400">{selectedPlayer.ftPct}%</span>
                </div>
              </div>
            </div>

            {/* CARRIERA / HISTORY Data Table */}
            {(() => {
              const up = selectedPlayer.uniquePlayer || {};
              let historyList = [];

              if (Array.isArray(selectedPlayer.history) && selectedPlayer.history.length > 0) {
                historyList = selectedPlayer.history;
              } else if (Array.isArray(up.history) && up.history.length > 0) {
                historyList = up.history;
              } else if (Array.isArray(up.seasonStats) && up.seasonStats.length > 0) {
                const playersList = Array.isArray(up.players) ? up.players : [];
                historyList = up.seasonStats.map(stat => {
                  const rawId = stat.seasonId != null ? String(stat.seasonId) : '';
                  const matched = playersList.find(pl => String(pl.season?.id) === rawId);
                  const seasonName = matched?.season?.name || stat.seasonName || rawId || '—';
                  const teamName = (matched?.team?.name || stat.teamName || selectedPlayer.teamName || currentTeamStanding?.name || '—').trim();
                  const games = Number(stat.games || 0);
                  const pointsPerGame = stat.pointsPerGame != null 
                    ? Number(stat.pointsPerGame) 
                    : (games > 0 && stat.points != null ? Number((stat.points / games).toFixed(1)) : 0);
                  const twoMadePerGame = stat.twoMadePerGame != null 
                    ? Number(stat.twoMadePerGame) 
                    : (stat.inArcThrowsMadePerGame != null ? Number(stat.inArcThrowsMadePerGame) : (games > 0 && stat.inArcThrowsMade != null ? Number((stat.inArcThrowsMade / games).toFixed(1)) : 0));
                  const threeMadePerGame = stat.threeMadePerGame != null 
                    ? Number(stat.threeMadePerGame) 
                    : (stat.outArcThrowsMadePerGame != null ? Number(stat.outArcThrowsMadePerGame) : (games > 0 && stat.outArcThrowsMade != null ? Number((stat.outArcThrowsMade / games).toFixed(1)) : 0));
                  const freeThrowsPercentage = stat.freeThrowsPercentage != null ? Number(stat.freeThrowsPercentage) : null;
                  return {
                    seasonId: rawId,
                    seasonName,
                    teamName,
                    games,
                    pointsPerGame,
                    twoMadePerGame,
                    threeMadePerGame,
                    freeThrowsPercentage
                  };
                });
              }

              // Fallback to active season if empty and player has games
              if (historyList.length === 0 && selectedPlayer.games > 0) {
                historyList = [
                  {
                    seasonId: '14544',
                    seasonName: '2025/2026',
                    teamName: (selectedPlayer.teamName || currentTeamStanding?.name || '—').trim(),
                    games: selectedPlayer.games,
                    pointsPerGame: selectedPlayer.pointsAVG,
                    twoMadePerGame: selectedPlayer.twoMadeAVG,
                    threeMadePerGame: selectedPlayer.threeMadeAVG,
                    freeThrowsPercentage: selectedPlayer.ftPct
                  }
                ];
              }

              return (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      {t.historyTableTitle || 'CARRIERA / HISTORY'}
                    </span>
                    {historyList.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {historyList.length} {t.historySeason || 'STAGIONI'}
                      </span>
                    )}
                  </div>

                  {historyList.length > 0 ? (
                    <div className="overflow-x-auto -mx-1 sm:mx-0">
                      <table className="w-full text-left text-xs border-collapse font-sans min-w-[500px]">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                            <th className="p-2.5 text-slate-300 font-bold">{t.colSeason || 'Season'}</th>
                            <th className="p-2.5 text-slate-300 font-bold">{t.colTeam || 'Team'}</th>
                            <th className="p-2.5 text-center" title="Games Played">{t.colGp || 'GP'}</th>
                            <th className="p-2.5 text-center" title="Points Per Game">{t.colPpg || 'PTS/G'}</th>
                            <th className="p-2.5 text-center" title="2-Pointers Made Per Game">{t.col2pm || '2PM/G'}</th>
                            <th className="p-2.5 text-center" title="3-Pointers Made Per Game">{t.col3pm || '3PM/G'}</th>
                            <th className="p-2.5 text-center" title="Free Throw Percentage">{t.colFtPct || 'FT%'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                          {historyList.map((row, rIdx) => {
                            const sGames = Number(row.games ?? 0);
                            const sPpg = row.pointsPerGame != null ? Number(row.pointsPerGame).toFixed(1) : '0.0';
                            const s2pm = row.twoMadePerGame != null ? Number(row.twoMadePerGame).toFixed(1) : '0.0';
                            const s3pm = row.threeMadePerGame != null ? Number(row.threeMadePerGame).toFixed(1) : '0.0';
                            const sFtPct = row.freeThrowsPercentage != null ? `${Math.round(Number(row.freeThrowsPercentage))}%` : '—';

                            return (
                              <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-2.5 font-bold text-amber-400 text-xs font-sans whitespace-nowrap">
                                  {row.seasonName || row.seasonId || '—'}
                                </td>
                                <td className="p-2.5 text-slate-200 font-semibold text-xs font-sans whitespace-nowrap">
                                  {row.teamName || '—'}
                                </td>
                                <td className="p-2.5 text-center text-slate-300 font-mono">
                                  {sGames}
                                </td>
                                <td className="p-2.5 text-center font-black text-rose-400 font-mono">
                                  {sPpg}
                                </td>
                                <td className="p-2.5 text-center text-sky-400 font-mono">
                                  {s2pm}
                                </td>
                                <td className="p-2.5 text-center text-amber-300 font-mono">
                                  {s3pm}
                                </td>
                                <td className="p-2.5 text-center text-emerald-400 font-bold font-mono">
                                  {sFtPct}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2 text-center">
                      {t.noHistory || 'Nessun dato di carriera disponibile.'}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. JSON IMPORTER MODAL                                                    */}
      {/* ========================================================================= */}
      {showImporter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                    IMPORT LEAGUE JSON
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Paste raw standings or roster JSON to update the Hub
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImporter(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={jsonInputText}
              onChange={(e) => setJsonInputText(e.target.value)}
              rows={8}
              placeholder='[{"rank": 1, "teamFid": "...", "name": "...", "points": 28, "won": 14, "lost": 4}]'
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-rose-400"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                Reset to Default Sample League
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImporter(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonInputText);
                      if (Array.isArray(parsed)) {
                        setStandings(parsed);
                        localStorage.setItem('bba_fip_standings', JSON.stringify(parsed));
                        setStatusMsg(`✅ Imported ${parsed.length} teams into standings`);
                        setShowImporter(false);
                      } else if (typeof parsed === 'object') {
                        setRosters(parsed);
                        localStorage.setItem('bba_fip_rosters', JSON.stringify(parsed));
                        setStatusMsg(`✅ Imported rosters for ${Object.keys(parsed).length} teams`);
                        setShowImporter(false);
                      }
                    } catch (err) {
                      setStatusMsg(`❌ JSON Error: ${err.message}`);
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-1.5 rounded-lg text-xs transition-all shadow-md active:scale-95"
                >
                  LOAD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
