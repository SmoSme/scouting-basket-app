import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, Target, Upload, FileText, AlertTriangle, 
  RefreshCw, Search, ArrowLeft, Shield, Zap, ChevronRight, ChevronDown,
  X, User, HelpCircle, Loader2, Terminal, Flame, CheckCircle2,
  Users, Info, BarChart2
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
      player: { fid: "p1_1", name: "Marco Rossi", number: 8, position: "SG", starting: true },
      uniquePlayer: {
        id: "up_p1_1",
        stats: {
          games: 48,
          points: 864,
          pointsPerGame: 18.0,
          freeThrowsMade: 198,
          freeThrowsPercentage: 83.5,
          inArcThrowsMade: 226,
          outArcThrowsMade: 128,
          fouls: 96,
          plusMinus: 215,
          rebounds: 154,
          assists: 173
        }
      },
      history: [
        {
          seasonId: "s_2627",
          seasonName: "2026/2027",
          isAggregate: true,
          games: 4,
          pointsPerGame: 20.5,
          twoMadePerGame: 5.0,
          threeMadePerGame: 3.0,
          freeThrowsPercentage: 88.0,
          foulsPerGame: 1.8,
          plusMinusPerGame: 7.2,
          reboundsPerGame: 3.5,
          assistsPerGame: 4.2,
          teams: [
            {
              teamName: "Divisione Regionale 2 - Virtus Roma 1960",
              competitionName: "Divisione Regionale 2",
              games: 4,
              pointsPerGame: 20.5,
              twoMadePerGame: 5.0,
              threeMadePerGame: 3.0,
              freeThrowsPercentage: 88.0,
              foulsPerGame: 1.8,
              plusMinusPerGame: 7.2,
              reboundsPerGame: 3.5,
              assistsPerGame: 4.2
            }
          ]
        },
        {
          seasonId: "s_2526",
          seasonName: "2025/2026",
          isAggregate: true,
          games: 24,
          pointsPerGame: 19.5,
          twoMadePerGame: 5.1,
          threeMadePerGame: 2.7,
          freeThrowsPercentage: 84.3,
          foulsPerGame: 2.1,
          plusMinusPerGame: 5.4,
          reboundsPerGame: 3.2,
          assistsPerGame: 3.6,
          teams: [
            {
              teamName: "Divisione Regionale 2 - Virtus Roma 1960",
              competitionName: "Divisione Regionale 2",
              games: 18,
              pointsPerGame: 18.6,
              twoMadePerGame: 4.8,
              threeMadePerGame: 2.8,
              freeThrowsPercentage: 84.1,
              foulsPerGame: 2.0,
              plusMinusPerGame: 4.8,
              reboundsPerGame: 3.0,
              assistsPerGame: 3.2
            },
            {
              teamName: "Under 19 Maschile Gold - Virtus Roma U19",
              competitionName: "Under 19 Maschile Gold",
              games: 6,
              pointsPerGame: 22.0,
              twoMadePerGame: 6.0,
              threeMadePerGame: 2.5,
              freeThrowsPercentage: 85.0,
              foulsPerGame: 2.3,
              plusMinusPerGame: 7.2,
              reboundsPerGame: 3.8,
              assistsPerGame: 4.8
            }
          ]
        },
        {
          seasonId: "s_2425",
          seasonName: "2024/2025",
          isAggregate: true,
          games: 20,
          pointsPerGame: 15.4,
          twoMadePerGame: 4.0,
          threeMadePerGame: 2.1,
          freeThrowsPercentage: 80.0,
          foulsPerGame: 2.5,
          plusMinusPerGame: 3.1,
          reboundsPerGame: 2.8,
          assistsPerGame: 2.9,
          teams: [
            {
              teamName: "Serie D Regionale - Basket Frascati",
              competitionName: "Serie D Regionale",
              games: 20,
              pointsPerGame: 15.4,
              twoMadePerGame: 4.0,
              threeMadePerGame: 2.1,
              freeThrowsPercentage: 80.0,
              foulsPerGame: 2.5,
              plusMinusPerGame: 3.1,
              reboundsPerGame: 2.8,
              assistsPerGame: 2.9
            }
          ]
        }
      ],
      stats: {
        games: 18,
        timePlayedAVG: 1815,
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
      player: { fid: "p1_2", name: "Davide Moretti", number: 15, position: "C", starting: true },
      stats: {
        games: 17,
        timePlayedAVG: 1690,
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
      player: { fid: "p1_3", name: "Lorenzo Santoro", number: 4, position: "PG", starting: true },
      stats: {
        games: 18,
        timePlayedAVG: 1545,
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
      player: { fid: "p1_4", name: "Andrea Bianchi", number: 11, position: "PF", starting: true },
      stats: {
        games: 16,
        timePlayedAVG: 1415,
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
      player: { fid: "p1_5", name: "Federico Ferri", number: 23, position: "SF", starting: true },
      stats: {
        games: 18,
        timePlayedAVG: 1310,
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
      player: { fid: "p1_6", name: "Giulio Colasanti", number: 19, position: "G", starting: false },
      stats: {
        games: 15,
        timePlayedAVG: 750,
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

// Formats seconds into MM:SS string (e.g. 1415 -> "23:35")
export function formatMinutes(seconds) {
  if (seconds == null || isNaN(seconds) || Number(seconds) <= 0) return '00:00';
  const totalSec = Math.round(Number(seconds));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
      const seasonTeams = playersList.filter(pl => pl && pl.season && String(pl.season.id) === rawSeasonId);
      const matchedPlayer = seasonTeams[0];
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

      const teamsDetail = seasonTeams.map(st => {
        const tStats = st.stats || {};
        const compName = st.competition?.name ? st.competition.name.trim() : '';
        const tName = st.team?.name ? st.team.name.trim() : '—';
        const fullTeamName = compName ? `${compName} - ${tName}` : tName;
        const tGames = Number(tStats.games || 0);
        return {
          teamName: fullTeamName,
          competitionName: compName,
          games: tGames,
          pointsPerGame: tStats.pointsPerGame != null ? Number(tStats.pointsPerGame) : (tGames > 0 && tStats.points != null ? Number((tStats.points / tGames).toFixed(1)) : 0),
          twoMadePerGame: tStats.inArcThrowsAVG != null ? Number(tStats.inArcThrowsAVG) : 0,
          threeMadePerGame: tStats.outArcThrowsAVG != null ? Number(tStats.outArcThrowsAVG) : 0,
          freeThrowsPercentage: tStats.freeThrowsPercentage != null ? Number(tStats.freeThrowsPercentage) : null,
          foulsPerGame: tStats.foulsAVG != null ? Number(tStats.foulsAVG) : (tStats.foulsPerGame != null ? Number(tStats.foulsPerGame) : 0),
          plusMinusPerGame: tStats.plusMinusAVG != null ? Number(tStats.plusMinusAVG) : (tStats.plusMinusPerGame != null ? Number(tStats.plusMinusPerGame) : 0),
          reboundsPerGame: tStats.reboundsAVG != null ? Number(tStats.reboundsAVG) : (tStats.reboundsPerGame != null ? Number(tStats.reboundsPerGame) : 0),
          assistsPerGame: tStats.assistsAVG != null ? Number(tStats.assistsAVG) : (tStats.assistsPerGame != null ? Number(tStats.assistsPerGame) : 0)
        };
      });

      return {
        seasonId: rawSeasonId,
        seasonName,
        teamName,
        isAggregate: true,
        games,
        pointsPerGame: ppg,
        twoMadePerGame: twoMade,
        threeMadePerGame: threeMade,
        freeThrowsPercentage: ftPct,
        foulsPerGame: stat.foulsPerGame != null ? Number(stat.foulsPerGame) : 0,
        plusMinusPerGame: stat.plusMinusPerGame != null ? Number(stat.plusMinusPerGame) : 0,
        reboundsPerGame: stat.reboundsPerGame != null ? Number(stat.reboundsPerGame) : 0,
        assistsPerGame: stat.assistsPerGame != null ? Number(stat.assistsPerGame) : 0,
        teams: teamsDetail
      };
    });
  }

  // Fallback to active season if history is still empty and player has games
  if (history.length === 0 && Number(s.games ?? s.gp ?? 0) > 0) {
    const fallbackTeam = (p.team?.name || item.teamName || '—').trim();
    const g = Number(s.games ?? s.gp ?? 0);
    const ppg = Number(s.pointsPerGame ?? s.pointsAVG ?? s.ppg ?? 0);
    const twoMade = Number(s.inArcThrowsAVG ?? s.inArcThrowsMadeAVG ?? 0);
    const threeMade = Number(s.outArcThrowsAVG ?? s.outArcThrowsMadeAVG ?? 0);
    const ftPct = s.freeThrowsPercentage != null ? Number(s.freeThrowsPercentage) : null;
    const fouls = Number(s.foulsAVG ?? s.foulsPerGame ?? 0);
    const pm = Number(s.plusMinusAVG ?? s.plusMinusPerGame ?? 0);
    const reb = Number(s.reboundsAVG ?? s.reboundsPerGame ?? 0);
    const ast = Number(s.assistsAVG ?? s.assistsPerGame ?? 0);

    history = [
      {
        seasonId: '14544',
        seasonName: '2025/2026',
        teamName: fallbackTeam,
        isAggregate: true,
        games: g,
        pointsPerGame: ppg,
        twoMadePerGame: twoMade,
        threeMadePerGame: threeMade,
        freeThrowsPercentage: ftPct,
        foulsPerGame: fouls,
        plusMinusPerGame: pm,
        reboundsPerGame: reb,
        assistsPerGame: ast,
        teams: [
          {
            teamName: `Divisione Regionale 2 - ${fallbackTeam}`,
            competitionName: 'Divisione Regionale 2',
            games: g,
            pointsPerGame: ppg,
            twoMadePerGame: twoMade,
            threeMadePerGame: threeMade,
            freeThrowsPercentage: ftPct,
            foulsPerGame: fouls,
            plusMinusPerGame: pm,
            reboundsPerGame: reb,
            assistsPerGame: ast
          }
        ]
      }
    ];
  }

  const startingVal = item.starting != null ? item.starting : (p.starting != null ? p.starting : (s.starting != null ? s.starting : false));
  const timePlayedAVG = Number(s.timePlayedAVG ?? s.timePlayed ?? item.timePlayedAVG ?? p.timePlayedAVG ?? 0);
  const ppgVal = Number(s.pointsPerGame ?? s.pointsAVG ?? s.ppg ?? 0);
  const twoMadeVal = Number(s.twoMadePerGame ?? s.inArcThrowsAVG ?? s.inArcThrowsMadeAVG ?? 0);
  const threeMadeVal = Number(s.threeMadePerGame ?? s.outArcThrowsAVG ?? s.outArcThrowsMadeAVG ?? s.threePtMadeAVG ?? 0);
  const ftPctRaw = s.freeThrowsPercentage != null ? Number(s.freeThrowsPercentage) : (s.freeThrowsPercent != null ? Number(s.freeThrowsPercent) : null);

  const cleanPosition = (p.position && typeof p.position === 'string' && p.position.trim() && p.position.trim().toLowerCase() !== 'player') 
    ? p.position.trim() 
    : '';

  return {
    fid: p.fid || `p_${idx}`,
    name,
    firstName: p.name || '',
    lastName: p.lastName || '',
    number: p.number != null ? p.number : (idx + 1),
    position: cleanPosition,
    captain: Boolean(p.captain),
    starting: Boolean(startingVal),
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
    timePlayedAVG: timePlayedAVG,
    pointsAVG: ppgVal,
    pointsPerGame: ppgVal,
    foulsAVG: Number(s.foulsAVG ?? s.fouls ?? 0),
    threePct: formatPct(s.outArcThrowsPercentage ?? s.shotsOutArcPercent ?? s.three_pct ?? s.pct_3p),
    threeMadeAVG: threeMadeVal,
    threeMadePerGame: threeMadeVal,
    twoPct: formatPct(s.inArcThrowsPercentage ?? s.shotsInArcPercent ?? s.two_pct ?? s.pct_2p),
    twoMadeAVG: twoMadeVal,
    twoMadePerGame: twoMadeVal,
    freeThrowsPercentage: ftPctRaw,
    ftPct: formatPct(s.freeThrowsPercentage ?? s.freeThrowsPercent ?? s.ft_pct),
    plusMinusAVG: Number(s.plusMinusAVG ?? s.plus_minus ?? 0),
    reboundsAVG: Number(s.reboundsAVG ?? s.totalRebounds ?? 0),
    assistsAVG: Number(s.assistsAVG ?? s.assistsPerGame ?? 0),
    stealsAVG: Number(s.stealsAVG ?? 0),
    blocksAVG: Number(s.blocksAVG ?? 0),
    turnoversAVG: Number(s.turnoversAVG ?? 0),
    stats: {
      ...s,
      games: Number(s.games ?? s.gp ?? 0),
      timePlayedAVG: timePlayedAVG,
      pointsAVG: ppgVal,
      pointsPerGame: ppgVal,
      foulsAVG: Number(s.foulsAVG ?? s.fouls ?? 0),
      inArcThrowsAVG: twoMadeVal,
      outArcThrowsAVG: threeMadeVal,
      freeThrowsPercentage: ftPctRaw
    }
  };
}

// =========================================================================
// TACTICAL SCOUTING TAGS ENGINE & CONFIGURATION
// =========================================================================
export const TACTICAL_TAGS_CONFIG = [
  {
    id: 'perimeter_specialist',
    icon: '🎯',
    label: 'Perimeter Specialist',
    labelIt: 'Specialista Perimetrale',
    criteria: '3PM/G ≥ 1.5 & Pct3 ≥ 45%',
    criteriaDesc: 'Almeno 1.5 triple a partita e oltre il 45% dei punti dal tiro da 3.',
    criteriaDescEn: 'At least 1.5 3PM/G and over 45% of points from 3-pointers.',
    coachInsight: 'Tiratore primario ad alto volume perimetrale. Uscire forte dai blocchi, passare aggressivamente sopra i pick & roll e negare ricezioni piedi a terra.',
    coachInsightEn: 'High-volume primary perimeter shooter. Run shooters off screens, fight over pick & rolls, and deny spot-up catch-and-shoot looks.',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dotClass: 'bg-emerald-400',
    rule: (m) => m.ThreePM_PerGame >= 1.5 && m.Pct3 >= 45,
  },
  {
    id: 'inside_slasher',
    icon: '🚜',
    label: 'Inside / Slasher',
    labelIt: 'Attaccante Interno',
    criteria: '2PM/G ≥ 3.5 & Pct3 ≤ 15%',
    criteriaDesc: 'Almeno 3.5 canestri da 2 a partita e non oltre il 15% dei punti dal tiro da 3.',
    criteriaDescEn: 'At least 3.5 2PM/G and no more than 15% of points from 3-pointers.',
    coachInsight: 'Attacca aggressivamente il ferro dal palleggio o lavora spalle a canestro. Chiudere le linee di penetrazione, proteggere l\'area e concedere il tiro dal perimetro.',
    coachInsightEn: 'Attacks the rim aggressively off the dribble or in the paint. Pack the lane, wall off drives, and force contested pull-ups from deep.',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    dotClass: 'bg-sky-400',
    rule: (m) => m.TwoPM_PerGame >= 3.5 && m.Pct3 <= 15,
  },
  {
    id: 'foul_magnet',
    icon: '🧲',
    label: 'Foul Magnet',
    labelIt: 'Foul Magnet',
    criteria: 'FTA/G ≥ 4.5',
    criteriaDesc: 'Almeno 4.5 tentativi ai tiri liberi a partita.',
    criteriaDescEn: 'At least 4.5 free throw attempts per game.',
    coachInsight: 'Specialista nel creare contatti e subire falli. Disciplina difensiva fondamentale: mani in alto in verticalità senza abboccare alle finte di tiro.',
    coachInsightEn: 'Master at drawing fouls and initiating contact. Extreme discipline required: contest vertically with high hands and do not bite on pump fakes.',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dotClass: 'bg-amber-400',
    rule: (m) => m.FT_Att_PerGame >= 4.5,
  },
  {
    id: 'clutch_ft',
    icon: '🥶',
    label: 'Clutch FT Shooter',
    labelIt: 'Glaciale ai Liberi',
    criteria: 'FT% ≥ 78% & FTA/G ≥ 2.5',
    criteriaDesc: 'Percentuale ai tiri liberi ≥ 78% con almeno 2.5 tentativi a partita.',
    criteriaDescEn: 'Free throw percentage >= 78% with at least 2.5 FTA/G.',
    coachInsight: 'Tiratore infallibile a cronometro fermo. Evitare categoricamente falli sul tiro o situazioni di bonus nei finali punto a punto.',
    coachInsightEn: 'Deadly free-throw shooter in clutch moments. Never commit intentional fouls or surrender bonus free throws in close late-game scenarios.',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    dotClass: 'bg-teal-400',
    rule: (m) => m.freeThrowsPercentage != null && m.freeThrowsPercentage >= 78 && m.FT_Att_PerGame >= 2.5,
  },
  {
    id: 'hack_a_target',
    icon: '🧱',
    label: 'Hack-a-Target',
    labelIt: 'Bersaglio Hack',
    criteria: 'FT% ≤ 50% & FTA/G ≥ 1.5',
    criteriaDesc: 'Percentuale ai tiri liberi ≤ 50% con almeno 1.5 tentativi a partita.',
    criteriaDescEn: 'Free throw percentage <= 50% with at least 1.5 FTA/G: tactical foul target.',
    coachInsight: 'Bersaglio tattico difensivo: gravi difficoltà dalla lunetta. Opzione strategica per spendere falli in bonus sotto canestro per impedire 2 facili.',
    coachInsightEn: 'Tactical target: poor free-throw conversion. Strategic target to commit smart fouls in the bonus rather than allowing uncontested layups.',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    dotClass: 'bg-rose-400',
    rule: (m) => m.freeThrowsPercentage != null && m.freeThrowsPercentage <= 50 && m.FT_Att_PerGame >= 1.5,
  },
  {
    id: 'foul_trouble',
    icon: '🚨',
    label: 'Foul Trouble Risk',
    labelIt: 'Foul Trouble Risk',
    criteria: 'Fouls/G ≥ 3.0',
    criteriaDesc: 'Media falli commessi ≥ 3.0 a partita.',
    criteriaDescEn: 'Averages 3.0+ personal fouls committed per game.',
    coachInsight: 'Difensore indisciplinato e a costante rischio espulsione. Puntarlo fin dai primi minuti con isolamenti e roll decisi per costringerlo in panchina.',
    coachInsightEn: 'Foul-prone defender frequently in foul trouble. Attack them early in isolations and pick & rolls to force early substitution.',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    dotClass: 'bg-red-400',
    rule: (m) => m.Fouls_PerGame >= 3.0,
  },
];

export function getTacticalTags(stats, games) {
  const emptyMetrics = {
    TotalPoints: 0,
    totalPts: 0,
    Pct3: 0,
    pct3: 0,
    Pct2: 0,
    pct2: 0,
    PctFT: 0,
    pctFT: 0,
    FT_Att_PerGame: 0,
    ftAttPerGame: 0,
    ThreePM_PerGame: 0,
    threePerGame: 0,
    TwoPM_PerGame: 0,
    twoPerGame: 0,
    Fouls_PerGame: 0,
    foulsPerGame: 0,
    freeThrowsPercentage: null,
    ftPct: null,
    ptsPerGame: 0,
    threeMade: 0,
    twoMade: 0,
    ftMade: 0,
    games: 0
  };
  if (!stats) return { tags: [], metrics: emptyMetrics };
  const g = Number(games ?? stats.games ?? 0);
  if (g <= 0) return { tags: [], metrics: emptyMetrics };

  const freeThrowsPercentage = stats.freeThrowsPercentage != null 
    ? Number(stats.freeThrowsPercentage) 
    : (stats.ftPct != null ? Number(stats.ftPct) : null);

  const outArcThrowsMade = stats.outArcThrowsMade != null 
    ? Number(stats.outArcThrowsMade) 
    : (Number(stats.threeMadePerGame ?? stats.threeMadeAVG ?? stats.outArcThrowsAVG ?? 0) * g);

  const inArcThrowsMade = stats.inArcThrowsMade != null 
    ? Number(stats.inArcThrowsMade) 
    : (Number(stats.twoMadePerGame ?? stats.twoMadeAVG ?? stats.inArcThrowsAVG ?? 0) * g);

  let freeThrowsMade = stats.freeThrowsMade != null 
    ? Number(stats.freeThrowsMade) 
    : (stats.freeThrowsMadeAVG != null 
        ? Number(stats.freeThrowsMadeAVG) * g 
        : (() => {
            const ppg = stats.pointsPerGame != null ? Number(stats.pointsPerGame) : (stats.pointsAVG != null ? Number(stats.pointsAVG) : (stats.points != null ? Number(stats.points) / g : 0));
            return Math.max(0, Math.round(ppg * g - (outArcThrowsMade * 3 + inArcThrowsMade * 2)));
          })());

  let freeThrowsFailed = stats.freeThrowsFailed != null 
    ? Number(stats.freeThrowsFailed) 
    : (() => {
        if (freeThrowsPercentage != null && freeThrowsPercentage > 0 && freeThrowsMade > 0) {
          const totalAtt = freeThrowsMade / (freeThrowsPercentage / 100);
          return Math.max(0, totalAtt - freeThrowsMade);
        }
        return 0;
      })();

  const fouls = stats.fouls != null 
    ? Number(stats.fouls) 
    : (Number(stats.foulsPerGame ?? stats.foulsAVG ?? 0) * g);

  // Recalibrated volume + distribution formulas (Phase 3.10)
  const TotalPoints = (outArcThrowsMade * 3) + (inArcThrowsMade * 2) + freeThrowsMade;
  const Pct3 = TotalPoints > 0 ? ((outArcThrowsMade * 3) / TotalPoints) * 100 : 0;
  const Pct2 = TotalPoints > 0 ? ((inArcThrowsMade * 2) / TotalPoints) * 100 : 0;
  const PctFT = TotalPoints > 0 ? (freeThrowsMade / TotalPoints) * 100 : 0;
  const FT_Att_PerGame = g > 0 ? (freeThrowsMade + freeThrowsFailed) / g : 0;
  const ThreePM_PerGame = g > 0 ? outArcThrowsMade / g : 0;
  const TwoPM_PerGame = g > 0 ? inArcThrowsMade / g : 0;
  const Fouls_PerGame = g > 0 ? fouls / g : 0;

  const metrics = {
    TotalPoints: Math.round(TotalPoints),
    totalPts: Math.round(TotalPoints),
    Pct3,
    pct3: Pct3,
    Pct2,
    pct2: Pct2,
    PctFT,
    pctFT: PctFT,
    FT_Att_PerGame,
    ftAttPerGame: FT_Att_PerGame,
    ThreePM_PerGame,
    threePerGame: ThreePM_PerGame,
    TwoPM_PerGame,
    twoPerGame: TwoPM_PerGame,
    Fouls_PerGame,
    foulsPerGame: Fouls_PerGame,
    freeThrowsPercentage,
    ftPct: freeThrowsPercentage,
    ptsPerGame: g > 0 ? (stats.pointsPerGame != null ? Number(stats.pointsPerGame) : (stats.pointsAVG != null ? Number(stats.pointsAVG) : TotalPoints / g)) : 0,
    threeMade: Math.round(outArcThrowsMade),
    twoMade: Math.round(inArcThrowsMade),
    ftMade: Math.round(freeThrowsMade),
    games: g
  };

  const tags = TACTICAL_TAGS_CONFIG.filter(cfg => cfg.rule(metrics));

  return { tags, metrics };
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
    backToRoster: "Torna al Roster",
    // Career history / Statistiche Totale
    continuityBadge: "Confermati dal 24/25: {pct}%",
    statContinuity: "CONTINUITÀ 24/25",
    colSeason: "STAGIONE",
    col2pm: "2PT/P",
    col3pm: "3PT/P",
    colFtPct: "%TL",
    colFf: "FF/P",
    colReb: "RIM/P",
    colAst: "AST/P",
    historyTableTitle: "CARRIERA / STORICO FIP",
    historyTitle: "CARRIERA",
    historySeason: "STAGIONI",
    seasonTotalBadge: "TOTALE",
    combinedTeams: "Totale ({count} Squadre)",
    historyMin: "MIN",
    historyPts: "PT",
    historyFt: "TL",
    history2p: "2PT",
    history3p: "3PT",
    historyFouls: "FF",
    historyPlusMinus: "+/-",
    historyMed: "MED",
    historyMedLabel: "Media / Partita",
    historyTotale: "Totale",
    historyTotLabel: "Totale Carriera",
    noHistory: "Nessun dato di carriera disponibile.",
    colTags: "TAG",
    legendBtn: "Legenda Tag",
    legendTitle: "LEGENDA TAG TATTICI",
    legendSubtitle: "Metriche di scouting avanzate e regole di classificazione applicate a profilo e stagioni",
    shotDistTitle: "DISTRIBUZIONE PUNTI / SHOT PROFILE",
    shotDistSubtitle: "Ripartizione percentuale dei punti segnati tra 2PT, 3PT e Tiri Liberi",
    ptsFrom2: "Punti da 2 (2PT)",
    ptsFrom3: "Punti da 3 (3PT)",
    ptsFromFt: "Tiri Liberi (TL)",
    tacticalBadgesTitle: "PROFILO TATTICO & ALERT COACH",
    basedOnSeason: "Stagione 2025/2026 ({games} gare)",
    basedOnCareer: "Carriera Totale ({games} gare, campione stagionale ridotto < 3)",
    noActiveTags: "Nessun tag tattico specifico attivato per i criteri di volume e precisione.",
    sort2pm: "Ordina: 2PM/P",
    sort3pm: "Ordina: 3PM/P",
    sortFt: "Ordina: TL%",
    scoutingSummaryTitle: "CHIAVI TATTICHE & SCOUTING AVVERSARIO",
    scoutingSummarySubtitle: "Minacce e profili di tiro calcolati sulle statistiche effettive in questa squadra (Team Scope)",
    activeCategories: "CATEGORIE ATTIVE",
    noTeamThreats: "Nessun giocatore avversario supera le soglie estreme di volume per i tag tattici primari.",
    colMin: "MIN",
    latestStartingFive: "QUINTETTO ULTIMA GARA",
    latestStartingFiveDesc: "Titolari schierati nella partita più recente (starting: true)",
    mostUsedLineup: "QUINTETTO PIÙ UTILIZZATO",
    mostUsedLineupDesc: "I 5 giocatori con più presenze in squadra (games con tie-breaker su minuti/punti)",
    noStartingFive: "Nessun quintetto titolare registrato per questa squadra.",
    noLineupData: "Nessun dato di presenze disponibile per questa squadra.",
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
    backToRoster: "Back to Team Roster",
    // Career history / Statistiche Totale
    continuityBadge: "Core Retained from 24/25: {pct}%",
    statContinuity: "CORE CONTINUITY",
    colSeason: "SEASON",
    col2pm: "2PM/G",
    col3pm: "3PM/G",
    colFtPct: "FT%",
    colFf: "PF/G",
    colReb: "REB/G",
    colAst: "AST/G",
    historyTableTitle: "CAREER / FIP HISTORY",
    historyTitle: "CAREER",
    historySeason: "SEASONS",
    seasonTotalBadge: "TOTAL",
    combinedTeams: "Total ({count} Teams)",
    historyMin: "MIN",
    historyPts: "PT",
    historyFt: "TL",
    history2p: "2PT",
    history3p: "3PT",
    historyFouls: "FF",
    historyPlusMinus: "+/-",
    historyMed: "MED",
    historyMedLabel: "Per Game Average",
    historyTotale: "Totale",
    historyTotLabel: "Career Totals",
    noHistory: "No career data available.",
    colTags: "TAGS",
    legendBtn: "Tag Legend",
    legendTitle: "TACTICAL SCOUTING TAGS LEGEND",
    legendSubtitle: "Advanced scouting criteria and classification rules applied to profile and season history",
    shotDistTitle: "POINT DISTRIBUTION / SHOT PROFILE",
    shotDistSubtitle: "Percentage breakdown of total points between 2PT, 3PT and Free Throws",
    ptsFrom2: "Points from 2PT",
    ptsFrom3: "Points from 3PT",
    ptsFromFt: "Free Throws",
    tacticalBadgesTitle: "TACTICAL PROFILE & COACH ALERTS",
    basedOnSeason: "Season 2025/2026 ({games} games)",
    basedOnCareer: "Career Totals ({games} games, limited season sample < 3)",
    noActiveTags: "No specific tactical tags triggered under current volume and efficiency thresholds.",
    sort2pm: "Sort: 2PM/G",
    sort3pm: "Sort: 3PM/G",
    sortFt: "Sort: FT%",
    scoutingSummaryTitle: "KEY MATCHUPS & OPPONENT SCOUTING",
    scoutingSummarySubtitle: "Tactical threats and shot profiles calculated from actual stats in this team (Team Scope)",
    activeCategories: "ACTIVE CATEGORIES",
    noTeamThreats: "No opponent players currently trigger extreme volume thresholds for primary tactical tags.",
    colMin: "MIN",
    latestStartingFive: "LATEST STARTING FIVE",
    latestStartingFiveDesc: "Starters fielded in the most recent game (starting: true)",
    mostUsedLineup: "MOST USED LINEUP",
    mostUsedLineupDesc: "Top 5 players by total games played on this team (tie-breaker on minutes/points)",
    noStartingFive: "No starting lineup registered for this team.",
    noLineupData: "No games played data available for this team.",
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
  const [collapsedSeasons, setCollapsedSeasons] = useState({});
  const [showLegendModal, setShowLegendModal] = useState(false);
  const toggleSeasonCollapse = (seasonKey) => {
    setCollapsedSeasons(prev => ({
      ...prev,
      [seasonKey]: !prev[seasonKey]
    }));
  };

  // UI Filters & Status
  const [standingsSearch, setStandingsSearch] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'pointsPerGame', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key,
        direction: 'desc'
      };
    });
  };

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

  // Handle ESC key to dismiss full-screen player profile, legend popover, or JSON importer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showLegendModal) {
          setShowLegendModal(false);
        } else if (selectedPlayer) {
          setSelectedPlayer(null);
        } else if (showImporter) {
          setShowImporter(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLegendModal, selectedPlayer, showImporter]);

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
  // Dynamic Tactical Alerts & Team-Scope Threat Groups
  // -------------------------------------------------------------------------
  const teamTacticalGroups = useMemo(() => {
    if (!currentRoster || currentRoster.length === 0) return [];

    return TACTICAL_TAGS_CONFIG.map(cfg => {
      const matchingPlayers = currentRoster.filter(p => {
        const g = p.games || p.stats?.games || 0;
        const res = getTacticalTags(p.stats || p, g);
        return res.tags.some(t => t.id === cfg.id);
      });
      return {
        config: cfg,
        players: matchingPlayers
      };
    }).filter(group => group.players.length > 0);
  }, [currentRoster]);

  // Filtered Standings
  const filteredStandings = useMemo(() => {
    if (!Array.isArray(standings)) return [];
    if (!standingsSearch.trim()) return standings;
    const q = standingsSearch.toLowerCase().trim();
    return standings.filter(s => (s.name || s.team?.name || '').toLowerCase().includes(q));
  }, [standings, standingsSearch]);

  // Filtered Roster with Multi-Column Interactive Sorting
  const filteredRoster = useMemo(() => {
    let list = currentRoster;
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        String(p.number).includes(q) || 
        (p.position && p.position.toLowerCase().includes(q))
      );
    }

    const { key, direction } = sortConfig;
    const factor = direction === 'asc' ? 1 : -1;

    return [...list].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (key) {
        case 'number':
          valA = Number(a.number || 0);
          valB = Number(b.number || 0);
          return (valA - valB) * factor;

        case 'name':
          return (a.name || '').localeCompare(b.name || '') * factor;

        case 'games':
          valA = Number(a.games || 0);
          valB = Number(b.games || 0);
          break;

        case 'timePlayedAVG':
          valA = Number(a.timePlayedAVG || a.stats?.timePlayedAVG || 0);
          valB = Number(b.timePlayedAVG || b.stats?.timePlayedAVG || 0);
          break;

        case 'pointsPerGame':
          valA = Number(a.pointsPerGame ?? a.pointsAVG ?? 0);
          valB = Number(b.pointsPerGame ?? b.pointsAVG ?? 0);
          break;

        case 'twoMadePerGame':
          valA = Number(a.twoMadePerGame ?? a.twoMadeAVG ?? 0);
          valB = Number(b.twoMadePerGame ?? b.twoMadeAVG ?? 0);
          break;

        case 'threeMadePerGame':
          valA = Number(a.threeMadePerGame ?? a.threeMadeAVG ?? 0);
          valB = Number(b.threeMadePerGame ?? b.threeMadeAVG ?? 0);
          break;

        case 'freeThrowsPercentage':
          valA = Number(a.freeThrowsPercentage ?? parseFloat(a.ftPct) ?? 0);
          valB = Number(b.freeThrowsPercentage ?? parseFloat(b.ftPct) ?? 0);
          break;

        case 'foulsAVG':
          valA = Number(a.foulsAVG ?? a.foulsPerGame ?? 0);
          valB = Number(b.foulsAVG ?? b.foulsPerGame ?? 0);
          break;

        case 'plusMinus':
          valA = Number(a.plusMinusAVG ?? 0);
          valB = Number(b.plusMinusAVG ?? 0);
          break;

        default:
          valA = Number(a.pointsPerGame ?? a.pointsAVG ?? 0);
          valB = Number(b.pointsPerGame ?? b.pointsAVG ?? 0);
          break;
      }

      if (valA !== valB) {
        return (valA - valB) * factor;
      }
      return Number(a.number || 0) - Number(b.number || 0);
    });
  }, [currentRoster, rosterSearch, sortConfig]);

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
                    {standings
                      .filter(s => {
                        const fid = String(s.fid || s.teamFid || s.id || '');
                        const name = (s.name || s.team?.name || '').toLowerCase();
                        const bbaId = String(import.meta.env.VITE_BBA_TEAM_ID || '211634');
                        return fid !== '211634' && fid !== bbaId && fid !== 'team_bba_academy' && !name.includes('bba') && !name.includes('baronissi');
                      })
                      .map(s => {
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
              {/* AUTOMATED SCOUTING SUMMARY / KEY MATCHUPS (TEAM SCOPE THREATS)        */}
              {/* ===================================================================== */}
              <div className="glass-card p-4 sm:p-5 border-slate-700/80 bg-slate-900/90 shadow-xl space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        {t.scoutingSummaryTitle || 'SCOUTING SUMMARY / KEY MATCHUPS'}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {t.scoutingSummarySubtitle || 'Ruoli e pericoli tattici calcolati sulle statistiche effettive in questa squadra (Team Scope)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLegendModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.legendBtn || 'Legenda Tag'}</span>
                    </button>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      {teamTacticalGroups.length} {t.activeCategories || 'CATEGORIE ATTIVE'}
                    </span>
                  </div>
                </div>

                {teamTacticalGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teamTacticalGroups.map(({ config: tag, players }) => (
                      <div 
                        key={tag.id}
                        className={`p-3.5 rounded-xl border ${tag.badgeClass} bg-slate-950/60 flex flex-col justify-between space-y-2.5 shadow-sm`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg select-none">{tag.icon}</span>
                            <span className="font-black text-xs uppercase tracking-wide text-white">
                              {lang === 'it' ? tag.labelIt : tag.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-300">
                            {players.length}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {players.map(p => (
                            <button
                              key={p.fid}
                              type="button"
                              onClick={() => setSelectedPlayer(p)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                              title={`Apri profilo ${p.name}`}
                            >
                              <span className="text-rose-400 font-mono font-black">#{p.number}</span>
                              <span className="truncate max-w-[130px]">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-center italic">
                    {t.noTeamThreats || 'Nessun giocatore avversario supera le soglie estreme di volume per i tag tattici primari.'}
                  </div>
                )}
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

                  {/* Filter Search Bar (Sorting select removed in favor of clickable headers) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder={t.searchPlayer}
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 w-48 sm:w-56"
                      />
                    </div>
                  </div>
                </div>

                {/* Roster Table with Clickable Column Headers */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider select-none">
                        <th 
                          onClick={() => handleSort('number')}
                          className={`p-3 w-12 text-center cursor-pointer transition-colors group ${sortConfig.key === 'number' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Numero di maglia"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{t.colNumber || '#'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'number' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'number' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('name')}
                          className={`p-3 min-w-[220px] text-left cursor-pointer transition-colors group ${sortConfig.key === 'name' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Nome giocatore"
                        >
                          <div className="flex items-center justify-start gap-1">
                            <span>{t.colNamePos || 'NOME & RUOLO'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'name' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('games')}
                          className={`p-3 text-center cursor-pointer transition-colors group ${sortConfig.key === 'games' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Partite Giocate (GP)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{t.colGp || 'GP'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'games' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'games' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('timePlayedAVG')}
                          className={`p-3 text-center cursor-pointer transition-colors group ${sortConfig.key === 'timePlayedAVG' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Media Minuti Giocati (MM:SS)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sky-300 font-bold">{t.colMin || 'MIN'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'timePlayedAVG' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'timePlayedAVG' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('pointsPerGame')}
                          className={`p-3 text-center cursor-pointer transition-colors group ${sortConfig.key === 'pointsPerGame' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Punti a Partita (PTS/G)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{t.colPpg || 'PTS/G'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'pointsPerGame' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'pointsPerGame' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('twoMadePerGame')}
                          className={`p-3 text-center cursor-pointer transition-colors group ${sortConfig.key === 'twoMadePerGame' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Canestri da 2 Segnati a Partita (2PM/G)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{t.col2pm || '2PM/G'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'twoMadePerGame' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'twoMadePerGame' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('threeMadePerGame')}
                          className={`p-3 text-center cursor-pointer transition-colors group ${sortConfig.key === 'threeMadePerGame' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Triple Segnate a Partita (3PM/G)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{t.col3pm || '3PM/G'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'threeMadePerGame' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'threeMadePerGame' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('freeThrowsPercentage')}
                          className={`p-3 text-center cursor-pointer transition-colors group ${sortConfig.key === 'freeThrowsPercentage' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Percentuale ai Tiri Liberi (FT%)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{t.colFt || 'FT%'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'freeThrowsPercentage' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'freeThrowsPercentage' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('foulsAVG')}
                          className={`p-3 text-center cursor-pointer transition-colors group ${sortConfig.key === 'foulsAVG' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Falli Commessi a Partita (FF/P)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{t.colFouls || 'FF/P'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'foulsAVG' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'foulsAVG' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('plusMinus')}
                          className={`p-3 text-center cursor-pointer transition-colors group ${sortConfig.key === 'plusMinus' ? 'text-amber-300 font-black bg-slate-900/60' : 'hover:text-slate-200'}`}
                          title="Ordina per Plus / Minus (+/-)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{t.colPlusMinus || '+/-'}</span>
                            <span className={`text-[10px] leading-none ${sortConfig.key === 'plusMinus' ? 'text-amber-400 font-bold' : 'opacity-0 group-hover:opacity-40 text-slate-500'}`}>
                              {sortConfig.key === 'plusMinus' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                            </span>
                          </div>
                        </th>

                        <th className="p-3 text-left min-w-[120px]">{t.colAlerts || 'ALERT'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredRoster.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-8 text-center text-slate-400">
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

                          // 3 Scopes for Multi-Level Tactical Tags
                          // A. Team Scope
                          const teamTags = getTacticalTags(p.stats || p, p.games || p.stats?.games || 0).tags;

                          // B. Season Scope
                          const hist = Array.isArray(p.history) && p.history.length > 0 
                            ? p.history 
                            : (Array.isArray(p.uniquePlayer?.history) ? p.uniquePlayer.history : []);
                          const currSeason = hist.find(h => {
                            const str = String(h.seasonName || h.seasonId || '');
                            return str.includes('2025') || str.includes('25/26');
                          }) || hist[0];
                          const seasonTags = currSeason 
                            ? getTacticalTags(currSeason, currSeason.games).tags 
                            : (p.games > 0 ? teamTags : []);

                          // C. Career Scope
                          const careerTags = p.uniquePlayer?.stats 
                            ? getTacticalTags(p.uniquePlayer.stats, p.uniquePlayer.stats.games).tags 
                            : [];

                          return (
                            <tr
                              key={p.fid}
                              onClick={() => setSelectedPlayer(p)}
                              className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                              <td className="p-3 text-center font-mono font-black text-rose-400">
                                #{p.number}
                              </td>
                              <td className="p-3 min-w-[220px]">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-black text-slate-100 text-xs">{p.name}</span>
                                    {p.captain && (
                                      <span className="text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                                        CAP
                                      </span>
                                    )}
                                  </div>
                                  {p.position && p.position.trim() && p.position.trim().toLowerCase() !== 'player' && (
                                    <span className="text-[10px] text-slate-400 font-semibold">{p.position}</span>
                                  )}

                                  {/* Compact Multi-Level Tactical Tags Breakdown */}
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono select-none flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Team:</span>
                                      {teamTags.length > 0 ? (
                                        <span className="inline-flex items-center gap-0.5">
                                          {teamTags.map(t => (
                                            <span 
                                              key={t.id}
                                              title={`Team: ${t.icon} ${lang === 'it' ? t.labelIt : t.label}`}
                                              className="cursor-help hover:scale-125 transition-transform inline-block select-none"
                                            >
                                              {t.icon}
                                            </span>
                                          ))}
                                        </span>
                                      ) : (
                                        <span className="text-slate-600 font-sans">-</span>
                                      )}
                                    </span>

                                    <span className="text-slate-700">|</span>

                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Season:</span>
                                      {seasonTags.length > 0 ? (
                                        <span className="inline-flex items-center gap-0.5">
                                          {seasonTags.map(t => (
                                            <span 
                                              key={t.id}
                                              title={`Season: ${t.icon} ${lang === 'it' ? t.labelIt : t.label}`}
                                              className="cursor-help hover:scale-125 transition-transform inline-block select-none"
                                            >
                                              {t.icon}
                                            </span>
                                          ))}
                                        </span>
                                      ) : (
                                        <span className="text-slate-600 font-sans">-</span>
                                      )}
                                    </span>

                                    <span className="text-slate-700">|</span>

                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Career:</span>
                                      {careerTags.length > 0 ? (
                                        <span className="inline-flex items-center gap-0.5">
                                          {careerTags.map(t => (
                                            <span 
                                              key={t.id}
                                              title={`Career: ${t.icon} ${lang === 'it' ? t.labelIt : t.label}`}
                                              className="cursor-help hover:scale-125 transition-transform inline-block select-none"
                                            >
                                              {t.icon}
                                            </span>
                                          ))}
                                        </span>
                                      ) : (
                                        <span className="text-slate-600 font-sans">-</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono text-slate-400">
                                {p.games}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-sky-300">
                                {formatMinutes(p.timePlayedAVG || p.stats?.timePlayedAVG)}
                              </td>
                              <td className="p-3 text-center font-mono font-black text-rose-400 text-sm">
                                {p.pointsAVG != null ? p.pointsAVG.toFixed(1) : '0.0'}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-sky-400">
                                {p.twoMadeAVG != null ? p.twoMadeAVG.toFixed(1) : '0.0'}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-amber-300">
                                {p.threeMadeAVG != null ? p.threeMadeAVG.toFixed(1) : '0.0'}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-emerald-400">
                                {p.ftPct ? `${p.ftPct}%` : '—'}
                              </td>
                              <td className="p-3 text-center font-mono font-bold">
                                <span className={`px-2 py-0.5 rounded ${
                                  isFoulTarget ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black' : 'text-slate-300'
                                }`}>
                                  {p.foulsAVG != null ? p.foulsAVG.toFixed(1) : '0.0'}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-black">
                                <span className={`px-2 py-0.5 rounded ${
                                  p.plusMinusAVG > 0 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : p.plusMinusAVG < 0 
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                      : 'text-slate-400'
                                }`}>
                                  {p.plusMinusAVG > 0 ? `+${p.plusMinusAVG.toFixed(1)}` : (p.plusMinusAVG != null ? p.plusMinusAVG.toFixed(1) : '0.0')}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {teamTags.length > 0 ? (
                                    teamTags.slice(0, 2).map(tag => (
                                      <span 
                                        key={tag.id}
                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${tag.badgeClass} flex items-center gap-0.5`}
                                        title={`${tag.icon} ${lang === 'it' ? tag.labelIt : tag.label}`}
                                      >
                                        <span>{tag.icon}</span>
                                        <span className="hidden sm:inline">{lang === 'it' ? tag.labelIt : tag.label}</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono">—</span>
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
      {/* 3. FULL-SCREEN DEDICATED PLAYER PROFILE PAGE                              */}
      {/* ========================================================================= */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 w-full h-full h-screen bg-slate-950 overflow-y-auto animate-fade-in flex flex-col">
          {/* Top Sticky Navigation Bar */}
          <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between flex-none">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                aria-label={t.backToRoster || 'Torna al Roster'}
              >
                <ArrowLeft className="w-4 h-4 text-rose-400" />
                <span>{t.backToRoster || 'Torna al Roster'}</span>
              </button>
              <div className="h-5 w-px bg-slate-800 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="text-slate-300 font-bold">{currentTeamStanding?.name || selectedTeamFid}</span>
                <span>/</span>
                <span className="text-rose-400 font-bold uppercase">{selectedPlayer.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                #{selectedPlayer.number}{selectedPlayer.position && selectedPlayer.position.trim().toLowerCase() !== 'player' ? ` • ${selectedPlayer.position}` : ''}
              </span>
            </div>
          </header>

          {/* Main Full-Screen Body Container with Generous Padding */}
          {(() => {
            const useCareerProfile = (selectedPlayer.games || 0) < 3 && selectedPlayer.uniquePlayer?.stats && (selectedPlayer.uniquePlayer.stats.games || 0) >= 3;
            const profileStats = useCareerProfile ? selectedPlayer.uniquePlayer.stats : selectedPlayer;
            const profileGames = useCareerProfile ? selectedPlayer.uniquePlayer.stats.games : selectedPlayer.games;
            const profileAnalysis = getTacticalTags(profileStats, profileGames);
            const profileTags = profileAnalysis.tags;
            const profileMetrics = profileAnalysis.metrics;

            return (
              <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Player Hero Card */}
                <div className="glass-card p-5 sm:p-6 border-slate-800 bg-slate-900/90 shadow-xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedPlayer.photo ? (
                      <img
                        src={selectedPlayer.photo}
                        alt={selectedPlayer.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-rose-500/40 bg-slate-950 flex-none shadow-md"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-mono font-black text-rose-400 text-2xl flex-none shadow-md">
                        #{selectedPlayer.number}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-3xl font-black text-slate-100 uppercase tracking-wide">
                          {selectedPlayer.name}
                        </h2>
                        {selectedPlayer.captain && (
                          <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                            CAPITANO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 font-semibold flex items-center gap-2 mt-1">
                        {selectedPlayer.position && selectedPlayer.position.trim().toLowerCase() !== 'player' && (
                          <>
                            <span className="text-slate-300">{selectedPlayer.position}</span>
                            <span>•</span>
                          </>
                        )}
                        <span className="text-rose-400 font-bold">{currentTeamStanding?.name || selectedTeamFid}</span>
                        <span>•</span>
                        <span className="text-sky-400 font-mono font-bold">{selectedPlayer.games} GP</span>
                      </p>
                    </div>
                  </div>

                  {/* Active Tactical Badges on Hero */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {profileTags.length > 0 ? (
                      profileTags.map(tag => (
                        <span 
                          key={tag.id}
                          className={`text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border ${tag.badgeClass}`}
                          title={`${tag.icon} ${lang === 'it' ? tag.labelIt : tag.label}`}
                        >
                          <span className="text-sm select-none">{tag.icon}</span>
                          <span>{lang === 'it' ? tag.labelIt : tag.label}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                        Profilo Bilanciato
                      </span>
                    )}
                  </div>
                </div>

                {/* Core Stats Grid (Current Season) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.modalPpg}</span>
                    <span className="font-mono text-2xl font-black text-rose-400">{selectedPlayer.pointsAVG.toFixed(1)}</span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.modalFouls}</span>
                    <span className={`font-mono text-2xl font-black ${selectedPlayer.foulsAVG > 3.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {selectedPlayer.foulsAVG.toFixed(1)}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.modalThree}</span>
                    <span className="font-mono text-2xl font-black text-amber-300">{selectedPlayer.threePct}%</span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.modalPlusMinus}</span>
                    <span className={`font-mono text-2xl font-black ${selectedPlayer.plusMinusAVG > 0 ? 'text-emerald-400' : selectedPlayer.plusMinusAVG < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {selectedPlayer.plusMinusAVG > 0 ? `+${selectedPlayer.plusMinusAVG.toFixed(1)}` : selectedPlayer.plusMinusAVG.toFixed(1)}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.modalRebounds}</span>
                    <span className="font-mono text-2xl font-black text-indigo-300">{selectedPlayer.reboundsAVG.toFixed(1)}</span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.modalAssists}</span>
                    <span className="font-mono text-2xl font-black text-teal-300">{selectedPlayer.assistsAVG.toFixed(1)}</span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center shadow-sm col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.modalGames}</span>
                    <span className="font-mono text-2xl font-black text-sky-400">{selectedPlayer.games}</span>
                  </div>
                </div>

                {/* 100% Width Horizontal Stacked Bar Chart for Point Distribution */}
                <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-200 tracking-wider flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-rose-400" />
                        {t.shotDistTitle || 'DISTRIBUZIONE PUNTI / SHOT PROFILE'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t.shotDistSubtitle || 'Ripartizione percentuale dei punti segnati tra 2PT, 3PT e Tiri Liberi'}
                        {' • '}
                        <span className="text-amber-400/90 font-bold">
                          {useCareerProfile 
                            ? (t.basedOnCareer ? t.basedOnCareer.replace('{games}', profileGames) : `Carriera (${profileGames} PG)`)
                            : (t.basedOnSeason ? t.basedOnSeason.replace('{games}', profileGames) : `Stagione 2025/2026 (${profileGames} PG)`)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono font-bold block">
                        TOTALE: <strong className="text-rose-400 font-black text-sm">{profileMetrics.totalPts} PTS</strong> ({profileMetrics.ptsPerGame.toFixed(1)} PPG)
                      </span>
                    </div>
                  </div>

                  {profileMetrics.totalPts > 0 ? (
                    <div className="space-y-3">
                      {/* Stacked Bar */}
                      <div className="w-full h-7 bg-slate-950 rounded-xl p-1 border border-slate-800 shadow-inner flex overflow-hidden gap-1">
                        {profileMetrics.pct2 > 0 && (
                          <div 
                            style={{ width: `${profileMetrics.pct2}%` }}
                            className="h-full bg-sky-500 hover:bg-sky-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-slate-950 px-1 overflow-hidden"
                            title={`Punti da 2 (2PT): ${profileMetrics.pct2.toFixed(1)}% (${profileMetrics.twoMade * 2} PTS)`}
                          >
                            {profileMetrics.pct2 >= 10 && `${Math.round(profileMetrics.pct2)}%`}
                          </div>
                        )}
                        {profileMetrics.pct3 > 0 && (
                          <div 
                            style={{ width: `${profileMetrics.pct3}%` }}
                            className="h-full bg-emerald-500 hover:bg-emerald-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-slate-950 px-1 overflow-hidden"
                            title={`Punti da 3 (3PT): ${profileMetrics.pct3.toFixed(1)}% (${profileMetrics.threeMade * 3} PTS)`}
                          >
                            {profileMetrics.pct3 >= 10 && `${Math.round(profileMetrics.pct3)}%`}
                          </div>
                        )}
                        {profileMetrics.pctFT > 0 && (
                          <div 
                            style={{ width: `${profileMetrics.pctFT}%` }}
                            className="h-full bg-amber-500 hover:bg-amber-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-slate-950 px-1 overflow-hidden"
                            title={`Tiri Liberi (FT): ${profileMetrics.pctFT.toFixed(1)}% (${profileMetrics.ftMade} PTS)`}
                          >
                            {profileMetrics.pctFT >= 10 && `${Math.round(profileMetrics.pctFT)}%`}
                          </div>
                        )}
                      </div>

                      {/* 3 KPI breakdown cards below bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-sky-500 flex-none shadow-sm" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                                {t.ptsFrom2 || 'Punti da 2 (2PT)'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {profileMetrics.twoMade * 2} PTS • {profileMetrics.twoPerGame.toFixed(1)} 2PM/G
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xl font-black text-sky-400">
                            {profileMetrics.pct2.toFixed(1)}%
                          </span>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex-none shadow-sm" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                                {t.ptsFrom3 || 'Punti da 3 (3PT)'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {profileMetrics.threeMade * 3} PTS • {profileMetrics.threePerGame.toFixed(1)} 3PM/G
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xl font-black text-emerald-400">
                            {profileMetrics.pct3.toFixed(1)}%
                          </span>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex-none shadow-sm" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                                {t.ptsFromFt || 'Tiri Liberi (TL)'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {profileMetrics.ftMade} PTS • {profileMetrics.ftAttPerGame.toFixed(1)} FTA/G ({profileMetrics.ftPct != null ? Math.round(profileMetrics.ftPct) + '%' : '—'})
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xl font-black text-amber-400">
                            {profileMetrics.pctFT.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-xl text-center text-xs text-slate-500 italic">
                      Nessun punto registrato nel periodo di riferimento.
                    </div>
                  )}
                </div>

                {/* Tactical Badges with Coach Strategy Cards */}
                <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black uppercase text-slate-200 tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-rose-400" />
                      {t.tacticalBadgesTitle || 'PROFILO TATTICO & ALERT COACH'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLegendModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                      >
                        <HelpCircle className="w-3 h-3 text-amber-400" />
                        <span>{t.legendBtn || 'Legenda Tag'}</span>
                      </button>
                      <span className="text-[11px] font-bold text-slate-400">
                        • {profileTags.length} {profileTags.length === 1 ? 'Tag Attivo' : 'Tag Attivi'}
                      </span>
                    </div>
                  </div>

                  {profileTags.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profileTags.map(tag => (
                        <div 
                          key={tag.id}
                          className={`p-3.5 sm:p-4 rounded-xl border ${tag.badgeClass} shadow-sm`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl flex-none select-none">{tag.icon}</span>
                              <div>
                                <span className="font-black text-sm uppercase tracking-wide text-white block">
                                  {lang === 'it' ? tag.labelIt : tag.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {lang === 'it' ? tag.criteriaDesc : tag.criteriaDescEn}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-amber-300">
                              {tag.criteria}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                      <span className="text-xl select-none">⚖️</span>
                      <div>
                        <strong className="block text-slate-300 font-bold mb-0.5">Profilo Bilanciato / Nessun Alert Estremo</strong>
                        <span>{t.noActiveTags || 'Nessun tag tattico specifico attivato per i criteri di volume e precisione.'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shooting Splits */}
                <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                  <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {t.modalSplitsTitle} (2025/2026)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">{t.modal3pt}</span>
                      <span className="font-mono text-xl font-black text-amber-300 my-1 block">{selectedPlayer.threePct}%</span>
                      <span className="text-[11px] text-slate-400 block font-mono">{selectedPlayer.threeMadeAVG.toFixed(1)} {t.modalMadePerGame}</span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">{t.modal2pt}</span>
                      <span className="font-mono text-xl font-black text-sky-400 my-1 block">{selectedPlayer.twoPct}%</span>
                      <span className="text-[11px] text-slate-400 block font-mono">{selectedPlayer.twoMadeAVG.toFixed(1)} {t.modalMadePerGame}</span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">{t.modalFt}</span>
                      <span className="font-mono text-xl font-black text-emerald-400 my-1 block">{selectedPlayer.ftPct}%</span>
                      <span className="text-[11px] text-slate-400 block font-mono">Tiri Liberi</span>
                    </div>
                  </div>
                </div>

            {/* CARRIERA / HISTORY Data Table */}
            {(() => {
              const up = selectedPlayer.uniquePlayer || {};
              let rawList = [];

              if (Array.isArray(selectedPlayer.history) && selectedPlayer.history.length > 0) {
                rawList = selectedPlayer.history;
              } else if (Array.isArray(up.history) && up.history.length > 0) {
                rawList = up.history;
              } else if (Array.isArray(up.seasonStats) && up.seasonStats.length > 0) {
                const playersList = Array.isArray(up.players) ? up.players : [];
                rawList = up.seasonStats.map(stat => {
                  const rawId = stat.seasonId != null ? String(stat.seasonId) : '';
                  const seasonTeams = playersList.filter(pl => pl && pl.season && String(pl.season.id) === rawId);
                  const matchedPlayer = seasonTeams[0];
                  const seasonName = matchedPlayer?.season?.name || stat.seasonName || rawId || '—';
                  const teamName = (matchedPlayer?.team?.name || stat.teamName || selectedPlayer.teamName || currentTeamStanding?.name || '—').trim();
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

                  const teamsDetail = seasonTeams.map(st => {
                    const tStats = st.stats || {};
                    const tGames = Number(tStats.games || 0);
                    const compName = st.competition?.name ? st.competition.name.trim() : '';
                    const tName = st.team?.name ? st.team.name.trim() : '—';
                    const fullTeamName = compName ? `${compName} - ${tName}` : tName;
                    return {
                      teamName: fullTeamName,
                      competitionName: compName,
                      games: tGames,
                      pointsPerGame: tStats.pointsPerGame != null ? Number(tStats.pointsPerGame) : (tGames > 0 && tStats.points != null ? Number((tStats.points / tGames).toFixed(1)) : 0),
                      twoMadePerGame: tStats.inArcThrowsAVG != null ? Number(tStats.inArcThrowsAVG) : 0,
                      threeMadePerGame: tStats.outArcThrowsAVG != null ? Number(tStats.outArcThrowsAVG) : 0,
                      freeThrowsPercentage: tStats.freeThrowsPercentage != null ? Number(tStats.freeThrowsPercentage) : null,
                      foulsPerGame: tStats.foulsAVG != null ? Number(tStats.foulsAVG) : (tStats.foulsPerGame != null ? Number(tStats.foulsPerGame) : 0),
                      plusMinusPerGame: tStats.plusMinusAVG != null ? Number(tStats.plusMinusAVG) : (tStats.plusMinusPerGame != null ? Number(tStats.plusMinusPerGame) : 0),
                      reboundsPerGame: tStats.reboundsAVG != null ? Number(tStats.reboundsAVG) : (tStats.reboundsPerGame != null ? Number(tStats.reboundsPerGame) : 0),
                      assistsPerGame: tStats.assistsAVG != null ? Number(tStats.assistsAVG) : (tStats.assistsPerGame != null ? Number(tStats.assistsPerGame) : 0)
                    };
                  });

                  const sGames = Number(stat.games || 0);
                  const subGames = teamsDetail.reduce((a, c) => a + c.games, 0);
                  let foulsPerGame = stat.foulsPerGame != null ? Number(stat.foulsPerGame) : (sGames > 0 && stat.fouls != null ? Number((stat.fouls / sGames).toFixed(1)) : 0);
                  let plusMinusPerGame = stat.plusMinusPerGame != null ? Number(stat.plusMinusPerGame) : (sGames > 0 && stat.plusMinus != null ? Number((stat.plusMinus / sGames).toFixed(1)) : 0);
                  let reboundsPerGame = stat.reboundsPerGame != null ? Number(stat.reboundsPerGame) : 0;
                  let assistsPerGame = stat.assistsPerGame != null ? Number(stat.assistsPerGame) : 0;

                  if (foulsPerGame === 0 && subGames > 0) {
                    foulsPerGame = teamsDetail.reduce((a, c) => a + c.games * c.foulsPerGame, 0) / subGames;
                  }
                  if (plusMinusPerGame === 0 && subGames > 0) {
                    plusMinusPerGame = teamsDetail.reduce((a, c) => a + c.games * c.plusMinusPerGame, 0) / subGames;
                  }
                  if (reboundsPerGame === 0 && subGames > 0) {
                    reboundsPerGame = teamsDetail.reduce((a, c) => a + c.games * c.reboundsPerGame, 0) / subGames;
                  }
                  if (assistsPerGame === 0 && subGames > 0) {
                    assistsPerGame = teamsDetail.reduce((a, c) => a + c.games * c.assistsPerGame, 0) / subGames;
                  }

                  return {
                    seasonId: rawId,
                    seasonName,
                    teamName,
                    isAggregate: true,
                    games: sGames,
                    pointsPerGame,
                    twoMadePerGame,
                    threeMadePerGame,
                    freeThrowsPercentage,
                    foulsPerGame: Number(foulsPerGame.toFixed(1)),
                    plusMinusPerGame: Number(plusMinusPerGame.toFixed(1)),
                    reboundsPerGame: Number(reboundsPerGame.toFixed(1)),
                    assistsPerGame: Number(assistsPerGame.toFixed(1)),
                    teams: teamsDetail
                  };
                });
              }

              // Fallback to active season if empty and player has games
              if (rawList.length === 0 && selectedPlayer.games > 0) {
                const currentTeam = (selectedPlayer.teamName || currentTeamStanding?.name || '—').trim();
                const g = selectedPlayer.games;
                const ppg = selectedPlayer.pointsAVG;
                const twoM = selectedPlayer.twoMadeAVG;
                const threeM = selectedPlayer.threeMadeAVG;
                const ft = selectedPlayer.ftPct;
                const fouls = selectedPlayer.foulsAVG ?? 0;
                const pm = selectedPlayer.plusMinusAVG ?? 0;
                const reb = selectedPlayer.reboundsAVG ?? 0;
                const ast = selectedPlayer.assistsAVG ?? 0;

                rawList = [
                  {
                    seasonId: '14544',
                    seasonName: '2025/2026',
                    isAggregate: true,
                    teamName: currentTeam,
                    games: g,
                    pointsPerGame: ppg,
                    twoMadePerGame: twoM,
                    threeMadePerGame: threeM,
                    freeThrowsPercentage: ft,
                    foulsPerGame: fouls,
                    plusMinusPerGame: pm,
                    reboundsPerGame: reb,
                    assistsPerGame: ast,
                    teams: [
                      {
                        teamName: `Divisione Regionale 2 - ${currentTeam}`,
                        competitionName: 'Divisione Regionale 2',
                        games: g,
                        pointsPerGame: ppg,
                        twoMadePerGame: twoM,
                        threeMadePerGame: threeM,
                        freeThrowsPercentage: ft,
                        foulsPerGame: fouls,
                        plusMinusPerGame: pm,
                        reboundsPerGame: reb,
                        assistsPerGame: ast
                      }
                    ]
                  }
                ];
              }

              // Normalize history into season records with nested .teams
              const normalizedHistory = [];
              const hasNestedTeams = rawList.some(h => Array.isArray(h.teams) && h.teams.length > 0);

              if (hasNestedTeams) {
                rawList.forEach(item => {
                  const tms = Array.isArray(item.teams) ? item.teams.map(t => ({
                    teamName: t.teamName || '—',
                    competitionName: t.competitionName || '',
                    games: Number(t.games || 0),
                    pointsPerGame: t.pointsPerGame != null ? Number(t.pointsPerGame) : 0,
                    twoMadePerGame: t.twoMadePerGame != null ? Number(t.twoMadePerGame) : 0,
                    threeMadePerGame: t.threeMadePerGame != null ? Number(t.threeMadePerGame) : 0,
                    freeThrowsPercentage: t.freeThrowsPercentage != null ? Number(t.freeThrowsPercentage) : null,
                    foulsPerGame: t.foulsPerGame != null ? Number(t.foulsPerGame) : 0,
                    plusMinusPerGame: t.plusMinusPerGame != null ? Number(t.plusMinusPerGame) : 0,
                    reboundsPerGame: t.reboundsPerGame != null ? Number(t.reboundsPerGame) : 0,
                    assistsPerGame: t.assistsPerGame != null ? Number(t.assistsPerGame) : 0
                  })) : [];

                  const g = Number(item.games || 0);
                  let fouls = item.foulsPerGame != null ? Number(item.foulsPerGame) : 0;
                  let pm = item.plusMinusPerGame != null ? Number(item.plusMinusPerGame) : 0;
                  let reb = item.reboundsPerGame != null ? Number(item.reboundsPerGame) : 0;
                  let ast = item.assistsPerGame != null ? Number(item.assistsPerGame) : 0;

                  const subGames = tms.reduce((acc, t) => acc + t.games, 0);
                  if (fouls === 0 && subGames > 0) {
                    fouls = tms.reduce((acc, t) => acc + t.games * t.foulsPerGame, 0) / subGames;
                  }
                  if (pm === 0 && subGames > 0) {
                    pm = tms.reduce((acc, t) => acc + t.games * t.plusMinusPerGame, 0) / subGames;
                  }
                  if (reb === 0 && subGames > 0) {
                    reb = tms.reduce((acc, t) => acc + t.games * t.reboundsPerGame, 0) / subGames;
                  }
                  if (ast === 0 && subGames > 0) {
                    ast = tms.reduce((acc, t) => acc + t.games * t.assistsPerGame, 0) / subGames;
                  }

                  normalizedHistory.push({
                    seasonId: item.seasonId,
                    seasonName: item.seasonName || item.seasonId || '—',
                    isAggregate: true,
                    games: g,
                    pointsPerGame: item.pointsPerGame != null ? Number(item.pointsPerGame) : 0,
                    twoMadePerGame: item.twoMadePerGame != null ? Number(item.twoMadePerGame) : 0,
                    threeMadePerGame: item.threeMadePerGame != null ? Number(item.threeMadePerGame) : 0,
                    freeThrowsPercentage: item.freeThrowsPercentage != null ? Number(item.freeThrowsPercentage) : null,
                    foulsPerGame: Number(fouls.toFixed(1)),
                    plusMinusPerGame: Number(pm.toFixed(1)),
                    reboundsPerGame: Number(reb.toFixed(1)),
                    assistsPerGame: Number(ast.toFixed(1)),
                    teamName: item.teamName || (tms[0]?.teamName) || '—',
                    teams: tms
                  });
                });
              } else {
                const groupMap = new Map();
                rawList.forEach(item => {
                  const sKey = (item.seasonName && item.seasonName !== '—') ? item.seasonName : (item.seasonId || 'unknown');
                  if (!groupMap.has(sKey)) {
                    groupMap.set(sKey, {
                      seasonId: item.seasonId,
                      seasonName: item.seasonName || item.seasonId || '—',
                      isAggregate: true,
                      games: 0,
                      totalPoints: 0,
                      total2pm: 0,
                      total3pm: 0,
                      totalFouls: 0,
                      totalPm: 0,
                      totalReb: 0,
                      totalAst: 0,
                      teams: []
                    });
                  }
                  const grp = groupMap.get(sKey);
                  const g = Number(item.games || 0);
                  const ppg = Number(item.pointsPerGame) || 0;
                  const twoM = Number(item.twoMadePerGame) || 0;
                  const threeM = Number(item.threeMadePerGame) || 0;
                  const fouls = Number(item.foulsPerGame) || 0;
                  const pm = Number(item.plusMinusPerGame) || 0;
                  const reb = Number(item.reboundsPerGame) || 0;
                  const ast = Number(item.assistsPerGame) || 0;

                  grp.games += g;
                  grp.totalPoints += g * ppg;
                  grp.total2pm += g * twoM;
                  grp.total3pm += g * threeM;
                  grp.totalFouls += g * fouls;
                  grp.totalPm += g * pm;
                  grp.totalReb += g * reb;
                  grp.totalAst += g * ast;

                  grp.teams.push({
                    teamName: item.teamName || '—',
                    competitionName: item.competitionName || '',
                    games: g,
                    pointsPerGame: ppg,
                    twoMadePerGame: twoM,
                    threeMadePerGame: threeM,
                    freeThrowsPercentage: item.freeThrowsPercentage,
                    foulsPerGame: fouls,
                    plusMinusPerGame: pm,
                    reboundsPerGame: reb,
                    assistsPerGame: ast
                  });
                });

                groupMap.forEach(grp => {
                  const ppg = grp.games > 0 ? grp.totalPoints / grp.games : 0;
                  const twoMade = grp.games > 0 ? grp.total2pm / grp.games : 0;
                  const threeMade = grp.games > 0 ? grp.total3pm / grp.games : 0;
                  const fouls = grp.games > 0 ? grp.totalFouls / grp.games : 0;
                  const pm = grp.games > 0 ? grp.totalPm / grp.games : 0;
                  const reb = grp.games > 0 ? grp.totalReb / grp.games : 0;
                  const ast = grp.games > 0 ? grp.totalAst / grp.games : 0;

                  normalizedHistory.push({
                    seasonId: grp.seasonId,
                    seasonName: grp.seasonName,
                    isAggregate: true,
                    games: grp.games,
                    pointsPerGame: ppg,
                    twoMadePerGame: twoMade,
                    threeMadePerGame: threeMade,
                    freeThrowsPercentage: grp.teams[0]?.freeThrowsPercentage ?? null,
                    foulsPerGame: Number(fouls.toFixed(1)),
                    plusMinusPerGame: Number(pm.toFixed(1)),
                    reboundsPerGame: Number(reb.toFixed(1)),
                    assistsPerGame: Number(ast.toFixed(1)),
                    teamName: grp.teams[0]?.teamName || '—',
                    teams: grp.teams
                  });
                });
              }

              // Helper: parse starting season year for strict descending sorting (newest first)
              const parseSeasonYear = (val) => {
                if (!val) return 0;
                const str = String(val);
                const m4 = str.match(/(20\d{2}|19\d{2})/);
                if (m4) return parseInt(m4[1], 10);
                const m2 = str.match(/(\d{2})\s*\/\s*(\d{2})/);
                if (m2) return 2000 + parseInt(m2[1], 10);
                const n = parseInt(str, 10);
                return isNaN(n) ? 0 : n;
              };

              // 1. SORTING: strictly descending order by season name (e.g. 2026/2027, 2025/2026, 2024/2025)
              normalizedHistory.sort((a, b) => {
                const yA = parseSeasonYear(a.seasonName || a.seasonId);
                const yB = parseSeasonYear(b.seasonName || b.seasonId);
                if (yA !== yB) return yB - yA;
                return String(b.seasonName || '').localeCompare(String(a.seasonName || ''));
              });

              // 2. CAREER AGGREGATES (MED & TOT) from player.uniquePlayer.stats
              const upStats = up.stats || selectedPlayer.stats || {};
              let careerGames = Number(upStats.games || 0);
              let careerPoints = Number(upStats.points != null ? upStats.points : Math.round(careerGames * (Number(upStats.pointsPerGame) || 0)));
              let careerInArcMade = Number(upStats.inArcThrowsMade || 0);
              let careerOutArcMade = Number(upStats.outArcThrowsMade || 0);
              let careerFtPct = upStats.freeThrowsPercentage != null ? `${Math.round(Number(upStats.freeThrowsPercentage))}%` : null;
              let careerFtMade = upStats.freeThrowsMade != null ? Number(upStats.freeThrowsMade) : null;

              let careerFouls = Number(upStats.fouls != null ? upStats.fouls : 0);
              let careerPlusMinus = Number(upStats.plusMinus != null ? upStats.plusMinus : 0);
              let careerRebounds = Number(upStats.rebounds != null ? upStats.rebounds : 0);
              let careerAssists = Number(upStats.assists != null ? upStats.assists : 0);

              if (careerGames === 0 && normalizedHistory.length > 0) {
                normalizedHistory.forEach(h => {
                  const g = Number(h.games || 0);
                  careerGames += g;
                  careerPoints += Math.round(g * (Number(h.pointsPerGame) || 0));
                  careerInArcMade += Math.round(g * (Number(h.twoMadePerGame) || 0));
                  careerOutArcMade += Math.round(g * (Number(h.threeMadePerGame) || 0));
                  careerFouls += Math.round(g * (Number(h.foulsPerGame) || 0));
                  careerPlusMinus += Math.round(g * (Number(h.plusMinusPerGame) || 0));
                  careerRebounds += Math.round(g * (Number(h.reboundsPerGame) || 0));
                  careerAssists += Math.round(g * (Number(h.assistsPerGame) || 0));
                });
                const ftList = normalizedHistory.filter(h => h.freeThrowsPercentage != null && (Number(h.games) || 0) > 0);
                const ftGp = ftList.reduce((acc, h) => acc + (Number(h.games) || 0), 0);
                if (ftGp > 0) {
                  const weightedFt = ftList.reduce((acc, h) => acc + (Number(h.freeThrowsPercentage) * (Number(h.games) || 0)), 0);
                  careerFtPct = `${Math.round(weightedFt / ftGp)}%`;
                }
              } else if (careerFouls === 0 && careerPlusMinus === 0 && normalizedHistory.length > 0) {
                normalizedHistory.forEach(h => {
                  const g = Number(h.games || 0);
                  careerFouls += Math.round(g * (Number(h.foulsPerGame) || 0));
                  careerPlusMinus += Math.round(g * (Number(h.plusMinusPerGame) || 0));
                  careerRebounds += Math.round(g * (Number(h.reboundsPerGame) || 0));
                  careerAssists += Math.round(g * (Number(h.assistsPerGame) || 0));
                });
              }

              const careerPpg = careerGames > 0 
                ? (upStats.pointsPerGame != null ? Number(upStats.pointsPerGame) : careerPoints / careerGames)
                : 0;
              const career2pm = careerGames > 0 ? careerInArcMade / careerGames : 0;
              const career3pm = careerGames > 0 ? careerOutArcMade / careerGames : 0;
              const careerFoulsAvg = careerGames > 0 
                ? (upStats.foulsPerGame != null ? Number(upStats.foulsPerGame) : careerFouls / careerGames)
                : 0;
              const careerPmAvg = careerGames > 0 
                ? (upStats.plusMinusPerGame != null ? Number(upStats.plusMinusPerGame) : careerPlusMinus / careerGames)
                : 0;
              const careerRebAvg = careerGames > 0 
                ? (upStats.reboundsPerGame != null ? Number(upStats.reboundsPerGame) : careerRebounds / careerGames)
                : 0;
              const careerAstAvg = careerGames > 0 
                ? (upStats.assistsPerGame != null ? Number(upStats.assistsPerGame) : careerAssists / careerGames)
                : 0;
              if (!careerFtPct) careerFtPct = '—';

              return (
                <div className="w-full bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider">
                          {t.historyTableTitle || 'CARRIERA / STORICO FIP'}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Statistiche aggregate e per stagione da database ufficiale FIP
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLegendModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.legendBtn || 'Legenda Tag'}</span>
                      </button>
                      {normalizedHistory.length > 0 && (
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30">
                          {normalizedHistory.length} {t.historySeason || 'STAGIONI'}
                        </span>
                      )}
                    </div>
                  </div>

                  {normalizedHistory.length > 0 ? (
                    <div className="w-full overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950 shadow-inner">
                      <table className="w-full min-w-[760px] text-left text-xs border-collapse font-sans">
                        <thead className="sticky top-0 z-20 shadow-md">
                          {/* Column headers */}
                          <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                            <th className="px-3.5 py-3 text-slate-300 font-bold whitespace-nowrap min-w-[130px]">{t.colSeason || 'Season'}</th>
                            <th className="px-3.5 py-3 text-slate-300 font-bold min-w-[240px]">{t.colTeam || 'Team'}</th>
                            <th className="px-2 py-3 text-center whitespace-nowrap min-w-[85px] text-amber-400/90" title="Tactical Scouting Tags">{t.colTags || 'TAGS'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[50px]" title="Games Played">{t.colGp || 'GP'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="Points / Average">{t.colPpg || 'PTS/G'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="2-Pointers Made / Average">{t.col2pm || '2PM/G'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="3-Pointers Made / Average">{t.col3pm || '3PM/G'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="Free Throws">{t.colFtPct || 'FT%'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px] text-amber-400/90" title="Fouls per game">{t.colFf || 'FF/P'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="Plus / Minus">{t.colPlusMinus || '+/-'}</th>
                          </tr>

                          {/* CAREER AGGREGATES HEADER ROW: MED (Career Average) */}
                          <tr className="bg-slate-900/95 border-b-2 border-amber-500/40 text-xs font-mono font-bold">
                            <td className="px-3.5 py-3 whitespace-nowrap font-sans">
                              <span className="font-black text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded text-[10px] border border-amber-500/40 inline-flex items-center gap-1">
                                {t.historyMed || 'MED'}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-amber-200/90 font-bold text-xs uppercase tracking-wider font-sans">
                              {t.historyMedLabel || 'Media / Partita'}
                            </td>
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              {(() => {
                                const cTags = getTacticalTags(upStats, careerGames).tags;
                                return cTags.length > 0 ? (
                                  <div className="flex items-center justify-center gap-1">
                                    {cTags.map(tag => (
                                      <span 
                                        key={tag.id}
                                        title={`${tag.icon} ${lang === 'it' ? tag.labelIt : tag.label}`}
                                        className="cursor-help text-sm hover:scale-125 transition-transform inline-block select-none"
                                      >
                                        {tag.icon}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-600 text-xs">—</span>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-3 text-center text-slate-300 font-mono">
                              {careerGames}
                            </td>
                            <td className="px-3 py-3 text-center font-black text-rose-400 font-mono">
                              {careerPpg.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-center text-sky-400 font-mono">
                              {career2pm.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-center text-amber-300 font-mono">
                              {career3pm.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-center text-emerald-400 font-mono">
                              {careerFtPct}
                            </td>
                            <td className="px-3 py-3 text-center text-amber-300 font-mono">
                              {careerFoulsAvg > 0 ? careerFoulsAvg.toFixed(1) : (careerFouls > 0 && careerGames > 0 ? (careerFouls / careerGames).toFixed(1) : '—')}
                            </td>
                            <td className={`px-3 py-3 text-center font-mono ${careerPmAvg > 0 ? 'text-emerald-400' : careerPmAvg < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {careerPmAvg !== 0 ? (careerPmAvg > 0 ? `+${careerPmAvg.toFixed(1)}` : careerPmAvg.toFixed(1)) : '0.0'}
                            </td>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                          {normalizedHistory.map((season) => {
                            const sKey = season.seasonName || season.seasonId || '—';
                            const teams = Array.isArray(season.teams) ? season.teams : [];
                            const hasTeams = teams.length > 0;
                            const isCollapsed = Boolean(collapsedSeasons[sKey]);

                            const sGames = Number(season.games ?? 0);
                            const sPpg = season.pointsPerGame != null ? Number(season.pointsPerGame).toFixed(1) : '0.0';
                            const s2pm = season.twoMadePerGame != null ? Number(season.twoMadePerGame).toFixed(1) : '0.0';
                            const s3pm = season.threeMadePerGame != null ? Number(season.threeMadePerGame).toFixed(1) : '0.0';
                            const sFtPct = season.freeThrowsPercentage != null ? `${Math.round(Number(season.freeThrowsPercentage))}%` : '—';

                            const sFouls = season.foulsPerGame != null && Number(season.foulsPerGame) > 0
                              ? Number(season.foulsPerGame).toFixed(1)
                              : (teams.length > 0 && teams.some(t => t.foulsPerGame > 0)
                                  ? (teams.reduce((a, t) => a + (t.games || 0) * (t.foulsPerGame || 0), 0) / (sGames || 1)).toFixed(1)
                                  : '—');

                            const rawPm = season.plusMinusPerGame != null && season.plusMinusPerGame !== 0
                              ? Number(season.plusMinusPerGame)
                              : (teams.length > 0 && teams.some(t => t.plusMinusPerGame !== 0)
                                  ? (teams.reduce((a, t) => a + (t.games || 0) * (t.plusMinusPerGame || 0), 0) / (sGames || 1))
                                  : 0);
                            const sPm = rawPm !== 0 ? (rawPm > 0 ? `+${rawPm.toFixed(1)}` : rawPm.toFixed(1)) : '0.0';

                            const rawReb = season.reboundsPerGame != null && Number(season.reboundsPerGame) > 0
                              ? Number(season.reboundsPerGame)
                              : (teams.length > 0 && teams.some(t => t.reboundsPerGame > 0)
                                  ? (teams.reduce((a, t) => a + (t.games || 0) * (t.reboundsPerGame || 0), 0) / (sGames || 1))
                                  : 0);
                            const sReb = rawReb > 0 ? rawReb.toFixed(1) : '—';

                            const rawAst = season.assistsPerGame != null && Number(season.assistsPerGame) > 0
                              ? Number(season.assistsPerGame)
                              : (teams.length > 0 && teams.some(t => t.assistsPerGame > 0)
                                  ? (teams.reduce((a, t) => a + (t.games || 0) * (t.assistsPerGame || 0), 0) / (sGames || 1))
                                  : 0);
                            const sAst = rawAst > 0 ? rawAst.toFixed(1) : '—';

                            return (
                              <React.Fragment key={sKey}>
                                {/* Main Season Aggregate Row */}
                                <tr 
                                  onClick={() => hasTeams && toggleSeasonCollapse(sKey)}
                                  className={`transition-colors ${hasTeams ? 'cursor-pointer' : ''} ${isCollapsed ? 'bg-slate-900/40 hover:bg-slate-800/50' : 'bg-slate-900/80 hover:bg-slate-800/70 border-t border-slate-800'}`}
                                >
                                  <td className="px-3.5 py-3 font-black text-amber-400 text-xs font-sans whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      {hasTeams ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSeasonCollapse(sKey);
                                          }}
                                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                          aria-label="Toggle season teams"
                                        >
                                          {isCollapsed ? (
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4 text-amber-400" />
                                          )}
                                        </button>
                                      ) : (
                                        <span className="w-4 inline-block text-center text-slate-600 font-bold">•</span>
                                      )}
                                      <span className="font-bold text-amber-300 text-sm">{season.seasonName || season.seasonId || '—'}</span>
                                    </div>
                                  </td>
                                  <td className="px-3.5 py-3 text-slate-300 font-bold text-xs font-sans">
                                    {teams.length > 1 ? (
                                      <span className="inline-flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[10px] uppercase font-bold">
                                          {t.seasonTotalBadge || 'TOTALE'}
                                        </span>
                                        <span className="text-slate-400 italic">
                                          {t.combinedTeams ? t.combinedTeams.replace('{count}', teams.length) : `(${teams.length} Squadre)`}
                                        </span>
                                      </span>
                                    ) : teams.length === 1 ? (
                                      <span className="text-slate-200 font-bold">{teams[0].teamName || '—'}</span>
                                    ) : (
                                      <span className="text-slate-200 font-bold">{season.teamName || '—'}</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-3 text-center whitespace-nowrap">
                                    {(() => {
                                      const sTags = getTacticalTags(season, sGames).tags;
                                      return sTags.length > 0 ? (
                                        <div className="flex items-center justify-center gap-1">
                                          {sTags.map(tag => (
                                            <span 
                                              key={tag.id}
                                              title={`${tag.icon} ${lang === 'it' ? tag.labelIt : tag.label}`}
                                              className="cursor-help text-sm hover:scale-125 transition-transform inline-block select-none"
                                            >
                                              {tag.icon}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-slate-600 text-xs">—</span>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-3 py-3 text-center text-slate-200 font-bold font-mono">
                                    {sGames}
                                  </td>
                                  <td className="px-3 py-3 text-center font-black text-rose-400 font-mono text-sm">
                                    {sPpg}
                                  </td>
                                  <td className="px-3 py-3 text-center text-sky-400 font-mono font-bold">
                                    {s2pm}
                                  </td>
                                  <td className="px-3 py-3 text-center text-amber-300 font-mono font-bold">
                                    {s3pm}
                                  </td>
                                  <td className="px-3 py-3 text-center text-emerald-400 font-mono font-bold">
                                    {sFtPct}
                                  </td>
                                  <td className="px-3 py-3 text-center text-amber-300 font-mono font-bold">
                                    {sFouls}
                                  </td>
                                  <td className={`px-3 py-3 text-center font-mono font-bold ${rawPm > 0 ? 'text-emerald-400' : rawPm < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {sPm}
                                  </td>
                                </tr>

                                {/* Nested sub-rows for each team (when expanded) */}
                                {!isCollapsed && teams.map((team, tIdx) => {
                                  const tGames = Number(team.games ?? 0);
                                  const tPpg = team.pointsPerGame != null ? Number(team.pointsPerGame).toFixed(1) : '0.0';
                                  const t2pm = team.twoMadePerGame != null ? Number(team.twoMadePerGame).toFixed(1) : '0.0';
                                  const t3pm = team.threeMadePerGame != null ? Number(team.threeMadePerGame).toFixed(1) : '0.0';
                                  const tFtPct = team.freeThrowsPercentage != null ? `${Math.round(Number(team.freeThrowsPercentage))}%` : '—';
                                  const tFouls = team.foulsPerGame != null && Number(team.foulsPerGame) > 0 ? Number(team.foulsPerGame).toFixed(1) : '—';
                                  const tPmRaw = team.plusMinusPerGame != null ? Number(team.plusMinusPerGame) : 0;
                                  const tPm = tPmRaw !== 0 ? (tPmRaw > 0 ? `+${tPmRaw.toFixed(1)}` : tPmRaw.toFixed(1)) : '0.0';
                                  const tReb = team.reboundsPerGame != null && Number(team.reboundsPerGame) > 0 ? Number(team.reboundsPerGame).toFixed(1) : '—';
                                  const tAst = team.assistsPerGame != null && Number(team.assistsPerGame) > 0 ? Number(team.assistsPerGame).toFixed(1) : '—';

                                  // Extract competition and clean team name
                                  let displayComp = team.competitionName ? team.competitionName.trim() : '';
                                  let rawTeamName = (team.teamName || '—').trim();
                                  let displayTeam = rawTeamName;

                                  if (displayComp && rawTeamName.startsWith(`${displayComp} - `)) {
                                    displayTeam = rawTeamName.replace(`${displayComp} - `, '').trim();
                                  } else if (!displayComp && rawTeamName.includes(' - ')) {
                                    const parts = rawTeamName.split(' - ');
                                    displayComp = parts[0].trim();
                                    displayTeam = parts.slice(1).join(' - ').trim();
                                  }

                                  return (
                                    <tr key={`${sKey}-team-${tIdx}`} className="bg-slate-950/70 hover:bg-slate-900/50 border-b border-slate-800/40 transition-colors">
                                      {/* Indented indicator */}
                                      <td className="py-2.5 px-3.5 pl-8 text-slate-500 font-mono text-xs whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                          <span className="text-slate-600 font-bold font-sans">↳</span>
                                          <span className="text-xs font-sans text-slate-400 font-medium">{season.seasonName}</span>
                                        </div>
                                      </td>
                                      {/* Team details: competitionName in uppercase rose on top, teamName below */}
                                      <td className="py-2.5 px-3.5 text-xs font-sans whitespace-normal break-words min-w-[260px]">
                                        <div className="flex flex-col">
                                          {displayComp ? (
                                            <span className="text-[10px] font-bold text-rose-400/90 tracking-wide uppercase leading-tight line-clamp-1" title={displayComp}>
                                              {displayComp}
                                            </span>
                                          ) : null}
                                          <span className="text-xs font-bold text-slate-200 leading-tight">
                                            {displayTeam}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                        {(() => {
                                          const tTags = getTacticalTags(team, tGames).tags;
                                          return tTags.length > 0 ? (
                                            <div className="flex items-center justify-center gap-1">
                                              {tTags.map(tag => (
                                                <span 
                                                  key={tag.id}
                                                  title={`${tag.icon} ${lang === 'it' ? tag.labelIt : tag.label}`}
                                                  className="cursor-help text-sm hover:scale-125 transition-transform inline-block select-none"
                                                >
                                                  {tag.icon}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-slate-700 text-xs">—</span>
                                          );
                                        })()}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-slate-300 font-mono">
                                        {tGames}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-bold text-rose-400/90 font-mono">
                                        {tPpg}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-sky-400/90 font-mono">
                                        {t2pm}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-amber-300/90 font-mono">
                                        {t3pm}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-emerald-400 font-mono">
                                        {tFtPct}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-amber-300 font-mono">
                                        {tFouls}
                                      </td>
                                      <td className={`py-2.5 px-3 text-center font-mono ${tPmRaw > 0 ? 'text-emerald-400' : tPmRaw < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {tPm}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-4 text-center">
                      {t.noHistory || 'Nessun dato di carriera disponibile.'}
                    </p>
                  )}
                </div>
              );
            })()}
          </main>
        );
      })()}
    </div>
  )}

      {/* ========================================================================= */}
      {/* TACTICAL TAGS SCOUTING LEGENDA MODAL                                      */}
      {/* ========================================================================= */}
      {showLegendModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-none">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 uppercase tracking-wider">
                    {t.legendTitle || 'LEGENDA TAG TATTICI'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t.legendSubtitle || 'Metriche di scouting avanzate e regole di classificazione applicate a profilo e stagioni'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Close legend modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tactical Tags Cards Grid */}
            <div className="grid grid-cols-1 gap-3">
              {TACTICAL_TAGS_CONFIG.map(tag => (
                <div 
                  key={tag.id}
                  className={`p-3.5 sm:p-4 rounded-xl border ${tag.badgeClass} flex items-center justify-between gap-2 flex-wrap bg-slate-950/50`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl flex-none select-none">{tag.icon}</span>
                    <div>
                      <span className="font-black text-sm uppercase tracking-wide text-white block">
                        {lang === 'it' ? tag.labelIt : tag.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {lang === 'it' ? tag.criteriaDesc : tag.criteriaDescEn}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg text-amber-300">
                    {tag.criteria}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Chiudi Legenda
              </button>
            </div>
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
