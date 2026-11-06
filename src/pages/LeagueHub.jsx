import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Target, Upload, FileText, AlertTriangle, 
  RefreshCw, Search, ArrowLeft, Shield, Zap, ChevronRight, ChevronDown,
  X, User, HelpCircle, Loader2, Terminal, Flame, CheckCircle2,
  Users, Info, BarChart2, TrendingUp, Calendar, Clock, Home, Activity,
  Crosshair, Magnet, Award, AlertCircle, ShieldAlert, Navigation, ChevronUp, Scale, MapPin, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
import { 
  buildSuperchargedBbaRoster, 
  BBA_TEAM_ID, 
  formatPlayerFullName, 
  formatPercentage, 
  formatAverage 
} from '../utils/hybridDataService';

export function TacticalTagIcon({ id, className = "w-4 h-4" }) {
  switch (id) {
    case 'perimeter_specialist':
      return <Target className={className} />;
    case 'inside_slasher':
      return <Crosshair className={className} />;
    case 'foul_magnet':
      return <Magnet className={className} />;
    case 'clutch_ft':
      return <Award className={className} />;
    case 'hack_a_target':
      return <AlertCircle className={className} />;
    case 'foul_trouble':
      return <ShieldAlert className={className} />;
    default:
      return <Activity className={className} />;
  }
}

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
  if (pm == null || isNaN(pm)) return <span className="text-[#022D32]/60">0</span>;
  const num = Number(pm);
  if (num > 0) return <span className="text-[#0CA17A]">+{num}</span>;
  if (num < 0) return <span className="text-rose-600">{num}</span>;
  return <span className="text-[#022D32]/60">0</span>;
};

const formatMedPlusMinus = (stats) => {
  if (!stats) return <span className="text-[#022D32]/60">0.0</span>;
  const games = Number(stats.games || 0);
  if (games <= 0) return <span className="text-[#022D32]/60">0.0</span>;
  const pm = Number(stats.plusMinus || 0);
  const avg = pm / games;
  if (avg > 0) return <span className="text-[#0CA17A]">+{avg.toFixed(1)}</span>;
  if (avg < 0) return <span className="text-rose-600">{avg.toFixed(1)}</span>;
  return <span className="text-[#022D32]/60">0.0</span>;
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
  const rawName = formatPlayerFullName(p.name, p.lastName);
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
  const rawStartPct = item.startPercentage != null ? item.startPercentage : (p.startPercentage != null ? p.startPercentage : (s.startPercentage != null ? s.startPercentage : null));
  let startPercentage = '0%';
  if (rawStartPct != null) {
    startPercentage = typeof rawStartPct === 'string' && rawStartPct.includes('%') ? rawStartPct : `${rawStartPct}%`;
  } else if (startingVal) {
    startPercentage = '100%';
  }
  const startsCount = Number(item.startsCount ?? p.startsCount ?? (startingVal ? 1 : 0));

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
    startPercentage,
    startsCount,
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
    label: 'Perimeter Specialist',
    labelIt: 'Specialista Perimetrale',
    criteria: '3PM/G ≥ 1.5 & Pct3 ≥ 45%',
    criteriaDesc: 'Almeno 1.5 triple a partita e oltre il 45% dei punti dal tiro da 3.',
    criteriaDescEn: 'At least 1.5 3PM/G and over 45% of points from 3-pointers.',
    coachInsight: 'Tiratore primario ad alto volume perimetrale. Uscire forte dai blocchi, passare aggressivamente sopra i pick & roll e negare ricezioni piedi a terra.',
    coachInsightEn: 'High-volume primary perimeter shooter. Run shooters off screens, fight over pick & rolls, and deny spot-up catch-and-shoot looks.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-600',
    rule: (m) => m.ThreePM_PerGame >= 1.5 && m.Pct3 >= 45,
  },
  {
    id: 'inside_slasher',
    label: 'Inside / Slasher',
    labelIt: 'Attaccante Interno',
    criteria: '2PM/G ≥ 3.5 & Pct3 ≤ 15%',
    criteriaDesc: 'Almeno 3.5 canestri da 2 a partita e non oltre il 15% dei punti dal tiro da 3.',
    criteriaDescEn: 'At least 3.5 2PM/G and no more than 15% of points from 3-pointers.',
    coachInsight: 'Attacca aggressivamente il ferro dal palleggio o lavora spalle a canestro. Chiudere le linee di penetrazione, proteggere l\'area e concedere il tiro dal perimetro.',
    coachInsightEn: 'Attacks the rim aggressively off the dribble or in the paint. Pack the lane, wall off drives, and force contested pull-ups from deep.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
    dotClass: 'bg-sky-600',
    rule: (m) => m.TwoPM_PerGame >= 3.5 && m.Pct3 <= 15,
  },
  {
    id: 'foul_magnet',
    label: 'Foul Magnet',
    labelIt: 'Foul Magnet',
    criteria: 'FTA/G ≥ 4.5',
    criteriaDesc: 'Almeno 4.5 tentativi ai tiri liberi a partita.',
    criteriaDescEn: 'At least 4.5 free throw attempts per game.',
    coachInsight: 'Specialista nel creare contatti e subire falli. Disciplina difensiva fondamentale: mani in alto in verticalità senza abboccare alle finte di tiro.',
    coachInsightEn: 'Master at drawing fouls and initiating contact. Extreme discipline required: contest vertically with high hands and do not bite on pump fakes.',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-600',
    rule: (m) => m.FT_Att_PerGame >= 4.5,
  },
  {
    id: 'clutch_ft',
    label: 'Clutch FT Shooter',
    labelIt: 'Glaciale ai Liberi',
    criteria: 'FT% ≥ 78% & FTA/G ≥ 2.5',
    criteriaDesc: 'Percentuale ai tiri liberi ≥ 78% con almeno 2.5 tentativi a partita.',
    criteriaDescEn: 'Free throw percentage >= 78% with at least 2.5 FTA/G.',
    coachInsight: 'Tiratore infallibile a cronometro fermo. Evitare categoricamente falli sul tiro o situazioni di bonus nei finali punto a punto.',
    coachInsightEn: 'Deadly free-throw shooter in clutch moments. Never commit intentional fouls or surrender bonus free throws in close late-game scenarios.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300',
    dotClass: 'bg-teal-600',
    rule: (m) => m.freeThrowsPercentage != null && m.freeThrowsPercentage >= 78 && m.FT_Att_PerGame >= 2.5,
  },
  {
    id: 'hack_a_target',
    label: 'Hack-a-Target',
    labelIt: 'Bersaglio Hack',
    criteria: 'FT% ≤ 50% & FTA/G ≥ 1.5',
    criteriaDesc: 'Percentuale ai tiri liberi ≤ 50% con almeno 1.5 tentativi a partita.',
    criteriaDescEn: 'Free throw percentage <= 50% with at least 1.5 FTA/G: tactical foul target.',
    coachInsight: 'Bersaglio tattico difensivo: gravi difficoltà dalla lunetta. Opzione strategica per spendere falli in bonus sotto canestro per impedire 2 facili.',
    coachInsightEn: 'Tactical target: poor free-throw conversion. Strategic target to commit smart fouls in the bonus rather than allowing uncontested layups.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-600',
    rule: (m) => m.freeThrowsPercentage != null && m.freeThrowsPercentage <= 50 && m.FT_Att_PerGame >= 1.5,
  },
  {
    id: 'foul_trouble',
    label: 'Foul Trouble Risk',
    labelIt: 'Foul Trouble Risk',
    criteria: 'Fouls/G ≥ 3.0',
    criteriaDesc: 'Media falli commessi ≥ 3.0 a partita.',
    criteriaDescEn: 'Averages 3.0+ personal fouls committed per game.',
    coachInsight: 'Difensore indisciplinato e a costante rischio espulsione. Puntarlo fin dai primi minuti con isolamenti e roll decisi per costringerlo in panchina.',
    coachInsightEn: 'Foul-prone defender frequently in foul trouble. Attack them early in isolations and pick & rolls to force early substitution.',
    badgeClass: 'bg-red-50 text-red-800 border-red-300',
    dotClass: 'bg-red-600',
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
    btnSelfScout: "SELF-SCOUT",
    colAst: "AST/P",
    colReb: "REB/P",
    colTov: "TOV/P",
    colRatio: "AST/TOV",
    col2pct: "2PT%",
    col3pct: "3PT%",
    fipVerifiedPill: "FIP VERIFIED",
    btnBack: "Torna alla Classifica",
    quickSwitch: "Cambia Squadra:",
    division: "Divisione Regionale 2 - Girone F",
    season: "Stagione 2025/2026",
    scoutProfileSubtitle: "Profilo Scouting Avversario",
    trackedPlayers: "giocatori monitorati",
    statRecord: "RECORD",
    statWinRate: "PERC. VITTORIE",
    statDiff: "DIFF. CANESTRI",
    statPtsScored: "PUNTI SEGNATI / GARA",
    statPtsConceded: "PUNTI SUBITI / GARA",
    statRosterSize: "ROSTER",
    playersCount: "Giocatori",
    alertFoulTitle: "BERSAGLI DA FALLO (>3.0 FALLI/P)",
    alertFoulStrategy: "Strategia Coach: Attaccare l'area nei primi minuti dal palleggio per caricare di falli, entrare in bonus e forzare la panchina avversaria.",
    alertFoulBadge: "CANDIDATI",
    alertFoulEmpty: "Nessun giocatore con più di 3.0 falli di media.",
    alertShooterTitle: "TIRATORI PRIMARI (>1.5 TRIPLE A PARTITA)",
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
    continuityBadge: "Confermati dal {season}: {pct}%",
    statContinuity: "CONTINUITÀ {season}",
    colSeason: "STAGIONE",
    col2pm: "2PT/P",
    col3pm: "3PT/P",
    colFtPct: "%TL",
    colFf: "FF/P",
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
    tabRoster: "ROSTER & STATISTICHE",
    tabTrends: "ANALISI & TREND",
    trendsOverviewTitle: "PANORAMICA & MOMENTUM",
    splitsTitle: "CONFRONTO RENDIMENTO & AMBIENTE",
    visualAnalyticsTitle: "VISUAL ANALYTICS & TRAIETTORIE",
    colStartPct: "START %",
    trendsTitle: "ANALISI TREND & MACRO-SCOUTING",
    trendsSubtitle: "Rendimento casa/trasferta, analisi dei quarti e game log ufficiale FIP",
    streakTitle: "FORMA ATTUALE / STRISCIA",
    homeAwayTitle: "RENDIMENTO CASA / TRASFERTA",
    home: "CASA",
    away: "TRASFERTA",
    quartersTitle: "ANALISI DEI QUARTI",
    quartersSubtitle: "Punti segnati, punti subiti e differenziale medio per periodo",
    quarterDiffChartTitle: "DIFFERENZIALE MEDIO PER QUARTO",
    quarterDiffChartSubtitle: "Impronta visiva dell'efficienza periodo per periodo (Verde = Vantaggio, Rosso = Sofferenza)",
    volatilityIndex: "INDICE DI VOLATILITÀ (σ)",
    volatilityConsistent: "Offensiva Costante",
    volatilityConsistentDesc: "Bassa dispersione dei punteggi, produzione realizzativa stabile ed affidabile",
    volatilityFluctuating: "Offensiva Altalenante",
    volatilityFluctuatingDesc: "Discreta variabilità realizzativa a seconda dell'avversario",
    volatilityUnpredictable: "Offensiva Imprevedibile",
    volatilityUnpredictableDesc: "Forti oscillazioni tra gare a punteggio alto e basso",
    halvesTitle: "1° TEMPO vs 2° TEMPO (TENUTA FISICA)",
    halvesSubtitle: "Confronto rendimento prima metà vs seconda metà di gara",
    firstHalf: "1° TEMPO (Q1+Q2)",
    secondHalf: "2° TEMPO (Q3+Q4)",
    halvesFade: "CALO FISICO NEL 2° TEMPO",
    halvesFadeDesc: "La squadra cala significativamente di intensità nella seconda frazione. Alzare il ritmo ed aggredire nella ripresa.",
    halvesStrong: "PROGRESSIONE NEL 2° TEMPO",
    halvesStrongDesc: "Squadra diesel che aumenta efficienza ed intensità nei quarti finali. Mantenere la concentrazione fino al 40°.",
    halvesBalanced: "RENDIMENTO EQUILIBRATO",
    halvesBalancedDesc: "Produzione e differenziale stabili tra primo e secondo tempo.",
    halvesDiffDelta: "Differenziale 2°T vs 1°T",
    gameTrendsTitle: "TRAIETTORIA & TREND DI RENDIMENTO",
    gameTrendsSubtitle: "Evoluzione cronologica dei punti segnati vs punti subiti partita per partita",
    scoredPoints: "Punti Segnati",
    concededPoints: "Punti Subiti",
    netMargin: "Differenziale Netto",
    gameLogTitle: "GAME LOG / ULTIME PARTITE",
    noTrends: "Nessun dato di trend o partite registrato per questa squadra.",
    noGames: "Nessuna gara disputata registrata a referto.",
    // Empty state
    emptyTitle: "Dati Campionato Non Sincronizzati",
    emptyDesc: "Dati campionato non presenti. Clicca su AGGIORNA DATI FIP per scaricare l'ultima classifica e i report scouting dal cloud, oppure carica il set di esempio.",
    emptyCmd: "npm run sync-league",
    syncSuccess: "Dati FIP sincronizzati con successo",
    syncToast: "Dati Campionato Caricati",
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
    btnSelfScout: "SELF-SCOUT",
    colAst: "AST/G",
    colReb: "REB/G",
    colTov: "TOV/G",
    colRatio: "AST/TOV",
    col2pct: "2PT%",
    col3pct: "3PT%",
    fipVerifiedPill: "FIP VERIFIED",
    btnBack: "Back to Standings",
    quickSwitch: "Switch Team:",
    division: "Divisione Regionale 2 - Girone F",
    season: "Season 2025/2026",
    scoutProfileSubtitle: "Opponent Scouting Profile",
    trackedPlayers: "players tracked",
    statRecord: "RECORD",
    statWinRate: "WIN RATE",
    statDiff: "POINT DIFFERENTIAL",
    statPtsScored: "POINTS SCORED / G",
    statPtsConceded: "POINTS CONCEDED / G",
    statRosterSize: "ROSTER SIZE",
    playersCount: "Players",
    alertFoulTitle: "HIGH FOUL TARGETS (>3.0 FOULS/G)",
    alertFoulStrategy: "Coach Strategy: Attack in the paint early off the dribble to draw fouls, induce penalty, and force bench substitutions.",
    alertFoulBadge: "CANDIDATES",
    alertFoulEmpty: "No players averaging > 3.0 fouls.",
    alertShooterTitle: "PRIMARY SHOOTERS (>1.5 MADE 3PT/G)",
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
    continuityBadge: "Core Retained from {season}: {pct}%",
    statContinuity: "CORE CONTINUITY",
    colSeason: "SEASON",
    col2pm: "2PM/G",
    col3pm: "3PM/G",
    colFtPct: "FT%",
    colFf: "PF/G",
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
    tabRoster: "ROSTER & STATS",
    tabTrends: "TRENDS & ANALYSIS",
    trendsOverviewTitle: "OVERVIEW & MOMENTUM",
    splitsTitle: "ENVIRONMENT & SPLIT PERFORMANCE",
    visualAnalyticsTitle: "VISUAL ANALYTICS & TRAJECTORIES",
    colStartPct: "START %",
    trendsTitle: "TEAM TRENDS & MACRO-SCOUTING",
    trendsSubtitle: "Home/away splits, quarters breakdown and official FIP game log",
    streakTitle: "CURRENT FORM / STREAK",
    homeAwayTitle: "HOME / AWAY PERFORMANCE",
    home: "HOME",
    away: "AWAY",
    quartersTitle: "QUARTERS BREAKDOWN",
    quartersSubtitle: "Average points scored, conceded and differential per period",
    quarterDiffChartTitle: "QUARTER AVERAGE DIFFERENTIAL",
    quarterDiffChartSubtitle: "Visual fingerprint of period-by-period net margin (Green = Advantage, Red = Deficit)",
    volatilityIndex: "VOLATILITY INDEX (σ)",
    volatilityConsistent: "Consistent Offense",
    volatilityConsistentDesc: "Low scoring dispersion, reliable and predictable offensive output",
    volatilityFluctuating: "Fluctuating Offense",
    volatilityFluctuatingDesc: "Moderate scoring variance depending on opponent and matchup",
    volatilityUnpredictable: "Unpredictable Offense",
    volatilityUnpredictableDesc: "High variance with wide swings between high and low scoring nights",
    halvesTitle: "1ST HALF vs 2ND HALF (STAMINA & MOMENTUM)",
    halvesSubtitle: "Performance comparison between first half and second half",
    firstHalf: "1ST HALF (Q1+Q2)",
    secondHalf: "2ND HALF (Q3+Q4)",
    halvesFade: "SECOND HALF FADE",
    halvesFadeDesc: "Team suffers a noticeable drop in late quarters. Push pace and attack aggressively in the second half.",
    halvesStrong: "SECOND HALF FINISH",
    halvesStrongDesc: "Team ramps up intensity and efficiency late. Guard against lapses and maintain 40-minute focus.",
    halvesBalanced: "BALANCED HALF SPLITS",
    halvesBalancedDesc: "Consistent scoring and defensive stability across both halves.",
    halvesDiffDelta: "2nd Half vs 1st Half Differential",
    gameTrendsTitle: "GAME-BY-GAME PERFORMANCE TREND",
    gameTrendsSubtitle: "Chronological trajectory of points scored vs points conceded game by game",
    scoredPoints: "Points Scored",
    concededPoints: "Points Conceded",
    netMargin: "Net Margin",
    gameLogTitle: "GAME LOG / RECENT MATCHES",
    noTrends: "No match trends recorded for this team.",
    noGames: "No official matches recorded on file.",
    // Empty state
    emptyTitle: "League Data Not Synced",
    emptyDesc: "League data not synced. Tap SYNC FIP DATA to pull the latest standings and scouting reports directly from the cloud, or load the baseline sample.",
    emptyCmd: "npm run sync-league",
    syncSuccess: "Live FIP league data synced successfully",
    syncToast: "League Hub Synced",
    syncError: "Sync failed"
  }
};

// =========================================================================
// RECHARTS CUSTOM TOOLTIPS (BBA MODERN SAAS THEME)
// =========================================================================
function CustomTrendTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isWin = data.isWin;
    return (
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-md text-xs space-y-2 font-sans min-w-[200px]">
        <div className="font-black text-[#022D32] border-b border-slate-100 pb-1.5 flex items-center justify-between gap-2">
          <span>{data.fullTitle}</span>
          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
            isWin ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {isWin ? 'V' : 'P'}
          </span>
        </div>
        <div className="flex justify-between items-center text-[#0CA17A] font-bold">
          <span>Punti Segnati:</span>
          <span className="font-mono font-black text-sm">{data.scored}</span>
        </div>
        <div className="flex justify-between items-center text-rose-600 font-bold">
          <span>Punti Subiti:</span>
          <span className="font-mono font-black text-sm">{data.conceded}</span>
        </div>
        <div className="flex justify-between items-center text-[#022D32] pt-1.5 border-t border-slate-100 font-bold text-[11px]">
          <span className="text-slate-500 uppercase tracking-wider">Differenziale:</span>
          <span className={`font-mono font-black ${data.diff > 0 ? 'text-[#0CA17A]' : data.diff < 0 ? 'text-rose-600' : 'text-[#022D32]'}`}>
            {data.diff > 0 ? `+${data.diff}` : data.diff}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

function CustomQuarterTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPos = data.diff > 0;
    return (
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-md text-xs space-y-2 font-sans min-w-[170px]">
        <div className="font-black text-[#022D32] border-b border-slate-100 pb-1 flex items-center justify-between">
          <span className="font-mono text-sm">{data.quarter}</span>
          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
            isPos ? 'bg-emerald-50 text-emerald-700' : data.diff < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {isPos ? `+${data.diff}` : data.diff}
          </span>
        </div>
        <div className="flex justify-between items-center text-[#0CA17A] font-semibold">
          <span>Media Segnati:</span>
          <span className="font-mono font-black">{data.scoredAvg}</span>
        </div>
        <div className="flex justify-between items-center text-rose-600 font-semibold">
          <span>Media Subiti:</span>
          <span className="font-mono font-black">{data.concededAvg}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function LeagueHub({ showToast }) {
  const navigate = useNavigate();
  // Global Language Context: 'it' | 'en'
  const { language, setLanguage } = useLanguage();
  const lang = language;
  const t = DICTIONARY[lang] || DICTIONARY.it;

  const toggleLang = (newLang) => {
    setLanguage(newLang);
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

  const [teamTrends, setTeamTrends] = useState(() => {
    try {
      const saved = localStorage.getItem('bba_fip_trends');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [teamDetailTab, setTeamDetailTab] = useState('roster'); // 'roster' | 'trends'

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

  // Proprietary Supabase data for BBA Self-Scouting
  const [supabaseLogs, setSupabaseLogs] = useState([]);
  useEffect(() => {
    async function loadSupabase() {
      try {
        const { data, error } = await supabase.from('scouting_log').select('*');
        if (!error && Array.isArray(data)) {
          setSupabaseLogs(data);
        }
      } catch (e) {
        console.warn('[League Hub] Supabase fetch note:', e.message);
      }
    }
    loadSupabase();
  }, []);

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

      // 3. Fetch /data/team_trends.json directly
      try {
        const trendsRes = await fetch('/data/team_trends.json', { cache: 'no-store' });
        if (trendsRes.ok) {
          const trendsJson = await trendsRes.json();
          if (trendsJson && typeof trendsJson === 'object') {
            setTeamTrends(trendsJson);
            try {
              localStorage.setItem('bba_fip_trends', JSON.stringify(trendsJson));
            } catch (e) {}
          }
        }
      } catch (trendsErr) {
        console.warn('[League Hub] /data/team_trends.json fetch note:', trendsErr.message);
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
        setStatusMsg('Live FIP league data synced successfully');
        if (showToast) showToast('League Hub Synced');
      }
    } catch (err) {
      console.warn('[League Hub] Sync error:', err.message);
      setFetchError(err.message);
      if (isManual && showToast) {
        showToast(`Sync failed: ${err.message}`);
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
    const sFid = String(teamFid);
    const sTeam = (standings || []).find(s => String(s.fid || s.teamFid || s.id) === sFid);
    const isB = sFid === bbaTeamId || sFid === 'team_bba_academy' || (sTeam?.name || '').toLowerCase().includes('bba') || (sTeam?.name || '').toLowerCase().includes('baronissi');

    if (isB) {
      navigate('/trends');
      return;
    }

    setSelectedTeamFid(teamFid);
    setCurrentView('TEAM_DETAIL_VIEW');
    setSelectedPlayer(null);
    setTeamDetailTab('roster');
    setRosterSearch('');
  };

  const handleBackToStandings = () => {
    setCurrentView('STANDINGS_VIEW');
    setSelectedTeamFid(null);
    setSelectedPlayer(null);
    setTeamDetailTab('roster');
  };

  const handleResetToDefault = () => {
    setStandings(DEFAULT_STANDINGS);
    setRosters(DEFAULT_ROSTERS);
    setFetchError(null);
    try {
      localStorage.setItem('bba_fip_standings', JSON.stringify(DEFAULT_STANDINGS));
      localStorage.setItem('bba_fip_rosters', JSON.stringify(DEFAULT_ROSTERS));
    } catch (e) {}
    setStatusMsg('Loaded baseline Divisione Regionale 2 dataset');
    if (showToast) showToast('Sample League Loaded');
    setCurrentView('STANDINGS_VIEW');
    setSelectedTeamFid(null);
    setSelectedPlayer(null);
  };

  const bbaTeamId = String(import.meta.env.VITE_BBA_TEAM_ID || BBA_TEAM_ID);

  // Selected Team Info
  const currentTeamStanding = useMemo(() => {
    if (!selectedTeamFid || !standings) return null;
    return standings.find(s => String(s.fid || s.teamFid || s.id) === String(selectedTeamFid)) || null;
  }, [selectedTeamFid, standings]);

  const isSelectedBBA = useMemo(() => {
    if (!selectedTeamFid) return false;
    const sFid = String(selectedTeamFid);
    const sName = (currentTeamStanding?.name || '').toLowerCase();
    return sFid === bbaTeamId || sFid === 'team_bba_academy' || sName.includes('bba') || sName.includes('baronissi');
  }, [selectedTeamFid, currentTeamStanding, bbaTeamId]);

  // Intercept BBA Selection: Redirect immediately to dedicated internal BBA page
  useEffect(() => {
    if (isSelectedBBA) {
      setSelectedTeamFid(null);
      setCurrentView('STANDINGS_VIEW');
      navigate('/trends');
    }
  }, [isSelectedBBA, navigate]);

  const rawLineups = useMemo(() => {
    if (!selectedTeamFid || !rosters) return [];
    if (rosters[selectedTeamFid] && rosters[selectedTeamFid].length > 0) {
      return rosters[selectedTeamFid];
    }
    if (isSelectedBBA) {
      return rosters[bbaTeamId] || rosters['team_bba_academy'] || [];
    }
    return rosters[selectedTeamFid] || [];
  }, [selectedTeamFid, rosters, isSelectedBBA, bbaTeamId]);

  const currentRoster = useMemo(() => {
    const normalized = rawLineups.map((item, idx) => normalizeLineupItem(item, idx));
    if (isSelectedBBA) {
      return buildSuperchargedBbaRoster(normalized, supabaseLogs);
    }
    return normalized;
  }, [rawLineups, isSelectedBBA, supabaseLogs]);

  // Selected Team Advanced Match Trends (Home/Away, Quarters, Streak, Log)
  const currentTrends = useMemo(() => {
    if (!selectedTeamFid || !teamTrends) return null;
    if (teamTrends[selectedTeamFid]) return teamTrends[selectedTeamFid];
    if (isSelectedBBA) {
      return teamTrends[bbaTeamId] || teamTrends['team_bba_academy'] || null;
    }
    return teamTrends[selectedTeamFid] || null;
  }, [selectedTeamFid, teamTrends, isSelectedBBA, bbaTeamId]);

  // Dynamic active season & previous season detection from current roster history
  const activeSeasonInfo = useMemo(() => {
    let activeSeason = '';
    if (Array.isArray(currentRoster)) {
      for (const p of currentRoster) {
        const history = p.history || p.uniquePlayer?.history || [];
        if (history.length > 0 && history[0].seasonName) {
          activeSeason = history[0].seasonName;
          break;
        }
      }
    }
    if (!activeSeason || !activeSeason.includes('/')) {
      return { activeSeason: '2026/2027', prevSeason: '2025/2026', prevShort: '25/26' };
    }
    const [startYear, endYear] = activeSeason.split('/').map(Number);
    const prevSeason = `${startYear - 1}/${endYear - 1}`;
    const prevShort = `${String(startYear - 1).slice(-2)}/${String(endYear - 1).slice(-2)}`;
    return { activeSeason, prevSeason, prevShort };
  }, [currentRoster]);

  // Roster Continuity (core retained from previous season)
  const continuityPct = useMemo(() => {
    if (currentTeamStanding?.continuityPct != null) {
      return Number(currentTeamStanding.continuityPct);
    }
    if (selectedTeamFid && rosters && rosters[selectedTeamFid]?.continuityPct != null) {
      return Number(rosters[selectedTeamFid].continuityPct);
    }
    if (Array.isArray(currentRoster) && currentRoster.length > 0) {
      const currentTeamName = currentTeamStanding?.name || '';
      const prevSeasonName = activeSeasonInfo.prevSeason;
      let retained = 0;
      for (const player of currentRoster) {
        const history = player.history || player.uniquePlayer?.history || [];
        const prevSeason = history.find(h => {
          const isPrevSeason = String(h.seasonName || '') === prevSeasonName;
          let matchedTeam = false;
          if (h.teams && Array.isArray(h.teams)) {
            matchedTeam = h.teams.some(t => isSameTeam(t.teamName, currentTeamName));
          } else {
            matchedTeam = isSameTeam(h.teamName, currentTeamName);
          }
          return isPrevSeason && matchedTeam;
        });
        if (prevSeason) retained++;
      }
      return Math.round((retained / currentRoster.length) * 100);
    }
    return 65;
  }, [currentTeamStanding, selectedTeamFid, rosters, currentRoster, activeSeasonInfo]);

  // =========================================================================
  // DERIVED INTELLIGENCE: VOLATILITY, HALVES & CHARTS DATA
  // =========================================================================

  // 1. Volatility & Predictability Index (Standard Deviation σ of Points Scored across all games in log)
  const volatilityMetric = useMemo(() => {
    if (!currentTrends || !Array.isArray(currentTrends.log) || currentTrends.log.length === 0) {
      return null;
    }
    const matchLog = currentTrends.log;
    const scoredList = matchLog
      .map(m => (m.isHomeGame ? m.homeScore : m.awayScore))
      .filter(p => typeof p === 'number' && !isNaN(p));

    if (scoredList.length === 0) return null;

    const n = scoredList.length;
    const mean = scoredList.reduce((acc, v) => acc + v, 0) / n;

    let stdDev = 0;
    if (n > 1) {
      const variance = scoredList.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
      stdDev = Number(Math.sqrt(variance).toFixed(1));
    }

    let badgeText = '';
    let badgeDesc = '';
    let badgeColor = '';
    let dotColor = '';

    if (stdDev < 7) {
      badgeText = t.volatilityConsistent || 'Offensiva Costante';
      badgeDesc = t.volatilityConsistentDesc || 'Produzione offensiva affidabile e stabile';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      dotColor = 'bg-emerald-500';
    } else if (stdDev <= 12) {
      badgeText = t.volatilityFluctuating || 'Offensiva Altalenante';
      badgeDesc = t.volatilityFluctuatingDesc || 'Variabilità realizzativa media a seconda del match';
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
      dotColor = 'bg-amber-500';
    } else {
      badgeText = t.volatilityUnpredictable || 'Offensiva Imprevedibile';
      badgeDesc = t.volatilityUnpredictableDesc || 'Forti oscillazioni tra gare a punteggio alto e basso';
      badgeColor = 'bg-rose-100 text-rose-900 border-rose-300';
      dotColor = 'bg-rose-500';
    }

    return {
      stdDev,
      mean: Number(mean.toFixed(1)),
      badgeText,
      badgeDesc,
      badgeColor,
      dotColor,
      gamesCount: n
    };
  }, [currentTrends, t]);

  // 2. First Half vs Second Half (Tenuta Fisica & Continuità)
  const halvesData = useMemo(() => {
    if (!currentTrends) return null;
    const g = currentTrends.global?.games || 0;
    if (g === 0) return null;

    const q1 = currentTrends.quarters?.Q1 || { scored: 0, conceded: 0 };
    const q2 = currentTrends.quarters?.Q2 || { scored: 0, conceded: 0 };
    const q3 = currentTrends.quarters?.Q3 || { scored: 0, conceded: 0 };
    const q4 = currentTrends.quarters?.Q4 || { scored: 0, conceded: 0 };

    const h1Scored = (q1.scored || 0) + (q2.scored || 0);
    const h1Conceded = (q1.conceded || 0) + (q2.conceded || 0);
    const h2Scored = (q3.scored || 0) + (q4.scored || 0);
    const h2Conceded = (q3.conceded || 0) + (q4.conceded || 0);

    const h1ScoredAvg = Number((h1Scored / g).toFixed(1));
    const h1ConcededAvg = Number((h1Conceded / g).toFixed(1));
    const h1Diff = Number((h1ScoredAvg - h1ConcededAvg).toFixed(1));

    const h2ScoredAvg = Number((h2Scored / g).toFixed(1));
    const h2ConcededAvg = Number((h2Conceded / g).toFixed(1));
    const h2Diff = Number((h2ScoredAvg - h2ConcededAvg).toFixed(1));

    const diffDelta = Number((h2Diff - h1Diff).toFixed(1));

    let verdictType = 'balanced';
    if (diffDelta <= -3.0) {
      verdictType = 'fade';
    } else if (diffDelta >= 3.0) {
      verdictType = 'strong';
    }

    return {
      h1ScoredAvg,
      h1ConcededAvg,
      h1Diff,
      h2ScoredAvg,
      h2ConcededAvg,
      h2Diff,
      diffDelta,
      verdictType
    };
  }, [currentTrends]);

  // 3. Chronological Game Trends (Oldest to Newest) for Recharts LineChart
  const trendsLineData = useMemo(() => {
    if (!currentTrends || !Array.isArray(currentTrends.log) || currentTrends.log.length === 0) {
      return [];
    }
    const sorted = [...currentTrends.log].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.map((m, idx) => {
      const scored = m.isHomeGame ? m.homeScore : m.awayScore;
      const conceded = m.isHomeGame ? m.awayScore : m.homeScore;
      const opp = (m.isHomeGame ? m.awayTeam : m.homeTeam) || 'Avversario';
      const locPrefix = m.isHomeGame ? 'vs' : '@';
      const d = new Date(m.date);
      const dateStr = !isNaN(d) ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}` : '';
      const roundLabel = m.round ? `G${m.round}` : `#${idx + 1}`;

      return {
        round: roundLabel,
        fullTitle: `${roundLabel} • ${locPrefix} ${opp.trim()}`,
        date: dateStr,
        scored: Number(scored) || 0,
        conceded: Number(conceded) || 0,
        diff: (Number(scored) || 0) - (Number(conceded) || 0),
        isWin: m.isWin,
        isHome: m.isHomeGame
      };
    });
  }, [currentTrends]);

  // 4. Quarter Differentials for Recharts BarChart
  const quarterChartData = useMemo(() => {
    if (!currentTrends || !currentTrends.quarterAverages) return [];
    const qa = currentTrends.quarterAverages;
    return ['Q1', 'Q2', 'Q3', 'Q4'].map(qKey => {
      const qData = qa[qKey] || { scoredAvg: 0, concededAvg: 0, diff: 0 };
      return {
        quarter: qKey,
        diff: Number(qData.diff) || 0,
        scoredAvg: qData.scoredAvg,
        concededAvg: qData.concededAvg
      };
    });
  }, [currentTrends]);

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

        case 'startPercentage':
          valA = parseFloat(String(a.startPercentage || '0').replace('%', ''));
          valB = parseFloat(String(b.startPercentage || '0').replace('%', ''));
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
        case 'ftPct':
          valA = Number(a.freeThrowsPercentage ?? a.ftPct ?? parseFloat(a.ftPct) ?? 0);
          valB = Number(b.freeThrowsPercentage ?? b.ftPct ?? parseFloat(b.ftPct) ?? 0);
          break;

        case 'ftAttAvg':
          valA = Number(a.ftAttAvg ?? a.ftAtt ?? 0);
          valB = Number(b.ftAttAvg ?? b.ftAtt ?? 0);
          break;

        case 'twoPct':
          valA = Number(a.twoPct ?? a.inArcThrowsPercentage ?? 0);
          valB = Number(b.twoPct ?? b.inArcThrowsPercentage ?? 0);
          break;

        case 'threePct':
          valA = Number(a.threePct ?? a.outArcThrowsPercentage ?? 0);
          valB = Number(b.threePct ?? b.outArcThrowsPercentage ?? 0);
          break;

        case 'astAvg':
          valA = Number(a.astAvg ?? a.stats?.assistsAVG ?? 0);
          valB = Number(b.astAvg ?? b.stats?.assistsAVG ?? 0);
          break;

        case 'rebAvg':
          valA = Number(a.rebAvg ?? a.stats?.reboundsAVG ?? 0);
          valB = Number(b.rebAvg ?? b.stats?.reboundsAVG ?? 0);
          break;

        case 'tovAvg':
          valA = Number(a.tovAvg ?? 0);
          valB = Number(b.tovAvg ?? 0);
          break;

        case 'astTovRatio':
          valA = Number(a.astTovRatio ?? 0);
          valB = Number(b.astTovRatio ?? 0);
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
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#F8F9FA] text-[#022D32] -m-1 sm:-m-2 p-3 sm:p-6 w-auto space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & GLOBAL CONTROLS                                           */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#DDF3E9] flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center flex-none">
            <Trophy className="w-6 h-6 text-[#0CA17A]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2.5">
              {t.title}
              <span className="text-xs bg-[#DDF3E9] text-[#0CA17A] font-black px-2.5 py-0.5 rounded-md border border-[#0CA17A]/30">
                {t.badgeSynced}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#022D32]/80 font-bold">
              {t.division} • {t.season}
            </p>
          </div>
        </div>

        {/* Global Controls & Language Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Language Toggle */}
          <div className="flex items-center bg-[#F8F9FA] border border-[#DDF3E9] rounded-xl p-1">
            <button
              type="button"
              onClick={() => toggleLang('it')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                lang === 'it' 
                  ? 'bg-[#0CA17A] text-white shadow-xs' 
                  : 'text-[#022D32]/70 hover:text-[#022D32]'
              }`}
            >
              IT
            </button>
            <button
              type="button"
              onClick={() => toggleLang('en')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                lang === 'en' 
                  ? 'bg-[#0CA17A] text-white shadow-xs' 
                  : 'text-[#022D32]/70 hover:text-[#022D32]'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchFipData(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-white border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Fetch latest league data from /api/sync-fip"
          >
            <RefreshCw className={`w-4 h-4 text-[#0CA17A] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t.btnSyncing : t.btnSync}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-2 bg-white border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Load default championship league dataset"
          >
            <RefreshCw className="w-4 h-4 text-[#0CA17A]" />
            <span>{t.btnDefault}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-2 bg-[#022D32] hover:bg-[#022D32]/90 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{t.btnImport}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className="p-2.5 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/40 text-xs font-bold text-[#022D32] flex items-center justify-between animate-fade-in">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-[#022D32]/60 hover:text-[#022D32]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LOADING & EMPTY/UNSYNCED STATES                                        */}
      {/* ========================================================================= */}
      {isSyncing && (!standings || standings.length === 0) ? (
        <div className="bg-white p-12 text-center border border-[#DDF3E9] rounded-2xl max-w-md mx-auto space-y-3 my-12 animate-pulse shadow-sm">
          <Loader2 className="w-8 h-8 text-[#0CA17A] animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#022D32]">Syncing FIP League Data...</p>
          <p className="text-xs text-[#022D32]/60 font-mono">Querying cloud serverless endpoint (/api/sync-fip)</p>
        </div>
      ) : (!standings || standings.length === 0) ? (
        /* Empty / Unsynced State */
        <div className="bg-white p-8 sm:p-12 text-center border border-[#DDF3E9] rounded-2xl max-w-xl mx-auto space-y-5 my-8 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center mx-auto text-[#0CA17A]">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-[#022D32] uppercase tracking-wide">
              {t.emptyTitle}
            </h2>
            <p className="text-sm text-[#022D32]/70">
              {t.emptyDesc}
            </p>
          </div>

          {/* Terminal Command Box */}
          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] text-left font-mono text-xs text-[#022D32] flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Terminal className="w-4 h-4 text-[#0CA17A] flex-none" />
              <span className="text-[#022D32]">{t.emptyCmd}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(t.emptyCmd);
                }
                if (showToast) showToast(`Copied: ${t.emptyCmd}`);
              }}
              className="text-[#022D32]/70 hover:text-[#022D32] px-2.5 py-1 rounded bg-white hover:bg-[#DDF3E9] border border-[#DDF3E9] transition-colors flex-none text-[11px] font-sans font-bold active:scale-95 shadow-xs"
              title="Copy command to clipboard"
            >
              Copy
            </button>
          </div>

          {fetchError && (
            <p className="text-xs text-[#022D32]/70 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
              Status: <span className="text-rose-600 font-bold">{fetchError}</span>
            </p>
          )}

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fetchFipData(true)}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black px-4 py-2 rounded-xl text-xs transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? t.btnSyncing : t.btnSync}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-2 bg-white border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-[#0CA17A]" />
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    {t.standingsTitle}
                  </span>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-lg sm:text-xl font-extrabold text-[#022D32] truncate">
                      {standings[0]?.name || standings[0]?.team?.name || 'N/A'}
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-extrabold text-[#0CA17A] flex-none">
                      {standings[0]?.stats?.wonMatches != null
                        ? standings[0].stats.wonMatches * 2
                        : (standings[0]?.points ?? ((standings[0]?.won ?? 0) * 2))} {t.colPts}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    {t.bestRecord}
                  </span>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-lg sm:text-xl font-extrabold text-[#022D32] truncate">
                      {standings[0]?.stats
                        ? `${standings[0].stats.wonMatches}W - ${standings[0].stats.lostMatches}L`
                        : `${standings[0]?.won ?? 0}W - ${standings[0]?.lost ?? 0}L`}
                    </span>
                    <span className="font-mono text-base font-extrabold text-[#0CA17A] flex-none">
                      {(() => {
                        const won = standings[0]?.stats?.wonMatches ?? standings[0]?.won ?? 0;
                        const played = standings[0]?.stats?.playedMatches ?? standings[0]?.played ?? 0;
                        return played > 0 ? `${Math.round((won / played) * 100)}% WIN` : '';
                      })()}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    {t.topDiff}
                  </span>
                  <div className="flex items-baseline justify-between gap-2">
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
                          <span className="text-lg sm:text-xl font-extrabold text-[#022D32] truncate">
                            {topDiffTeam?.name || 'N/A'}
                          </span>
                          <span className={`font-mono text-lg sm:text-xl font-extrabold flex-none ${diffVal > 0 ? 'text-[#0CA17A]' : (diffVal < 0 ? 'text-rose-600' : 'text-[#022D32]')}`}>
                            {diffVal > 0 ? `+${diffVal}` : diffVal}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Standings Table Card */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                      {t.standingsTitle} ({filteredStandings.length} {t.playersCount})
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      {t.standingsSubtitle}
                    </p>
                  </div>

                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={t.filterTeam}
                      value={standingsSearch}
                      onChange={(e) => setStandingsSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-[#022D32] placeholder-slate-400 focus:outline-none focus:border-[#0CA17A] w-52 sm:w-64 font-medium"
                    />
                  </div>
                </div>

                {/* Standings Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[11px] sm:text-xs tracking-wider select-none">
                        <th className="p-3.5 w-14 text-center">{t.colRank}</th>
                        <th className="p-3.5">{t.colTeam}</th>
                        <th className="p-3.5 text-center">{t.colLast5}</th>
                        <th className="p-3.5 text-center">{t.colPts}</th>
                        <th className="p-3.5 text-center">{t.colRecord}</th>
                        <th className="p-3.5 text-center">{t.colGp}</th>
                        <th className="p-3.5 text-center">{t.colDiff}</th>
                        <th className="p-3.5 text-right">{t.colScout}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
                            onClick={() => handleSelectTeam(team.fid || tFid)}
                            className={`transition-colors border-b border-slate-100/60 cursor-pointer ${
                              isBBA 
                                ? 'bg-emerald-50/50 hover:bg-emerald-100/60 border-l-4 border-[#0CA17A]' 
                                : `${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-[#0CA17A]/5`
                            }`}
                          >
                            <td className="p-3.5 text-center font-mono font-black">
                              <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                                isPlayoff
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : isPlayout
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-slate-100 text-slate-700'
                              }`}>
                                {rankNum}
                              </span>
                            </td>
                            <td className="p-3.5 font-black text-[#022D32]">
                              <div className="flex items-center gap-2">
                                <span className="text-sm sm:text-base">{tName}</span>
                                {isBBA && (
                                  <span className="text-[10px] sm:text-xs bg-[#DDF3E9] text-[#022D32] font-black px-2 py-0.5 rounded border border-[#0CA17A]/40">
                                    {t.ourTeam}
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Streak / Last 5 */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {Array.isArray(team.streak) && team.streak.length > 0 ? (
                                  team.streak.slice(-5).map((res, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={`w-5 h-5 rounded-full font-mono text-[10px] sm:text-xs font-black flex items-center justify-center ${
                                        res === 'W'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-rose-50 text-rose-700'
                                      }`}
                                    >
                                      {res}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[#022D32]/50 font-mono text-sm">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 text-center font-mono font-black text-[#022D32] text-sm sm:text-base">
                              {pts}
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-sm sm:text-base text-[#022D32]">
                              <span className="text-emerald-700 font-black">{won}</span>
                              <span className="text-[#022D32]/40 mx-1">-</span>
                              <span className="text-rose-700 font-black">{lost}</span>
                            </td>
                            <td className="p-3.5 text-center font-mono text-sm sm:text-base text-[#022D32] font-bold">
                              {gp}
                            </td>
                            <td className="p-3.5 text-center font-mono font-black text-sm sm:text-base">
                              <span className={Number(diff) > 0 ? 'text-emerald-700' : (Number(diff) < 0 ? 'text-rose-700' : 'text-[#022D32]')}>
                                {Number(diff) > 0 ? `+${diff}` : diff}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              {isBBA ? (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleSelectTeam(team.fid || tFid); }}
                                  className="bg-[#022D32] hover:bg-[#022D32]/90 text-white font-bold px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all inline-flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer border border-[#0CA17A]/50"
                                >
                                  <span>{t.btnSelfScout || 'SELF-SCOUT'}</span>
                                  <ChevronRight className="w-4 h-4 text-[#A7F3D0]" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleSelectTeam(team.fid || tFid); }}
                                  className="bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-bold px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all inline-flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                                >
                                  <span>{t.btnScout}</span>
                                  <ChevronRight className="w-4 h-4 text-white" />
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
            <div className="space-y-5 animate-fade-in">
              {/* Back Navigation Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleBackToStandings}
                  className="bg-white border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#0CA17A]" />
                  <span>← {t.btnBack}</span>
                </button>

                {/* Team Switcher Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#022D32]/80 uppercase hidden sm:inline">{t.quickSwitch}</span>
                  <select
                    value={selectedTeamFid || ''}
                    onChange={(e) => handleSelectTeam(e.target.value)}
                    className="bg-white border border-[#DDF3E9] text-[#022D32] text-xs sm:text-sm font-bold p-2.5 rounded-xl focus:outline-none focus:border-[#0CA17A] cursor-pointer shadow-xs"
                  >
                    {standings
                      .map(s => {
                        const fid = s.fid || s.teamFid || s.id;
                        const name = s.name || s.team?.name;
                        const pts = s.stats?.wonMatches != null ? s.stats.wonMatches * 2 : (s.points ?? ((s.won ?? 0) * 2));
                        const pos = s.position ?? s.rank ?? '-';
                        const isBBA = String(fid) === bbaTeamId || fid === 'team_bba_academy' || (name || '').toLowerCase().includes('bba') || (name || '').toLowerCase().includes('baronissi');
                        return (
                          <option key={fid} value={fid} className="bg-white text-[#022D32]">
                            #{pos} {name} {isBBA ? `(${t.ourTeam || 'NOSTRA SQUADRA'})` : `(${pts} ${t.colPts})`}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* Team Overview Header Banner */}
              {(() => {
                const won = currentTeamStanding?.stats?.wonMatches ?? currentTeamStanding?.won ?? 0;
                const lost = currentTeamStanding?.stats?.lostMatches ?? currentTeamStanding?.lost ?? 0;
                const teamPpg = currentTeamStanding?.stats?.pointsPerGame != null 
                  ? Number(currentTeamStanding.stats.pointsPerGame).toFixed(1) 
                  : (currentTeamStanding?.pointsPerGame != null ? Number(currentTeamStanding.pointsPerGame).toFixed(1) : '—');
                const teamOppPpg = currentTeamStanding?.stats?.opponentsPointsPerGame != null 
                  ? Number(currentTeamStanding.stats.opponentsPointsPerGame).toFixed(1) 
                  : (currentTeamStanding?.opponentsPointsPerGame != null ? Number(currentTeamStanding.opponentsPointsPerGame).toFixed(1) : '—');
                const diffVal = (currentTeamStanding?.stats?.pointsPerGame != null && currentTeamStanding?.stats?.opponentsPointsPerGame != null)
                  ? (currentTeamStanding.stats.pointsPerGame - currentTeamStanding.stats.opponentsPointsPerGame).toFixed(1)
                  : (currentTeamStanding?.pointDiff != null ? Number(currentTeamStanding.pointDiff).toFixed(1) : '0.0');
                const rankNum = currentTeamStanding?.position ?? currentTeamStanding?.rank ?? '-';

                return (
                  <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                          <h2 className="text-2xl sm:text-4xl font-black text-[#022D32] uppercase tracking-wide">
                            {currentTeamStanding?.name || selectedTeamFid}
                          </h2>
                          {isSelectedBBA && (
                            <span className="text-xs sm:text-sm bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-lg border border-emerald-300 inline-flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-[#0CA17A]" />
                              <span>{t.ourTeam || 'NOSTRA SQUADRA'} (SELF-SCOUTING)</span>
                            </span>
                          )}
                          <span className="text-xs sm:text-sm bg-slate-100 text-[#022D32] font-black px-3 py-1 rounded-lg">
                            #{rankNum} IN CLASSIFICA
                          </span>
                          <span className="text-xs sm:text-sm bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg">
                            {t.division}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                          {isSelectedBBA 
                            ? (lang === 'it' ? 'Self-Scouting Ufficiale BBA • Dati Ibridi FIP + Supabase' : 'Official BBA Self-Scouting • Hybrid FIP + Supabase Data Model')
                            : `${t.scoutProfileSubtitle} • ${currentRoster.length} ${t.trackedPlayers}`}
                        </p>
                      </div>

                      {/* Continuity badge in header */}
                      {continuityPct != null && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs">
                          <Users className="w-5 h-5 text-[#0CA17A]" />
                          <div>
                            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 block">
                              {(t.statContinuity || 'CONTINUITÀ {season}').replace('{season}', activeSeasonInfo.prevShort)}
                            </span>
                            <span className="font-mono text-base sm:text-lg font-extrabold text-[#0CA17A]">
                              {continuityPct}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team Stats Strip - 5 Primary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-4 border-t border-slate-100">
                      {/* 1. Record */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl text-center border border-slate-100 flex flex-col justify-between">
                        <div>
                          <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] block">
                            {won}W - {lost}L
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">
                            {t.statRecord}
                          </span>
                        </div>
                      </div>

                      {/* 2. Punti Segnati / Gara + Volatility Index Badge */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl text-center border border-slate-100 flex flex-col justify-between">
                        <div>
                          <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0CA17A] block">
                            {teamPpg} <span className="text-xs sm:text-sm font-sans font-bold text-slate-400">PTS/G</span>
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">
                            {t.statPtsScored || 'PUNTI SEGNATI / GARA'}
                          </span>
                        </div>
                        {volatilityMetric && (
                          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-center">
                            <span 
                              className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-2xs ${volatilityMetric.badgeColor}`}
                              title={volatilityMetric.badgeDesc}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${volatilityMetric.dotColor}`} />
                              <span>{volatilityMetric.badgeText}</span>
                              <span className="font-mono text-[9px] font-black opacity-80">(σ {volatilityMetric.stdDev})</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 3. Punti Subiti / Gara */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl text-center border border-slate-100 flex flex-col justify-between">
                        <div>
                          <span className="font-mono text-3xl sm:text-4xl font-extrabold text-rose-600 block">
                            {teamOppPpg} <span className="text-xs sm:text-sm font-sans font-bold text-slate-400">PTS/G</span>
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">
                            {t.statPtsConceded || 'PUNTI SUBITI / GARA'}
                          </span>
                        </div>
                      </div>

                      {/* 4. Differenziale (+/-) */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl text-center border border-slate-100 flex flex-col justify-between">
                        <div>
                          <span className={`font-mono text-3xl sm:text-4xl font-extrabold block ${Number(diffVal) > 0 ? 'text-[#0CA17A]' : (Number(diffVal) < 0 ? 'text-rose-600' : 'text-[#022D32]')}`}>
                            {Number(diffVal) > 0 ? `+${diffVal}` : diffVal}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">
                            {t.statDiff}
                          </span>
                        </div>
                      </div>

                      {/* 5. Roster Continuity */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl text-center border border-slate-100 col-span-2 sm:col-span-1 flex flex-col justify-between">
                        <div>
                          <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] block">
                            {continuityPct != null ? `${continuityPct}%` : '—'}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">
                            ROSTER RETENTION
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ===================================================================== */}
              {/* SUB-NAVIGATION TABS: ROSTER & STATISTICHE vs ANALISI & TREND          */}
              {/* ===================================================================== */}
              <div className="flex items-center gap-2.5 border-b border-[#DDF3E9] pb-2">
                <button
                  type="button"
                  onClick={() => setTeamDetailTab('roster')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                    teamDetailTab === 'roster'
                      ? 'bg-[#022D32] text-white shadow-md'
                      : 'bg-white text-[#022D32] hover:bg-[#F8F9FA] border border-[#DDF3E9]'
                  }`}
                >
                  <Users className={`w-4 h-4 ${teamDetailTab === 'roster' ? 'text-[#0CA17A]' : 'text-[#022D32]/60'}`} />
                  <span>{t.tabRoster || 'ROSTER & STATISTICHE'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTeamDetailTab('trends')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                    teamDetailTab === 'trends'
                      ? 'bg-[#022D32] text-white shadow-md'
                      : 'bg-white text-[#022D32] hover:bg-[#F8F9FA] border border-[#DDF3E9]'
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 ${teamDetailTab === 'trends' ? 'text-[#0CA17A]' : 'text-[#022D32]/60'}`} />
                  <span>{t.tabTrends || 'ANALISI & TREND'}</span>
                </button>
              </div>

              {/* TAB 1: ROSTER & STATISTICHE (KEY MATCHUPS + ROSTER TABLE) */}
              {teamDetailTab === 'roster' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Automated Scouting Summary / Key Matchups */}
                  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#DDF3E9] shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#DDF3E9] flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-[#0CA17A]" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                            {t.scoutingSummaryTitle || 'SCOUTING SUMMARY / KEY MATCHUPS'}
                          </h3>
                          <p className="text-xs sm:text-sm text-[#022D32]/75 font-medium">
                            {t.scoutingSummarySubtitle || 'Ruoli e pericoli tattici calcolati sulle statistiche effettive in questa squadra (Team Scope)'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setShowLegendModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] hover:bg-[#DDF3E9] border border-[#DDF3E9] text-[#022D32] text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-[#0CA17A]" />
                          <span>{t.legendBtn || 'Legenda Tag'}</span>
                        </button>
                        <span className="text-xs font-mono font-black text-[#022D32] bg-[#DDF3E9] px-3 py-1 rounded-lg border border-[#0CA17A]/40">
                          {teamTacticalGroups.length} {t.activeCategories || 'CATEGORIE ATTIVE'}
                        </span>
                      </div>
                    </div>

                    {teamTacticalGroups.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {teamTacticalGroups.map(({ config: tag, players }) => (
                          <div 
                            key={tag.id}
                            className={`p-4 rounded-2xl border ${tag.badgeClass} flex flex-col justify-between space-y-3 shadow-xs`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <TacticalTagIcon id={tag.id} className="w-5 h-5 flex-none" />
                                <span className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#022D32]">
                                  {lang === 'it' ? tag.labelIt : tag.label}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold bg-white border border-[#DDF3E9] px-2.5 py-0.5 rounded text-[#022D32]">
                                {players.length}
                              </span>
                            </div>

                            {/* Player Badges - FULL NAMES ALWAYS DISPLAYED */}
                            <div className="flex flex-wrap gap-2 pt-1.5">
                              {players.map(p => (
                                <button
                                  key={p.fid}
                                  type="button"
                                  onClick={() => setSelectedPlayer(p)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F9FA] border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                                  title={`Apri profilo ${p.name}`}
                                >
                                  <span className="text-[#065F46] font-mono font-black text-xs sm:text-sm">#{p.number}</span>
                                  <span className="font-bold text-[#022D32] whitespace-nowrap">{p.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DDF3E9] text-xs sm:text-sm text-[#022D32]/70 text-center italic font-medium">
                        {t.noTeamThreats || 'Nessun giocatore avversario supera le soglie estreme di volume per i tag tattici primari.'}
                      </div>
                    )}
                  </div>

                  {/* Roster Table Card */}
                  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                            {t.rosterTitle} ({filteredRoster.length} {t.playersCount})
                          </h3>
                          {isSelectedBBA && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {lang === 'it' ? 'FIP VERIFIED • MODELLO IBRIDO (FIP + SUPABASE)' : 'FIP VERIFIED • HYBRID MODEL (FIP + SUPABASE)'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                          {isSelectedBBA 
                            ? (lang === 'it' ? 'Roster ufficiale BBA: statistiche di tiro e minuti FIP integrate con playmaking e rimbalzi proprietari Supabase.' : 'Official BBA Roster: FIP shooting and minutes integrated with proprietary Supabase playmaking and rebounding.')
                            : t.rosterSubtitle}
                        </p>
                      </div>

                      {/* Filter Search Bar */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder={t.searchPlayer}
                            value={rosterSearch}
                            onChange={(e) => setRosterSearch(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-[#022D32] placeholder-slate-400 focus:outline-none focus:border-[#0CA17A] w-52 sm:w-64 font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Roster Table with Clickable Column Headers */}
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse font-sans">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[11px] sm:text-xs tracking-wider select-none">
                            <th 
                              onClick={() => handleSort('number')}
                              className={`p-3.5 sm:p-4 w-14 text-center cursor-pointer transition-colors group ${sortConfig.key === 'number' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                              title="Ordina per Numero di maglia"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>{t.colNumber || '#'}</span>
                                <span className={`inline-flex items-center ${sortConfig.key === 'number' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                  {sortConfig.key === 'number' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                            </th>

                            <th 
                              onClick={() => handleSort('name')}
                              className={`p-3.5 sm:p-4 min-w-[240px] text-left cursor-pointer transition-colors group ${sortConfig.key === 'name' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                              title="Ordina per Nome giocatore"
                            >
                              <div className="flex items-center justify-start gap-1.5">
                                <span>{t.colNamePos || 'NOME & RUOLO'}</span>
                                <span className={`inline-flex items-center ${sortConfig.key === 'name' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                  {sortConfig.key === 'name' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                            </th>

                            <th 
                              onClick={() => handleSort('games')}
                              className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'games' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                              title="Ordina per Partite Giocate (GP)"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>{t.colGp || 'GP'}</span>
                                <span className={`inline-flex items-center ${sortConfig.key === 'games' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                  {sortConfig.key === 'games' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                            </th>

                            <th 
                              onClick={() => handleSort('timePlayedAVG')}
                              className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'timePlayedAVG' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                              title="Ordina per Media Minuti Giocati (MM:SS)"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>{t.colMin || 'MIN'}</span>
                                <span className={`inline-flex items-center ${sortConfig.key === 'timePlayedAVG' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                  {sortConfig.key === 'timePlayedAVG' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                            </th>

                            {/* QUINTETTO % (START %) COLUMN */}
                            <th 
                              onClick={() => handleSort('startPercentage')}
                              className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'startPercentage' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                              title="Ordina per Percentuale di Partenza in Quintetto (START %)"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>{t.colStartPct || 'START %'}</span>
                                <span className={`inline-flex items-center ${sortConfig.key === 'startPercentage' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                  {sortConfig.key === 'startPercentage' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                            </th>

                            <th 
                              onClick={() => handleSort('pointsPerGame')}
                              className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'pointsPerGame' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                              title="Ordina per Punti a Partita (PTS/G)"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>{t.colPpg || 'PTS/G'}</span>
                                <span className={`inline-flex items-center ${sortConfig.key === 'pointsPerGame' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                  {sortConfig.key === 'pointsPerGame' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                            </th>

                            {isSelectedBBA ? (
                              <>
                                {/* 2PT F/P */}
                                <th 
                                  onClick={() => handleSort('twoMadeAVG')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'twoMadeAVG' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Volume: 2 Punti Fatti per Partita (2PT F/P)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>2PT F/P</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'twoMadeAVG' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'twoMadeAVG' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* 2PT% */}
                                <th 
                                  onClick={() => handleSort('twoPct')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'twoPct' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Efficienza: Percentuale da 2 Punti (2PT %)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>2PT %</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'twoPct' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'twoPct' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* 3PT F/P */}
                                <th 
                                  onClick={() => handleSort('threeMadeAVG')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'threeMadeAVG' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Volume: 3 Punti Fatti per Partita (3PT F/P)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>3PT F/P</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'threeMadeAVG' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'threeMadeAVG' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* 3PT% */}
                                <th 
                                  onClick={() => handleSort('threePct')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'threePct' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Efficienza: Percentuale da 3 Punti (3PT %)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>3PT %</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'threePct' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'threePct' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* TL T/P */}
                                <th 
                                  onClick={() => handleSort('ftAttAvg')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'ftAttAvg' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Volume: Tiri Liberi Tentati per Partita (TL T/P)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>TL T/P</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'ftAttAvg' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'ftAttAvg' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* TL % */}
                                <th 
                                  onClick={() => handleSort('ftPct')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'ftPct' || sortConfig.key === 'freeThrowsPercentage' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Realizzazione: Percentuale Tiri Liberi (TL %)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>TL %</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'ftPct' || sortConfig.key === 'freeThrowsPercentage' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* AST/G (Supabase) */}
                                <th 
                                  onClick={() => handleSort('astAvg')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'astAvg' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Supabase: Media Assist a Partita (AST/G)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.colAst || 'AST/G'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'astAvg' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'astAvg' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* REB/G (Supabase) */}
                                <th 
                                  onClick={() => handleSort('rebAvg')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'rebAvg' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Supabase: Media Rimbalzi a Partita (REB/G)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.colReb || 'REB/G'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'rebAvg' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'rebAvg' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* TOV/G (Supabase) */}
                                <th 
                                  onClick={() => handleSort('tovAvg')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'tovAvg' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Supabase: Media Palle Perse a Partita (TOV/G)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.colTov || 'TOV/G'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'tovAvg' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'tovAvg' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                {/* AST/TOV (Supabase) */}
                                <th 
                                  onClick={() => handleSort('astTovRatio')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'astTovRatio' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Supabase: Rapporto Assist / Palle Perse (AST/TOV)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.colRatio || 'AST/TOV'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'astTovRatio' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'astTovRatio' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                <th className="p-3.5 sm:p-4 text-left min-w-[130px]">{lang === 'it' ? 'TAG TATTICI' : 'TACTICAL TAGS'}</th>
                              </>
                            ) : (
                              <>
                                <th 
                                  onClick={() => handleSort('twoMadePerGame')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'twoMadePerGame' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Ordina per Canestri da 2 Segnati a Partita (2PM/G)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.col2pm || '2PM/G'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'twoMadePerGame' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'twoMadePerGame' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                <th 
                                  onClick={() => handleSort('threeMadePerGame')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'threeMadePerGame' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Ordina per Triple Segnate a Partita (3PM/G)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.col3pm || '3PM/G'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'threeMadePerGame' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'threeMadePerGame' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                <th 
                                  onClick={() => handleSort('freeThrowsPercentage')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'freeThrowsPercentage' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Ordina per Percentuale ai Tiri Liberi (FT%)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.colFt || 'FT%'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'freeThrowsPercentage' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'freeThrowsPercentage' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                <th 
                                  onClick={() => handleSort('foulsAVG')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'foulsAVG' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Ordina per Falli Commessi a Partita (FF/P)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.colFouls || 'FF/P'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'foulsAVG' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'foulsAVG' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                <th 
                                  onClick={() => handleSort('plusMinus')}
                                  className={`p-3.5 sm:p-4 text-center cursor-pointer transition-colors group ${sortConfig.key === 'plusMinus' ? 'text-[#022D32] font-black bg-slate-100/90' : 'text-slate-500 hover:text-[#0CA17A]'}`}
                                  title="Ordina per Plus / Minus (+/-)"
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{t.colPlusMinus || '+/-'}</span>
                                    <span className={`inline-flex items-center ${sortConfig.key === 'plusMinus' ? 'text-[#0CA17A]' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`}>
                                      {sortConfig.key === 'plusMinus' && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  </div>
                                </th>

                                <th className="p-3.5 sm:p-4 text-left min-w-[130px]">{t.colAlerts || 'ALERT'}</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DDF3E9]/80">
                          {filteredRoster.length === 0 ? (
                            <tr>
                              <td colSpan={isSelectedBBA ? 14 : 12} className="p-8 text-center text-[#022D32]/60">
                                <User className="w-8 h-8 text-[#022D32]/30 mx-auto mb-2 opacity-50" />
                                <p className="font-bold text-[#022D32]">{t.noPlayersTitle}</p>
                                <p className="text-xs text-[#022D32]/60 mt-1">
                                  {rosterSearch.trim() ? `${t.noPlayersSearch} "${rosterSearch}"` : t.noPlayersDesc}
                                </p>
                              </td>
                            </tr>
                          ) : (
                            filteredRoster.map((p, pIdx) => {
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

                              const startPctNum = parseInt(p.startPercentage || 0, 10);

                              return (
                                <tr
                                  key={p.fid}
                                  onClick={() => setSelectedPlayer(p)}
                                  className={`${pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-[#0CA17A]/5 cursor-pointer transition-colors border-b border-slate-100/60`}
                                >
                                  <td className="p-3.5 sm:p-4 text-center font-mono font-black text-[#022D32] text-sm sm:text-base">
                                    #{p.number}
                                  </td>
                                  <td className="p-3.5 sm:p-4 min-w-[240px]">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-[#022D32] text-sm sm:text-base">{p.name}</span>
                                        {p.captain && (
                                          <span className="text-[10px] sm:text-xs font-black uppercase bg-slate-100 text-[#022D32] border border-slate-200 px-2 py-0.5 rounded">
                                            CAP
                                          </span>
                                        )}
                                        {isSelectedBBA && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title={lang === 'it' ? 'Verificato su tabellino ufficiale FIP' : 'Verified on official FIP boxscore'}>
                                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                            {t.fipVerifiedPill || 'FIP VERIFIED'}
                                          </span>
                                        )}
                                      </div>
                                      {p.position && p.position.trim() && p.position.trim().toLowerCase() !== 'player' && (
                                        <span className="text-xs text-slate-500 font-semibold">{p.position}</span>
                                      )}

                                      {/* Compact Multi-Level Tactical Tags Breakdown */}
                                      <div className="flex items-center gap-2 mt-0.5 text-xs font-mono select-none flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 text-[#022D32]">
                                          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight">Team:</span>
                                          {teamTags.length > 0 ? (
                                            <span className="inline-flex items-center gap-1.5">
                                              {teamTags.map(t => (
                                                <span 
                                                  key={t.id}
                                                  title={`Team: ${lang === 'it' ? t.labelIt : t.label}`}
                                                  className="cursor-help hover:scale-125 transition-transform inline-flex items-center"
                                                >
                                                  <TacticalTagIcon id={t.id} className="w-3.5 h-3.5 text-[#022D32]" />
                                                </span>
                                              ))}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300 font-sans text-xs">—</span>
                                          )}
                                        </span>

                                        <span className="text-slate-200 text-xs">|</span>

                                        <span className="inline-flex items-center gap-1.5 text-[#022D32]">
                                          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight">Season:</span>
                                          {seasonTags.length > 0 ? (
                                            <span className="inline-flex items-center gap-1.5">
                                              {seasonTags.map(t => (
                                                <span 
                                                  key={t.id}
                                                  title={`Season: ${lang === 'it' ? t.labelIt : t.label}`}
                                                  className="cursor-help hover:scale-125 transition-transform inline-flex items-center"
                                                >
                                                  <TacticalTagIcon id={t.id} className="w-3.5 h-3.5 text-[#022D32]" />
                                                </span>
                                              ))}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300 font-sans text-xs">—</span>
                                          )}
                                        </span>

                                        <span className="text-slate-200 text-xs">|</span>

                                        <span className="inline-flex items-center gap-1.5 text-[#022D32]">
                                          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight">Career:</span>
                                          {careerTags.length > 0 ? (
                                            <span className="inline-flex items-center gap-1.5">
                                              {careerTags.map(t => (
                                                <span 
                                                  key={t.id}
                                                  title={`Career: ${lang === 'it' ? t.labelIt : t.label}`}
                                                  className="cursor-help hover:scale-125 transition-transform inline-flex items-center"
                                                >
                                                  <TacticalTagIcon id={t.id} className="w-3.5 h-3.5 text-[#022D32]" />
                                                </span>
                                              ))}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300 font-sans text-xs">—</span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-[#022D32] text-sm sm:text-base">
                                    {p.games}
                                  </td>
                                  <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-[#022D32] text-sm sm:text-base">
                                    {formatMinutes(p.timePlayedAVG || p.stats?.timePlayedAVG)}
                                  </td>
                                  {/* QUINTETTO % CELL */}
                                  <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-xs sm:text-sm">
                                    <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold ${
                                      startPctNum >= 80 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : startPctNum >= 50
                                          ? 'bg-slate-100 text-[#022D32]'
                                          : 'text-slate-400'
                                    }`}>
                                      {p.startPercentage || '0%'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 sm:p-4 text-center font-mono font-black text-[#022D32] text-sm sm:text-base">
                                    {p.pointsAVG != null ? p.pointsAVG.toFixed(1) : '0.0'}
                                  </td>

                                  {isSelectedBBA ? (
                                    <>
                                      {/* 2PT F/P (Volume) */}
                                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                                        {formatAverage(p.twoMadeAVG)}
                                      </td>

                                      {/* 2PT % (Efficiency) */}
                                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {formatPercentage(p.twoPct)}
                                      </td>

                                      {/* 3PT F/P (Volume) */}
                                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                                        {formatAverage(p.threeMadeAVG)}
                                      </td>

                                      {/* 3PT % (Efficiency) */}
                                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {formatPercentage(p.threePct)}
                                      </td>

                                      {/* TL T/P (Volume Tentati) */}
                                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium" title={p.ftAtt ? `${p.ftAtt} TL tentati totali (${p.ftMade || 0} realizzati)` : undefined}>
                                        <div className="flex flex-col items-center">
                                          <span>{formatAverage(p.ftAttAvg)}</span>
                                          {p.ftAtt > 0 && (
                                            <span className="text-[10px] text-gray-400 font-normal">
                                              ({p.ftAtt} tot)
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* TL % (Realizzazione) */}
                                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {formatPercentage(p.ftPct)}
                                      </td>

                                      {/* AST/G (Supabase) */}
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-xs sm:text-sm">
                                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold ${
                                          p.astAvg != null && p.astAvg >= 2.5 
                                            ? 'bg-emerald-50 text-emerald-700' 
                                            : 'text-[#022D32]'
                                        }`}>
                                          {p.astAvg != null ? p.astAvg.toFixed(1) : '—'}
                                        </span>
                                      </td>

                                      {/* REB/G (Supabase) */}
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-xs sm:text-sm">
                                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold ${
                                          p.rebAvg != null && p.rebAvg >= 5.0 
                                            ? 'bg-emerald-50 text-emerald-700' 
                                            : 'text-[#022D32]'
                                        }`}>
                                          {p.rebAvg != null ? p.rebAvg.toFixed(1) : '—'}
                                        </span>
                                      </td>

                                      {/* TOV/G (Supabase) */}
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-xs sm:text-sm">
                                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold ${
                                          p.tovAvg != null && p.tovAvg >= 3.0 
                                            ? 'bg-rose-50 text-rose-700' 
                                            : 'text-[#022D32]'
                                        }`}>
                                          {p.tovAvg != null ? p.tovAvg.toFixed(1) : '—'}
                                        </span>
                                      </td>

                                      {/* AST/TOV (Supabase) */}
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-xs sm:text-sm">
                                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold ${
                                          p.astTovRatio != null && p.astTovRatio >= 1.5 
                                            ? 'bg-emerald-50 text-emerald-700' 
                                            : p.astTovRatio != null && p.astTovRatio >= 1.0
                                              ? 'bg-slate-100 text-[#022D32]'
                                              : p.astTovRatio != null && p.astTovRatio > 0
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'text-slate-400'
                                        }`}>
                                          {p.astTovRatio != null ? p.astTovRatio.toFixed(2) : '—'}
                                        </span>
                                      </td>

                                      {/* TAG TATTICI */}
                                      <td className="p-3.5 sm:p-4">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {teamTags.length > 0 ? (
                                            teamTags.slice(0, 2).map(tag => (
                                              <span 
                                                key={tag.id}
                                                className={`text-xs font-bold px-2 py-1 rounded-lg border ${tag.badgeClass} flex items-center gap-1.5 shadow-xs`}
                                                title={lang === 'it' ? tag.labelIt : tag.label}
                                              >
                                                <TacticalTagIcon id={tag.id} className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">{lang === 'it' ? tag.labelIt : tag.label}</span>
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-xs text-slate-300 font-mono">—</span>
                                          )}
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-[#022D32] text-sm sm:text-base">
                                        {p.twoMadeAVG != null ? p.twoMadeAVG.toFixed(1) : '0.0'}
                                      </td>
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-[#022D32] text-sm sm:text-base">
                                        {p.threeMadeAVG != null ? p.threeMadeAVG.toFixed(1) : '0.0'}
                                      </td>
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-[#022D32] text-sm sm:text-base">
                                        {p.ftPct ? `${p.ftPct}%` : '—'}
                                      </td>
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-xs sm:text-sm">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                                          isFoulTarget ? 'bg-rose-50 text-rose-700 font-black' : 'text-[#022D32]'
                                        }`}>
                                          {p.foulsAVG != null ? p.foulsAVG.toFixed(1) : '0.0'}
                                        </span>
                                      </td>
                                      <td className="p-3.5 sm:p-4 text-center font-mono font-black text-xs sm:text-sm">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                                          p.plusMinusAVG > 0 
                                            ? 'bg-emerald-50 text-emerald-700 font-black' 
                                            : p.plusMinusAVG < 0 
                                              ? 'bg-rose-50 text-rose-700 font-black' 
                                              : 'text-slate-400'
                                        }`}>
                                          {p.plusMinusAVG > 0 ? `+${p.plusMinusAVG.toFixed(1)}` : (p.plusMinusAVG != null ? p.plusMinusAVG.toFixed(1) : '0.0')}
                                        </span>
                                      </td>
                                      <td className="p-3.5 sm:p-4">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {teamTags.length > 0 ? (
                                            teamTags.slice(0, 2).map(tag => (
                                              <span 
                                                key={tag.id}
                                                className={`text-xs font-bold px-2 py-1 rounded-lg border ${tag.badgeClass} flex items-center gap-1.5 shadow-xs`}
                                                title={lang === 'it' ? tag.labelIt : tag.label}
                                              >
                                                <TacticalTagIcon id={tag.id} className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">{lang === 'it' ? tag.labelIt : tag.label}</span>
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-xs text-slate-300 font-mono">—</span>
                                          )}
                                        </div>
                                      </td>
                                    </>
                                  )}
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

              {/* TAB 2: DEDICATED "ANALISI & TREND" TEAM MODULE */}
              {teamDetailTab === 'trends' && (() => {
                const trends = currentTrends || {
                  global: { games: 0, pointsScored: 0, pointsConceded: 0, wins: 0, losses: 0 },
                  home: { games: 0, pointsScored: 0, pointsConceded: 0, wins: 0, losses: 0 },
                  away: { games: 0, pointsScored: 0, pointsConceded: 0, wins: 0, losses: 0 },
                  quarters: { Q1: { scored: 0, conceded: 0 }, Q2: { scored: 0, conceded: 0 }, Q3: { scored: 0, conceded: 0 }, Q4: { scored: 0, conceded: 0 } },
                  quarterAverages: {},
                  streak: [],
                  log: []
                };

                const streak = Array.isArray(trends.streak) ? trends.streak : [];
                const streakWins = streak.filter(s => s === 'V' || s === 'W').length;
                const streakLosses = streak.filter(s => s === 'P' || s === 'L').length;

                const homeStats = trends.home || { games: 0, pointsScored: 0, pointsConceded: 0, wins: 0, losses: 0 };
                const awayStats = trends.away || { games: 0, pointsScored: 0, pointsConceded: 0, wins: 0, losses: 0 };
                const homeDiff = homeStats.games > 0 ? Number(((homeStats.pointsScored - homeStats.pointsConceded) / homeStats.games).toFixed(1)) : 0;
                const awayDiff = awayStats.games > 0 ? Number(((awayStats.pointsScored - awayStats.pointsConceded) / awayStats.games).toFixed(1)) : 0;

                const quarterAverages = trends.quarterAverages || {};
                const g = trends.global?.games || 0;
                const matchLog = Array.isArray(trends.log) ? trends.log : [];

                return (
                  <div className="space-y-8 animate-fade-in">
                    {/* SECTION 1: PANORAMICA & MOMENTUM (CSS Grid 3 cols, independent floating white cards) */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#022D32] flex items-center gap-2">
                          <Flame className="w-4 h-4 text-[#0CA17A]" />
                          {t.trendsOverviewTitle || 'PANORAMICA & MOMENTUM'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {lang === 'it' 
                            ? 'Striscia recente, consistenza offensiva e variazione tra primo e secondo tempo'
                            : 'Recent streak, offensive volatility index, and second half progression'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                        {/* 1A. Forma Attuale / Striscia */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                              {t.streakTitle || 'FORMA ATTUALE / STRISCIA'}
                            </span>
                            {streak.length > 0 && (
                              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {streakWins}V - {streakLosses}P
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32]">
                              {streak.length > 0 ? `${Math.round((streakWins / streak.length) * 100)}%` : '—'}
                            </div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mt-1">
                              {lang === 'it' ? `Vittorie ultime ${streak.length} gare` : `Win rate last ${streak.length} games`}
                            </span>
                          </div>

                          {streak.length > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                              {streak.map((res, sIdx) => {
                                const isWin = res === 'V' || res === 'W';
                                return (
                                  <span
                                    key={sIdx}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                                      isWin ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}
                                    title={isWin ? 'Vittoria' : 'Sconfitta'}
                                  >
                                    {isWin ? 'V' : 'P'}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic font-medium">{t.noGames || 'Nessuna gara registrata'}</p>
                          )}
                        </div>

                        {/* 1B. Indice di Volatilità (σ) */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                              {t.volatilityIndex || 'INDICE DI VOLATILITÀ (σ)'}
                            </span>
                            {volatilityMetric && (
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                volatilityMetric.stdDev < 7 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : volatilityMetric.stdDev <= 12 
                                    ? 'bg-amber-50 text-amber-700' 
                                    : 'bg-rose-50 text-rose-700'
                              }`}>
                                {volatilityMetric.badgeText}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32]">
                              {volatilityMetric ? `σ ${volatilityMetric.stdDev}` : '—'}
                            </div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mt-1">
                              {lang === 'it' ? 'Deviazione standard punti segnati' : 'Points standard deviation'}
                            </span>
                          </div>

                          {volatilityMetric ? (
                            <div className="pt-2 border-t border-slate-100">
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                {volatilityMetric.badgeDesc} • Media: <strong className="font-mono text-[#022D32]">{volatilityMetric.mean}</strong> pts
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic font-medium">{t.noGames || 'Nessuna gara registrata'}</p>
                          )}
                        </div>

                        {/* 1C. Delta 2° Tempo vs 1° Tempo */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                              {t.halvesDiffDelta || 'DELTA 2°T vs 1°T'}
                            </span>
                            {halvesData && (
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                halvesData.verdictType === 'fade'
                                  ? 'bg-rose-50 text-rose-700'
                                  : halvesData.verdictType === 'strong'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-700'
                              }`}>
                                {halvesData.verdictType === 'fade' ? (
                                  <>
                                    <AlertTriangle className="w-3 h-3 text-rose-600 flex-none" />
                                    <span>{t.halvesFade || 'Calo Fisico'}</span>
                                  </>
                                ) : halvesData.verdictType === 'strong' ? (
                                  <>
                                    <Zap className="w-3 h-3 text-emerald-600 flex-none" />
                                    <span>{t.halvesStrong || 'Progressione'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Scale className="w-3 h-3 text-slate-600 flex-none" />
                                    <span>{t.halvesBalanced || 'Costante'}</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className={`font-mono text-3xl sm:text-4xl font-extrabold ${
                              halvesData 
                                ? (halvesData.diffDelta > 0 ? 'text-[#0CA17A]' : halvesData.diffDelta < 0 ? 'text-rose-600' : 'text-[#022D32]')
                                : 'text-[#022D32]'
                            }`}>
                              {halvesData ? (halvesData.diffDelta > 0 ? `+${halvesData.diffDelta}` : halvesData.diffDelta) : '—'}
                              <span className="text-sm font-sans font-bold text-slate-400 ml-1.5">PTS</span>
                            </div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mt-1">
                              {lang === 'it' ? 'Scarto differenziale ripresa' : 'Second half net swing'}
                            </span>
                          </div>

                          {halvesData ? (
                            <div className="pt-2 border-t border-slate-100">
                              <p className="text-xs text-slate-500 font-medium leading-relaxed truncate" title={
                                halvesData.verdictType === 'fade' 
                                  ? (t.halvesFadeDesc || 'La squadra cala significativamente di intensità nella seconda frazione.') 
                                  : halvesData.verdictType === 'strong' 
                                    ? (t.halvesStrongDesc || 'Squadra diesel che aumenta efficienza ed intensità nei quarti finali.') 
                                    : (t.halvesBalancedDesc || 'Produzione e differenziale stabili tra primo e secondo tempo.')
                              }>
                                {halvesData.verdictType === 'fade' 
                                  ? (t.halvesFadeDesc || 'Cala di intensità nella ripresa.') 
                                  : halvesData.verdictType === 'strong' 
                                    ? (t.halvesStrongDesc || 'Aumenta efficienza nei quarti finali.') 
                                    : (t.halvesBalancedDesc || 'Produzione stabile tra primo e secondo tempo.')}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic font-medium">{t.noGames || 'Nessuna gara registrata'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: CONFRONTO RENDIMENTO & AMBIENTE (CASA / TRASFERTA) */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#022D32] flex items-center gap-2">
                          <Home className="w-4 h-4 text-[#0CA17A]" />
                          {t.splitsTitle || 'CONFRONTO RENDIMENTO & AMBIENTE'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {lang === 'it' ? 'Spaccato comparativo tra partite casalinghe e trasferte' : 'Comparative performance between home and away games'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {/* Casa */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Home className="w-5 h-5 text-[#0CA17A]" />
                              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#022D32]">
                                {t.home || 'CASA'}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {homeStats.games} {homeStats.games === 1 ? (lang === 'it' ? 'partita' : 'game') : (lang === 'it' ? 'partite' : 'games')}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-1">
                            <div>
                              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#022D32] block">
                                {homeStats.wins}W - {homeStats.losses}L
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                RECORD
                              </span>
                            </div>
                            <div>
                              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0CA17A] block">
                                {homeStats.games > 0 ? (homeStats.pointsScored / homeStats.games).toFixed(1) : '—'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                SEGNATI/G
                              </span>
                            </div>
                            <div>
                              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 block">
                                {homeStats.games > 0 ? (homeStats.pointsConceded / homeStats.games).toFixed(1) : '—'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                SUBITI/G
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {lang === 'it' ? 'Differenziale Medio' : 'Average Margin'}
                            </span>
                            <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                              homeDiff > 0 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : homeDiff < 0 
                                  ? 'bg-rose-50 text-rose-700' 
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {homeDiff > 0 ? `+${homeDiff}` : homeDiff} pts
                            </span>
                          </div>
                        </div>

                        {/* Trasferta */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Navigation className="w-5 h-5 text-[#0CA17A]" />
                              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#022D32]">
                                {t.away || 'TRASFERTA'}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {awayStats.games} {awayStats.games === 1 ? (lang === 'it' ? 'partita' : 'game') : (lang === 'it' ? 'partite' : 'games')}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-1">
                            <div>
                              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#022D32] block">
                                {awayStats.wins}W - {awayStats.losses}L
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                RECORD
                              </span>
                            </div>
                            <div>
                              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0CA17A] block">
                                {awayStats.games > 0 ? (awayStats.pointsScored / awayStats.games).toFixed(1) : '—'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                SEGNATI/G
                              </span>
                            </div>
                            <div>
                              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 block">
                                {awayStats.games > 0 ? (awayStats.pointsConceded / awayStats.games).toFixed(1) : '—'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                SUBITI/G
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {lang === 'it' ? 'Differenziale Medio' : 'Average Margin'}
                            </span>
                            <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                              awayDiff > 0 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : awayDiff < 0 
                                  ? 'bg-rose-50 text-rose-700' 
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {awayDiff > 0 ? `+${awayDiff}` : awayDiff} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: TENUTA FISICA (1° TEMPO vs 2° TEMPO) */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#022D32] flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#0CA17A]" />
                          {t.halvesTitle || '1° TEMPO vs 2° TEMPO (TENUTA FISICA)'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {t.halvesSubtitle || 'Analisi tenuta atletica, cali di concentrazione e progressione di rendimento'}
                        </p>
                      </div>

                      {halvesData ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            {/* 1° Tempo (Q1 + Q2) */}
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-5 h-5 text-[#0CA17A]" />
                                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#022D32]">
                                    {t.firstHalf || '1° TEMPO (Q1+Q2)'}
                                  </span>
                                </div>
                                <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                                  halvesData.h1Diff > 0 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : halvesData.h1Diff < 0 
                                      ? 'bg-rose-50 text-rose-700' 
                                      : 'bg-slate-100 text-slate-700'
                                }`}>
                                  Diff: {halvesData.h1Diff > 0 ? `+${halvesData.h1Diff}` : halvesData.h1Diff}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0CA17A] block">
                                    {halvesData.h1ScoredAvg}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                    SEGNATI / 1°T
                                  </span>
                                </div>
                                <div>
                                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 block">
                                    {halvesData.h1ConcededAvg}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                    SUBITI / 1°T
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 2° Tempo (Q3 + Q4) */}
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Flame className="w-5 h-5 text-[#0CA17A]" />
                                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#022D32]">
                                    {t.secondHalf || '2° TEMPO (Q3+Q4)'}
                                  </span>
                                </div>
                                <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                                  halvesData.h2Diff > 0 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : halvesData.h2Diff < 0 
                                      ? 'bg-rose-50 text-rose-700' 
                                      : 'bg-slate-100 text-slate-700'
                                }`}>
                                  Diff: {halvesData.h2Diff > 0 ? `+${halvesData.h2Diff}` : halvesData.h2Diff}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0CA17A] block">
                                    {halvesData.h2ScoredAvg}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                    SEGNATI / 2°T
                                  </span>
                                </div>
                                <div>
                                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 block">
                                    {halvesData.h2ConcededAvg}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                                    SUBITI / 2°T
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tactical Takeaway Pill */}
                          <div className={`p-4 rounded-2xl flex items-start gap-3 shadow-sm border ${
                            halvesData.verdictType === 'fade'
                              ? 'bg-rose-50/60 border-rose-100 text-rose-900'
                              : halvesData.verdictType === 'strong'
                                ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
                                : 'bg-white border-slate-100 text-[#022D32]'
                          }`}>
                            <Info className={`w-4 h-4 mt-0.5 flex-none ${
                              halvesData.verdictType === 'fade' 
                                ? 'text-rose-600' 
                                : halvesData.verdictType === 'strong' 
                                  ? 'text-emerald-600' 
                                  : 'text-[#0CA17A]'
                            }`} />
                            <div className="space-y-0.5">
                              <p className="text-xs font-black uppercase tracking-wider">
                                {t.halvesDiffDelta || 'Differenziale 2°T vs 1°T'}: <span className="font-mono text-sm">{halvesData.diffDelta > 0 ? `+${halvesData.diffDelta}` : halvesData.diffDelta} pts</span>
                              </p>
                              <p className="text-xs opacity-90 leading-relaxed font-medium">
                                {halvesData.verdictType === 'fade'
                                  ? (t.halvesFadeDesc || "La squadra cala significativamente di intensità nella seconda frazione. Alzare il ritmo ed aggredire nella ripresa.")
                                  : halvesData.verdictType === 'strong'
                                    ? (t.halvesStrongDesc || "Squadra diesel che aumenta efficienza ed intensità nei quarti finali. Mantenere la concentrazione fino al 40°.")
                                    : (t.halvesBalancedDesc || "Produzione e differenziale stabili tra primo e secondo tempo.")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                          <p className="text-xs text-slate-400 italic font-medium">
                            {t.noGames || 'Nessuna gara disputata registrata a referto.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* SECTION 4: VISUAL ANALYTICS & TRAIETTORIE (CSS Grid 12 cols: 7 cols LineChart + 5 cols BarChart) */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#022D32] flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#0CA17A]" />
                          {t.visualAnalyticsTitle || 'VISUAL ANALYTICS & TRAIETTORIE'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {lang === 'it' 
                            ? 'Evoluzione punti partita per partita e margine medio per singolo quarto' 
                            : 'Chronological scoring trends and period net margins'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                        {/* 4A. LineChart (7 cols) */}
                        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-[#022D32] uppercase tracking-wider">
                                {t.gameTrendsTitle || 'TRAIETTORIA & TREND DI RENDIMENTO'}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {t.gameTrendsSubtitle || 'Evoluzione cronologica dei punti segnati vs punti subiti'}
                              </p>
                            </div>
                            {trendsLineData.length > 0 && (
                              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {trendsLineData.length} {trendsLineData.length === 1 ? (lang === 'it' ? 'partita' : 'game') : (lang === 'it' ? 'partite' : 'games')}
                              </span>
                            )}
                          </div>

                          {trendsLineData.length > 0 ? (
                            <div className="h-64 sm:h-72 w-full pt-1">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendsLineData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                  <XAxis 
                                    dataKey="round" 
                                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: '600' }} 
                                    stroke="#CBD5E1" 
                                  />
                                  <YAxis 
                                    domain={['auto', 'auto']} 
                                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: '600' }} 
                                    stroke="#CBD5E1" 
                                  />
                                  <Tooltip content={<CustomTrendTooltip />} />
                                  <Legend 
                                    iconType="circle" 
                                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold', color: '#022D32' }} 
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="scored" 
                                    name={t.scoredPoints || 'Punti Segnati'} 
                                    stroke="#0CA17A" 
                                    strokeWidth={3} 
                                    dot={{ r: 4.5, fill: '#0CA17A', stroke: '#FFFFFF', strokeWidth: 2 }} 
                                    activeDot={{ r: 6.5 }} 
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="conceded" 
                                    name={t.concededPoints || 'Punti Subiti'} 
                                    stroke="#E11D48" 
                                    strokeWidth={2.5} 
                                    strokeDasharray="4 4" 
                                    dot={{ r: 4, fill: '#E11D48', stroke: '#FFFFFF', strokeWidth: 1.5 }} 
                                    activeDot={{ r: 6 }} 
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic font-medium py-8 text-center">
                              {t.noGames || 'Nessuna gara disputata registrata a referto.'}
                            </p>
                          )}
                        </div>

                        {/* 4B. BarChart Differenziale per Quarto (5 cols) */}
                        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-[#022D32] uppercase tracking-wider">
                              {t.quartersTitle || 'ANALISI DEI QUARTI'}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {t.quartersSubtitle || 'Differenziale medio periodo per periodo (Q1 - Q4)'}
                            </p>
                          </div>

                          {quarterChartData.length > 0 && g > 0 ? (
                            <div className="space-y-4">
                              <div className="h-48 sm:h-52 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={quarterChartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis 
                                      dataKey="quarter" 
                                      tick={{ fill: '#022D32', fontSize: 11, fontWeight: '800' }} 
                                      stroke="#CBD5E1" 
                                    />
                                    <YAxis 
                                      tick={{ fill: '#64748B', fontSize: 10, fontWeight: '600' }} 
                                      stroke="#CBD5E1" 
                                    />
                                    <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1} strokeDasharray="2 2" />
                                    <Tooltip content={<CustomQuarterTooltip />} />
                                    <Bar dataKey="diff" radius={[6, 6, 0, 0]}>
                                      {quarterChartData.map((entry, index) => (
                                        <Cell 
                                          key={`cell-${index}`} 
                                          fill={entry.diff >= 0 ? '#0CA17A' : '#F43F5E'} 
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>

                              {/* 4-Column Quarter Summary Pill Row */}
                              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                                {['Q1', 'Q2', 'Q3', 'Q4'].map(qKey => {
                                  const qData = quarterAverages[qKey] || { scoredAvg: 0, concededAvg: 0, diff: 0 };
                                  const isPos = qData.diff > 0;
                                  const isNeg = qData.diff < 0;
                                  return (
                                    <div key={qKey} className="text-center">
                                      <span className="text-[11px] font-mono font-bold text-slate-400 block">{qKey}</span>
                                      <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md inline-block mt-0.5 ${
                                        isPos ? 'bg-emerald-50 text-emerald-700' : isNeg ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {isPos ? `+${qData.diff}` : qData.diff}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400 block mt-1">
                                        {qData.scoredAvg}/{qData.concededAvg}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic font-medium py-8 text-center">
                              {t.noGames || 'Nessuna gara disputata registrata a referto.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 5: GAME LOG / ULTIME PARTITE (Floating White Container, Soft Win/Loss Badges) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <div>
                          <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#022D32] flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#0CA17A]" />
                            {t.gameLogTitle || 'GAME LOG / ULTIME PARTITE'}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {lang === 'it' ? 'Risultati ufficiali e parziali per quarto' : 'Official match results and quarter scores'}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {matchLog.length} {matchLog.length === 1 ? 'GARA' : 'GARE'}
                        </span>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                        {matchLog.length > 0 ? (
                          matchLog.map((m, mIdx) => {
                            const dStr = m.date ? new Date(m.date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US') : '—';
                            const isWin = Boolean(m.isWin);
                            const opponentTeamName = m.isHomeGame ? m.awayTeam : m.homeTeam;
                            const myScore = m.isHomeGame ? m.homeScore : m.awayScore;
                            const oppScore = m.isHomeGame ? m.awayScore : m.homeScore;

                            return (
                              <div 
                                key={m.matchFid || mIdx}
                                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5"
                              >
                                <div className="flex items-center gap-3.5 flex-wrap">
                                  <span className={`w-9 h-9 rounded-xl font-mono font-extrabold text-sm flex items-center justify-center flex-none ${
                                    isWin 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {isWin ? 'V' : 'P'}
                                  </span>

                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs sm:text-sm font-black uppercase text-[#022D32]">
                                        vs {opponentTeamName}
                                      </span>
                                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                                        {m.isHomeGame ? <Home className="w-3 h-3 text-[#0CA17A]" /> : <Navigation className="w-3 h-3 text-[#0CA17A]" />}
                                        <span>{m.isHomeGame ? (t.home || 'CASA') : (t.away || 'TRASFERTA')}</span>
                                      </span>
                                      {m.round && (
                                        <span className="text-[10px] sm:text-xs font-mono text-slate-400">
                                          • {m.round}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">
                                      {dStr}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3.5 flex-wrap md:flex-nowrap w-full md:w-auto justify-between md:justify-end">
                                  {/* Partials */}
                                  {Array.isArray(m.partials) && m.partials.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl">
                                      {m.partials.map(p => (
                                        <span key={p.period}>
                                          <span className="text-slate-400 font-bold">Q{p.period}:</span> {p.homeScore}-{p.awayScore}
                                          {p.period < m.partials.length && <span className="text-slate-300 mx-1">|</span>}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Final score */}
                                  <div className="text-right flex-none">
                                    <span className={`font-mono text-base sm:text-lg font-extrabold px-3.5 py-1.5 rounded-xl ${
                                      isWin
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {myScore} - {oppScore}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs sm:text-sm text-slate-400 italic font-medium py-6 text-center">
                            {t.noGames || 'Nessun match disputato registrato.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. FULL-SCREEN DEDICATED PLAYER PROFILE PAGE                              */}
      {/* ========================================================================= */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#F8F9FA] text-[#022D32] overflow-y-auto animate-fade-in flex flex-col">
          {/* Top Sticky Navigation Bar */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DDF3E9] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between flex-none shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F9FA] border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                aria-label={t.backToRoster || 'Torna al Roster'}
              >
                <ArrowLeft className="w-4 h-4 text-[#0CA17A]" />
                <span>{t.backToRoster || 'Torna al Roster'}</span>
              </button>
              <div className="h-5 w-px bg-[#DDF3E9] hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#022D32]/70 font-medium">
                <span className="text-[#022D32] font-bold">{currentTeamStanding?.name || selectedTeamFid}</span>
                <span>/</span>
                <span className="text-[#022D32] font-black uppercase">{selectedPlayer.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#022D32] bg-[#DDF3E9] px-3 py-1.5 rounded-lg border border-[#0CA17A]/30">
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
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedPlayer.photo ? (
                      <img
                        src={selectedPlayer.photo}
                        alt={selectedPlayer.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#0CA17A]/40 bg-[#F8F9FA] flex-none shadow-xs"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-black text-[#022D32] text-2xl flex-none shadow-xs">
                        #{selectedPlayer.number}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-3xl font-black text-[#022D32] uppercase tracking-wide">
                          {selectedPlayer.name}
                        </h2>
                        {selectedPlayer.captain && (
                          <span className="text-[10px] font-black uppercase bg-slate-100 text-[#022D32] border border-slate-200 px-2 py-0.5 rounded">
                            CAPITANO
                          </span>
                        )}
                        {selectedPlayer.fipVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {t.fipVerifiedPill || 'FIP VERIFIED'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 font-semibold flex items-center gap-2 mt-1">
                        {selectedPlayer.position && selectedPlayer.position.trim().toLowerCase() !== 'player' && (
                          <>
                            <span className="text-[#022D32] font-bold">{selectedPlayer.position}</span>
                            <span>•</span>
                          </>
                        )}
                        <span className="text-[#022D32] font-black">{currentTeamStanding?.name || selectedTeamFid}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-mono font-bold">{selectedPlayer.games} GP</span>
                        <span>•</span>
                        <span className="text-[#0CA17A] font-mono font-bold">{selectedPlayer.startPercentage || '0%'} START</span>
                      </p>
                    </div>
                  </div>

                  {/* Active Tactical Badges on Hero */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {profileTags.length > 0 ? (
                      profileTags.map(tag => (
                        <span 
                          key={tag.id}
                          className={`text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs border ${tag.badgeClass}`}
                          title={lang === 'it' ? tag.labelIt : tag.label}
                        >
                          <TacticalTagIcon id={tag.id} className="w-4 h-4 flex-none" />
                          <span>{lang === 'it' ? tag.labelIt : tag.label}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        Profilo Bilanciato
                      </span>
                    )}
                  </div>
                </div>

                {/* Core Stats Grid (Current Season) - 5 SaaS Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] block">{selectedPlayer.pointsAVG.toFixed(1)}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalPpg}</span>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0CA17A] block">{selectedPlayer.threePct}%</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalThree}</span>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
                    <span className={`font-mono text-3xl sm:text-4xl font-extrabold block ${selectedPlayer.foulsAVG > 3.0 ? 'text-rose-600' : 'text-[#022D32]'}`}>
                      {selectedPlayer.foulsAVG.toFixed(1)}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalFouls}</span>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
                    <span className={`font-mono text-3xl sm:text-4xl font-extrabold block ${selectedPlayer.plusMinusAVG > 0 ? 'text-[#0CA17A]' : selectedPlayer.plusMinusAVG < 0 ? 'text-rose-600' : 'text-[#022D32]'}`}>
                      {selectedPlayer.plusMinusAVG > 0 ? `+${selectedPlayer.plusMinusAVG.toFixed(1)}` : selectedPlayer.plusMinusAVG.toFixed(1)}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalPlusMinus}</span>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center col-span-2 sm:col-span-1">
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] block">{selectedPlayer.games}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalGames}</span>
                  </div>
                </div>

                {/* Supabase Proprietary Hustle & Playmaking Grid */}
                {selectedPlayer.hasSupabaseStats && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#0CA17A]" />
                          {lang === 'it' ? 'PLAYMAKING & HUSTLE PROPRIETARI (SUPABASE)' : 'PROPRIETARY PLAYMAKING & HUSTLE (SUPABASE)'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          INTERNAL TRACKING
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {selectedPlayer.gpSupabase || selectedPlayer.games} {lang === 'it' ? 'partite tracciate' : 'matches tracked'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                        <span className="font-mono text-2xl font-black text-[#022D32] block">
                          {selectedPlayer.astAvg != null ? selectedPlayer.astAvg.toFixed(1) : '—'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                          {t.colAst || 'AST/G'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                        <span className="font-mono text-2xl font-black text-[#022D32] block">
                          {selectedPlayer.rebAvg != null ? selectedPlayer.rebAvg.toFixed(1) : '—'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                          {t.colReb || 'REB/G'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                        <span className="font-mono text-2xl font-black text-[#022D32] block">
                          {selectedPlayer.tovAvg != null ? selectedPlayer.tovAvg.toFixed(1) : '—'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                          {t.colTov || 'TOV/G'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                        <span className={`font-mono text-2xl font-black block ${
                          selectedPlayer.astTovRatio >= 1.5 
                            ? 'text-emerald-700' 
                            : selectedPlayer.astTovRatio >= 1.0 
                              ? 'text-[#022D32]' 
                              : 'text-amber-700'
                        }`}>
                          {selectedPlayer.astTovRatio != null ? selectedPlayer.astTovRatio.toFixed(2) : '—'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                          {t.colRatio || 'AST/TOV'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100 col-span-2 sm:col-span-1">
                        <span className="font-mono text-2xl font-black text-[#0CA17A] block">
                          {selectedPlayer.efgPct != null ? `${selectedPlayer.efgPct}%` : '—'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                          eFG%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 100% Width Horizontal Stacked Bar Chart for Point Distribution */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#DDF3E9] space-y-4 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-[#0CA17A]" />
                        {t.shotDistTitle || 'DISTRIBUZIONE PUNTI / SHOT PROFILE'}
                      </span>
                      <p className="text-[11px] text-[#022D32]/70 mt-0.5">
                        {t.shotDistSubtitle || 'Ripartizione percentuale dei punti segnati tra 2PT, 3PT e Tiri Liberi'}
                        {' • '}
                        <span className="text-[#0CA17A] font-bold">
                          {useCareerProfile 
                            ? (t.basedOnCareer ? t.basedOnCareer.replace('{games}', profileGames) : `Carriera (${profileGames} PG)`)
                            : (t.basedOnSeason ? t.basedOnSeason.replace('{games}', profileGames) : `Stagione 2025/2026 (${profileGames} PG)`)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#022D32]/70 font-mono font-bold block">
                        TOTALE: <strong className="text-[#022D32] font-black text-sm">{profileMetrics.totalPts} PTS</strong> ({profileMetrics.ptsPerGame.toFixed(1)} PPG)
                      </span>
                    </div>
                  </div>

                  {profileMetrics.totalPts > 0 ? (
                    <div className="space-y-3">
                      {/* Stacked Bar */}
                      <div className="w-full h-7 bg-[#F8F9FA] rounded-xl p-1 border border-[#DDF3E9] shadow-inner flex overflow-hidden gap-1">
                        {profileMetrics.pct2 > 0 && (
                          <div 
                            style={{ width: `${profileMetrics.pct2}%` }}
                            className="h-full bg-sky-500 hover:bg-sky-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                            title={`Punti da 2 (2PT): ${profileMetrics.pct2.toFixed(1)}% (${profileMetrics.twoMade * 2} PTS)`}
                          >
                            {profileMetrics.pct2 >= 10 && `${Math.round(profileMetrics.pct2)}%`}
                          </div>
                        )}
                        {profileMetrics.pct3 > 0 && (
                          <div 
                            style={{ width: `${profileMetrics.pct3}%` }}
                            className="h-full bg-[#0CA17A] hover:bg-[#0CA17A]/90 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                            title={`Punti da 3 (3PT): ${profileMetrics.pct3.toFixed(1)}% (${profileMetrics.threeMade * 3} PTS)`}
                          >
                            {profileMetrics.pct3 >= 10 && `${Math.round(profileMetrics.pct3)}%`}
                          </div>
                        )}
                        {profileMetrics.pctFT > 0 && (
                          <div 
                            style={{ width: `${profileMetrics.pctFT}%` }}
                            className="h-full bg-amber-500 hover:bg-amber-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                            title={`Tiri Liberi (FT): ${profileMetrics.pctFT.toFixed(1)}% (${profileMetrics.ftMade} PTS)`}
                          >
                            {profileMetrics.pctFT >= 10 && `${Math.round(profileMetrics.pctFT)}%`}
                          </div>
                        )}
                      </div>

                      {/* 3 KPI breakdown cards below bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-sky-500 flex-none shadow-xs" />
                            <div>
                              <span className="text-[10px] font-black text-[#022D32]/60 uppercase block tracking-wider">
                                {t.ptsFrom2 || 'Punti da 2 (2PT)'}
                              </span>
                              <span className="text-[11px] text-[#022D32]/70 font-mono">
                                {profileMetrics.twoMade * 2} PTS • {profileMetrics.twoPerGame.toFixed(1)} 2PM/G
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xl font-black text-sky-700">
                            {profileMetrics.pct2.toFixed(1)}%
                          </span>
                        </div>

                        <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#0CA17A] flex-none shadow-xs" />
                            <div>
                              <span className="text-[10px] font-black text-[#022D32]/60 uppercase block tracking-wider">
                                {t.ptsFrom3 || 'Punti da 3 (3PT)'}
                              </span>
                              <span className="text-[11px] text-[#022D32]/70 font-mono">
                                {profileMetrics.threeMade * 3} PTS • {profileMetrics.threePerGame.toFixed(1)} 3PM/G
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xl font-black text-[#0CA17A]">
                            {profileMetrics.pct3.toFixed(1)}%
                          </span>
                        </div>

                        <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex-none shadow-xs" />
                            <div>
                              <span className="text-[10px] font-black text-[#022D32]/60 uppercase block tracking-wider">
                                {t.ptsFromFt || 'Tiri Liberi (TL)'}
                              </span>
                              <span className="text-[11px] text-[#022D32]/70 font-mono">
                                {profileMetrics.ftMade} PTS • {profileMetrics.ftAttPerGame.toFixed(1)} FTA/G ({profileMetrics.ftPct != null ? Math.round(profileMetrics.ftPct) + '%' : '—'})
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xl font-black text-amber-700">
                            {profileMetrics.pctFT.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F8F9FA] p-4 rounded-xl text-center text-xs text-[#022D32]/60 italic border border-[#DDF3E9]">
                      Nessun punto registrato nel periodo di riferimento.
                    </div>
                  )}
                </div>

                {/* Tactical Badges with Coach Strategy Cards */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DDF3E9] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#0CA17A]" />
                      {t.tacticalBadgesTitle || 'PROFILO TATTICO & ALERT COACH'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLegendModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0CA17A] hover:text-[#0CA17A]/80 hover:underline cursor-pointer"
                      >
                        <HelpCircle className="w-3 h-3 text-[#0CA17A]" />
                        <span>{t.legendBtn || 'Legenda Tag'}</span>
                      </button>
                      <span className="text-[11px] font-bold text-[#022D32]/70">
                        • {profileTags.length} {profileTags.length === 1 ? 'Tag Attivo' : 'Tag Attivi'}
                      </span>
                    </div>
                  </div>

                  {profileTags.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profileTags.map(tag => (
                        <div 
                          key={tag.id}
                          className={`p-3.5 sm:p-4 rounded-xl border ${tag.badgeClass} shadow-xs`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <TacticalTagIcon id={tag.id} className="w-6 h-6 flex-none text-[#022D32]" />
                              <div>
                                <span className="font-black text-sm uppercase tracking-wide text-[#022D32] block">
                                  {lang === 'it' ? tag.labelIt : tag.label}
                                </span>
                                <span className="text-[10px] text-[#022D32]/70 font-mono">
                                  {lang === 'it' ? tag.criteriaDesc : tag.criteriaDescEn}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-white border border-[#DDF3E9] px-2 py-0.5 rounded text-[#022D32]">
                              {tag.criteria}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#F8F9FA] p-4 rounded-xl border border-slate-100 text-xs text-[#022D32]/70 flex items-center gap-3">
                      <Scale className="w-5 h-5 flex-none text-slate-400" />
                      <div>
                        <strong className="block text-[#022D32] font-bold mb-0.5">Profilo Bilanciato / Nessun Alert Estremo</strong>
                        <span>{t.noActiveTags || 'Nessun tag tattico specifico attivato per i criteri di volume e precisione.'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shooting Splits */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DDF3E9] space-y-3 shadow-xs">
                  <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#0CA17A]" />
                    {t.modalSplitsTitle} (2025/2026)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] shadow-xs">
                      <span className="text-[10px] text-[#022D32]/60 font-bold block uppercase">{t.modal3pt}</span>
                      <span className="font-mono text-xl font-black text-[#0CA17A] my-1 block">{selectedPlayer.threePct}%</span>
                      <span className="text-[11px] text-[#022D32]/70 block font-mono">{selectedPlayer.threeMadeAVG.toFixed(1)} {t.modalMadePerGame}</span>
                    </div>
                    <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] shadow-xs">
                      <span className="text-[10px] text-[#022D32]/60 font-bold block uppercase">{t.modal2pt}</span>
                      <span className="font-mono text-xl font-black text-sky-700 my-1 block">{selectedPlayer.twoPct}%</span>
                      <span className="text-[11px] text-[#022D32]/70 block font-mono">{selectedPlayer.twoMadeAVG.toFixed(1)} {t.modalMadePerGame}</span>
                    </div>
                    <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] shadow-xs">
                      <span className="text-[10px] text-[#022D32]/60 font-bold block uppercase">{t.modalFt}</span>
                      <span className="font-mono text-xl font-black text-[#022D32] my-1 block">{selectedPlayer.ftPct}%</span>
                      <span className="text-[11px] text-[#022D32]/70 block font-mono">Tiri Liberi</span>
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
                <div className="w-full bg-white p-4 sm:p-6 rounded-2xl border border-[#DDF3E9] space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#DDF3E9] flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-[#0CA17A]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase text-[#022D32] tracking-wider">
                          {t.historyTableTitle || 'CARRIERA / STORICO FIP'}
                        </h3>
                        <p className="text-[11px] text-[#022D32]/70 font-medium">
                          Statistiche aggregate e per stagione da database ufficiale FIP
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLegendModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] hover:bg-[#DDF3E9] border border-[#DDF3E9] text-[#022D32] text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#0CA17A]" />
                        <span>{t.legendBtn || 'Legenda Tag'}</span>
                      </button>
                      {normalizedHistory.length > 0 && (
                        <span className="text-xs font-mono font-bold text-[#0CA17A] bg-[#DDF3E9] px-3 py-1.5 rounded-xl border border-[#0CA17A]/30">
                          {normalizedHistory.length} {t.historySeason || 'STAGIONI'}
                        </span>
                      )}
                    </div>
                  </div>

                  {normalizedHistory.length > 0 ? (
                    <div className="w-full overflow-x-auto rounded-xl border border-[#DDF3E9] bg-white shadow-xs">
                      <table className="w-full min-w-[760px] text-left text-xs border-collapse font-sans">
                        <thead className="sticky top-0 z-20 shadow-xs">
                          {/* Column headers */}
                          <tr className="border-b border-[#DDF3E9] bg-[#DDF3E9] text-[#022D32] font-black uppercase text-[10px] tracking-wider">
                            <th className="px-3.5 py-3 text-[#022D32] font-bold whitespace-nowrap min-w-[130px]">{t.colSeason || 'Season'}</th>
                            <th className="px-3.5 py-3 text-[#022D32] font-bold min-w-[240px]">{t.colTeam || 'Team'}</th>
                            <th className="px-2 py-3 text-center whitespace-nowrap min-w-[85px] text-[#022D32]" title="Tactical Scouting Tags">{t.colTags || 'TAGS'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[50px]" title="Games Played">{t.colGp || 'GP'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="Points / Average">{t.colPpg || 'PTS/G'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="2-Pointers Made / Average">{t.col2pm || '2PM/G'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="3-Pointers Made / Average">{t.col3pm || '3PM/G'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="Free Throws">{t.colFtPct || 'FT%'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px] text-[#022D32]" title="Fouls per game">{t.colFf || 'FF/P'}</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap min-w-[65px]" title="Plus / Minus">{t.colPlusMinus || '+/-'}</th>
                          </tr>

                          {/* CAREER AGGREGATES HEADER ROW: MED (Career Average) */}
                          <tr className="bg-[#022D32] text-white border-b-2 border-[#0CA17A] text-xs font-mono font-bold">
                            <td className="px-3.5 py-3 whitespace-nowrap font-sans">
                              <span className="font-black text-white bg-[#0CA17A] px-2.5 py-1 rounded text-[10px] inline-flex items-center gap-1">
                                {t.historyMed || 'MED'}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-white/90 font-bold text-xs uppercase tracking-wider font-sans">
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
                                        title={lang === 'it' ? tag.labelIt : tag.label}
                                        className="cursor-help inline-flex items-center text-white"
                                      >
                                        <TacticalTagIcon id={tag.id} className="w-3.5 h-3.5 text-white" />
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-white/40 text-xs">—</span>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-3 text-center text-white font-mono">
                              {careerGames}
                            </td>
                            <td className="px-3 py-3 text-center font-black text-emerald-300 font-mono">
                              {careerPpg.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-center text-white font-mono font-bold">
                              {career2pm.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-center text-emerald-300 font-mono font-bold">
                              {career3pm.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-center text-white font-mono font-bold">
                              {careerFtPct}
                            </td>
                            <td className="px-3 py-3 text-center text-white font-mono font-bold">
                              {careerFoulsAvg > 0 ? careerFoulsAvg.toFixed(1) : (careerFouls > 0 && careerGames > 0 ? (careerFouls / careerGames).toFixed(1) : '—')}
                            </td>
                            <td className={`px-3 py-3 text-center font-mono font-bold ${careerPmAvg > 0 ? 'text-emerald-300' : careerPmAvg < 0 ? 'text-rose-300' : 'text-white/80'}`}>
                              {careerPmAvg !== 0 ? (careerPmAvg > 0 ? `+${careerPmAvg.toFixed(1)}` : careerPmAvg.toFixed(1)) : '0.0'}
                            </td>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#DDF3E9]/80 font-mono text-xs">
                          {normalizedHistory.map((season, sIdx) => {
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

                            return (
                              <React.Fragment key={sKey}>
                                {/* Main Season Aggregate Row */}
                                <tr 
                                  onClick={() => hasTeams && toggleSeasonCollapse(sKey)}
                                  className={`transition-colors ${hasTeams ? 'cursor-pointer' : ''} ${sIdx % 2 === 0 ? 'bg-[#DDF3E9]/25' : 'bg-white'} hover:bg-[#DDF3E9]/50 border-t border-[#DDF3E9] text-[#022D32]`}
                                >
                                  <td className="px-3.5 py-3 font-black text-[#022D32] text-xs font-sans whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      {hasTeams ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSeasonCollapse(sKey);
                                          }}
                                          className="p-1 rounded hover:bg-[#DDF3E9] text-[#022D32]/60 hover:text-[#022D32] transition-colors"
                                          aria-label="Toggle season teams"
                                        >
                                          {isCollapsed ? (
                                            <ChevronRight className="w-4 h-4 text-[#022D32]/60" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4 text-[#0CA17A]" />
                                          )}
                                        </button>
                                      ) : (
                                        <span className="w-4 inline-block text-center text-[#022D32]/40 font-bold">•</span>
                                      )}
                                      <span className="font-bold text-[#022D32] text-sm">{season.seasonName || season.seasonId || '—'}</span>
                                    </div>
                                  </td>
                                  <td className="px-3.5 py-3 text-[#022D32] font-bold text-xs font-sans">
                                    {teams.length > 1 ? (
                                      <span className="inline-flex items-center gap-1.5 text-[#022D32] font-semibold text-xs">
                                        <span className="text-[#065F46] bg-white px-2 py-0.5 rounded border border-[#0CA17A]/40 text-[10px] uppercase font-black">
                                          {t.seasonTotalBadge || 'TOTALE'}
                                        </span>
                                        <span className="text-[#022D32]/70 italic">
                                          {t.combinedTeams ? t.combinedTeams.replace('{count}', teams.length) : `(${teams.length} Squadre)`}
                                        </span>
                                      </span>
                                    ) : teams.length === 1 ? (
                                      <span className="text-[#022D32] font-bold">{teams[0].teamName || '—'}</span>
                                    ) : (
                                      <span className="text-[#022D32] font-bold">{season.teamName || '—'}</span>
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
                                              title={lang === 'it' ? tag.labelIt : tag.label}
                                              className="cursor-help inline-flex items-center text-[#022D32]"
                                            >
                                              <TacticalTagIcon id={tag.id} className="w-3.5 h-3.5 text-[#022D32]" />
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-[#022D32]/40 text-xs font-bold">—</span>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-3 py-3 text-center text-[#022D32] font-bold font-mono">
                                    {sGames}
                                  </td>
                                  <td className="px-3 py-3 text-center font-black text-[#022D32] font-mono text-sm">
                                    {sPpg}
                                  </td>
                                  <td className="px-3 py-3 text-center text-[#022D32] font-mono font-bold">
                                    {s2pm}
                                  </td>
                                  <td className="px-3 py-3 text-center text-[#022D32] font-mono font-bold">
                                    {s3pm}
                                  </td>
                                  <td className="px-3 py-3 text-center text-[#022D32] font-mono font-bold">
                                    {sFtPct}
                                  </td>
                                  <td className="px-3 py-3 text-center text-[#022D32] font-mono font-bold">
                                    {sFouls}
                                  </td>
                                  <td className={`px-3 py-3 text-center font-mono font-bold ${rawPm > 0 ? 'text-emerald-700' : rawPm < 0 ? 'text-rose-700' : 'text-[#022D32]'}`}>
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
                                    <tr key={`${sKey}-team-${tIdx}`} className="bg-white hover:bg-[#F8F9FA] border-b border-[#DDF3E9]/50 transition-colors text-[#022D32]">
                                      {/* Indented indicator */}
                                      <td className="py-2.5 px-3.5 pl-8 text-[#022D32]/60 font-mono text-xs whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[#0CA17A] font-bold font-sans">↳</span>
                                          <span className="text-xs font-sans text-[#022D32]/60 font-medium">{season.seasonName}</span>
                                        </div>
                                      </td>
                                      {/* Team details: competitionName in uppercase accent on top, teamName below */}
                                      <td className="py-2.5 px-3.5 text-xs font-sans whitespace-normal break-words min-w-[260px]">
                                        <div className="flex flex-col">
                                          {displayComp ? (
                                            <span className="text-[10px] font-bold text-[#0CA17A] tracking-wide uppercase leading-tight line-clamp-1" title={displayComp}>
                                              {displayComp}
                                            </span>
                                          ) : null}
                                          <span className="text-xs font-bold text-[#022D32] leading-tight">
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
                                                  title={lang === 'it' ? tag.labelIt : tag.label}
                                                  className="cursor-help inline-flex items-center text-[#022D32]"
                                                >
                                                  <TacticalTagIcon id={tag.id} className="w-3.5 h-3.5 text-[#022D32]" />
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-[#022D32]/30 text-xs">—</span>
                                          );
                                        })()}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-[#022D32]/80 font-mono">
                                        {tGames}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-bold text-[#022D32] font-mono">
                                        {tPpg}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-[#022D32]/80 font-mono">
                                        {t2pm}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-[#0CA17A] font-mono">
                                        {t3pm}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-[#022D32]/80 font-mono">
                                        {tFtPct}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-[#022D32]/80 font-mono">
                                        {tFouls}
                                      </td>
                                      <td className={`py-2.5 px-3 text-center font-mono ${tPmRaw > 0 ? 'text-emerald-700 font-bold' : tPmRaw < 0 ? 'text-rose-700 font-bold' : 'text-[#022D32]'}`}>
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
                    <p className="text-xs text-[#022D32]/60 italic py-4 text-center">
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
        <div className="fixed inset-0 z-[100] bg-[#022D32]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#DDF3E9] rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center flex-none">
                  <Shield className="w-5 h-5 text-[#0CA17A]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#022D32] uppercase tracking-wider">
                    {t.legendTitle || 'LEGENDA TAG TATTICI'}
                  </h3>
                  <p className="text-xs text-[#022D32]/70">
                    {t.legendSubtitle || 'Metriche di scouting avanzate e regole di classificazione applicate a profilo e stagioni'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="text-[#022D32]/60 hover:text-[#022D32] p-1.5 rounded-lg bg-[#F8F9FA] hover:bg-[#DDF3E9] transition-colors cursor-pointer"
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
                  className={`p-3.5 sm:p-4 rounded-xl border ${tag.badgeClass} flex items-center justify-between gap-2 flex-wrap bg-white shadow-xs`}
                >
                  <div className="flex items-center gap-2.5">
                    <TacticalTagIcon id={tag.id} className="w-6 h-6 flex-none text-[#022D32]" />
                    <div>
                      <span className="font-black text-sm uppercase tracking-wide text-[#022D32] block">
                        {lang === 'it' ? tag.labelIt : tag.label}
                      </span>
                      <span className="text-[11px] text-[#022D32]/70 font-medium">
                        {lang === 'it' ? tag.criteriaDesc : tag.criteriaDescEn}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#F8F9FA] border border-[#DDF3E9] px-2.5 py-1 rounded-lg text-[#022D32]">
                    {tag.criteria}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-[#DDF3E9]">
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="px-4 py-2 rounded-xl bg-[#022D32] hover:bg-[#022D32]/90 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-[#022D32]/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white border border-[#DDF3E9] rounded-2xl shadow-2xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-[#0CA17A]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#022D32] uppercase tracking-wider">
                    IMPORT LEAGUE JSON
                  </h3>
                  <p className="text-[11px] text-[#022D32]/70">
                    Paste raw standings or roster JSON to update the Hub
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImporter(false)}
                className="text-[#022D32]/60 hover:text-[#022D32] p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={jsonInputText}
              onChange={(e) => setJsonInputText(e.target.value)}
              rows={8}
              placeholder='[{"rank": 1, "teamFid": "...", "name": "...", "points": 28, "won": 14, "lost": 4}]'
              className="w-full bg-[#F8F9FA] border border-[#DDF3E9] rounded-xl p-3 font-mono text-xs text-[#022D32] focus:outline-none focus:border-[#0CA17A]"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#DDF3E9]">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs font-bold text-[#0CA17A] hover:underline"
              >
                Reset to Default Sample League
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImporter(false)}
                  className="bg-[#F8F9FA] hover:bg-[#DDF3E9] text-[#022D32] font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
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
                        setStatusMsg(`Imported ${parsed.length} teams into standings`);
                        setShowImporter(false);
                      } else if (typeof parsed === 'object') {
                        setRosters(parsed);
                        localStorage.setItem('bba_fip_rosters', JSON.stringify(parsed));
                        setStatusMsg(`Imported rosters for ${Object.keys(parsed).length} teams`);
                        setShowImporter(false);
                      }
                    } catch (err) {
                      setStatusMsg(`JSON Error: ${err.message}`);
                    }
                  }}
                  className="bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black px-4 py-1.5 rounded-lg text-xs transition-all shadow-xs active:scale-95"
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
