import React, { useState, useMemo } from 'react';
import { 
  Trophy, Crosshair, Target, Upload, FileText, CheckCircle2, 
  AlertTriangle, Zap, Flame, RefreshCw, Search, 
  FileCode, ArrowLeft, ArrowRight, Shield, Activity, BarChart2, 
  ChevronRight, X, User, Calendar, ExternalLink, HelpCircle
} from 'lucide-react';

// Comprehensive Divisione Regionale 2 Championship League Dataset
export const DEFAULT_LEAGUE_DATA = {
  lastUpdated: "2026-11-03",
  leagueName: "Divisione Regionale 2 - Girone F",
  season: "2025/2026",
  standings: [
    { id: "t1", rank: 1, name: "Virtus Roma 1960", points: 28, w: 14, l: 4, gp: 18, ppg: 79.4, opp_ppg: 71.2, diff: 8.2, streak: ["W", "W", "L", "W", "W"] },
    { id: "t2", rank: 2, name: "Carver Cinecittà", points: 26, w: 13, l: 5, gp: 18, ppg: 82.1, opp_ppg: 74.5, diff: 7.6, streak: ["W", "W", "W", "W", "L"] },
    { id: "t3", rank: 3, name: "Petriana Basket", points: 24, w: 12, l: 6, gp: 18, ppg: 75.8, opp_ppg: 72.0, diff: 3.8, streak: ["L", "W", "W", "L", "W"] },
    { id: "t4", rank: 4, name: "BBA - Basketball Academy", points: 22, w: 11, l: 7, gp: 18, ppg: 76.5, opp_ppg: 73.1, diff: 3.4, streak: ["W", "L", "W", "W", "W"] },
    { id: "t5", rank: 5, name: "San Paolo Ostiense", points: 20, w: 10, l: 8, gp: 18, ppg: 73.2, opp_ppg: 72.8, diff: 0.4, streak: ["W", "L", "L", "W", "L"] },
    { id: "t6", rank: 6, name: "Alfa Omega Ostia", points: 16, w: 8, l: 10, gp: 18, ppg: 71.0, opp_ppg: 74.2, diff: -3.2, streak: ["L", "L", "W", "L", "W"] },
    { id: "t7", rank: 7, name: "Vis Nova Basket", points: 12, w: 6, l: 12, gp: 18, ppg: 68.4, opp_ppg: 76.0, diff: -7.6, streak: ["L", "L", "L", "W", "L"] },
    { id: "t8", rank: 8, name: "Basket Frascati", points: 8, w: 4, l: 14, gp: 18, ppg: 65.2, opp_ppg: 77.8, diff: -12.6, streak: ["L", "L", "L", "L", "W"] }
  ],
  teams: {
    "t1": {
      id: "t1",
      name: "Virtus Roma 1960",
      league: "Divisione Regionale 2",
      city: "Roma (RM)",
      stats: { ppg: 79.4, opp_ppg: 71.2, diff: 8.2, pace: "Fast / Transition Heavy", homeRecord: "8-1", awayRecord: "6-3" },
      roster: [
        {
          id: "p1_1",
          number: 8,
          name: "Marco Rossi",
          position: "SG",
          games: 18,
          ppg: 18.6,
          fouls: 2.1,
          threePtAtt: 7.4,
          pct_3p: 52.0,
          pct_2p: 32.0,
          pct_ft: 16.0,
          fg_pct: 46.2,
          three_pct: 38.5,
          ft_pct: 84.1,
          notes: "Dangerous pull-up shooter in transition; attacks left on high screen-and-rolls.",
          recentGames: [
            { opponent: "vs Carver", pts: 24, fouls: 2, threeMade: 5, date: "2026-10-28" },
            { opponent: "@ Petriana", pts: 18, fouls: 3, threeMade: 3, date: "2026-10-21" },
            { opponent: "vs San Paolo", pts: 16, fouls: 1, threeMade: 2, date: "2026-10-14" }
          ]
        },
        {
          id: "p1_2",
          number: 15,
          name: "Davide Moretti",
          position: "C",
          games: 17,
          ppg: 14.2,
          fouls: 3.8,
          threePtAtt: 0.5,
          pct_3p: 3.0,
          pct_2p: 68.0,
          pct_ft: 29.0,
          fg_pct: 56.4,
          three_pct: 20.0,
          ft_pct: 61.5,
          notes: "Aggressive shot blocker prone to early foul trouble on pump fakes and seal-offs.",
          recentGames: [
            { opponent: "vs Carver", pts: 12, fouls: 4, threeMade: 0, date: "2026-10-28" },
            { opponent: "@ Petriana", pts: 16, fouls: 5, threeMade: 0, date: "2026-10-21" },
            { opponent: "vs San Paolo", pts: 15, fouls: 3, threeMade: 0, date: "2026-10-14" }
          ]
        },
        {
          id: "p1_3",
          number: 23,
          name: "Matteo Bianchi",
          position: "PF",
          games: 18,
          ppg: 12.8,
          fouls: 3.6,
          threePtAtt: 2.1,
          pct_3p: 18.0,
          pct_2p: 55.0,
          pct_ft: 27.0,
          fg_pct: 51.0,
          three_pct: 31.0,
          ft_pct: 70.0,
          notes: "Physical rebounder; commits blocking fouls when challenged laterally off the dribble.",
          recentGames: [
            { opponent: "vs Carver", pts: 14, fouls: 3, threeMade: 1, date: "2026-10-28" },
            { opponent: "@ Petriana", pts: 10, fouls: 4, threeMade: 0, date: "2026-10-21" },
            { opponent: "vs San Paolo", pts: 15, fouls: 4, threeMade: 2, date: "2026-10-14" }
          ]
        },
        {
          id: "p1_4",
          number: 4,
          name: "Lorenzo Conti",
          position: "PG",
          games: 16,
          ppg: 10.5,
          fouls: 1.9,
          threePtAtt: 5.8,
          pct_3p: 62.0,
          pct_2p: 20.0,
          pct_ft: 18.0,
          fg_pct: 42.0,
          three_pct: 39.2,
          ft_pct: 88.0,
          notes: "Corner 3PT specialist and drive-and-kick floor general; rarely commits fouls.",
          recentGames: [
            { opponent: "vs Carver", pts: 9, fouls: 2, threeMade: 3, date: "2026-10-28" },
            { opponent: "@ Petriana", pts: 12, fouls: 1, threeMade: 4, date: "2026-10-21" },
            { opponent: "vs San Paolo", pts: 11, fouls: 2, threeMade: 3, date: "2026-10-14" }
          ]
        },
        {
          id: "p1_5",
          number: 11,
          name: "Andrea Ferrari",
          position: "SF",
          games: 18,
          ppg: 9.1,
          fouls: 2.4,
          threePtAtt: 3.2,
          pct_3p: 35.0,
          pct_2p: 45.0,
          pct_ft: 20.0,
          fg_pct: 44.5,
          three_pct: 33.3,
          ft_pct: 76.5,
          notes: "Baseline back-door cutter and secondary transition finisher.",
          recentGames: [
            { opponent: "vs Carver", pts: 11, fouls: 2, threeMade: 1, date: "2026-10-28" },
            { opponent: "@ Petriana", pts: 8, fouls: 3, threeMade: 1, date: "2026-10-21" },
            { opponent: "vs San Paolo", pts: 9, fouls: 1, threeMade: 0, date: "2026-10-14" }
          ]
        },
        {
          id: "p1_6",
          number: 19,
          name: "Federico Russo",
          position: "C",
          games: 14,
          ppg: 5.4,
          fouls: 3.7,
          threePtAtt: 0.2,
          pct_3p: 0.0,
          pct_2p: 72.0,
          pct_ft: 28.0,
          fg_pct: 52.0,
          three_pct: 0.0,
          ft_pct: 58.0,
          notes: "Back-up big man; frequently in foul trouble within 5 minutes of entering.",
          recentGames: [
            { opponent: "vs Carver", pts: 4, fouls: 4, threeMade: 0, date: "2026-10-28" },
            { opponent: "@ Petriana", pts: 6, fouls: 4, threeMade: 0, date: "2026-10-21" }
          ]
        }
      ]
    },
    "t2": {
      id: "t2",
      name: "Carver Cinecittà",
      league: "Divisione Regionale 2",
      city: "Roma (RM)",
      stats: { ppg: 82.1, opp_ppg: 74.5, diff: 7.6, pace: "High Octane / 3PT Oriented", homeRecord: "7-2", awayRecord: "6-3" },
      roster: [
        {
          id: "p2_1",
          number: 7,
          name: "Simone Paoletti",
          position: "PG",
          games: 18,
          ppg: 21.4,
          fouls: 2.3,
          threePtAtt: 8.5,
          pct_3p: 58.0,
          pct_2p: 26.0,
          pct_ft: 16.0,
          fg_pct: 48.0,
          three_pct: 41.2,
          ft_pct: 86.5,
          notes: "League leading scorer; lethal step-back 3PT shooter off pick-and-roll.",
          recentGames: [
            { opponent: "@ Virtus", pts: 26, fouls: 2, threeMade: 6, date: "2026-10-28" },
            { opponent: "vs Frascati", pts: 22, fouls: 1, threeMade: 4, date: "2026-10-21" }
          ]
        },
        {
          id: "p2_2",
          number: 14,
          name: "Fabio Marini",
          position: "PF",
          games: 18,
          ppg: 15.6,
          fouls: 3.9,
          threePtAtt: 1.2,
          pct_3p: 12.0,
          pct_2p: 62.0,
          pct_ft: 26.0,
          fg_pct: 54.0,
          three_pct: 28.0,
          ft_pct: 68.0,
          notes: "Aggressive rebounder and physical enforcer; commits frequent offensive fouls on screens.",
          recentGames: [
            { opponent: "@ Virtus", pts: 14, fouls: 4, threeMade: 0, date: "2026-10-28" },
            { opponent: "vs Frascati", pts: 18, fouls: 5, threeMade: 1, date: "2026-10-21" }
          ]
        },
        {
          id: "p2_3",
          number: 10,
          name: "Luca Rinaldi",
          position: "SF",
          games: 17,
          ppg: 13.8,
          fouls: 2.8,
          threePtAtt: 6.2,
          pct_3p: 48.0,
          pct_2p: 38.0,
          pct_ft: 14.0,
          fg_pct: 44.0,
          three_pct: 36.5,
          ft_pct: 78.0,
          notes: "Spot-up shooter trailing in fastbreaks; struggles defending quick wings.",
          recentGames: [
            { opponent: "@ Virtus", pts: 15, fouls: 3, threeMade: 3, date: "2026-10-28" }
          ]
        }
      ]
    },
    "t3": {
      id: "t3",
      name: "Petriana Basket",
      league: "Divisione Regionale 2",
      city: "Roma (RM)",
      stats: { ppg: 75.8, opp_ppg: 72.0, diff: 3.8, pace: "Half-Court Execution", homeRecord: "7-2", awayRecord: "5-4" },
      roster: [
        {
          id: "p3_1",
          number: 9,
          name: "Gabriele Mancini",
          position: "PG",
          games: 18,
          ppg: 16.2,
          fouls: 2.0,
          threePtAtt: 4.8,
          pct_3p: 40.0,
          pct_2p: 42.0,
          pct_ft: 18.0,
          fg_pct: 47.0,
          three_pct: 37.0,
          ft_pct: 82.0,
          notes: "Disciplined floor general; runs patient sets and hits clutch mid-range jumpers."
        },
        {
          id: "p3_2",
          number: 33,
          name: "Roberto Santoro",
          position: "C",
          games: 18,
          ppg: 13.5,
          fouls: 3.7,
          threePtAtt: 0.1,
          pct_3p: 0.0,
          pct_2p: 75.0,
          pct_ft: 25.0,
          fg_pct: 58.0,
          three_pct: 0.0,
          ft_pct: 59.0,
          notes: "Classic low-post anchor; draws double teams but gets into foul trouble vs spread lineups."
        }
      ]
    },
    "t4": {
      id: "t4",
      name: "BBA - Basketball Academy",
      league: "Divisione Regionale 2",
      city: "Roma (RM)",
      stats: { ppg: 76.5, opp_ppg: 73.1, diff: 3.4, pace: "High Intensity / Pressure Defense", homeRecord: "6-3", awayRecord: "5-4" },
      roster: [
        { id: "p4_1", number: 7, name: "Emanuele Cuomo", position: "PG", games: 18, ppg: 15.4, fouls: 2.1, threePtAtt: 4.5, pct_3p: 38.0, pct_2p: 42.0, pct_ft: 20.0, fg_pct: 46.0, three_pct: 36.0, ft_pct: 82.0, notes: "Our floor leader and perimeter creator." },
        { id: "p4_2", number: 12, name: "Matteo Silvestri", position: "SG", games: 17, ppg: 14.1, fouls: 1.8, threePtAtt: 6.2, pct_3p: 55.0, pct_2p: 30.0, pct_ft: 15.0, fg_pct: 45.0, three_pct: 39.0, ft_pct: 85.0, notes: "Sharpshooter on catch-and-shoot actions." }
      ]
    }
  }
};

export default function LeagueHub({ showToast }) {
  const [leagueData, setLeagueData] = useState(() => {
    try {
      const saved = localStorage.getItem('bba_league_hub_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LEAGUE_DATA;
  });

  // Navigation hierarchy: 'STANDINGS' | 'TEAM_DETAIL'
  const [currentView, setCurrentView] = useState('STANDINGS');
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // Selected Player for Slide-Out Profile Panel
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // JSON Importer Modal State
  const [showImporter, setShowImporter] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Standings Search & Filter
  const [standingsSearch, setStandingsSearch] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterSortBy, setRosterSortBy] = useState('ppg'); // 'ppg' | 'fouls' | 'three' | 'number'

  // Persist updated league data
  const handleUpdateLeagueData = (newData) => {
    setLeagueData(newData);
    try {
      localStorage.setItem('bba_league_hub_data', JSON.stringify(newData));
    } catch (e) {}
  };

  // Safe navigation helpers
  const handleSelectTeam = (teamId) => {
    setSelectedTeamId(teamId);
    setCurrentView('TEAM_DETAIL');
    setSelectedPlayer(null);
    setRosterSearch('');
  };

  const handleBackToStandings = () => {
    setCurrentView('STANDINGS');
    setSelectedTeamId(null);
    setSelectedPlayer(null);
  };

  // Selected Team Object
  const currentTeam = useMemo(() => {
    if (!selectedTeamId || !leagueData?.teams) return null;
    return leagueData.teams[selectedTeamId] || null;
  }, [selectedTeamId, leagueData]);

  // Normalize Ingested JSON (supports full league schema OR legacy single-team JSON)
  const handleIngestJSON = (rawString) => {
    try {
      const parsed = JSON.parse(rawString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON structure');
      }

      // Check if it's already a full league schema
      if (Array.isArray(parsed.standings) && parsed.teams && typeof parsed.teams === 'object') {
        handleUpdateLeagueData(parsed);
        setStatusMsg(`✅ Successfully ingested full league: "${parsed.leagueName || 'Championship'}" (${parsed.standings.length} teams)`);
        if (showToast) showToast('🏆 League data ingested successfully');
        setShowImporter(false);
        return;
      }

      // If it's a single team JSON (like previous Phase 3 shape), gracefully wrap it into the league!
      if (parsed.team && Array.isArray(parsed.players)) {
        const teamId = "scouted_team_1";
        const teamName = parsed.team.name || "Scouted Opponent";
        const newLeague = {
          lastUpdated: new Date().toISOString().split('T')[0],
          leagueName: parsed.team.league || "Divisione Regionale 2",
          season: parsed.team.season || "2025/2026",
          standings: [
            {
              id: teamId,
              rank: 1,
              name: teamName,
              points: (parsed.team.record?.wins || 0) * 2,
              w: parsed.team.record?.wins || 0,
              l: parsed.team.record?.losses || 0,
              gp: (parsed.team.record?.wins || 0) + (parsed.team.record?.losses || 0),
              ppg: parsed.team.ppg || 0,
              opp_ppg: parsed.team.pointsAllowed || 0,
              diff: parsed.team.netMargin || 0,
              streak: parsed.team.lastFive || ["W"]
            }
          ],
          teams: {
            [teamId]: {
              id: teamId,
              name: teamName,
              league: parsed.team.league || "Divisione Regionale 2",
              stats: {
                ppg: parsed.team.ppg || 0,
                opp_ppg: parsed.team.pointsAllowed || 0,
                diff: parsed.team.netMargin || 0,
                pace: parsed.team.paceRating || "Standard Pace"
              },
              roster: parsed.players.map((p, idx) => ({
                id: `p_${idx}`,
                number: p.number ?? (idx + 1),
                name: p.name || `Player #${idx + 1}`,
                position: p.position || 'N/A',
                games: p.games || 0,
                ppg: p.ppg || 0,
                fouls: p.foulsPerGame || p.fouls || 0,
                threePtAtt: p.threePtAttPerGame || p.threePtAtt || 0,
                pct_3p: p.pctFromThree || p.pct_3p || 0,
                pct_2p: p.pctFromTwo || p.pct_2p || 0,
                pct_ft: p.pctFromFt || p.pct_ft || 0,
                fg_pct: p.fgPct || p.fg_pct || 0,
                three_pct: p.threePtPct || p.three_pct || 0,
                ft_pct: p.ftPct || p.ft_pct || 0,
                notes: p.notes || ''
              }))
            }
          }
        };

        handleUpdateLeagueData(newLeague);
        setStatusMsg(`✅ Ingested team "${teamName}" into League Hub!`);
        if (showToast) showToast(`🎯 Loaded ${teamName}`);
        handleSelectTeam(teamId);
        setShowImporter(false);
        return;
      }

      throw new Error('Unrecognized JSON format. Expected full league schema or team scout JSON.');
    } catch (err) {
      console.error('League JSON ingest error:', err);
      setStatusMsg(`❌ Error: ${err.message}`);
      if (showToast) showToast(`❌ Ingest error: ${err.message}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') handleIngestJSON(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') handleIngestJSON(content);
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    handleUpdateLeagueData(DEFAULT_LEAGUE_DATA);
    setStatusMsg('✅ Restored standard Divisione Regionale 2 championship data');
    if (showToast) showToast('🏆 Sample League Loaded');
    setCurrentView('STANDINGS');
    setSelectedTeamId(null);
    setSelectedPlayer(null);
  };

  // Filtered Standings
  const filteredStandings = useMemo(() => {
    const list = leagueData?.standings || [];
    if (!standingsSearch.trim()) return list;
    const q = standingsSearch.toLowerCase().trim();
    return list.filter(t => t.name.toLowerCase().includes(q));
  }, [leagueData?.standings, standingsSearch]);

  // Tactical Groups for Current Team Detail
  const foulTroubleTargets = useMemo(() => {
    if (!currentTeam?.roster) return [];
    return currentTeam.roster
      .filter(p => (p.fouls || p.foulsPerGame || 0) >= 3.5)
      .sort((a, b) => (b.fouls || 0) - (a.fouls || 0));
  }, [currentTeam]);

  const perimeterShooters = useMemo(() => {
    if (!currentTeam?.roster) return [];
    return currentTeam.roster
      .filter(p => (p.threePtAtt || p.threePtAttPerGame || 0) >= 4.0 || (p.pct_3p || p.pctFromThree || 0) >= 40.0)
      .sort((a, b) => (b.threePtAtt || 0) - (a.threePtAtt || 0));
  }, [currentTeam]);

  // Filtered Roster for Current Team
  const filteredRoster = useMemo(() => {
    let list = currentTeam?.roster || [];
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || String(p.number).includes(q) || p.position.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (rosterSortBy === 'ppg') return (b.ppg || 0) - (a.ppg || 0);
      if (rosterSortBy === 'fouls') return (b.fouls || 0) - (a.fouls || 0);
      if (rosterSortBy === 'three') return (b.threePtAtt || 0) - (a.threePtAtt || 0);
      if (rosterSortBy === 'number') return Number(a.number) - Number(b.number);
      return 0;
    });
  }, [currentTeam, rosterSearch, rosterSortBy]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 max-w-7xl mx-auto w-full space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION                                                */}
      {/* ========================================================================= */}
      <div className="glass-card p-4 border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-none shadow-inner">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              LEAGUE HUB
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40">
                CHAMPIONSHIP EXPLORER
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              {leagueData.leagueName || 'Regional Championship'} • Season {leagueData.season || '2025/2026'}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Load default championship league dataset"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>LOAD SAMPLE LEAGUE</span>
          </button>

          <button
            onClick={() => {
              setShowImporter(true);
              setJsonInputText(JSON.stringify(leagueData, null, 2));
            }}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-md active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>IMPORT LEAGUE JSON</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: STANDINGS (MAIN CHAMPIONSHIP OVERVIEW)                            */}
      {/* ========================================================================= */}
      {currentView === 'STANDINGS' && (
        <div className="space-y-4 animate-fade-in">
          {/* Quick League Leaders Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="glass-card p-3 border-amber-500/30 bg-slate-900/90 shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                LEAGUE LEADER
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-black text-slate-100">
                  {leagueData.standings?.[0]?.name || 'N/A'}
                </span>
                <span className="font-mono text-sm font-black text-amber-400">
                  {leagueData.standings?.[0]?.points || 0} PTS
                </span>
              </div>
            </div>

            <div className="glass-card p-3 border-sky-500/30 bg-slate-900/90 shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
                TOP OFFENSE (PPG)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-black text-slate-100">
                  {leagueData.standings?.reduce((max, t) => t.ppg > (max.ppg || 0) ? t : max, leagueData.standings[0])?.name || 'N/A'}
                </span>
                <span className="font-mono text-sm font-black text-sky-400">
                  {leagueData.standings?.reduce((max, t) => t.ppg > (max.ppg || 0) ? t : max, leagueData.standings[0])?.ppg || 0} PPG
                </span>
              </div>
            </div>

            <div className="glass-card p-3 border-emerald-500/30 bg-slate-900/90 shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                BEST DEFENSE (FEWEST PTS ALLOWED)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-black text-slate-100">
                  {leagueData.standings?.reduce((min, t) => t.opp_ppg < (min.opp_ppg || 999) ? t : min, leagueData.standings[0])?.name || 'N/A'}
                </span>
                <span className="font-mono text-sm font-black text-emerald-400">
                  {leagueData.standings?.reduce((min, t) => t.opp_ppg < (min.opp_ppg || 999) ? t : min, leagueData.standings[0])?.opp_ppg || 0} OPP
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
                  Click any team row to inspect full scouting report, roster statistics, and tactical target board
                </p>
              </div>

              {/* Search filter */}
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
                    <th className="p-3 text-center">PTS</th>
                    <th className="p-3 text-center">W</th>
                    <th className="p-3 text-center">L</th>
                    <th className="p-3 text-center">GP</th>
                    <th className="p-3 text-center">WIN%</th>
                    <th className="p-3 text-center">PPG</th>
                    <th className="p-3 text-center">OPP</th>
                    <th className="p-3 text-center">+/-</th>
                    <th className="p-3 text-center">LAST 5</th>
                    <th className="p-3 text-right">SCOUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredStandings.map((team, idx) => {
                    const isBBA = team.name.includes('BBA');
                    const rankNum = team.rank || idx + 1;
                    const isPlayoff = rankNum <= 4;
                    const isPlayout = rankNum >= 7;

                    return (
                      <tr
                        key={team.id || idx}
                        onClick={() => handleSelectTeam(team.id)}
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
                          <span className="text-sm">{team.name}</span>
                          {isBBA && (
                            <span className="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.2 rounded border border-sky-500/40">
                              OUR TEAM
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-amber-400 text-sm">
                          {team.points}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-200">
                          {team.w}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-400">
                          {team.l}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">
                          {team.gp || (team.w + team.l)}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-300">
                          {team.gp > 0 ? `${Math.round((team.w / team.gp) * 100)}%` : '-'}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-rose-400">
                          {team.ppg}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-300">
                          {team.opp_ppg}
                        </td>
                        <td className="p-3 text-center font-mono font-black">
                          <span className={team.diff > 0 ? 'text-emerald-400' : (team.diff < 0 ? 'text-rose-400' : 'text-slate-400')}>
                            {team.diff > 0 ? `+${team.diff}` : team.diff}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {Array.isArray(team.streak) && team.streak.map((s, i) => (
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
                            onClick={(e) => { e.stopPropagation(); handleSelectTeam(team.id); }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1 rounded text-xs transition-all inline-flex items-center gap-1"
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
      {/* VIEW B: TEAM DETAIL & SCOUTING REPORT                                     */}
      {/* ========================================================================= */}
      {currentView === 'TEAM_DETAIL' && (
        <div className="space-y-4 animate-fade-in">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleBackToStandings}
              className="bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-black px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>BACK TO STANDINGS</span>
            </button>

            {/* Quick Team Switcher Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">SWITCH TEAM:</span>
              <select
                value={selectedTeamId || ''}
                onChange={(e) => handleSelectTeam(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold p-2 rounded-xl focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {leagueData.standings?.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                    #{t.rank || '-'} {t.name} ({t.points} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!currentTeam ? (
            <div className="glass-card p-12 text-center border-slate-800 space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">No detailed roster data found for this team.</p>
              <button onClick={handleBackToStandings} className="text-xs text-sky-400 hover:underline">
                Return to Standings
              </button>
            </div>
          ) : (
            <>
              {/* 1. Team Profile Header Card */}
              <div className="glass-card p-4 sm:p-5 border-slate-800 bg-slate-900/90 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-xl sm:text-2xl font-black text-rose-400 uppercase tracking-wider">
                        {currentTeam.name}
                      </h2>
                      <span className="text-[10px] bg-slate-950 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-800">
                        {currentTeam.league || 'Divisione Regionale 2'}
                      </span>
                      {currentTeam.stats?.pace && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {currentTeam.stats.pace}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Opponent Scouting Profile • {currentTeam.roster?.length || 0} active roster players tracked
                    </p>
                  </div>

                  {/* Standing points pill */}
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      CHAMPIONSHIP RANK
                    </span>
                    <div className="font-mono text-xl font-black text-amber-400">
                      {leagueData.standings?.find(s => s.id === currentTeam.id)?.points || 0} PTS
                      <span className="text-xs text-slate-300 font-semibold ml-1.5">
                        (#{leagueData.standings?.find(s => s.id === currentTeam.id)?.rank || '-'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team Stats Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      POINTS SCORED (PPG)
                    </span>
                    <span className="font-mono text-xl font-black text-rose-400">
                      {currentTeam.stats?.ppg || 0}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      POINTS ALLOWED (OPP)
                    </span>
                    <span className="font-mono text-xl font-black text-slate-200">
                      {currentTeam.stats?.opp_ppg || 0}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      NET SCORING MARGIN
                    </span>
                    <span className={`font-mono text-xl font-black ${
                      (currentTeam.stats?.diff || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(currentTeam.stats?.diff || 0) > 0 ? `+${currentTeam.stats.diff}` : currentTeam.stats?.diff || 0}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      ROSTER DEPTH
                    </span>
                    <span className="font-mono text-xl font-black text-sky-400">
                      {currentTeam.roster?.length || 0} Players
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Target Board: Tactical Matchup Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Board 1: Foul Trouble Targets */}
                <div className="glass-card p-4 border-amber-500/30 bg-slate-900/90 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      </div>
                      <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                        FOUL TROUBLE CANDIDATES (&gt;3.5 F/G)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      {foulTroubleTargets.length} TARGETS
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Coach Strategy:</strong> Attack in the paint early with shot fakes and aggressive drives to force bench rotation or foul out.
                  </p>

                  <div className="space-y-2">
                    {foulTroubleTargets.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/60 rounded-lg">
                        No players averaging &gt; 3.5 fouls/game.
                      </div>
                    ) : (
                      foulTroubleTargets.map(p => (
                        <div
                          key={p.id || p.number}
                          onClick={() => setSelectedPlayer(p)}
                          className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-400 text-xs">#{p.number}</span>
                              <span className="font-black text-slate-200 text-xs group-hover:text-amber-300">{p.name}</span>
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-bold">{p.position}</span>
                            </div>
                            {p.notes && <p className="text-[11px] text-slate-400 mt-1 italic">"{p.notes}"</p>}
                          </div>

                          <div className="text-right flex-none">
                            <span className="font-mono text-xs font-black text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded block">
                              {Number(p.fouls || p.foulsPerGame || 0).toFixed(1)} F/G
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold block mt-0.5">{p.ppg} PPG</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Target Board 2: Primary Perimeter Shooters */}
                <div className="glass-card p-4 border-sky-500/30 bg-slate-900/90 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                        <Target className="w-4 h-4 text-sky-400" />
                      </div>
                      <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                        PRIMARY PERIMETER SHOOTERS
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-sky-400">
                      {perimeterShooters.length} SHOOTERS
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Coach Strategy:</strong> No-help perimeter coverage. Close out aggressive on catch, contest high, force into mid-range pull-ups.
                  </p>

                  <div className="space-y-2">
                    {perimeterShooters.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/60 rounded-lg">
                        No high-volume 3PT shooters identified in current roster.
                      </div>
                    ) : (
                      perimeterShooters.map(p => (
                        <div
                          key={p.id || p.number}
                          onClick={() => setSelectedPlayer(p)}
                          className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-sky-400/50 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-sky-400 text-xs">#{p.number}</span>
                              <span className="font-black text-slate-200 text-xs group-hover:text-sky-300">{p.name}</span>
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-bold">{p.position}</span>
                            </div>
                            {p.notes && <p className="text-[11px] text-slate-400 mt-1 italic">"{p.notes}"</p>}
                          </div>

                          <div className="text-right flex-none">
                            <span className="font-mono text-xs font-black text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded block">
                              {Number(p.threePtAtt || p.threePtAttPerGame || 0).toFixed(1)} 3PA/G
                            </span>
                            <span className="text-[9px] text-amber-400 font-bold block mt-0.5">
                              {p.three_pct || p.threePtPct || 0}% 3P
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Interactive Roster Table & Scoring Breakdown */}
              <div className="glass-card p-4 border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-rose-400" />
                      ROSTER PROFILES & SCORING COMPOSITION
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Click any player row to view detailed shooting profile & recent game logs
                    </p>
                  </div>

                  {/* Filter & Sort */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search roster..."
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-400 w-40"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                      <span className="text-slate-500 font-bold px-1 uppercase">SORT:</span>
                      {[
                        { id: 'ppg', label: 'PPG' },
                        { id: 'three', label: '3PT' },
                        { id: 'fouls', label: 'FOULS' },
                        { id: 'number', label: '#' }
                      ].map(s => (
                        <button
                          key={s.id}
                          onClick={() => setRosterSortBy(s.id)}
                          className={`px-2 py-0.5 font-bold rounded transition-all ${
                            rosterSortBy === s.id ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">PLAYER</th>
                        <th className="p-2.5 text-center">POS</th>
                        <th className="p-2.5 text-center">GP</th>
                        <th className="p-2.5 text-center">PPG</th>
                        <th className="p-2.5 w-48 sm:w-64">SCORING BREAKDOWN (% OF PTS)</th>
                        <th className="p-2.5 text-center">3PA/G</th>
                        <th className="p-2.5 text-center">3P%</th>
                        <th className="p-2.5 text-center">FT%</th>
                        <th className="p-2.5 text-center">FOULS</th>
                        <th className="p-2.5">SCOUTING TAGS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredRoster.map(p => {
                        const pct3 = p.pct_3p ?? p.pctFromThree ?? 0;
                        const pct2 = p.pct_2p ?? p.pctFromTwo ?? 0;
                        const pctFt = p.pct_ft ?? p.pctFromFt ?? 0;
                        const threePa = p.threePtAtt ?? p.threePtAttPerGame ?? 0;
                        const fpg = p.fouls ?? p.foulsPerGame ?? 0;
                        const isShooter = threePa >= 4.0 || pct3 >= 40;
                        const isFoulProne = fpg >= 3.5;

                        return (
                          <tr
                            key={p.id || p.number}
                            onClick={() => setSelectedPlayer(p)}
                            className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="p-2.5 font-mono font-black text-rose-400">
                              #{p.number}
                            </td>
                            <td className="p-2.5 font-black text-slate-200">
                              {p.name}
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-400">
                              {p.position}
                            </td>
                            <td className="p-2.5 text-center font-mono text-slate-300">
                              {p.games || '-'}
                            </td>
                            <td className="p-2.5 text-center font-mono font-black text-slate-100 text-sm">
                              {Number(p.ppg || 0).toFixed(1)}
                            </td>
                            <td className="p-2.5">
                              <div className="space-y-1">
                                <div className="h-3 w-full bg-slate-950 rounded overflow-hidden flex border border-slate-800">
                                  <div style={{ width: `${pct3}%` }} className="bg-amber-400 h-full" title={`3P: ${pct3}%`} />
                                  <div style={{ width: `${pct2}%` }} className="bg-sky-400 h-full" title={`2P: ${pct2}%`} />
                                  <div style={{ width: `${pctFt}%` }} className="bg-emerald-400 h-full" title={`FT: ${pctFt}%`} />
                                </div>
                                <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                                  <span className="text-amber-400">{pct3}% 3P</span>
                                  <span className="text-sky-400">{pct2}% 2P</span>
                                  <span className="text-emerald-400">{pctFt}% FT</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-sky-400">
                              {Number(threePa).toFixed(1)}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-amber-300">
                              {p.three_pct ?? p.threePtPct ?? 0}%
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-emerald-300">
                              {p.ft_pct ?? p.ftPct ?? 0}%
                            </td>
                            <td className="p-2.5 text-center font-mono font-black">
                              <span className={`px-1.5 py-0.5 rounded ${
                                isFoulProne ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'text-slate-300'
                              }`}>
                                {Number(fpg).toFixed(1)}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1 flex-wrap">
                                {isShooter && (
                                  <span className="text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <Target className="w-2.5 h-2.5" /> SHOOTER
                                  </span>
                                )}
                                {isFoulProne && (
                                  <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" /> FOUL PRONE
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
            </>
          )}
        </div>
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
                    <span className="text-rose-400">{currentTeam?.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Stats Strip */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">PPG</span>
                <span className="font-mono text-lg font-black text-rose-400">{selectedPlayer.ppg}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">3PA/G</span>
                <span className="font-mono text-lg font-black text-sky-400">{selectedPlayer.threePtAtt ?? selectedPlayer.threePtAttPerGame ?? 0}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">3P%</span>
                <span className="font-mono text-lg font-black text-amber-300">{selectedPlayer.three_pct ?? selectedPlayer.threePtPct ?? 0}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">FOULS</span>
                <span className="font-mono text-lg font-black text-emerald-400">{selectedPlayer.fouls ?? selectedPlayer.foulsPerGame ?? 0}</span>
              </div>
            </div>

            {/* Tactical Scouting Notes */}
            {selectedPlayer.notes && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px] tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>TACTICAL SCOUTING REPORT</span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{selectedPlayer.notes}"
                </p>
              </div>
            )}

            {/* Scoring Distribution */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                POINT DISTRIBUTION (% OF TOTAL SCORING)
              </span>
              <div className="h-4 w-full bg-slate-900 rounded overflow-hidden flex border border-slate-800">
                <div style={{ width: `${selectedPlayer.pct_3p ?? selectedPlayer.pctFromThree ?? 0}%` }} className="bg-amber-400 h-full" />
                <div style={{ width: `${selectedPlayer.pct_2p ?? selectedPlayer.pctFromTwo ?? 0}%` }} className="bg-sky-400 h-full" />
                <div style={{ width: `${selectedPlayer.pct_ft ?? selectedPlayer.pctFromFt ?? 0}%` }} className="bg-emerald-400 h-full" />
              </div>
              <div className="grid grid-cols-3 text-center text-xs font-mono font-bold pt-1">
                <span className="text-amber-400">{selectedPlayer.pct_3p ?? selectedPlayer.pctFromThree ?? 0}% from 3PT</span>
                <span className="text-sky-400">{selectedPlayer.pct_2p ?? selectedPlayer.pctFromTwo ?? 0}% from 2PT</span>
                <span className="text-emerald-400">{selectedPlayer.pct_ft ?? selectedPlayer.pctFromFt ?? 0}% from FT</span>
              </div>
            </div>

            {/* Recent Performances (if present) */}
            {Array.isArray(selectedPlayer.recentGames) && selectedPlayer.recentGames.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  RECENT PERFORMANCES (LAST {selectedPlayer.recentGames.length} GAMES)
                </span>
                <div className="space-y-1.5">
                  {selectedPlayer.recentGames.map((g, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200 block">{g.opponent}</span>
                        <span className="text-[10px] text-slate-500">{g.date}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono font-bold">
                        <span className="text-rose-400 font-black">{g.pts} PTS</span>
                        <span className="text-amber-300">{g.threeMade} 3PM</span>
                        <span className="text-slate-400">{g.fouls} FOULS</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. JSON IMPORTER MODAL                                                    */}
      {/* ========================================================================= */}
      {showImporter && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                    INGEST CHAMPIONSHIP LEAGUE JSON
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Load multi-team standings & scouting reports from external Python FIP scraper
                  </p>
                </div>
              </div>
              <button onClick={() => setShowImporter(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                isDragOver ? 'border-rose-400 bg-rose-500/10' : 'border-slate-700 bg-slate-950/60'
              }`}
            >
              <FileCode className="w-7 h-7 text-rose-400/80 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-200 mb-1">
                Drop your <code className="text-rose-300">league_data.json</code> file here
              </p>
              <label className="bg-rose-600 hover:bg-rose-500 text-white font-black px-3.5 py-1.5 rounded-lg text-xs cursor-pointer shadow-md inline-flex items-center gap-1.5 active:scale-95 transition-all mt-1">
                <FileText className="w-3.5 h-3.5" />
                <span>SELECT JSON FILE</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Raw JSON Paste Area */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                OR PASTE JSON CODE DIRECTLY:
              </label>
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                rows={8}
                placeholder='{"standings": [...], "teams": {...}}'
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Modal Actions */}
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
                  onClick={() => handleIngestJSON(jsonInputText)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-1.5 rounded-lg text-xs transition-all shadow-md active:scale-95"
                >
                  PARSE & LOAD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
