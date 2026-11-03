import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Trophy, Download, X, PieChart, List, 
  Target, Users, Clock, Shield, Zap, Sparkles, Layers, Ghost, 
  Calendar, Hash, Search, Filter, TrendingUp, BarChart2,
  Check, ArrowRight, ArrowLeft, UserCheck, Flame, ChevronRight, ChevronLeft,
  Info, AlertTriangle, BookOpen, HelpCircle
} from 'lucide-react';
import CourtPitchMap from './CourtPitchMap';
import MetricGuideModal from './MetricGuideModal';
import { calculateMatchAnalytics, computeZoneStats } from '../utils/basketballAnalytics';

export default function MatchReviewModal({ match, onClose, onDownloadCSV, onUpdateMatchDate }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'quarters' | 'players' | 'shotmap' | 'boxscore' | 'playbyplay'
  const [selectedPlayerNum, setSelectedPlayerNum] = useState(null);
  const [shotMapPlayerFilter, setShotMapPlayerFilter] = useState(null);
  const [shotMapSelectedZone, setShotMapSelectedZone] = useState('PAINT');
  const [boxScoreSortKey, setBoxScoreSortKey] = useState('pir');
  const [boxScoreSortAsc, setBoxScoreSortAsc] = useState(false);
  const [activeMetricGuideKey, setActiveMetricGuideKey] = useState(null); // 'pillars' | 'efg' | 'ts' | 'oreb' | 'asttov' | 'ballControl' | 'pir' | 'gamescore' | 'pps'

  // Match Date State for retroactive editing
  const [matchDateValue, setMatchDateValue] = useState(() => {
    const stored = localStorage.getItem(`match_date_${match?.name}`);
    if (stored) return stored;
    if (match?.matchDate) return match.matchDate;
    try {
      const d = new Date(match?.createdAt);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch(e) {}
    return new Date().toISOString().split('T')[0];
  });

  const handleDateChange = (newDate) => {
    setMatchDateValue(newDate);
    try {
      localStorage.setItem(`match_date_${match?.name}`, newDate);
    } catch(e) {}
    if (onUpdateMatchDate) {
      onUpdateMatchDate(match?.name, newDate);
    }
  };

  // Play-by-Play Filters
  const [playSearch, setPlaySearch] = useState('');
  const [playQuarterFilter, setPlayQuarterFilter] = useState('ALL');
  const [playCategoryFilter, setPlayCategoryFilter] = useState('ALL');
  const [playPlayerFilter, setPlayPlayerFilter] = useState('ALL');

  // Compute full analytics dataset
  const analytics = useMemo(() => {
    return calculateMatchAnalytics(match?.events || []);
  }, [match]);

  // Unified shot zone stats strictly filtered for 2PT/3PT attempts and reacting to player filter
  const filteredShotMapEvents = useMemo(() => {
    let evs = match?.events || [];
    if (shotMapPlayerFilter) {
      evs = evs.filter(e => String(e.Number ?? e.number ?? e.Numero ?? e.numero ?? '') === String(shotMapPlayerFilter.number));
    }
    return evs;
  }, [match?.events, shotMapPlayerFilter]);

  const activeZoneStats = useMemo(() => {
    return computeZoneStats(filteredShotMapEvents);
  }, [filteredShotMapEvents]);

  const {
    teamOverview,
    efficiencyPillars,
    fourFactors,
    quarters,
    playerStats,
    teamLeaders,
    zoneSummary,
    totalEvents,
    opponentShooting,
    reboundingAnalysis,
    situational,
    defensiveSchemes
  } = analytics;

  // Fallback to fourFactors alias if efficiencyPillars is not defined
  const pillars = efficiencyPillars || fourFactors;

  // Initialize selected player to top PIR player if none selected
  const activePlayer = useMemo(() => {
    if (playerStats.length === 0) return null;
    if (selectedPlayerNum) {
      return playerStats.find(p => String(p.number) === String(selectedPlayerNum)) || playerStats[0];
    }
    return playerStats[0];
  }, [playerStats, selectedPlayerNum]);

  // Horizontal Carousel Ref for Auto-Scroll & Wheel
  const carouselContainerRef = useRef(null);

  // Active Player Index in playerStats list
  const activePlayerIndex = useMemo(() => {
    if (!activePlayer || playerStats.length === 0) return 0;
    const idx = playerStats.findIndex(p => String(p.number) === String(activePlayer.number));
    return idx >= 0 ? idx : 0;
  }, [activePlayer, playerStats]);

  const handlePrevPlayer = () => {
    if (playerStats.length <= 1) return;
    const prevIdx = (activePlayerIndex - 1 + playerStats.length) % playerStats.length;
    setSelectedPlayerNum(playerStats[prevIdx].number);
  };

  const handleNextPlayer = () => {
    if (playerStats.length <= 1) return;
    const nextIdx = (activePlayerIndex + 1) % playerStats.length;
    setSelectedPlayerNum(playerStats[nextIdx].number);
  };

  // Keyboard Arrow Navigation (ArrowLeft [←] & ArrowRight [→]) for Player Cards
  useEffect(() => {
    if (activeTab !== 'players' || playerStats.length <= 1) return;

    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in search/filter inputs or textareas
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevPlayer();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextPlayer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, playerStats, activePlayerIndex]);

  // Keep active player pill smoothly centered in the carousel
  useEffect(() => {
    if (activeTab === 'players' && activePlayer && carouselContainerRef.current) {
      const activeBtn = carouselContainerRef.current.querySelector(`[data-player-card-num="${activePlayer.number}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab, activePlayer]);

  // Support horizontal mouse wheel scrolling over the carousel
  const handleCarouselWheel = (e) => {
    if (carouselContainerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        carouselContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  // Sortable Box Score rows
  const sortedPlayers = useMemo(() => {
    const list = [...playerStats];
    list.sort((a, b) => {
      let valA = a[boxScoreSortKey];
      let valB = b[boxScoreSortKey];
      if (typeof valA === 'string') {
        return boxScoreSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return boxScoreSortAsc ? valA - valB : valB - valA;
    });
    return list;
  }, [playerStats, boxScoreSortKey, boxScoreSortAsc]);

  const handleSortBoxScore = (key) => {
    if (boxScoreSortKey === key) {
      setBoxScoreSortAsc(!boxScoreSortAsc);
    } else {
      setBoxScoreSortKey(key);
      setBoxScoreSortAsc(false);
    }
  };

  // Filtered play-by-play events
  const filteredEvents = useMemo(() => {
    const rawEvents = match?.events || [];
    return rawEvents.filter(ev => {
      const q = String(ev.Quarter || ev.quarter || ev.Quarto || ev.quarto || 'Q1');
      const num = String(ev.Number ?? ev.number ?? ev.Numero ?? ev.numero ?? '');
      const pName = String(ev.Player || ev.player || ev.Giocatore || ev.giocatore || '');
      const act = String(ev.Action || ev.action || ev.Azione || ev.azione || '');
      const cat = String(ev.Category || ev.category || ev.Categoria || ev.categoria || '');
      const zn = String(ev.Zone || ev.zone || ev.Zona || ev.zona || '');

      // Quarter filter
      if (playQuarterFilter !== 'ALL' && !q.toUpperCase().startsWith(playQuarterFilter.toUpperCase())) {
        return false;
      }

      // Player filter
      if (playPlayerFilter !== 'ALL' && num !== playPlayerFilter) {
        return false;
      }

      // Category filter
      if (playCategoryFilter === 'SHOTS' && !act.includes('2PT') && !act.includes('3PT')) {
        return false;
      }
      if (playCategoryFilter === 'FT' && !act.includes('FT') && !act.includes('TL')) {
        return false;
      }
      if (playCategoryFilter === 'REB' && !act.includes('Rebound') && !act.includes('Rimb')) {
        return false;
      }
      if (playCategoryFilter === 'BALL' && act !== 'Turnover' && act !== 'Steal' && act !== 'Assist') {
        return false;
      }
      if (playCategoryFilter === 'FOUL' && !act.includes('Foul') && !act.includes('Fallo')) {
        return false;
      }
      if (playCategoryFilter === 'TACTIC' && act !== 'Stagger' && act !== 'Ghost') {
        return false;
      }

      // Search keyword
      if (playSearch.trim()) {
        const query = playSearch.toLowerCase().trim();
        const matchString = `${q} ${num} ${pName} ${act} ${cat} ${zn}`.toLowerCase();
        if (!matchString.includes(query)) return false;
      }

      return true;
    });
  }, [match, playQuarterFilter, playPlayerFilter, playCategoryFilter, playSearch]);

  if (!match) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & MATCH BRANDING BAR                                       */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 flex-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center flex-none shadow-inner">
              <Trophy className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wider">
                  {match.name}
                </h2>
                <div className="bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono font-black text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                  <span className="text-slate-300 font-bold">BBA</span>
                  <span className="text-amber-400 text-sm font-black">{teamOverview.pts}</span>
                  <span className="text-slate-500 font-bold">-</span>
                  <span className="text-amber-400 text-sm font-black">{teamOverview.opponentScore || 0}</span>
                  <span className="text-[10px] text-amber-500 uppercase font-bold">OPP</span>
                  {(teamOverview.opponentScore > 0 || teamOverview.pointDifferential !== 0) && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ml-0.5 ${
                      teamOverview.pointDifferential > 0 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : teamOverview.pointDifferential < 0 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                          : 'bg-slate-700 text-slate-300'
                    }`}>
                      {teamOverview.pointDifferential > 0 ? `+${teamOverview.pointDifferential}` : teamOverview.pointDifferential}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-sky-400" />
                  {totalEvents} Logged Plays
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <input
                    type="date"
                    value={matchDateValue}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-transparent text-slate-200 font-bold text-xs focus:outline-none focus:border-sky-400 cursor-pointer"
                    title="Click to edit match date (YYYY-MM-DD)"
                  />
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">
                  {quarters.map(q => `${q.quarter}: ${q.pts}`).join(' | ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMetricGuideKey('pillars')}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-black px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm active:scale-95"
              title="Metric Guide & Reference Benchmarks"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">METRIC</span> GUIDE
            </button>
            <button
              onClick={() => onDownloadCSV(match.name, match.events)}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm active:scale-95"
              title="Export complete match data to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EXPORT</span> CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
              title="Close Review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. NAVIGATION TABS (6 PROFESSIONAL SCOUTING TIERS)                       */}
        {/* ========================================================================= */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 px-2 sm:px-4 pt-2 gap-1 overflow-x-auto no-scrollbar flex-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'overview'
                ? 'bg-slate-800/90 text-sky-400 border-sky-400 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            OVERVIEW & EFFICIENCY PILLARS
          </button>

          <button
            onClick={() => setActiveTab('situational')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'situational'
                ? 'bg-slate-800/90 text-amber-400 border-amber-400 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            SITUATIONAL & OPPONENT
          </button>

          <button
            onClick={() => setActiveTab('quarters')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'quarters'
                ? 'bg-slate-800/90 text-sky-400 border-sky-400 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            BY QUARTER ({quarters.length})
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'players'
                ? 'bg-slate-800/90 text-sky-400 border-sky-400 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            PLAYER CARDS ({playerStats.length})
          </button>

          <button
            onClick={() => setActiveTab('shotmap')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'shotmap'
                ? 'bg-slate-800/90 text-sky-400 border-sky-400 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            SHOT MAP & ZONES
          </button>

          <button
            onClick={() => setActiveTab('boxscore')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'boxscore'
                ? 'bg-slate-800/90 text-sky-400 border-sky-400 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            FIBA BOX SCORE
          </button>

          <button
            onClick={() => setActiveTab('playbyplay')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'playbyplay'
                ? 'bg-slate-800/90 text-sky-400 border-sky-400 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            PLAY-BY-PLAY ({totalEvents})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. MODAL CONTENT CONTAINER                                                */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-900/90">

          {/* ===================================================================== */}
          {/* TAB 1: EXECUTIVE OVERVIEW & FOUR FACTORS                              */}
          {/* ===================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Contextual Scouting Intelligence Bar */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-3 text-xs flex-wrap shadow-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Info className="w-4 h-4 text-sky-400 flex-none" />
                  <span>
                    <strong className="text-sky-300">Match Overview:</strong> Direct, measurable performance metrics across shooting, rebounding, playmaking, and defense. Click on any metric card or <span className="text-amber-400 font-bold">ⓘ</span> to view definitions and benchmarks.
                  </span>
                </div>
                <button
                  onClick={() => setActiveMetricGuideKey('pillars')}
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 underline flex-none"
                >
                  <span>Open Metric Guide</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* 4-Card Match Totals Strip (Raw, Immediate Basketball Numbers) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1. Field Goals (FG%) */}
                <div
                  onClick={() => setActiveMetricGuideKey('fg')}
                  className="glass-card p-3 border-slate-800 hover:border-emerald-500/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view Field Goals (FG%) guide and shot breakdown"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-300 uppercase tracking-wider transition-colors">
                      FIELD GOALS (FG%)
                    </span>
                    <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400">
                      {teamOverview.pctFg.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">FG%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                    {teamOverview.fgm}/{teamOverview.fga} FG (2P: {teamOverview.fg2m}/{teamOverview.fg2a} • 3P: {teamOverview.fg3m}/{teamOverview.fg3a})
                  </span>
                </div>

                {/* 2. Free Throws (FT%) */}
                <div
                  onClick={() => setActiveMetricGuideKey('shotProfile')}
                  className="glass-card p-3 border-slate-800 hover:border-sky-500/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view Free Throw and Shot Profile guide"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-300 uppercase tracking-wider transition-colors">
                      FREE THROWS (FT%)
                    </span>
                    <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-sky-400">
                      {teamOverview.pctFt.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">FT%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                    {teamOverview.ftm}/{teamOverview.fta} FT Made • {teamOverview.fd || 0} Fouls Drawn
                  </span>
                </div>

                {/* 3. Total Rebounds */}
                <div
                  onClick={() => setActiveMetricGuideKey('oreb')}
                  className="glass-card p-3 border-slate-800 hover:border-amber-500/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view Rebounding & Extra Possessions guide"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-300 uppercase tracking-wider transition-colors">
                      TOTAL REBOUNDS
                    </span>
                    <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400">
                      {teamOverview.reb}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">REB</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                    {teamOverview.dreb} Defensive • {teamOverview.oreb} Offensive
                  </span>
                </div>

                {/* 4. Team FIBA PIR */}
                <div
                  onClick={() => setActiveMetricGuideKey('pir')}
                  className="glass-card p-3 border-slate-800 hover:border-purple-500/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view FIBA Performance Index Rating (PIR) guide"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-300 uppercase tracking-wider transition-colors">
                      TEAM FIBA PIR
                    </span>
                    <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-purple-400">
                      {teamOverview.pir}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">PIR</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                    {teamOverview.pts} PTS • {teamOverview.ast} AST • {teamOverview.stl} STL
                  </span>
                </div>
              </div>

              {/* Game Control & Efficiency Pillars Section */}
              <div className="glass-card p-3 sm:p-4 border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div
                    onClick={() => setActiveMetricGuideKey('pillars')}
                    className="flex items-center gap-2 cursor-pointer group"
                    title="Click to view Game Control & Efficiency Pillars guide"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                      GAME CONTROL & EFFICIENCY PILLARS
                      <Info className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveMetricGuideKey('pillars')}
                    className="text-[10px] font-bold text-slate-400 hover:text-amber-400 transition-colors underline"
                  >
                    Pillars Guide
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Pillar 1: Shooting Efficiency */}
                  <div
                    onClick={() => setActiveMetricGuideKey('efg')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-emerald-500/60 cursor-pointer group transition-all flex flex-col justify-between"
                    title="Pillar 1: Shooting Efficiency (eFG%). Click for guide."
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                          1. SHOOTING EFFICIENCY <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          pillars.shooting?.rating === 'Elite' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          pillars.shooting?.rating === 'Solid' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {pillars.shooting?.rating || 'Solid'}
                        </span>
                      </div>
                      <div className="font-mono text-2xl font-black text-emerald-400 my-1">
                        {pillars.shooting?.value || `${teamOverview.efgPct.toFixed(1)}%`}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2">
                      {pillars.shooting?.subtext || `2P: ${teamOverview.fg2m}/${teamOverview.fg2a} (${teamOverview.pct2p.toFixed(0)}%) | 3P: ${teamOverview.fg3m}/${teamOverview.fg3a} (${teamOverview.pct3p.toFixed(0)}%)`}
                    </div>
                  </div>

                  {/* Pillar 2: Paint vs Perimeter Shot Profile */}
                  <div
                    onClick={() => setActiveMetricGuideKey('shotProfile')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-sky-500/60 cursor-pointer group transition-all flex flex-col justify-between"
                    title="Pillar 2: Paint vs Perimeter Shot Profile & FT Conversion. Click for guide."
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="group-hover:text-sky-300 transition-colors flex items-center gap-1">
                          2. SHOT PROFILE BALANCE <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {pillars.shotProfile?.rating || 'Balanced'}
                        </span>
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-sky-400 my-1">
                        {pillars.shotProfile?.value || `Paint ${teamOverview.pctPaint}% | 3PT ${teamOverview.pctThree}%`}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2">
                      {pillars.shotProfile?.subtext || `Mid: ${teamOverview.pctMid}% (${teamOverview.teamMidShots || 0} FGA) • FT: ${teamOverview.ftm}/${teamOverview.fta} (${teamOverview.pctFt.toFixed(0)}%)`}
                    </div>
                  </div>

                  {/* Pillar 3: Rebounding & Extra Possessions */}
                  <div
                    onClick={() => setActiveMetricGuideKey('oreb')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-amber-500/60 cursor-pointer group transition-all flex flex-col justify-between"
                    title="Pillar 3: Rebounding & Extra Possessions. Click for guide."
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="group-hover:text-amber-300 transition-colors flex items-center gap-1">
                          3. REBOUNDING & EXTRA POSSESSIONS <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          (pillars.rebounding?.rating === 'Strong Glass' || pillars.rebounding?.rating === 'Elite Glass' || teamOverview.oreb >= 10 || teamOverview.orebShare >= 28) ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          (pillars.rebounding?.rating === 'Solid' || teamOverview.oreb >= 7) ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-850 text-slate-300 border border-slate-700'
                        }`}>
                          {pillars.rebounding?.rating || (teamOverview.oreb >= 10 || teamOverview.orebShare >= 28 ? 'Strong Glass' : teamOverview.oreb >= 7 ? 'Solid' : 'Passive')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between my-1">
                        <div className="font-mono text-xl sm:text-2xl font-black text-amber-400">
                          {pillars.rebounding?.value || `${teamOverview.oreb} OFF | ${teamOverview.dreb} DEF`}
                        </div>
                        {teamOverview.drbPct != null && (
                          <div className="text-right">
                            <span className="font-mono text-lg font-black text-emerald-400">
                              {teamOverview.drbPct.toFixed(1)}%
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 ml-1">DRB%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2">
                      {teamOverview.drbPct != null
                        ? `${teamOverview.reb} Total REB • DRB%: ${teamOverview.drbPct.toFixed(1)}% (${teamOverview.dreb} D-REB vs ${teamOverview.oppOffReb || 0} Opp O-REB)`
                        : (pillars.rebounding?.subtext || `${teamOverview.reb} Total REB • ${Math.round(teamOverview.orebShare)}% Offensive Rebound Share`)}
                    </div>
                  </div>

                  {/* Pillar 4: Ball Movement & Security */}
                  <div
                    onClick={() => setActiveMetricGuideKey('ballControl')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-cyan-500/60 cursor-pointer group transition-all flex flex-col justify-between"
                    title="Pillar 4: Ball Movement & Security. Click for guide."
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                          4. BALL MOVEMENT & SECURITY <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          (pillars.ballControl?.rating === 'Great Flow' || teamOverview.astTovRatio >= 1.3) ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          (pillars.ballControl?.rating === 'Balanced' || teamOverview.astTovRatio >= 0.9) ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {pillars.ballControl?.rating || (teamOverview.astTovRatio >= 1.3 ? 'Great Flow' : teamOverview.astTovRatio >= 0.9 ? 'Balanced' : 'High Turnovers')}
                        </span>
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-cyan-400 my-1">
                        {pillars.ballControl?.value || `${teamOverview.ast} AST / ${teamOverview.tov} TOV`}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2">
                      {pillars.ballControl?.subtext || `Assisted FGs: ${teamOverview.assistedFgmPct || (teamOverview.fgm > 0 ? Math.round((teamOverview.ast / teamOverview.fgm) * 100) : 0)}% (${teamOverview.ast} of ${teamOverview.fgm} FGM) • ${teamOverview.stl} Steals (STL)`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Leaders Showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {teamLeaders.scoring && (
                  <div className="glass-card p-3 border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-black text-sm text-amber-400 flex-none">
                      #{teamLeaders.scoring.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">TOP SCORER</div>
                      <div className="text-xs font-black text-slate-100 truncate">{teamLeaders.scoring.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{teamLeaders.scoring.pts} PTS ({teamLeaders.scoring.fgm}/{teamLeaders.scoring.fga} FG)</div>
                    </div>
                  </div>
                )}

                {teamLeaders.efficiency && (
                  <div className="glass-card p-3 border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-black text-sm text-emerald-400 flex-none">
                      #{teamLeaders.efficiency.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">MATCH MVP (EFFICIENCY)</div>
                      <div className="text-xs font-black text-slate-100 truncate">{teamLeaders.efficiency.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{teamLeaders.efficiency.pir} PIR (GameScore: {teamLeaders.efficiency.gameScore})</div>
                    </div>
                  </div>
                )}

                {teamLeaders.rebounding && (
                  <div className="glass-card p-3 border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center font-mono font-black text-sm text-sky-400 flex-none">
                      #{teamLeaders.rebounding.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">REBOUND DOMINATOR</div>
                      <div className="text-xs font-black text-slate-100 truncate">{teamLeaders.rebounding.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{teamLeaders.rebounding.reb} REB ({teamLeaders.rebounding.oreb} OFF + {teamLeaders.rebounding.dreb} DEF)</div>
                    </div>
                  </div>
                )}

                {teamLeaders.playmaking && (
                  <div className="glass-card p-3 border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-mono font-black text-sm text-cyan-400 flex-none">
                      #{teamLeaders.playmaking.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">FLOOR GENERAL</div>
                      <div className="text-xs font-black text-slate-100 truncate">{teamLeaders.playmaking.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{teamLeaders.playmaking.ast} AST ({teamLeaders.playmaking.tov} TOV)</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tactical System Execution (Staggers & Ghosts) */}
              <div className="glass-card p-3 sm:p-4 border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                      TACTICAL SCREENING TECHNIQUES DEPLOYED ({teamOverview.totalTactics})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-violet-300">
                    {teamOverview.staggerCount} Stagger • {teamOverview.ghostCount} Ghost
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-violet-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-violet-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-100">STAGGER SCREENS</div>
                        <div className="text-[10px] text-slate-400">Double sequential off-ball shooter screens</div>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-black text-violet-300">{teamOverview.staggerCount}</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-cyan-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Ghost className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-100">GHOST SCREENS</div>
                        <div className="text-[10px] text-slate-400">Fake ball screen popping into open perimeter space</div>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-black text-cyan-300">{teamOverview.ghostCount}</span>
                  </div>
                </div>

                {/* Quarter distribution of tactics */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {quarters.map(q => (
                    <div key={q.quarter} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                      <div className="text-[10px] font-mono font-bold text-slate-400">{q.quarter}</div>
                      <div className="text-xs font-black text-slate-200 mt-0.5">{q.totalTactics} Tactics</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        <span className="text-violet-400">{q.stagger} S</span> • <span className="text-cyan-400">{q.ghost} G</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring Flow By Quarter Progress Bar */}
              <div className="glass-card p-3 sm:p-4 border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    SCORING CONTRIBUTION BY QUARTER
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">{teamOverview.pts} TOTAL PTS</span>
                </div>
                <div className="h-6 w-full bg-slate-950 rounded-lg overflow-hidden flex p-0.5 gap-0.5 border border-slate-800">
                  {quarters.map((q, idx) => {
                    const colors = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                    const color = colors[idx % colors.length];
                    if (q.pts === 0) return null;
                    return (
                      <div
                        key={q.quarter}
                        style={{ width: `${q.pctShare}%` }}
                        className={`${color} h-full rounded flex items-center justify-center text-[10px] font-black text-slate-950 transition-all`}
                        title={`${q.quarter}: ${q.pts} PTS (${q.pctShare}%)`}
                      >
                        {q.quarter} ({q.pts})
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB: SITUATIONAL SCOUTING, OPPONENT SHOT PROFILE & DEFENSIVE SCHEMES */}
          {/* ===================================================================== */}
          {activeTab === 'situational' && (
            <div className="space-y-4">
              {/* Contextual Intelligence Banner */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-3 text-xs flex-wrap shadow-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Zap className="w-4 h-4 text-amber-400 flex-none" />
                  <span>
                    <strong className="text-amber-300">Situational Scouting & Opponent Breakdown:</strong> Evaluation of Fastbreak vs Half-court offense, complete opponent shooting profile, defensive rebounding cleanup (DRB%), and defensive scheme efficiency (Man, Zone, Press).
                  </span>
                </div>
                <button
                  onClick={() => setActiveMetricGuideKey('transitionPpp')}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline flex-none"
                >
                  <span>Situational Guide</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* 1. TRANSITION VS HALF-COURT OFFENSE COMPARISON */}
              <div className="glass-card p-3 sm:p-4 border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                      PACE & PACE-ADJUSTED EFFICIENCY: TRANSITION VS HALF-COURT
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Tagged via TRANSITION toggle
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Card A: Transition / Fastbreak Offense */}
                  <div
                    onClick={() => setActiveMetricGuideKey('transitionPpp')}
                    className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 hover:border-amber-400/80 cursor-pointer group transition-all flex flex-col justify-between shadow-sm"
                    title="Click to view Transition PPP guide"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                        <span className="group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          FASTBREAK / TRANSITION
                          <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          (situational?.transition?.ppp >= 1.15) ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          (situational?.transition?.ppp >= 0.95) ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-850 text-slate-400 border border-slate-700'
                        }`}>
                          {situational?.transition?.ppp >= 1.15 ? 'Elite Fastbreak' : situational?.transition?.ppp >= 0.95 ? 'Solid Pace' : (situational?.transition?.poss > 0 ? 'Low Yield' : 'No Data')}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 my-1">
                        <span className="font-mono text-3xl font-black text-amber-400">
                          {situational?.transition?.ppp?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">PPP</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {situational?.transition?.pts || 0} PTS
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({situational?.transition?.poss || 0} Possessions)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2 border-t border-slate-850 text-center">
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">FG CONVERSION</div>
                        <div className="font-mono text-xs font-bold text-slate-200 mt-0.5">
                          {situational?.transition?.fgm || 0}/{situational?.transition?.fga || 0}
                        </div>
                        <div className="text-[9px] font-bold text-amber-400">
                          {situational?.transition?.efgPct || 0}% eFG%
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">TURNOVERS</div>
                        <div className="font-mono text-xs font-bold text-rose-400 mt-0.5">
                          {situational?.transition?.tov || 0} TOV
                        </div>
                        <div className="text-[9px] text-slate-500">Fastbreak errors</div>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">FREE THROWS</div>
                        <div className="font-mono text-xs font-bold text-sky-400 mt-0.5">
                          {situational?.transition?.ftm || 0}/{situational?.transition?.fta || 0} FT
                        </div>
                        <div className="text-[9px] text-slate-500">Contact drawn</div>
                      </div>
                    </div>
                  </div>

                  {/* Card B: Half-Court Set Offense */}
                  <div
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-sky-400" />
                          HALF-COURT SET OFFENSE
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          (situational?.halfCourt?.ppp >= 0.95) ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          (situational?.halfCourt?.ppp >= 0.80) ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-850 text-slate-400 border border-slate-700'
                        }`}>
                          {situational?.halfCourt?.ppp >= 0.95 ? 'Efficient Sets' : situational?.halfCourt?.ppp >= 0.80 ? 'Standard Sets' : (situational?.halfCourt?.poss > 0 ? 'Stagnant' : 'No Data')}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 my-1">
                        <span className="font-mono text-3xl font-black text-sky-400">
                          {situational?.halfCourt?.ppp?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">PPP</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {situational?.halfCourt?.pts || 0} PTS
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({situational?.halfCourt?.poss || 0} Possessions)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2 border-t border-slate-850 text-center">
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">FG CONVERSION</div>
                        <div className="font-mono text-xs font-bold text-slate-200 mt-0.5">
                          {situational?.halfCourt?.fgm || 0}/{situational?.halfCourt?.fga || 0}
                        </div>
                        <div className="text-[9px] font-bold text-sky-400">
                          {situational?.halfCourt?.efgPct || 0}% eFG%
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">TURNOVERS</div>
                        <div className="font-mono text-xs font-bold text-rose-400 mt-0.5">
                          {situational?.halfCourt?.tov || 0} TOV
                        </div>
                        <div className="text-[9px] text-slate-500">Set-play giveaways</div>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">FREE THROWS</div>
                        <div className="font-mono text-xs font-bold text-sky-400 mt-0.5">
                          {situational?.halfCourt?.ftm || 0}/{situational?.halfCourt?.fta || 0} FT
                        </div>
                        <div className="text-[9px] text-slate-500">Half-court fouls</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. OPPONENT SHOOTING & REBOUND PROFILE */}
              <div className="glass-card p-3 sm:p-4 border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                      OPPONENT COMPLETE SHOOTING & REBOUND PROFILE
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-rose-400">
                    {teamOverview.opponentScore || 0} Total Opponent Points
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {/* Opponent eFG% */}
                  <div
                    onClick={() => setActiveMetricGuideKey('oppEfg')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-rose-500/60 cursor-pointer group transition-all flex flex-col justify-between shadow-sm"
                    title="Click to view Opponent eFG% guide"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-300 uppercase tracking-wider">
                        OPP eFG%
                      </span>
                      <Info className="w-3 h-3 text-slate-500 group-hover:text-rose-400" />
                    </div>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-rose-400">
                        {opponentShooting?.oppEfgPct?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {opponentShooting?.oppFgm || 0}/{opponentShooting?.oppFga || 0} FG
                      </div>
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-center border ${
                      (opponentShooting?.oppEfgPct < 46 && opponentShooting?.oppFga > 0) ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' :
                      (opponentShooting?.oppEfgPct <= 52 && opponentShooting?.oppFga > 0) ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                      (opponentShooting?.oppFga > 0) ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                      'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {opponentShooting?.oppEfgPct < 46 && opponentShooting?.oppFga > 0 ? 'Lockdown' :
                       opponentShooting?.oppEfgPct <= 52 && opponentShooting?.oppFga > 0 ? 'Average' :
                       opponentShooting?.oppFga > 0 ? 'Vulnerable' : 'No FGA'}
                    </div>
                  </div>

                  {/* DRB% (Defensive Rebounding Percentage) */}
                  <div
                    onClick={() => setActiveMetricGuideKey('drb')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-emerald-500/60 cursor-pointer group transition-all flex flex-col justify-between shadow-sm"
                    title="Click to view DRB% guide"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-300 uppercase tracking-wider">
                        DRB% (CLEANUP)
                      </span>
                      <Info className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                    </div>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-emerald-400">
                        {reboundingAnalysis?.drbPct != null ? `${reboundingAnalysis.drbPct.toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {reboundingAnalysis?.bbaDefReb || teamOverview.dreb} D-REB vs {reboundingAnalysis?.oppOffReb || 0} Opp O-REB
                      </div>
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-center border ${
                      (reboundingAnalysis?.drbPct >= 72) ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' :
                      (reboundingAnalysis?.drbPct >= 65) ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                      (reboundingAnalysis?.drbPct != null) ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                      'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {reboundingAnalysis?.drbPct >= 72 ? 'Elite Glass' :
                       reboundingAnalysis?.drbPct >= 65 ? 'Solid Glass' :
                       reboundingAnalysis?.drbPct != null ? 'Vulnerable' : 'Track Misses'}
                    </div>
                  </div>

                  {/* Opponent 2PT Shooting */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      OPP 2PT FG
                    </span>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-slate-200">
                        {opponentShooting?.oppPct2p || 0}%
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {opponentShooting?.opp2pm || 0}/{opponentShooting?.opp2pa || 0} Made
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 border-t border-slate-850 pt-1">
                      Interior scoring
                    </div>
                  </div>

                  {/* Opponent 3PT Shooting */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      OPP 3PT FG
                    </span>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-slate-200">
                        {opponentShooting?.oppPct3p || 0}%
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {opponentShooting?.opp3pm || 0}/{opponentShooting?.opp3pa || 0} Made
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 border-t border-slate-850 pt-1">
                      Perimeter conversion
                    </div>
                  </div>

                  {/* Opponent Free Throws */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      OPP FREE THROWS
                    </span>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-slate-200">
                        {opponentShooting?.oppPctFt || 0}%
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {opponentShooting?.oppFtm || 0}/{opponentShooting?.oppFta || 0} FT
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 border-t border-slate-850 pt-1">
                      Foul conversion
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. DEFENSIVE SCHEMES BREAKDOWN (MAN vs ZONE vs PRESS) */}
              <div className="glass-card p-3 sm:p-4 border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                      DEFENSIVE SCHEME PERFORMANCE (MAN vs ZONE vs PRESS)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Defensive stats & opponent conversion per scheme
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'MAN', label: 'MAN-TO-MAN (MAN)', scheme: defensiveSchemes?.MAN, color: 'sky' },
                    { key: 'ZONE', label: 'ZONE DEFENSE (ZONE)', scheme: defensiveSchemes?.ZONE, color: 'purple' },
                    { key: 'PRESS', label: 'FULL-COURT PRESS (PRESS)', scheme: defensiveSchemes?.PRESS, color: 'amber' }
                  ].map(({ key, label, scheme, color }) => {
                    const count = scheme?.eventsCount || 0;
                    const pts = scheme?.ptsAllowed || 0;
                    const fga = scheme?.fga || 0;
                    const efg = scheme?.efg || 0;
                    const stl = scheme?.stl || 0;
                    const blk = scheme?.blk || 0;
                    const dreb = scheme?.dreb || 0;
                    const fouls = scheme?.fouls || 0;

                    return (
                      <div
                        key={key}
                        className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                            <span className="text-xs font-black text-slate-200">
                              {label}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                              {count} Events
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 my-2">
                            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">PTS ALLOWED</div>
                              <div className="font-mono text-xl font-black text-rose-400">
                                {pts} PTS
                              </div>
                            </div>
                            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">OPP eFG%</div>
                              <div className="font-mono text-xl font-black text-slate-200">
                                {fga > 0 ? `${efg}%` : 'N/A'}
                              </div>
                              <div className="text-[9px] text-slate-500">{fga} FGA</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-850 text-center">
                          <div className="bg-slate-900/50 p-1 rounded">
                            <div className="text-[8px] font-bold text-slate-500 uppercase">STL</div>
                            <div className="font-mono text-xs font-bold text-emerald-400">{stl}</div>
                          </div>
                          <div className="bg-slate-900/50 p-1 rounded">
                            <div className="text-[8px] font-bold text-slate-500 uppercase">BLK</div>
                            <div className="font-mono text-xs font-bold text-cyan-400">{blk}</div>
                          </div>
                          <div className="bg-slate-900/50 p-1 rounded">
                            <div className="text-[8px] font-bold text-slate-500 uppercase">D-REB</div>
                            <div className="font-mono text-xs font-bold text-amber-400">{dreb}</div>
                          </div>
                          <div className="bg-slate-900/50 p-1 rounded">
                            <div className="text-[8px] font-bold text-slate-500 uppercase">PF</div>
                            <div className="font-mono text-xs font-bold text-rose-400">{fouls}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: BY QUARTER (PERIOD ANALYTICS & MOMENTUM)                       */}
          {/* ===================================================================== */}
          {activeTab === 'quarters' && (
            <div className="space-y-4">
              {/* Detailed Quarter Breakdown Table */}
              <div className="glass-card p-4 border-slate-800 overflow-x-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                      QUARTER-BY-QUARTER PERFORMANCE MATRIX
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Progression across 4 Periods + OT</span>
                </div>

                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-700/80 text-slate-400">
                      <th className="py-2.5 px-2">PERIOD</th>
                      <th className="py-2.5 px-2 text-amber-400 font-bold">PTS</th>
                      <th className="py-2.5 px-2">2PM/A</th>
                      <th className="py-2.5 px-2">2P%</th>
                      <th className="py-2.5 px-2">3PM/A</th>
                      <th className="py-2.5 px-2">3P%</th>
                      <th className="py-2.5 px-2">FTM/A</th>
                      <th className="py-2.5 px-2">FT%</th>
                      <th className="py-2.5 px-2 text-emerald-400">eFG%</th>
                      <th className="py-2.5 px-2">REB (O/D)</th>
                      <th className="py-2.5 px-2">AST</th>
                      <th className="py-2.5 px-2 text-rose-400">TOV</th>
                      <th className="py-2.5 px-2 text-sky-400">STL</th>
                      <th className="py-2.5 px-2">PF</th>
                      <th className="py-2.5 px-2 text-purple-400">TACTICS</th>
                      <th className="py-2.5 px-2 text-emerald-400 font-black">PIR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.map((q) => (
                      <tr key={q.quarter} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-2 font-mono font-black text-sky-400 text-sm">{q.quarter}</td>
                        <td className="py-2.5 px-2 text-amber-400 font-black text-base">{q.pts}</td>
                        <td className="py-2.5 px-2 text-slate-200">{q.fg2m}/{q.fg2a}</td>
                        <td className="py-2.5 px-2 text-slate-300 font-mono">{q.pct2p.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-slate-200">{q.fg3m}/{q.fg3a}</td>
                        <td className="py-2.5 px-2 text-slate-300 font-mono">{q.pct3p.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-slate-200">{q.ftm}/{q.fta}</td>
                        <td className="py-2.5 px-2 text-slate-300 font-mono">{q.pctFt.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-emerald-400 font-mono font-bold">{q.efgPct.toFixed(1)}%</td>
                        <td className="py-2.5 px-2 text-slate-200">{q.reb} ({q.oreb}/{q.dreb})</td>
                        <td className="py-2.5 px-2 text-slate-200">{q.ast}</td>
                        <td className="py-2.5 px-2 text-rose-400 font-bold">{q.tov}</td>
                        <td className="py-2.5 px-2 text-sky-400 font-bold">{q.stl}</td>
                        <td className="py-2.5 px-2 text-slate-300">{q.pf}</td>
                        <td className="py-2.5 px-2 text-purple-300 font-mono font-bold">
                          {q.totalTactics} <span className="text-[10px] text-slate-500 font-normal">({q.stagger}S/{q.ghost}G)</span>
                        </td>
                        <td className="py-2.5 px-2 text-emerald-400 font-black text-sm">{q.pir}</td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot>
                    <tr className="bg-slate-950/80 border-t-2 border-slate-700 text-slate-200 font-black">
                      <td className="py-3 px-2 text-sky-400 uppercase">MATCH TOTAL</td>
                      <td className="py-3 px-2 text-amber-400 text-lg">{teamOverview.pts}</td>
                      <td className="py-3 px-2">{teamOverview.fg2m}/{teamOverview.fg2a}</td>
                      <td className="py-3 px-2 font-mono">{teamOverview.pct2p.toFixed(0)}%</td>
                      <td className="py-3 px-2">{teamOverview.fg3m}/{teamOverview.fg3a}</td>
                      <td className="py-3 px-2 font-mono">{teamOverview.pct3p.toFixed(0)}%</td>
                      <td className="py-3 px-2">{teamOverview.ftm}/{teamOverview.fta}</td>
                      <td className="py-3 px-2 font-mono">{teamOverview.pctFt.toFixed(0)}%</td>
                      <td className="py-3 px-2 text-emerald-400 font-mono">{teamOverview.efgPct.toFixed(1)}%</td>
                      <td className="py-3 px-2">{teamOverview.reb} ({teamOverview.oreb}/{teamOverview.dreb})</td>
                      <td className="py-3 px-2">{teamOverview.ast}</td>
                      <td className="py-3 px-2 text-rose-400">{teamOverview.tov}</td>
                      <td className="py-3 px-2 text-sky-400">{teamOverview.stl}</td>
                      <td className="py-3 px-2">{teamOverview.pf}</td>
                      <td className="py-3 px-2 text-purple-300">{teamOverview.totalTactics}</td>
                      <td className="py-3 px-2 text-emerald-400 text-base">{teamOverview.pir}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Quarter Visual Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Points & Shooting % Comparison */}
                <div className="glass-card p-4 border-slate-800">
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                    SCORING OUTPUT & SHOOTING ACCURACY PER QUARTER
                  </h4>
                  <div className="space-y-3">
                    {quarters.map(q => {
                      const maxPts = Math.max(...quarters.map(item => item.pts), 1);
                      const barWidth = Math.max(8, (q.pts / maxPts) * 100);
                      return (
                        <div key={q.quarter} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono font-bold text-sky-400">{q.quarter}</span>
                            <span className="font-mono text-slate-300">
                              <strong className="text-amber-400 text-sm">{q.pts} PTS</strong> ({q.pct2p.toFixed(0)}% 2P | {q.pct3p.toFixed(0)}% 3P)
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                            <div
                              style={{ width: `${barWidth}%` }}
                              className="h-full bg-gradient-to-r from-sky-500 to-amber-400 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Turnovers vs Assists Flow */}
                <div className="glass-card p-4 border-slate-800">
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    BALL CONTROL: ASSISTS VS TURNOVERS BY PERIOD
                  </h4>
                  <div className="space-y-3">
                    {quarters.map(q => (
                      <div key={q.quarter} className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-sky-400">{q.quarter}</span>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span>AST:</span>
                            <span className="font-mono text-sm font-black">{q.ast}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-rose-400">
                            <span>TOV:</span>
                            <span className="font-mono text-sm font-black">{q.tov}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Ratio: {q.tov > 0 ? (q.ast / q.tov).toFixed(2) : q.ast}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: PLAYER CARDS & PROFILES                                        */}
          {/* ===================================================================== */}
          {activeTab === 'players' && (
            <div className="space-y-4">
              {/* Horizontal Player Carousel / Selector with Controls */}
              <div className="glass-card p-2.5 border-slate-800 space-y-1.5">
                {/* Carousel Top Helper Bar */}
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span className="uppercase tracking-wider">SELECT PLAYER CARD</span>
                    <span className="hidden sm:inline text-slate-500 font-normal">
                      (Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px]">→</kbd> or click arrows)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sky-400 text-xs">
                      #{activePlayer?.number} ({activePlayerIndex + 1}/{playerStats.length})
                    </span>
                  </div>
                </div>

                {/* Carousel Row with Clickable Prev/Next Buttons & Horizontal Scroll */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevPlayer}
                    disabled={playerStats.length <= 1}
                    className="w-9 h-11 rounded-xl bg-slate-950 hover:bg-sky-600 hover:text-white text-slate-400 border border-slate-800 hover:border-sky-500 flex items-center justify-center flex-none transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-md group"
                    title="Previous Player (Left Arrow [←])"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  </button>

                  <div
                    ref={carouselContainerRef}
                    onWheel={handleCarouselWheel}
                    className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 flex-1 scroll-smooth"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#0284c7 #0f172a'
                    }}
                  >
                    {playerStats.map(p => {
                      const isSelected = activePlayer && String(activePlayer.number) === String(p.number);
                      return (
                        <button
                          key={p.number}
                          data-player-card-num={p.number}
                          onClick={() => setSelectedPlayerNum(p.number)}
                          className={`px-3 py-2 rounded-xl flex items-center gap-2 flex-none transition-all border ${
                            isSelected
                              ? 'bg-sky-500/25 border-sky-400 text-white shadow-lg ring-2 ring-sky-400/50 scale-[1.03]'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs border flex-none ${
                            isSelected ? 'bg-sky-500 text-slate-950 border-white' : 'bg-slate-900 text-sky-400 border-slate-800'
                          }`}>
                            #{p.number}
                          </span>
                          <div className="text-left min-w-0">
                            <div className="text-xs font-bold truncate max-w-[110px] leading-tight text-slate-100">
                              {p.name.split(' ')[0]}
                            </div>
                            <div className="text-[10px] font-mono font-bold text-amber-400">
                              {p.pts} PTS • {p.pir} PIR
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextPlayer}
                    disabled={playerStats.length <= 1}
                    className="w-9 h-11 rounded-xl bg-slate-950 hover:bg-sky-600 hover:text-white text-slate-400 border border-slate-800 hover:border-sky-500 flex items-center justify-center flex-none transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-md group"
                    title="Next Player (Right Arrow [→])"
                  >
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Active Player Detailed Dossier */}
              {activePlayer ? (
                <div className="space-y-4">
                  {/* Hero Dossier Header */}
                  <div className="glass-card p-4 border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border-2 border-sky-400 flex items-center justify-center font-mono font-black text-2xl text-sky-400 shadow-lg">
                        #{activePlayer.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-wider">
                            {activePlayer.name}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                            {activePlayer.pos || 'Active Roster'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          {activePlayer.eventsCount} logged match interactions • GameScore (GS):{' '}
                          <button
                            onClick={() => setActiveMetricGuideKey('gamescore')}
                            className="text-emerald-400 font-bold hover:text-emerald-300 underline inline-flex items-center gap-0.5 transition-colors"
                            title="Click to view GameScore guide"
                          >
                            <span>{activePlayer.gameScore}</span>
                            <Info className="w-2.5 h-2.5" />
                          </button>
                        </p>
                      </div>
                    </div>

                    {/* Quick Player Switcher Pill in Hero Header */}
                    <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shadow-inner">
                      <button
                        onClick={handlePrevPlayer}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white text-slate-300 transition-all flex items-center gap-1 text-xs font-bold border border-slate-800 hover:border-sky-500 active:scale-95"
                        title="Previous Player (Left Arrow [←])"
                      >
                        <ChevronLeft className="w-4 h-4 text-sky-400" />
                        <span className="hidden sm:inline">PREV</span>
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-400 px-1.5">
                        {activePlayerIndex + 1} / {playerStats.length}
                      </span>
                      <button
                        onClick={handleNextPlayer}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white text-slate-300 transition-all flex items-center gap-1 text-xs font-bold border border-slate-800 hover:border-sky-500 active:scale-95"
                        title="Next Player (Right Arrow [→])"
                      >
                        <span className="hidden sm:inline">NEXT</span>
                        <ChevronRight className="w-4 h-4 text-sky-400" />
                      </button>
                    </div>

                    {/* Big Key Metric Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">POINTS</span>
                        <span className="font-mono text-2xl font-black text-amber-400 leading-none">{activePlayer.pts}</span>
                      </div>
                      <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">REBOUNDS</span>
                        <span className="font-mono text-2xl font-black text-sky-400 leading-none">{activePlayer.reb}</span>
                      </div>
                      <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">ASSISTS</span>
                        <span className="font-mono text-2xl font-black text-cyan-400 leading-none">{activePlayer.ast}</span>
                      </div>
                      <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">PLUS / MINUS</span>
                        <span className={`font-mono text-2xl font-black leading-none ${
                          (activePlayer.plusMinus || 0) > 0 ? 'text-emerald-400' :
                          (activePlayer.plusMinus || 0) < 0 ? 'text-rose-400' :
                          'text-slate-400'
                        }`}>
                          {(activePlayer.plusMinus || 0) > 0 ? `+${activePlayer.plusMinus}` : (activePlayer.plusMinus || 0)}
                        </span>
                      </div>
                      <div 
                        onClick={() => setActiveMetricGuideKey('pir')}
                        className="bg-slate-950 px-3.5 py-1.5 rounded-xl border-2 border-emerald-500/50 hover:border-emerald-400 text-center shadow-md cursor-pointer group transition-all"
                        title="Click to view FIBA PIR guide"
                      >
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1">
                          FIBA PIR <Info className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-300" />
                        </span>
                        <span className="font-mono text-2xl font-black text-emerald-300 leading-none">{activePlayer.pir}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Section: Left Shooting & Shot Chart, Right Quarter progression & Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Column (col-span-6): Interactive Player Shot Heatmap */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="glass-card p-3 border-slate-800">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                              PLAYER SHOT MAP (#{activePlayer.number} {activePlayer.name})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {activePlayer.fgm}/{activePlayer.fga} FG ({activePlayer.pctFg.toFixed(0)}%)
                          </span>
                        </div>

                        <CourtPitchMap
                          selectedPlayer={{ number: activePlayer.number, name: activePlayer.name }}
                          selectedZoneKey={shotMapSelectedZone}
                          onSelectZone={(k) => setShotMapSelectedZone(k)}
                          events={match.events}
                        />

                        {/* Shot Distribution Bars */}
                        <div className="mt-3 pt-2 border-t border-slate-800 space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            SHOT SELECTION BREAKDOWN:
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                              <span className="text-[9px] text-slate-400 font-bold block">PAINT 2PT</span>
                              <span className="font-mono text-sm font-black text-slate-100">{activePlayer.shotDist.paintMade}/{activePlayer.shotDist.paintAttempts}</span>
                              <span className="text-[10px] text-emerald-400 block font-mono">({activePlayer.shotDist.pctPaint}% volume)</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                              <span className="text-[9px] text-slate-400 font-bold block">MID-RANGE 2PT</span>
                              <span className="font-mono text-sm font-black text-slate-100">{activePlayer.shotDist.midMade}/{activePlayer.shotDist.midAttempts}</span>
                              <span className="text-[10px] text-amber-400 block font-mono">({activePlayer.shotDist.pctMid}% volume)</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                              <span className="text-[9px] text-slate-400 font-bold block">3-POINTERS</span>
                              <span className="font-mono text-sm font-black text-slate-100">{activePlayer.shotDist.threeMade}/{activePlayer.shotDist.threeAttempts}</span>
                              <span className="text-[10px] text-sky-400 block font-mono">({activePlayer.shotDist.pctThree}% volume)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (col-span-6): Complete Stat Line & Quarter Progression */}
                    <div className="lg:col-span-6 space-y-3">
                      {/* Advanced Shooting Profile Box */}
                      <div className="glass-card p-3.5 border-slate-800">
                        <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          ADVANCED EFFICIENCY & SHOOTING METRICS
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">2PT FIELD GOALS</span>
                            <span className="font-mono text-sm font-black text-slate-100">{activePlayer.fg2m}/{activePlayer.fg2a}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{activePlayer.pct2p.toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">3PT FIELD GOALS</span>
                            <span className="font-mono text-sm font-black text-slate-100">{activePlayer.fg3m}/{activePlayer.fg3a}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{activePlayer.pct3p.toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">FREE THROWS</span>
                            <span className="font-mono text-sm font-black text-slate-100">{activePlayer.ftm}/{activePlayer.fta}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{activePlayer.pctFt.toFixed(0)}%</span>
                          </div>
                          <div 
                            onClick={() => setActiveMetricGuideKey('ts')}
                            className="bg-slate-950 p-2 rounded-lg border border-slate-850 hover:border-emerald-500/60 cursor-pointer group transition-all"
                            title="Click to view TS% and eFG% guide"
                          >
                            <span className="text-[9px] text-slate-400 group-hover:text-emerald-300 font-bold flex items-center justify-center gap-1 uppercase transition-colors">
                              TRUE SHOOTING <Info className="w-2.5 h-2.5 text-slate-500" />
                            </span>
                            <span className="font-mono text-sm font-black text-emerald-400">{activePlayer.tsPct.toFixed(1)}%</span>
                            <span className="text-[10px] text-slate-500 font-mono block">eFG: {activePlayer.efgPct.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* Secondary stats row */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2 text-center">
                          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-400 font-bold block">OFF REB</span>
                            <span className="font-mono text-xs font-black text-slate-200">{activePlayer.oreb}</span>
                          </div>
                          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-400 font-bold block">DEF REB</span>
                            <span className="font-mono text-xs font-black text-slate-200">{activePlayer.dreb}</span>
                          </div>
                          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-400 font-bold block">STEALS</span>
                            <span className="font-mono text-xs font-black text-sky-400">{activePlayer.stl}</span>
                          </div>
                          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-400 font-bold block">TURNOVERS</span>
                            <span className="font-mono text-xs font-black text-rose-400">{activePlayer.tov}</span>
                          </div>
                          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-400 font-bold block">BLOCKS</span>
                            <span className="font-mono text-xs font-black text-purple-400">{activePlayer.blk}</span>
                          </div>
                          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-400 font-bold block">FOULS (PF/FD)</span>
                            <span className="font-mono text-xs font-black text-slate-200">{activePlayer.pf}/{activePlayer.fd}</span>
                          </div>
                        </div>
                      </div>

                      {/* Player Progression by Quarter Table */}
                      <div className="glass-card p-3 border-slate-800 overflow-x-auto">
                        <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          QUARTER-BY-QUARTER STAT PRODUCTION
                        </h4>
                        <table className="w-full text-left text-xs font-semibold">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                              <th className="py-1 px-1.5">PERIOD</th>
                              <th className="py-1 px-1.5 text-amber-400">PTS</th>
                              <th className="py-1 px-1.5">FGM/A</th>
                              <th className="py-1 px-1.5">FG%</th>
                              <th className="py-1 px-1.5">REB</th>
                              <th className="py-1 px-1.5">AST</th>
                              <th className="py-1 px-1.5 text-rose-400">TOV</th>
                              <th className="py-1 px-1.5">PF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quarters.map(q => {
                              const qData = activePlayer.quarters[q.quarter] || { pts: 0, fgm: 0, fga: 0, pctFg: 0, reb: 0, ast: 0, tov: 0, pf: 0 };
                              return (
                                <tr key={q.quarter} className="border-b border-slate-850 hover:bg-slate-800/30">
                                  <td className="py-1.5 px-1.5 font-mono text-sky-400 font-bold">{q.quarter}</td>
                                  <td className="py-1.5 px-1.5 font-mono font-black text-amber-400">{qData.pts}</td>
                                  <td className="py-1.5 px-1.5 font-mono text-slate-300">{qData.fgm}/{qData.fga}</td>
                                  <td className="py-1.5 px-1.5 font-mono text-slate-400">{qData.pctFg.toFixed(0)}%</td>
                                  <td className="py-1.5 px-1.5 text-slate-300">{qData.reb}</td>
                                  <td className="py-1.5 px-1.5 text-slate-300">{qData.ast}</td>
                                  <td className="py-1.5 px-1.5 text-rose-400">{qData.tov}</td>
                                  <td className="py-1.5 px-1.5 text-slate-400">{qData.pf}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Player Chronological Match Action Log */}
                  <div className="glass-card p-3.5 border-slate-800">
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <List className="w-3.5 h-3.5 text-sky-400" />
                        <span>MATCH ACTION LOG FOR #{activePlayer.number} {activePlayer.name} ({activePlayer.events.length} PLAYS)</span>
                      </div>
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {activePlayer.events.map((ev, i) => {
                        const q = ev.Quarter || ev.quarter || 'Q1';
                        const ts = ev.Timestamp || ev.timestamp || '-';
                        const act = ev.Action || ev.action || '';
                        const zn = ev.Zone || ev.zone || 'Generic';
                        const isMade = act.includes('Made');
                        const isMiss = act.includes('Missed');

                        return (
                          <div key={i} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-850 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sky-400 font-bold">{q}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{ts}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isMade ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                isMiss ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                'bg-slate-850 text-slate-200'
                              }`}>
                                {act}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">{zn}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-8 text-center text-slate-400 font-bold">
                  No individual player logs found for this match session.
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: SHOT MAP & ZONE EFFICIENCY                                    */}
          {/* ===================================================================== */}
          {activeTab === 'shotmap' && (
            <div className="space-y-4">
              {/* Filter Row: Team or Individual Player */}
              <div className="glass-card p-3 border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    FILTER SHOT HEATMAP & STATS:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={shotMapPlayerFilter ? shotMapPlayerFilter.number : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setShotMapPlayerFilter(null);
                      } else {
                        const found = playerStats.find(p => String(p.number) === val);
                        setShotMapPlayerFilter(found || { number: val, name: `Player #${val}` });
                      }
                    }}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:border-sky-400"
                  >
                    <option value="">WHOLE TEAM (ALL PLAYERS)</option>
                    {playerStats.map(p => (
                      <option key={p.number} value={p.number}>
                        #{p.number} - {p.name} ({p.fgm}/{p.fga} FG)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Court Half-Pitch Map */}
              <div className="glass-card p-4 border-slate-800">
                <CourtPitchMap
                  selectedPlayer={shotMapPlayerFilter}
                  selectedZoneKey={shotMapSelectedZone}
                  onSelectZone={(k) => setShotMapSelectedZone(k)}
                  events={filteredShotMapEvents}
                  zoneStats={activeZoneStats}
                />
              </div>

              {/* Shot Zone Efficiency Table */}
              <div className="glass-card p-4 border-slate-800 overflow-x-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                      9-ZONE SHOT EFFICIENCY & VOLUME RANKING
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveMetricGuideKey('pps')}
                    className="text-[10px] font-bold text-slate-400 hover:text-amber-400 underline flex items-center gap-1 transition-colors"
                    title="Click to view Points Per Shot (PPS) guide"
                  >
                    <span>PPS = Points Per Shot (Expected Value)</span>
                    <Info className="w-2.5 h-2.5 text-amber-400" />
                  </button>
                </div>

                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-700/80 text-slate-400">
                      <th className="py-2 px-2">ZONE</th>
                      <th className="py-2 px-2">TYPE</th>
                      <th className="py-2 px-2 text-slate-200">FGM / FGA</th>
                      <th className="py-2 px-2">ACCURACY (FG%)</th>
                      <th className="py-2 px-2">SHOT SHARE</th>
                      <th 
                        onClick={() => setActiveMetricGuideKey('pps')}
                        className="py-2 px-2 text-amber-400 font-bold cursor-pointer hover:text-amber-300 transition-colors"
                        title="Click to view Points Per Shot (PPS) guide"
                      >
                        <span className="flex items-center gap-1">
                          PTS / SHOT (PPS) <Info className="w-2.5 h-2.5" />
                        </span>
                      </th>
                      <th className="py-2 px-2 text-right">RATING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeZoneStats.zones.map(z => (
                      <tr key={z.key} className="border-b border-slate-850 hover:bg-slate-800/30">
                        <td className="py-2.5 px-2 font-bold text-slate-100 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.efficiencyColor }}></span>
                          {z.name}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-400">{z.type}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-200 font-bold">{z.made} / {z.attempts}</td>
                        <td className="py-2.5 px-2 font-mono font-bold" style={{ color: z.efficiencyColor }}>
                          {z.pct.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-300">
                          {z.shotShare.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 font-mono font-black text-amber-400">
                          {z.pps.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            z.pct >= 50 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            z.pct >= 33 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            z.attempts > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            'bg-slate-800 text-slate-500'
                          }`}>
                            {z.ratingLabel || (z.pct >= 50 ? 'HOT' : z.pct >= 33 ? 'SOLID' : z.attempts > 0 ? 'COLD' : 'NO ATTEMPTS')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {activeZoneStats.totalShotsCount > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-700 bg-slate-900/80 font-black text-slate-100">
                        <td className="py-2.5 px-2">TOTAL (ALL 9 ZONES)</td>
                        <td className="py-2.5 px-2 text-slate-400">FG</td>
                        <td className="py-2.5 px-2 text-sky-400 font-mono text-sm">
                          {activeZoneStats.totalMadeCount} / {activeZoneStats.totalShotsCount}
                        </td>
                        <td className="py-2.5 px-2 text-sky-400 font-mono text-sm">
                          {((activeZoneStats.totalMadeCount / activeZoneStats.totalShotsCount) * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 font-mono">100.0%</td>
                        <td className="py-2.5 px-2 text-amber-400 font-mono">
                          {activeZoneStats.zones.reduce((acc, z) => acc + (z.attempts * z.pps), 0) > 0
                            ? (activeZoneStats.zones.reduce((acc, z) => acc + (z.attempts * z.pps), 0) / activeZoneStats.totalShotsCount).toFixed(2)
                            : '0.00'}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                            ALL SHOTS
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: OFFICIAL FIBA BOX SCORE                                        */}
          {/* ===================================================================== */}
          {activeTab === 'boxscore' && (
            <div className="space-y-4">
              <div className="glass-card p-4 border-slate-800 overflow-x-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                      OFFICIAL FIBA BOX SCORE — SORTABLE METRICS
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveMetricGuideKey('pir')}
                      className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1 transition-colors"
                      title="FIBA PIR Calculation Guide"
                    >
                      <span>What is PIR?</span>
                      <Info className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => setActiveMetricGuideKey('gamescore')}
                      className="text-[10px] font-bold text-purple-400 hover:underline flex items-center gap-1 transition-colors"
                      title="GameScore Guide"
                    >
                      <span>What is GS?</span>
                      <Info className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">• Click column header to sort</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-700/80 text-slate-400 select-none">
                      <th onClick={() => handleSortBoxScore('number')} className="py-2.5 px-2 cursor-pointer hover:text-white">N°</th>
                      <th onClick={() => handleSortBoxScore('name')} className="py-2.5 px-2 cursor-pointer hover:text-white">PLAYER</th>
                      <th onClick={() => handleSortBoxScore('pts')} className="py-2.5 px-2 text-amber-400 font-bold cursor-pointer hover:text-amber-300">PTS</th>
                      <th onClick={() => handleSortBoxScore('fg2m')} className="py-2.5 px-2 cursor-pointer hover:text-white">2PM/A</th>
                      <th onClick={() => handleSortBoxScore('pct2p')} className="py-2.5 px-2 cursor-pointer hover:text-white">2P%</th>
                      <th onClick={() => handleSortBoxScore('fg3m')} className="py-2.5 px-2 cursor-pointer hover:text-white">3PM/A</th>
                      <th onClick={() => handleSortBoxScore('pct3p')} className="py-2.5 px-2 cursor-pointer hover:text-white">3P%</th>
                      <th onClick={() => handleSortBoxScore('ftm')} className="py-2.5 px-2 cursor-pointer hover:text-white">FTM/A</th>
                      <th onClick={() => handleSortBoxScore('pctFt')} className="py-2.5 px-2 cursor-pointer hover:text-white">FT%</th>
                      <th onClick={() => handleSortBoxScore('reb')} className="py-2.5 px-2 cursor-pointer hover:text-white">REB</th>
                      <th onClick={() => handleSortBoxScore('ast')} className="py-2.5 px-2 cursor-pointer hover:text-white">AST</th>
                      <th onClick={() => handleSortBoxScore('stl')} className="py-2.5 px-2 text-sky-400 cursor-pointer hover:text-sky-300">STL</th>
                      <th onClick={() => handleSortBoxScore('tov')} className="py-2.5 px-2 text-rose-400 cursor-pointer hover:text-rose-300">TOV</th>
                      <th onClick={() => handleSortBoxScore('pf')} className="py-2.5 px-2 cursor-pointer hover:text-white">PF</th>
                      <th onClick={() => handleSortBoxScore('fd')} className="py-2.5 px-2 cursor-pointer hover:text-white">FD</th>
                      <th onClick={() => handleSortBoxScore('blk')} className="py-2.5 px-2 cursor-pointer hover:text-white">BLK</th>
                      <th onClick={() => handleSortBoxScore('pir')} className="py-2.5 px-2 text-emerald-400 font-black cursor-pointer hover:text-emerald-300" title="Sort by FIBA PIR">
                        <span className="inline-flex items-center gap-0.5">
                          PIR <Info className="w-2.5 h-2.5 text-emerald-500 hover:text-emerald-300" onClick={(e) => { e.stopPropagation(); setActiveMetricGuideKey('pir'); }} />
                        </span>
                      </th>
                      <th onClick={() => handleSortBoxScore('plusMinus')} className="py-2.5 px-2 text-cyan-400 font-bold cursor-pointer hover:text-cyan-300" title="Sort by Plus/Minus (+/-)">
                        +/-
                      </th>
                      <th onClick={() => handleSortBoxScore('gameScore')} className="py-2.5 px-2 text-purple-400 font-bold cursor-pointer hover:text-purple-300" title="Sort by GameScore">
                        <span className="inline-flex items-center gap-0.5">
                          GS <Info className="w-2.5 h-2.5 text-purple-500 hover:text-purple-300" onClick={(e) => { e.stopPropagation(); setActiveMetricGuideKey('gamescore'); }} />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map(r => (
                      <tr key={r.number} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-sky-400 font-mono">#{r.number}</td>
                        <td className="py-2.5 px-2 text-slate-100 font-bold truncate max-w-[150px]">{r.name}</td>
                        <td className="py-2.5 px-2 text-amber-400 font-black text-sm">{r.pts}</td>
                        <td className="py-2.5 px-2 text-slate-200">{r.fg2m}/{r.fg2a}</td>
                        <td className="py-2.5 px-2 text-slate-300 font-mono">{r.pct2p.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-slate-200">{r.fg3m}/{r.fg3a}</td>
                        <td className="py-2.5 px-2 text-slate-300 font-mono">{r.pct3p.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-slate-200">{r.ftm}/{r.fta}</td>
                        <td className="py-2.5 px-2 text-slate-300 font-mono">{r.pctFt.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-slate-200">{r.reb}</td>
                        <td className="py-2.5 px-2 text-slate-200">{r.ast}</td>
                        <td className="py-2.5 px-2 text-sky-400 font-bold">{r.stl}</td>
                        <td className="py-2.5 px-2 text-rose-400 font-bold">{r.tov}</td>
                        <td className="py-2.5 px-2 text-slate-300">{r.pf}</td>
                        <td className="py-2.5 px-2 text-slate-300">{r.fd}</td>
                        <td className="py-2.5 px-2 text-slate-300">{r.blk}</td>
                        <td className="py-2.5 px-2 text-emerald-400 font-black">{r.pir}</td>
                        <td className={`py-2.5 px-2 font-mono font-bold ${
                          (r.plusMinus || 0) > 0 ? 'text-emerald-400' :
                          (r.plusMinus || 0) < 0 ? 'text-rose-400' :
                          'text-slate-400'
                        }`}>
                          {(r.plusMinus || 0) > 0 ? `+${r.plusMinus}` : (r.plusMinus || 0)}
                        </td>
                        <td className="py-2.5 px-2 text-purple-400 font-mono">{r.gameScore}</td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot>
                    <tr className="bg-slate-950 border-t-2 border-slate-700 text-slate-200 font-black">
                      <td colSpan={2} className="py-3 px-2 text-sky-400 uppercase tracking-wider">TEAM TOTALS</td>
                      <td className="py-3 px-2 text-amber-400 text-base">{teamOverview.pts}</td>
                      <td className="py-3 px-2">{teamOverview.fg2m}/{teamOverview.fg2a}</td>
                      <td className="py-3 px-2 font-mono">{teamOverview.pct2p.toFixed(0)}%</td>
                      <td className="py-3 px-2">{teamOverview.fg3m}/{teamOverview.fg3a}</td>
                      <td className="py-3 px-2 font-mono">{teamOverview.pct3p.toFixed(0)}%</td>
                      <td className="py-3 px-2">{teamOverview.ftm}/{teamOverview.fta}</td>
                      <td className="py-3 px-2 font-mono">{teamOverview.pctFt.toFixed(0)}%</td>
                      <td className="py-3 px-2">{teamOverview.reb}</td>
                      <td className="py-3 px-2">{teamOverview.ast}</td>
                      <td className="py-3 px-2 text-sky-400">{teamOverview.stl}</td>
                      <td className="py-3 px-2 text-rose-400">{teamOverview.tov}</td>
                      <td className="py-3 px-2">{teamOverview.pf}</td>
                      <td className="py-3 px-2">{teamOverview.fd}</td>
                      <td className="py-3 px-2">{teamOverview.blk}</td>
                      <td className="py-3 px-2 text-emerald-400 text-base">{teamOverview.pir}</td>
                      <td className={`py-3 px-2 font-mono font-bold ${
                        (teamOverview.pointDifferential || 0) > 0 ? 'text-emerald-400' :
                        (teamOverview.pointDifferential || 0) < 0 ? 'text-rose-400' :
                        'text-slate-400'
                      }`}>
                        {(teamOverview.pointDifferential || 0) > 0 ? `+${teamOverview.pointDifferential}` : (teamOverview.pointDifferential || 0)}
                      </td>
                      <td className="py-3 px-2 text-purple-400">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 6: PLAY-BY-PLAY FEED & SEARCH                                     */}
          {/* ===================================================================== */}
          {activeTab === 'playbyplay' && (
            <div className="space-y-3">
              {/* Filter Controls Bar */}
              <div className="glass-card p-3 border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search player, action, zone..."
                      value={playSearch}
                      onChange={(e) => setPlaySearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg font-medium focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* Player Filter */}
                  <select
                    value={playPlayerFilter}
                    onChange={(e) => setPlayPlayerFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:border-sky-400"
                  >
                    <option value="ALL">ALL PLAYERS</option>
                    {playerStats.map(p => (
                      <option key={p.number} value={p.number}>#{p.number} {p.name}</option>
                    ))}
                    <option value="-">TEAM TACTICS</option>
                  </select>
                </div>

                {/* Quarter and Category Quick Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850">
                  {/* Quarter pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">PERIOD:</span>
                    {['ALL', 'Q1', 'Q2', 'Q3', 'Q4', ...quarters.filter(q => q.quarter.startsWith('OT')).map(q => q.quarter)].map(q => (
                      <button
                        key={q}
                        onClick={() => setPlayQuarterFilter(q)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          playQuarterFilter === q
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Category pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">TYPE:</span>
                    {[
                      { key: 'ALL', label: 'ALL' },
                      { key: 'SHOTS', label: 'SHOTS' },
                      { key: 'FT', label: 'FT' },
                      { key: 'REB', label: 'REBOUNDS' },
                      { key: 'BALL', label: 'CONTROL' },
                      { key: 'FOUL', label: 'FOULS' },
                      { key: 'TACTIC', label: 'TACTICAL' }
                    ].map(c => (
                      <button
                        key={c.key}
                        onClick={() => setPlayCategoryFilter(c.key)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          playCategoryFilter === c.key
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Event Log Table */}
              <div className="glass-card p-3 border-slate-800 overflow-x-auto">
                <div className="text-[10px] text-slate-500 font-bold mb-2">
                  SHOWING {filteredEvents.length} OF {totalEvents} MATCH ACTIONS
                </div>

                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-700/80 text-slate-400">
                      <th className="py-2 px-2">QUARTER</th>
                      <th className="py-2 px-2">TIME</th>
                      <th className="py-2 px-2">PLAYER</th>
                      <th className="py-2 px-2">ACTION</th>
                      <th className="py-2 px-2">CATEGORY</th>
                      <th className="py-2 px-2">COURT ZONE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((ev, i) => {
                      const q = ev.Quarter || ev.quarter || 'Q1';
                      const ts = ev.Timestamp || ev.timestamp || '-';
                      const num = ev.Number ?? ev.number ?? '';
                      const pName = ev.Player || ev.player || '';
                      const act = ev.Action || ev.action || '';
                      const cat = ev.Category || ev.category || 'General';
                      const zn = ev.Zone || ev.zone || '-';

                      const isSuccess = act.includes('Made') || act.includes('Fatto');
                      const isMiss = act.includes('Missed') || act.includes('Sbagliato');

                      return (
                        <tr key={i} className="border-b border-slate-850 hover:bg-slate-800/30">
                          <td className="py-2 px-2 font-mono text-sky-400 font-black">{q}</td>
                          <td className="py-2 px-2 text-slate-400 text-[11px] font-mono">{ts}</td>
                          <td className="py-2 px-2 font-bold text-slate-100">
                            {num === '-' || pName === 'TEAM' ? (
                              <span className="text-amber-400 font-black flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" /> TEAM
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="font-mono text-sky-400">#{num}</span> {pName}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isSuccess ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              isMiss ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                              act === 'Stagger' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                              act === 'Ghost' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                              'bg-slate-800 text-slate-200'
                            }`}>
                              {act}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-slate-400 text-[11px]">{cat}</td>
                          <td className="py-2 px-2 text-slate-300">{zn}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Metric Decision Guide Modal */}
      {activeMetricGuideKey && (
        <MetricGuideModal
          activeKey={activeMetricGuideKey}
          onClose={() => setActiveMetricGuideKey(null)}
          onSelectMetric={(k) => setActiveMetricGuideKey(k)}
        />
      )}
    </div>
  );
}

function teamOthersCount(t) {
  const parts = [];
  if (t.oreb) parts.push(`${t.oreb} OREB`);
  if (t.tov) parts.push(`${t.tov} TOV`);
  return parts.join(' - ');
}
