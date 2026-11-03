import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, Target, Upload, FileText, AlertTriangle, 
  RefreshCw, Search, ArrowLeft, Shield, Zap, ChevronRight, 
  X, User, HelpCircle, Loader2, Terminal, Flame, CheckCircle2
} from 'lucide-react';

// =========================================================================
// BASELINE DATA (Divisione Regionale 2 - Girone F)
// =========================================================================
export const DEFAULT_STANDINGS = [
  {
    rank: 1,
    teamFid: "team_virtus_1960",
    team: { fid: "team_virtus_1960", name: "Virtus Roma 1960" },
    name: "Virtus Roma 1960",
    points: 28,
    won: 14,
    lost: 4,
    played: 18,
    pointDiff: 8.2,
    streak: ["W", "W", "L", "W", "W"]
  },
  {
    rank: 2,
    teamFid: "team_carver",
    team: { fid: "team_carver", name: "Carver Cinecittà" },
    name: "Carver Cinecittà",
    points: 26,
    won: 13,
    lost: 5,
    played: 18,
    pointDiff: 7.6,
    streak: ["W", "W", "W", "W", "L"]
  },
  {
    rank: 3,
    teamFid: "team_petriana",
    team: { fid: "team_petriana", name: "Petriana Basket" },
    name: "Petriana Basket",
    points: 24,
    won: 12,
    lost: 6,
    played: 18,
    pointDiff: 3.8,
    streak: ["L", "W", "W", "L", "W"]
  },
  {
    rank: 4,
    teamFid: "team_bba_academy",
    team: { fid: "team_bba_academy", name: "BBA - Basketball Academy" },
    name: "BBA - Basketball Academy",
    points: 22,
    won: 11,
    lost: 7,
    played: 18,
    pointDiff: 3.4,
    streak: ["W", "L", "W", "W", "W"]
  },
  {
    rank: 5,
    teamFid: "team_san_paolo",
    team: { fid: "team_san_paolo", name: "San Paolo Ostiense" },
    name: "San Paolo Ostiense",
    points: 20,
    won: 10,
    lost: 8,
    played: 18,
    pointDiff: 0.4,
    streak: ["W", "L", "L", "W", "L"]
  },
  {
    rank: 6,
    teamFid: "team_alfa_omega",
    team: { fid: "team_alfa_omega", name: "Alfa Omega Ostia" },
    name: "Alfa Omega Ostia",
    points: 16,
    won: 8,
    lost: 10,
    played: 18,
    pointDiff: -3.2,
    streak: ["L", "L", "W", "L", "W"]
  },
  {
    rank: 7,
    teamFid: "team_vis_nova",
    team: { fid: "team_vis_nova", name: "Vis Nova Basket" },
    name: "Vis Nova Basket",
    points: 12,
    won: 6,
    lost: 12,
    played: 18,
    pointDiff: -7.6,
    streak: ["L", "L", "L", "W", "L"]
  },
  {
    rank: 8,
    teamFid: "team_frascati",
    team: { fid: "team_frascati", name: "Basket Frascati" },
    name: "Basket Frascati",
    points: 8,
    won: 4,
    lost: 14,
    played: 18,
    pointDiff: -12.6,
    streak: ["L", "L", "L", "L", "W"]
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

// Defensive helper to parse player lineup item
function normalizeLineupItem(item, idx) {
  const p = item.player || item;
  const s = item.stats || item;
  return {
    fid: p.fid || `p_${idx}`,
    name: p.name || `Player #${idx + 1}`,
    number: p.number ?? (idx + 1),
    position: p.position || 'N/A',
    games: s.games ?? s.gp ?? 0,
    pointsAVG: Number(s.pointsAVG ?? s.ppg ?? 0),
    foulsAVG: Number(s.foulsAVG ?? s.fouls ?? 0),
    threePct: Number(s.outArcThrowsPercentage ?? s.three_pct ?? s.pct_3p ?? 0),
    threeMadeAVG: Number(s.outArcThrowsAVG ?? s.threePtMadeAVG ?? 0),
    twoPct: Number(s.inArcThrowsPercentage ?? s.two_pct ?? s.pct_2p ?? 0),
    twoMadeAVG: Number(s.inArcThrowsAVG ?? 0),
    ftPct: Number(s.freeThrowsPercentage ?? s.ft_pct ?? 0),
    plusMinusAVG: Number(s.plusMinusAVG ?? s.plus_minus ?? 0),
    reboundsAVG: Number(s.reboundsAVG ?? 0),
    assistsAVG: Number(s.assistsAVG ?? 0)
  };
}

export default function LeagueHub({ showToast }) {
  // Navigation State: 'STANDINGS_VIEW' | 'TEAM_DETAIL_VIEW'
  const [currentView, setCurrentView] = useState('STANDINGS_VIEW');
  const [selectedTeamFid, setSelectedTeamFid] = useState(null);

  // Data states from JSON files
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
  // Fetch GraphQL Generated JSONs on Mount
  // -------------------------------------------------------------------------
  const fetchFipData = async (isManual = false) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [standingsRes, rostersRes] = await Promise.all([
        fetch('/data/league_standings.json', { cache: 'no-store' }),
        fetch('/data/league_rosters.json', { cache: 'no-store' })
      ]);

      if (!standingsRes.ok || !rostersRes.ok) {
        throw new Error(`Data files not found (${standingsRes.status}/${rostersRes.status})`);
      }

      const standingsData = await standingsRes.json();
      const rostersData = await rostersRes.json();

      if (Array.isArray(standingsData) && standingsData.length > 0) {
        setStandings(standingsData);
        setRosters(rostersData || {});
        try {
          localStorage.setItem('bba_fip_standings', JSON.stringify(standingsData));
          localStorage.setItem('bba_fip_rosters', JSON.stringify(rostersData || {}));
        } catch (e) {}

        if (isManual) {
          setStatusMsg('✅ Live FIP GraphQL data synced successfully');
          if (showToast) showToast('🏀 Standings & Rosters Loaded');
        }
      } else {
        throw new Error('Invalid standings array in /data/league_standings.json');
      }
    } catch (err) {
      console.warn('[League Hub] Fetch error:', err.message);
      setFetchError(err.message);
      if (isManual && showToast) {
        showToast('⚠️ Could not load FIP JSON files');
      }
    } finally {
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
    return standings.find(s => (s.teamFid || s.team?.fid || s.id) === selectedTeamFid) || null;
  }, [selectedTeamFid, standings]);

  const rawLineups = useMemo(() => {
    if (!selectedTeamFid || !rosters) return [];
    return rosters[selectedTeamFid] || [];
  }, [selectedTeamFid, rosters]);

  const currentRoster = useMemo(() => {
    return rawLineups.map((item, idx) => normalizeLineupItem(item, idx));
  }, [rawLineups]);

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
              LEAGUE HUB
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40">
                FIP GRAPHQL SYNCED
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Divisione Regionale 2 - Girone F • Season 2025/2026
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fetchFipData(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 hover:border-indigo-400 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Reload from /data/league_standings.json & league_rosters.json"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>SYNC GRAPHQL DATA</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Load default championship league dataset"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>LOAD SAMPLE LEAGUE</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-md active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>IMPORT JSON</span>
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
      {isLoading && (!standings || standings.length === 0) ? (
        <div className="glass-card p-12 text-center border-slate-800 bg-slate-900/90 rounded-2xl max-w-md mx-auto space-y-3 my-12 animate-pulse shadow-2xl">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-300">Loading FIP League Data...</p>
          <p className="text-xs text-slate-500 font-mono">Fetching /data/league_standings.json & league_rosters.json</p>
        </div>
      ) : (!standings || standings.length === 0) ? (
        /* Empty / Unsynced State */
        <div className="glass-card p-8 sm:p-12 text-center border-slate-800 bg-slate-900/90 rounded-2xl max-w-xl mx-auto space-y-5 my-8 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-wide">
              League Data Not Synced
            </h2>
            <p className="text-sm text-slate-400">
              League data not synced. Run <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono text-xs border border-slate-800">npm run sync-fip</code> locally to download the latest FIP API data.
            </p>
          </div>

          {/* Terminal Command Box */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left font-mono text-xs text-slate-300 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Terminal className="w-4 h-4 text-emerald-400 flex-none" />
              <span className="text-slate-200">npm run sync-fip</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText('npm run sync-fip');
                }
                if (showToast) showToast('📋 Copied: npm run sync-fip');
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
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RETRY SYNC</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>LOAD SAMPLE LEAGUE</span>
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
                    LEAGUE LEADER
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-100">
                      {standings[0]?.name || standings[0]?.team?.name || 'N/A'}
                    </span>
                    <span className="font-mono text-sm font-black text-amber-400">
                      {standings[0]?.points ?? (standings[0]?.won * 2)} PTS
                    </span>
                  </div>
                </div>

                <div className="glass-card p-3 border-sky-500/30 bg-slate-900/90 shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
                    BEST RECORD
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-100">
                      {standings[0]?.won}W - {standings[0]?.lost}L
                    </span>
                    <span className="font-mono text-sm font-black text-sky-400">
                      {standings[0]?.played > 0 ? `${Math.round((standings[0].won / standings[0].played) * 100)}% WIN` : ''}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-3 border-emerald-500/30 bg-slate-900/90 shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                    TOP POINT DIFFERENTIAL
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-100">
                      {standings.reduce((best, s) => (s.pointDiff > (best.pointDiff || -999) ? s : best), standings[0])?.name || 'N/A'}
                    </span>
                    <span className="font-mono text-sm font-black text-emerald-400">
                      +{standings.reduce((best, s) => (s.pointDiff > (best.pointDiff || -999) ? s : best), standings[0])?.pointDiff || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Standings Table Card */}
              <div className="glass-card p-4 sm:p-5 border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      CHAMPIONSHIP STANDINGS ({filteredStandings.length} TEAMS)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Click any team row to inspect roster stats, shooting splits, and dynamic scouting alerts
                    </p>
                  </div>

                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter team..."
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
                        <th className="p-3 w-12 text-center">RANK</th>
                        <th className="p-3">TEAM</th>
                        <th className="p-3 text-center">PTS (WON × 2)</th>
                        <th className="p-3 text-center">W - L RECORD</th>
                        <th className="p-3 text-center">GP</th>
                        <th className="p-3 text-center">WIN%</th>
                        <th className="p-3 text-center">DIFF</th>
                        <th className="p-3 text-center">LAST 5</th>
                        <th className="p-3 text-right">SCOUT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredStandings.map((st, idx) => {
                        const tFid = st.teamFid || st.team?.fid || st.id || `team_${idx + 1}`;
                        const tName = st.name || st.team?.name || `Team #${idx + 1}`;
                        const isBBA = tName.includes('BBA') || tFid === 'team_bba_academy';
                        const rankNum = st.rank || (idx + 1);
                        const isPlayoff = rankNum <= 4;
                        const isPlayout = rankNum >= 7;

                        const ptsVal = st.points ?? ((st.won ?? 0) * 2);
                        const gpVal = st.played ?? ((st.won ?? 0) + (st.lost ?? 0));
                        const winPct = gpVal > 0 ? Math.round(((st.won ?? 0) / gpVal) * 100) : 0;

                        return (
                          <tr
                            key={tFid}
                            onClick={() => handleSelectTeam(tFid)}
                            className={`cursor-pointer transition-colors ${
                              isBBA 
                                ? 'bg-sky-950/20 hover:bg-sky-900/30 border-l-2 border-sky-400' 
                                : 'hover:bg-slate-800/50'
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
                                <span className="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.2 rounded border border-sky-500/40">
                                  OUR TEAM
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono font-black text-amber-400 text-sm">
                              {ptsVal}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-200">
                              <span className="text-emerald-400">{st.won ?? 0}</span>
                              <span className="text-slate-500 mx-1">-</span>
                              <span className="text-rose-400">{st.lost ?? 0}</span>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-400">
                              {gpVal}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-300">
                              {gpVal > 0 ? `${winPct}%` : '-'}
                            </td>
                            <td className="p-3 text-center font-mono font-black">
                              <span className={(st.pointDiff ?? 0) > 0 ? 'text-emerald-400' : ((st.pointDiff ?? 0) < 0 ? 'text-rose-400' : 'text-slate-400')}>
                                {(st.pointDiff ?? 0) > 0 ? `+${st.pointDiff}` : (st.pointDiff ?? 0)}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {Array.isArray(st.streak) && st.streak.map((s, i) => (
                                  <span
                                    key={i}
                                    className={`w-4 h-4 rounded text-[9px] font-mono font-black flex items-center justify-center ${
                                      s === 'W'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    }`}
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleSelectTeam(tFid); }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1 rounded text-xs transition-all inline-flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <span>SCOUT</span>
                                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                              </button>
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
                  <span>← BACK TO STANDINGS</span>
                </button>

                {/* Team Switcher Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">SWITCH TEAM:</span>
                  <select
                    value={selectedTeamFid || ''}
                    onChange={(e) => handleSelectTeam(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold p-2 rounded-xl focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {standings.map(s => {
                      const fid = s.teamFid || s.team?.fid || s.id;
                      const name = s.name || s.team?.name;
                      return (
                        <option key={fid} value={fid} className="bg-slate-900 text-slate-100">
                          #{s.rank || '-'} {name} ({s.points ?? (s.won * 2)} pts)
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
                        {currentTeamStanding?.name || currentTeamStanding?.team?.name || selectedTeamFid}
                      </h2>
                      <span className="text-[10px] bg-slate-950 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-800">
                        Divisione Regionale 2
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Opponent Scouting Profile • {currentRoster.length} players tracked from FIP competitionLineupStats
                    </p>
                  </div>

                  {/* Standing points pill */}
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      CHAMPIONSHIP RANK
                    </span>
                    <div className="font-mono text-xl font-black text-amber-400">
                      {currentTeamStanding?.points ?? ((currentTeamStanding?.won ?? 0) * 2)} PTS
                      <span className="text-xs text-slate-300 font-semibold ml-1.5">
                        (#{currentTeamStanding?.rank || '-'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team Stats Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      RECORD
                    </span>
                    <span className="font-mono text-xl font-black text-slate-200">
                      {currentTeamStanding?.won ?? 0}W - {currentTeamStanding?.lost ?? 0}L
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      WIN RATE
                    </span>
                    <span className="font-mono text-xl font-black text-sky-400">
                      {(currentTeamStanding?.played ?? 0) > 0 
                        ? `${Math.round(((currentTeamStanding?.won ?? 0) / currentTeamStanding.played) * 100)}%` 
                        : '-'}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      POINT DIFFERENTIAL
                    </span>
                    <span className={`font-mono text-xl font-black ${
                      (currentTeamStanding?.pointDiff ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(currentTeamStanding?.pointDiff ?? 0) > 0 ? `+${currentTeamStanding.pointDiff}` : (currentTeamStanding?.pointDiff ?? 0)}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      ROSTER SIZE
                    </span>
                    <span className="font-mono text-xl font-black text-amber-400">
                      {currentRoster.length} Players
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
                        ⚠️ HIGH FOUL TARGETS (&gt;3.0 FOULS/G)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                      {highFoulTargets.length} CANDIDATES
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Coach Strategy:</strong> Attack in the paint early off the dribble to draw fouls, induce penalty, and force bench substitutions.
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
                        No players averaging &gt; 3.0 fouls.
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
                        🎯 PRIMARY SHOOTERS (&gt;1.5 MADE 3PT/G)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {primaryShooters.length} SHOOTERS
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Coach Strategy:</strong> Contest tight on catch-and-shoot looks, fight over high ball screens, and do not help off them in corner rotations.
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
                        No primary perimeter volume shooters.
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
                      ROSTER & LINEUP STATISTICS ({filteredRoster.length} PLAYERS)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Official FIP lineup statistics. Click any row to view individual shooting chart splits.
                    </p>
                  </div>

                  {/* Filter & Sort Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search player..."
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
                      <option value="ppg">Sort: PPG</option>
                      <option value="fouls">Sort: Fouls/G</option>
                      <option value="three">Sort: 3PM/G</option>
                      <option value="plusMinus">Sort: Plus/Minus</option>
                      <option value="number">Sort: Jersey #</option>
                    </select>
                  </div>
                </div>

                {/* Roster Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">NAME & POSITION</th>
                        <th className="p-3 text-center">GP</th>
                        <th className="p-3 text-center">POINTS/G</th>
                        <th className="p-3 text-center">FOULS/G</th>
                        <th className="p-3 text-center">3PT% (3PM)</th>
                        <th className="p-3 text-center">2PT%</th>
                        <th className="p-3 text-center">FT%</th>
                        <th className="p-3 text-center">PLUS/MINUS (+/-)</th>
                        <th className="p-3 text-left">ALERTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredRoster.map((p) => {
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
                                    <Target className="w-2.5 h-2.5" /> SHOOTER
                                  </span>
                                )}
                                {isFoulTarget && (
                                  <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" /> FOUL TARGET
                                  </span>
                                )}
                              </div>
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
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. SLEEK PLAYER PROFILE SLIDE-OUT / MODAL                                 */}
      {/* ========================================================================= */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-2 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-mono font-black text-rose-400 text-lg">
                  #{selectedPlayer.number}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                    {selectedPlayer.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                    <span>{selectedPlayer.position}</span>
                    <span>•</span>
                    <span className="text-rose-400">{currentTeamStanding?.name || selectedTeamFid}</span>
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
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">POINTS/G</span>
                <span className="font-mono text-lg font-black text-rose-400">{selectedPlayer.pointsAVG.toFixed(1)}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">FOULS/G</span>
                <span className={`font-mono text-lg font-black ${selectedPlayer.foulsAVG > 3.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {selectedPlayer.foulsAVG.toFixed(1)}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">3PT%</span>
                <span className="font-mono text-lg font-black text-amber-300">{selectedPlayer.threePct}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">+/-</span>
                <span className={`font-mono text-lg font-black ${selectedPlayer.plusMinusAVG > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {selectedPlayer.plusMinusAVG > 0 ? `+${selectedPlayer.plusMinusAVG.toFixed(1)}` : selectedPlayer.plusMinusAVG.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Tactical Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedPlayer.threeMadeAVG > 1.5 && (
                <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 p-2.5 rounded-xl text-xs w-full flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400 flex-none" />
                  <div>
                    <strong className="block font-black">PRIMARY PERIMETER SHOOTER ({selectedPlayer.threeMadeAVG.toFixed(1)} 3PM/G)</strong>
                    <span className="text-[11px] text-slate-300">High volume threat from outside the arc. Contest tight and deny open look.</span>
                  </div>
                </div>
              )}
              {selectedPlayer.foulsAVG > 3.0 && (
                <div className="bg-rose-500/20 text-rose-300 border border-rose-500/40 p-2.5 rounded-xl text-xs w-full flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-none" />
                  <div>
                    <strong className="block font-black">HIGH FOUL TARGET ({selectedPlayer.foulsAVG.toFixed(1)} FOULS/G)</strong>
                    <span className="text-[11px] text-slate-300">Vulnerable on pump fakes and aggressive drives. Attack early to draw foul trouble.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Shooting Splits */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                SHOOTING ACCURACY SPLITS
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold block">3PT (OUT-ARC)</span>
                  <span className="font-mono text-sm font-black text-amber-300">{selectedPlayer.threePct}%</span>
                  <span className="text-[9px] text-slate-500 block">{selectedPlayer.threeMadeAVG.toFixed(1)} made/G</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold block">2PT (IN-ARC)</span>
                  <span className="font-mono text-sm font-black text-sky-400">{selectedPlayer.twoPct}%</span>
                  <span className="text-[9px] text-slate-500 block">{selectedPlayer.twoMadeAVG.toFixed(1)} made/G</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold block">FREE THROWS</span>
                  <span className="font-mono text-sm font-black text-emerald-400">{selectedPlayer.ftPct}%</span>
                </div>
              </div>
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
