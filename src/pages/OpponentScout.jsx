import React, { useState, useMemo } from 'react';
import { 
  Crosshair, ShieldAlert, Target, Upload, FileText, CheckCircle2, 
  AlertTriangle, Trophy, Zap, Flame, RefreshCw, Search, 
  FileCode, ArrowRight, Shield, Activity, BarChart2, Check, X
} from 'lucide-react';

// Default mock opponent report shaped like external Python FIP stats scraper output
export const DEFAULT_MOCK_OPPONENT = {
  team: {
    name: "Virtus Roma 1960",
    league: "Serie B Interregionale - Girone F",
    season: "2025/2026",
    record: {
      wins: 14,
      losses: 4,
      winPct: 77.8
    },
    ppg: 79.4,
    pointsAllowed: 71.2,
    netMargin: 8.2,
    lastFive: ["W", "W", "L", "W", "W"],
    paceRating: "Fast / Transition Heavy"
  },
  players: [
    {
      number: 8,
      name: "Marco Rossi",
      position: "SG",
      games: 18,
      ppg: 18.6,
      foulsPerGame: 2.1,
      threePtAttPerGame: 7.4,
      pctFromThree: 52.0,
      pctFromTwo: 32.0,
      pctFromFt: 16.0,
      fgPct: 46.2,
      threePtPct: 38.5,
      ftPct: 84.1,
      notes: "Dangerous pull-up shooter in transition; attacks left on high screen-and-rolls."
    },
    {
      number: 15,
      name: "Davide Moretti",
      position: "C",
      games: 17,
      ppg: 14.2,
      foulsPerGame: 3.8,
      threePtAttPerGame: 0.5,
      pctFromThree: 3.0,
      pctFromTwo: 68.0,
      pctFromFt: 29.0,
      fgPct: 56.4,
      threePtPct: 20.0,
      ftPct: 61.5,
      notes: "Aggressive shot blocker prone to early foul trouble on pump fakes and seal-offs."
    },
    {
      number: 23,
      name: "Matteo Bianchi",
      position: "PF",
      games: 18,
      ppg: 12.8,
      foulsPerGame: 3.6,
      threePtAttPerGame: 2.1,
      pctFromThree: 18.0,
      pctFromTwo: 55.0,
      pctFromFt: 27.0,
      fgPct: 51.0,
      threePtPct: 31.0,
      ftPct: 70.0,
      notes: "Physical rebounder; commits blocking fouls when challenged laterally off the dribble."
    },
    {
      number: 4,
      name: "Lorenzo Conti",
      position: "PG",
      games: 16,
      ppg: 10.5,
      foulsPerGame: 1.9,
      threePtAttPerGame: 5.8,
      pctFromThree: 62.0,
      pctFromTwo: 20.0,
      pctFromFt: 18.0,
      fgPct: 42.0,
      threePtPct: 39.2,
      ftPct: 88.0,
      notes: "Corner 3PT specialist and drive-and-kick floor general; rarely commits fouls."
    },
    {
      number: 11,
      name: "Andrea Ferrari",
      position: "SF",
      games: 18,
      ppg: 9.1,
      foulsPerGame: 2.4,
      threePtAttPerGame: 3.2,
      pctFromThree: 35.0,
      pctFromTwo: 45.0,
      pctFromFt: 20.0,
      fgPct: 44.5,
      threePtPct: 33.3,
      ftPct: 76.5,
      notes: "Baseline back-door cutter and secondary transition finisher."
    },
    {
      number: 7,
      name: "Giacomo De Luca",
      position: "G",
      games: 15,
      ppg: 6.8,
      foulsPerGame: 1.8,
      threePtAttPerGame: 2.0,
      pctFromThree: 28.0,
      pctFromTwo: 52.0,
      pctFromFt: 20.0,
      fgPct: 41.0,
      threePtPct: 29.5,
      ftPct: 75.0,
      notes: "Defensive perimeter stopper off the bench; aggressive full-court presser."
    },
    {
      number: 19,
      name: "Federico Russo",
      position: "PF/C",
      games: 14,
      ppg: 5.4,
      foulsPerGame: 3.7,
      threePtAttPerGame: 0.2,
      pctFromThree: 0.0,
      pctFromTwo: 72.0,
      pctFromFt: 28.0,
      fgPct: 52.0,
      threePtPct: 0.0,
      ftPct: 58.0,
      notes: "Back-up big man; frequently in foul trouble within 5 minutes of entering."
    }
  ]
};

export default function OpponentScout({ showToast }) {
  const [scoutData, setScoutData] = useState(() => {
    try {
      const saved = localStorage.getItem('bba_opponent_scout_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MOCK_OPPONENT;
  });

  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'RAW_JSON'
  const [jsonText, setJsonText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('ppg'); // 'ppg' | 'fouls' | 'three' | 'number'
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Persist current scout data
  const handleUpdateScoutData = (newData) => {
    setScoutData(newData);
    try {
      localStorage.setItem('bba_opponent_scout_data', JSON.stringify(newData));
    } catch (e) {}
  };

  // Parse JSON file or text
  const handleParseJSON = (rawString) => {
    try {
      const parsed = JSON.parse(rawString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON format');
      }

      // Basic validation for opponent data shape
      const teamName = parsed.team?.name || parsed.teamName || 'Opponent Team';
      const players = Array.isArray(parsed.players) ? parsed.players : [];

      const normalized = {
        team: {
          name: teamName,
          league: parsed.team?.league || 'FIP League',
          season: parsed.team?.season || 'Current Season',
          record: parsed.team?.record || { wins: 0, losses: 0, winPct: 0 },
          ppg: Number(parsed.team?.ppg || 0),
          pointsAllowed: Number(parsed.team?.pointsAllowed || parsed.team?.oppPpg || 0),
          netMargin: Number(parsed.team?.netMargin || 0),
          lastFive: Array.isArray(parsed.team?.lastFive) ? parsed.team.lastFive : ['W', 'W', 'W'],
          paceRating: parsed.team?.paceRating || 'Standard Pace'
        },
        players: players.map((p, idx) => ({
          number: p.number ?? p.jersey ?? (idx + 1),
          name: p.name || `Player #${p.number || idx + 1}`,
          position: p.position || p.pos || 'N/A',
          games: Number(p.games || p.gp || 0),
          ppg: Number(p.ppg || p.pts || 0),
          foulsPerGame: Number(p.foulsPerGame || p.fpg || p.fouls || 0),
          threePtAttPerGame: Number(p.threePtAttPerGame || p.threePa || 0),
          pctFromThree: Number(p.pctFromThree || 0),
          pctFromTwo: Number(p.pctFromTwo || 0),
          pctFromFt: Number(p.pctFromFt || 0),
          fgPct: Number(p.fgPct || 0),
          threePtPct: Number(p.threePtPct || p.threePct || 0),
          ftPct: Number(p.ftPct || 0),
          notes: p.notes || ''
        }))
      };

      handleUpdateScoutData(normalized);
      setStatusMsg(`Successfully loaded report for "${teamName}" (${players.length} players)`);
      if (showToast) showToast(`Loaded Opponent Report: ${teamName}`);
      setActiveTab('DASHBOARD');
    } catch (err) {
      console.error('JSON parse error:', err);
      setStatusMsg(`Error parsing JSON: ${err.message}`);
      if (showToast) showToast('Error parsing JSON report');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        handleParseJSON(content);
      }
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
      if (typeof content === 'string') {
        handleParseJSON(content);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    handleUpdateScoutData(DEFAULT_MOCK_OPPONENT);
    setStatusMsg(`Loaded default FIP sample report: "${DEFAULT_MOCK_OPPONENT.team.name}"`);
    if (showToast) showToast('Loaded sample FIP opponent report');
    setActiveTab('DASHBOARD');
  };

  const handleClear = () => {
    const empty = {
      team: { name: 'No Team Loaded', league: '', season: '', record: { wins: 0, losses: 0, winPct: 0 }, ppg: 0, pointsAllowed: 0, netMargin: 0, lastFive: [] },
      players: []
    };
    handleUpdateScoutData(empty);
    setStatusMsg('Cleared opponent report');
  };

  // Tactical Alert Groups
  const foulTroubleCandidates = useMemo(() => {
    return (scoutData.players || [])
      .filter(p => p.foulsPerGame >= 3.5)
      .sort((a, b) => b.foulsPerGame - a.foulsPerGame);
  }, [scoutData.players]);

  const primaryShooters = useMemo(() => {
    return (scoutData.players || [])
      .filter(p => p.threePtAttPerGame >= 4.0 || p.pctFromThree >= 40.0)
      .sort((a, b) => b.threePtAttPerGame - a.threePtAttPerGame);
  }, [scoutData.players]);

  // Filter & sort players
  const filteredPlayers = useMemo(() => {
    let list = scoutData.players || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || String(p.number).includes(q) || p.position.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'ppg') return b.ppg - a.ppg;
      if (sortBy === 'fouls') return b.foulsPerGame - a.foulsPerGame;
      if (sortBy === 'three') return b.threePtAttPerGame - a.threePtAttPerGame;
      if (sortBy === 'number') return Number(a.number) - Number(b.number);
      return 0;
    });
  }, [scoutData.players, searchQuery, sortBy]);

  const team = scoutData.team || {};

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 max-w-7xl mx-auto w-full space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & INGESTION STATUS BAR                                      */}
      {/* ========================================================================= */}
      <div className="glass-card p-4 border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-none shadow-inner">
            <Crosshair className="w-5 h-5 text-[#A7F3D0]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              OPPONENT SCOUT
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/40">
                FIP STATS INGESTION
              </span>
            </h1>
            <p className="text-xs text-[#022D32]/70 font-semibold">
              Scouting report & tactical target board generated from Python FIP scraper
            </p>
          </div>
        </div>

        {/* View Switcher & Sample Loader */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 bg-[#022D32] hover:bg-[#022D32]/90 border border-[#022D32] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Load standard sample Virtus Roma FIP report"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#A7F3D0]" />
            <span>LOAD SAMPLE DATA</span>
          </button>

          <div className="flex bg-white p-0.5 rounded-lg border border-[#DDF3E9] shadow-sm">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`px-3 py-1.5 text-xs font-black rounded-md transition-all ${
                activeTab === 'DASHBOARD'
                  ? 'bg-[#0CA17A] text-white shadow-sm font-black'
                  : 'text-[#022D32]/60 hover:text-[#022D32] hover:bg-[#DDF3E9]/40 font-bold'
              }`}
            >
              SCOUT DASHBOARD
            </button>
            <button
              onClick={() => {
                setActiveTab('RAW_JSON');
                setJsonText(JSON.stringify(scoutData, null, 2));
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'RAW_JSON'
                  ? 'bg-[#0CA17A] text-white shadow-sm font-black'
                  : 'text-[#022D32]/60 hover:text-[#022D32] hover:bg-[#DDF3E9]/40 font-bold'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>IMPORT JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className="p-2.5 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/40 text-xs font-bold text-[#022D32] flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-[#022D32]/60 hover:text-[#022D32]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. JSON IMPORTER (IF ACTIVE)                                              */}
      {/* ========================================================================= */}
      {activeTab === 'RAW_JSON' && (
        <div className="bg-white p-5 border border-[#DDF3E9] rounded-2xl shadow-sm space-y-4 animate-fade-in text-[#022D32]">
          <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#0CA17A]" />
              <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                LOAD OPPONENT JSON REPORT
              </h3>
            </div>
            <span className="text-[10px] text-[#022D32]/60 font-semibold">
              Drop Python FIP Scraper JSON File or Paste Directly
            </span>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragOver 
                ? 'border-[#0CA17A] bg-[#DDF3E9]/50' 
                : 'border-[#DDF3E9] hover:border-[#0CA17A] bg-[#F8F9FA]'
            }`}
          >
            <Upload className="w-8 h-8 text-[#0CA17A] mx-auto mb-2 font-black" />
            <p className="text-xs font-bold text-[#022D32] mb-1">
              Drag and drop an opponent <code className="text-[#0CA17A] font-bold">.json</code> file here
            </p>
            <p className="text-[11px] text-[#022D32]/70 mb-3">
              or select file directly from your computer
            </p>
            <label className="bg-[#022D32] hover:bg-[#022D32]/90 text-white font-black px-4 py-2 rounded-lg text-xs cursor-pointer shadow-md inline-flex items-center gap-2 active:scale-95 transition-all border border-[#022D32]">
              <FileText className="w-3.5 h-3.5" />
              <span>CHOOSE JSON FILE</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Paste Raw JSON Text */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-[#022D32]/80">
              OR PASTE JSON REPORT CONTENT:
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              placeholder='{"team": {"name": "Virtus Roma", "ppg": 79.4}, "players": [...]}'
              className="w-full bg-[#F8F9FA] border border-[#DDF3E9] rounded-xl p-3 font-mono text-xs text-[#022D32] focus:outline-none focus:border-[#0CA17A]"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleClear}
                className="bg-white border border-[#DDF3E9] hover:bg-[#F8F9FA] text-[#022D32] font-bold px-3 py-2 rounded-lg text-xs transition-all"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleParseJSON(jsonText)}
                className="bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black px-4 py-2 rounded-lg text-xs transition-all shadow-md active:scale-95"
              >
                PARSE & LOAD REPORT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TEAM PROFILE CARD                                                      */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 border border-[#DDF3E9] rounded-2xl shadow-sm text-[#022D32]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg sm:text-xl font-black text-[#022D32] uppercase tracking-wider">
                {team.name || 'Opponent Team'}
              </h2>
              {team.league && (
                <span className="text-[10px] bg-[#DDF3E9] text-[#022D32] font-bold px-2 py-0.5 rounded border border-[#C6E8DB]">
                  {team.league}
                </span>
              )}
              {team.paceRating && (
                <span className="text-[10px] bg-[#022D32] text-[#A7F3D0] font-black px-2 py-0.5 rounded border border-[#022D32] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#A7F3D0]" />
                  {team.paceRating}
                </span>
              )}
            </div>
            <p className="text-xs text-[#022D32]/70 font-medium">
              Season Profile • {scoutData.players?.length || 0} active roster players tracked
            </p>
          </div>

          {/* Record & Form */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#022D32]/70">
                SEASON RECORD
              </div>
              <div className="font-mono text-lg font-black text-[#022D32]">
                {team.record?.wins || 0}W - {team.record?.losses || 0}L
                <span className="text-xs font-black text-emerald-700 ml-1.5">
                  ({team.record?.winPct || 0}%)
                </span>
              </div>
            </div>

            {Array.isArray(team.lastFive) && team.lastFive.length > 0 && (
              <div className="flex items-center gap-1 bg-[#F8F9FA] p-1.5 rounded-lg border border-[#DDF3E9]">
                <span className="text-[9px] font-bold text-[#022D32]/60 mr-0.5">FORM:</span>
                {team.lastFive.map((res, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-black ${
                      res === 'W'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Core Team Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-[#DDF3E9]">
          <div className="bg-[#022D32] p-3 rounded-xl border border-[#022D32] text-center shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#A7F3D0] tracking-wider block mb-1">
              POINTS SCORED (PPG)
            </span>
            <span className="font-mono text-2xl font-black text-white">
              {team.ppg || 0}
            </span>
          </div>

          <div className="bg-[#022D32] p-3 rounded-xl border border-[#022D32] text-center shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#A7F3D0] tracking-wider block mb-1">
              POINTS ALLOWED (OPP)
            </span>
            <span className="font-mono text-2xl font-black text-white">
              {team.pointsAllowed || 0}
            </span>
          </div>

          <div className="bg-[#022D32] p-3 rounded-xl border border-[#022D32] text-center shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#A7F3D0] tracking-wider block mb-1">
              NET SCORING MARGIN
            </span>
            <span className="font-mono text-2xl font-black text-white">
              {team.netMargin > 0 ? `+${team.netMargin}` : team.netMargin || 0}
            </span>
          </div>

          <div className="bg-[#022D32] p-3 rounded-xl border border-[#022D32] text-center shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#A7F3D0] tracking-wider block mb-1">
              TRACKED SQUAD
            </span>
            <span className="font-mono text-2xl font-black text-white">
              {scoutData.players?.length || 0} Players
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TARGET BOARD: TACTICAL MATCHUP ALERTS                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD A: FOUL TROUBLE CANDIDATES */}
        <div className="bg-white p-4 sm:p-5 border border-[#DDF3E9] rounded-2xl shadow-sm space-y-3 text-[#022D32]">
          <div className="flex items-center justify-between pb-2 border-b border-[#DDF3E9]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider flex items-center gap-1.5">
                  FOUL TROUBLE TARGETS
                  <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                    &gt; 3.5 FOULED/G
                  </span>
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-700">
              {foulTroubleCandidates.length} CANDIDATES
            </span>
          </div>

          <p className="text-[11px] text-[#022D32]/70 leading-relaxed">
            <strong className="text-[#022D32]">Coach Tactical Note:</strong> Attack these players in early offensive possessions using shot fakes, high pick-and-roll drives, and post touches to draw early fouls and force bench substitutions.
          </p>

          <div className="space-y-2">
            {foulTroubleCandidates.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#022D32]/50 bg-[#F8F9FA] rounded-lg border border-[#DDF3E9]">
                No players with &gt; 3.5 fouls/game in current report.
              </div>
            ) : (
              foulTroubleCandidates.map((p) => (
                <div key={p.number} className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#DDF3E9] flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-[#022D32] text-xs">#{p.number}</span>
                      <span className="font-black text-[#022D32] text-xs">{p.name}</span>
                      <span className="text-[10px] bg-[#DDF3E9] text-[#022D32] px-1.5 py-0.2 rounded font-bold border border-[#C6E8DB]">{p.position}</span>
                    </div>
                    {p.notes && (
                      <p className="text-[11px] text-[#022D32]/70 mt-1 italic">
                        "{p.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-none">
                    <span className="font-mono text-sm font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded block">
                      {p.foulsPerGame.toFixed(1)} F/G
                    </span>
                    <span className="text-[9px] text-[#022D32]/60 font-bold block mt-0.5">
                      {p.ppg} PPG
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD B: PRIMARY PERIMETER SHOOTERS */}
        <div className="bg-white p-4 sm:p-5 border border-[#DDF3E9] rounded-2xl shadow-sm space-y-3 text-[#022D32]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/40 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#0CA17A]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  PRIMARY PERIMETER SHOOTERS
                  <span className="text-[9px] bg-[#DDF3E9] text-[#022D32] px-1.5 py-0.2 rounded font-bold border border-[#0CA17A]/40">
                    HIGH 3PA VOLUME
                  </span>
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#0CA17A]">
              {primaryShooters.length} SHOOTERS
            </span>
          </div>

          <p className="text-[11px] text-[#022D32]/70 leading-relaxed">
            <strong className="text-[#022D32]">Coach Tactical Note:</strong> No help off these players on the perimeter. Close out tight to contest on the catch, deny high-percentage spot-ups, and force them into off-balance mid-range pull-ups.
          </p>

          <div className="space-y-2">
            {primaryShooters.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#022D32]/50 bg-[#F8F9FA] rounded-lg border border-[#DDF3E9]">
                No high-volume 3PT shooters identified in current report.
              </div>
            ) : (
              primaryShooters.map((p) => (
                <div key={p.number} className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#DDF3E9] flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-[#022D32] text-xs">#{p.number}</span>
                      <span className="font-black text-[#022D32] text-xs">{p.name}</span>
                      <span className="text-[10px] bg-[#DDF3E9] text-[#022D32] px-1.5 py-0.2 rounded font-bold border border-[#C6E8DB]">{p.position}</span>
                    </div>
                    {p.notes && (
                      <p className="text-[11px] text-[#022D32]/70 mt-1 italic">
                        "{p.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-none">
                    <span className="font-mono text-sm font-black text-[#022D32] bg-[#DDF3E9] border border-[#C6E8DB] px-2 py-0.5 rounded block">
                      {p.threePtAttPerGame.toFixed(1)} 3PA/G
                    </span>
                    <span className="text-[9px] text-[#0CA17A] font-bold block mt-0.5">
                      {p.threePtPct}% 3P • {p.pctFromThree}% pts
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TOP SCORERS & COMPLETE ROSTER TABLE                                    */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 border border-[#DDF3E9] rounded-2xl shadow-sm space-y-3 text-[#022D32]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#0CA17A]" />
            <h3 className="text-xs sm:text-sm font-black text-[#022D32] uppercase tracking-wider">
              OPPONENT PLAYER PROFILES & SCORING DISTRIBUTION
            </h3>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#022D32]/60 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search player or #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#F8F9FA] border border-[#DDF3E9] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#022D32] focus:outline-none focus:border-[#0CA17A] w-44"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F8F9FA] p-1 rounded-lg border border-[#DDF3E9] text-[10px]">
              <span className="text-[#022D32]/60 font-bold px-1 uppercase">SORT:</span>
              {[
                { id: 'ppg', label: 'PPG' },
                { id: 'three', label: '3PT' },
                { id: 'fouls', label: 'FOULS' },
                { id: 'number', label: '#' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`px-2 py-0.5 font-bold rounded transition-all ${
                    sortBy === s.id ? 'bg-[#0CA17A] text-white' : 'text-[#022D32]/60 hover:text-[#022D32]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend for Scoring Breakdown Bar */}
        <div className="flex items-center gap-4 text-[10px] font-bold text-[#022D32]/70 border-b border-[#DDF3E9] pb-2">
          <span>SCORING COMPOSITION LEGEND:</span>
          <span className="flex items-center gap-1 text-amber-800 font-bold">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> 3-POINTERS
          </span>
          <span className="flex items-center gap-1 text-teal-800 font-bold">
            <span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block" /> 2-POINTERS
          </span>
          <span className="flex items-center gap-1 text-emerald-800 font-bold">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> FREE THROWS
          </span>
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DDF3E9] bg-[#DDF3E9]/60 text-[#022D32] font-black uppercase text-[10px] tracking-wider">
                <th className="p-2.5">#</th>
                <th className="p-2.5">PLAYER</th>
                <th className="p-2.5 text-center">POS</th>
                <th className="p-2.5 text-center">GP</th>
                <th className="p-2.5 text-center">PPG</th>
                <th className="p-2.5 w-48 sm:w-64">SCORING BREAKDOWN (% OF PTS)</th>
                <th className="p-2.5 text-center">3PA/G</th>
                <th className="p-2.5 text-center">3P%</th>
                <th className="p-2.5 text-center">FT%</th>
                <th className="p-2.5 text-center">FOULS/G</th>
                <th className="p-2.5">SCOUTING TAGS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDF3E9]">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-slate-500 font-medium">
                    No players found matching current search.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p) => {
                  const isShooter = p.threePtAttPerGame >= 4.0 || p.pctFromThree >= 40.0;
                  const isFoulProne = p.foulsPerGame >= 3.5;

                  return (
                    <tr key={p.number} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="p-2.5 font-mono font-black text-[#022D32]">
                        #{p.number}
                      </td>
                      <td className="p-2.5 font-black text-[#022D32]">
                        {p.name}
                      </td>
                      <td className="p-2.5 text-center font-bold text-[#022D32]/70">
                        {p.position}
                      </td>
                      <td className="p-2.5 text-center font-mono text-[#022D32]/80">
                        {p.games}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-[#022D32] text-sm">
                        {p.ppg.toFixed(1)}
                      </td>
                      
                      {/* Multi-Segment Visual Bar (% from 3P, 2P, FT) */}
                      <td className="p-2.5">
                        <div className="space-y-1">
                          <div className="h-3.5 w-full bg-[#F8F9FA] rounded-md overflow-hidden flex border border-[#DDF3E9] shadow-inner">
                            <div 
                              style={{ width: `${p.pctFromThree}%` }} 
                              className="bg-amber-400 h-full transition-all" 
                              title={`3PT: ${p.pctFromThree}% of points`}
                            />
                            <div 
                              style={{ width: `${p.pctFromTwo}%` }} 
                              className="bg-sky-400 h-full transition-all" 
                              title={`2PT: ${p.pctFromTwo}% of points`}
                            />
                            <div 
                              style={{ width: `${p.pctFromFt}%` }} 
                              className="bg-emerald-400 h-full transition-all" 
                              title={`FT: ${p.pctFromFt}% of points`}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] font-mono font-bold text-[#022D32]/70">
                            <span className="text-amber-800 font-bold">{p.pctFromThree}% 3P</span>
                            <span className="text-teal-800 font-bold">{p.pctFromTwo}% 2P</span>
                            <span className="text-emerald-800 font-bold">{p.pctFromFt}% FT</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-2.5 text-center font-mono font-bold text-[#022D32]">
                        {p.threePtAttPerGame.toFixed(1)}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#022D32]">
                        {p.threePtPct}%
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#022D32]">
                        {p.ftPct}%
                      </td>
                      <td className="p-2.5 text-center font-mono font-black">
                        <span className={`px-1.5 py-0.5 rounded ${
                          isFoulProne 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold' 
                            : 'text-[#022D32]'
                        }`}>
                          {p.foulsPerGame.toFixed(1)}
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
                          {p.pctFromTwo >= 65 && (
                            <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" /> INTERIOR
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
  );
}
