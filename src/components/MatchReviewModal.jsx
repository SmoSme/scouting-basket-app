import React, { useState, useMemo } from 'react';
import { 
  Trophy, Download, X, PieChart, List, 
  Target, Users, Clock, Shield, Zap, Sparkles, Layers, Ghost, 
  Calendar, Hash, Search, Filter, TrendingUp, BarChart2,
  Check, ArrowRight, UserCheck, Flame, ChevronRight,
  Info, AlertTriangle, BookOpen, HelpCircle
} from 'lucide-react';
import CourtPitchMap from './CourtPitchMap';
import MetricGuideModal from './MetricGuideModal';
import { calculateMatchAnalytics } from '../utils/basketballAnalytics';

export default function MatchReviewModal({ match, onClose, onDownloadCSV }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'quarters' | 'players' | 'shotmap' | 'boxscore' | 'playbyplay'
  const [selectedPlayerNum, setSelectedPlayerNum] = useState(null);
  const [shotMapPlayerFilter, setShotMapPlayerFilter] = useState(null);
  const [shotMapSelectedZone, setShotMapSelectedZone] = useState('PAINT');
  const [boxScoreSortKey, setBoxScoreSortKey] = useState('pir');
  const [boxScoreSortAsc, setBoxScoreSortAsc] = useState(false);
  const [activeMetricGuideKey, setActiveMetricGuideKey] = useState(null); // 'ortg' | 'possessions' | 'efg' | 'ts' | 'asttov' | 'pir' | 'gamescore' | 'fourfactors' | 'pps'

  // Play-by-Play Filters
  const [playSearch, setPlaySearch] = useState('');
  const [playQuarterFilter, setPlayQuarterFilter] = useState('ALL');
  const [playCategoryFilter, setPlayCategoryFilter] = useState('ALL');
  const [playPlayerFilter, setPlayPlayerFilter] = useState('ALL');

  // Compute full analytics dataset
  const analytics = useMemo(() => {
    return calculateMatchAnalytics(match?.events || []);
  }, [match]);

  const {
    teamOverview,
    fourFactors,
    quarters,
    playerStats,
    teamLeaders,
    zoneSummary,
    totalEvents
  } = analytics;

  // Initialize selected player to top PIR player if none selected
  const activePlayer = useMemo(() => {
    if (playerStats.length === 0) return null;
    if (selectedPlayerNum) {
      return playerStats.find(p => String(p.number) === String(selectedPlayerNum)) || playerStats[0];
    }
    return playerStats[0];
  }, [playerStats, selectedPlayerNum]);

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
                <div className="bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono font-black text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  <span>SCORE:</span>
                  <span className="text-amber-400 text-sm">{teamOverview.pts}</span>
                  <span className="text-[10px] text-amber-500 uppercase">PTS</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-sky-400" />
                  {totalEvents} Logged Plays
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(match.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
              onClick={() => setActiveMetricGuideKey('ortg')}
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
            OVERVIEW & FOUR FACTORS
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
              {/* Contextual Scouting Intelligence & Tracking Alert Banner */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-3 text-xs flex-wrap shadow-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Info className="w-4 h-4 text-sky-400 flex-none" />
                  <span>
                    <strong className="text-sky-300">Scouting Intelligence:</strong> Free Throws are recorded as made/missed. Personal Fouls are not currently logged. Click on any metric or <span className="text-amber-400 font-bold">ⓘ</span> to view formulas, definitions, and decision benchmarks.
                  </span>
                </div>
                <button
                  onClick={() => setActiveMetricGuideKey('ortg')}
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 underline flex-none"
                >
                  <span>Open Metric Guide</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Executive Summary Metrics Grid with Interactive Info Triggers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <div
                  onClick={() => setActiveMetricGuideKey('ortg')}
                  className="glass-card p-2.5 border-slate-800 hover:border-sky-400/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view metric definition and benchmarks"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-300 uppercase tracking-wider transition-colors">
                      OFFENSIVE RATING
                    </span>
                    <Info className="w-3 h-3 text-slate-500 group-hover:text-sky-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">{teamOverview.ortg}</span>
                    <span className="text-[10px] font-bold text-slate-500">PTS/100</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold">{teamOverview.ppp} pts/poss</span>
                </div>

                <div
                  onClick={() => setActiveMetricGuideKey('possessions')}
                  className="glass-card p-2.5 border-slate-800 hover:border-sky-400/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view metric definition and benchmarks"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-300 uppercase tracking-wider transition-colors">
                      EST. POSSESSIONS
                    </span>
                    <Info className="w-3 h-3 text-slate-500 group-hover:text-sky-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-xl sm:text-2xl font-black text-sky-400">{teamOverview.possessions}</span>
                    <span className="text-[10px] font-bold text-slate-500">PACE</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold">{teamOverview.fga} FGA + {teamOthersCount(teamOverview)}</span>
                </div>

                <div
                  onClick={() => setActiveMetricGuideKey('efg')}
                  className="glass-card p-2.5 border-slate-800 hover:border-sky-400/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view metric definition and benchmarks"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-300 uppercase tracking-wider transition-colors">
                      EFFECTIVE FG%
                    </span>
                    <Info className="w-3 h-3 text-slate-500 group-hover:text-sky-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">{teamOverview.efgPct.toFixed(1)}%</span>
                    <span className="text-[10px] font-bold text-slate-500">eFG%</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold">2P: {teamOverview.pct2p.toFixed(0)}% | 3P: {teamOverview.pct3p.toFixed(0)}%</span>
                </div>

                <div
                  onClick={() => setActiveMetricGuideKey('ts')}
                  className="glass-card p-2.5 border-slate-800 hover:border-sky-400/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view metric definition and benchmarks"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-300 uppercase tracking-wider transition-colors">
                      TRUE SHOOTING
                    </span>
                    <Info className="w-3 h-3 text-slate-500 group-hover:text-sky-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-xl sm:text-2xl font-black text-emerald-300">{teamOverview.tsPct.toFixed(1)}%</span>
                    <span className="text-[10px] font-bold text-slate-500">TS%</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold">FT: {teamOverview.ftm}/{teamOverview.fta} ({teamOverview.pctFt.toFixed(0)}%)</span>
                </div>

                <div
                  onClick={() => setActiveMetricGuideKey('asttov')}
                  className="glass-card p-2.5 border-slate-800 hover:border-sky-400/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view metric definition and benchmarks"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-300 uppercase tracking-wider transition-colors">
                      AST / TOV RATIO
                    </span>
                    <Info className="w-3 h-3 text-slate-500 group-hover:text-sky-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-xl sm:text-2xl font-black text-cyan-400">{teamOverview.astTovRatio}</span>
                    <span className="text-[10px] font-bold text-slate-500">RATIO</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold">{teamOverview.ast} AST / {teamOverview.tov} TOV</span>
                </div>

                <div
                  onClick={() => setActiveMetricGuideKey('pir')}
                  className="glass-card p-2.5 border-slate-800 hover:border-sky-400/80 hover:bg-slate-850 cursor-pointer group transition-all flex flex-col justify-between shadow-sm active:scale-98"
                  title="Click to view metric definition and benchmarks"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-300 uppercase tracking-wider transition-colors">
                      FIBA EFFICIENCY
                    </span>
                    <Info className="w-3 h-3 text-slate-500 group-hover:text-sky-400 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-xl sm:text-2xl font-black text-purple-400">{teamOverview.pir}</span>
                    <span className="text-[10px] font-bold text-slate-500">PIR</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold">{teamOverview.reb} REB | {teamOverview.stl} STL | {teamOverview.blk} BLK</span>
                </div>
              </div>

              {/* Dean Oliver's Four Factors Section */}
              <div className="glass-card p-3 sm:p-4 border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div
                    onClick={() => setActiveMetricGuideKey('fourfactors')}
                    className="flex items-center gap-2 cursor-pointer group"
                    title="Click to view Dean Oliver's Four Factors guide"
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                      DEAN OLIVER'S FOUR FACTORS OF BASKETBALL SUCCESS
                      <Info className="w-3 h-3 text-slate-500 group-hover:text-sky-400" />
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveMetricGuideKey('fourfactors')}
                    className="text-[10px] font-bold text-slate-400 hover:text-sky-400 transition-colors underline"
                  >
                    Four Factors Guide
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Factor 1: Shooting */}
                  <div
                    onClick={() => setActiveMetricGuideKey('efg')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-emerald-500/60 cursor-pointer group transition-all flex flex-col justify-between"
                    title="Factor 1: Shooting Efficiency (eFG%)"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                          1. SHOOTING EFFICIENCY <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          fourFactors.shooting.rating === 'Elite' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {fourFactors.shooting.rating}
                        </span>
                      </div>
                      <div className="font-mono text-2xl font-black text-emerald-400 my-1">
                        {fourFactors.shooting.value}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 mt-2">
                      {fourFactors.shooting.subtext}
                    </div>
                  </div>

                  {/* Factor 2: Turnovers */}
                  <div
                    onClick={() => setActiveMetricGuideKey('ortg')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-sky-500/60 cursor-pointer group transition-all flex flex-col justify-between"
                    title="Factor 2: Turnover Rate (TOV%)"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="group-hover:text-sky-300 transition-colors flex items-center gap-1">
                          2. TURNOVER RATE <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          fourFactors.turnovers.rating.includes('Elite') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {fourFactors.turnovers.rating}
                        </span>
                      </div>
                      <div className="font-mono text-2xl font-black text-sky-400 my-1">
                        {fourFactors.turnovers.value}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 mt-2">
                      {fourFactors.turnovers.subtext}
                    </div>
                  </div>

                  {/* Factor 3: Rebounding */}
                  <div
                    onClick={() => setActiveMetricGuideKey('fourfactors')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-amber-500/60 cursor-pointer group transition-all flex flex-col justify-between"
                    title="Factor 3: Offensive Rebound Share"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="group-hover:text-amber-300 transition-colors flex items-center gap-1">
                          3. OFFENSIVE REBOUND SHARE <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                          {fourFactors.rebounding.rating}
                        </span>
                      </div>
                      <div className="font-mono text-2xl font-black text-amber-400 my-1">
                        {fourFactors.rebounding.value}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 mt-2">
                      {fourFactors.rebounding.subtext}
                    </div>
                  </div>

                  {/* Factor 4: Free Throws */}
                  <div
                    onClick={() => setActiveMetricGuideKey('ts')}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-purple-500/60 cursor-pointer group transition-all flex flex-col justify-between"
                    title="Factor 4: Free Throw Rate (FTR)"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span className="group-hover:text-purple-300 transition-colors flex items-center gap-1">
                          4. FREE THROW RATE <Info className="w-2.5 h-2.5 text-slate-500" />
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                          {fourFactors.freeThrows.rating}
                        </span>
                      </div>
                      <div className="font-mono text-2xl font-black text-purple-400 my-1">
                        {fourFactors.freeThrows.value}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 mt-2">
                      {fourFactors.freeThrows.subtext}
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
                  <span className="text-[10px] font-bold text-slate-400">
                    {teamOverview.tacticsPerPoss} per 100 poss
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
              {/* Horizontal Player Carousel / Selector */}
              <div className="glass-card p-2 border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {playerStats.map(p => {
                    const isSelected = activePlayer && String(activePlayer.number) === String(p.number);
                    return (
                      <button
                        key={p.number}
                        onClick={() => setSelectedPlayerNum(p.number)}
                        className={`px-3 py-2 rounded-xl flex items-center gap-2 flex-none transition-all border ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 text-white shadow-md ring-1 ring-sky-400/50 scale-105'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center font-mono font-black text-xs text-sky-400 border border-slate-800 flex-none">
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-wider">
                            {activePlayer.name}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                            {activePlayer.pos || 'Active Roster'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          {activePlayer.eventsCount} logged match interactions • Hollinger GameScore:{' '}
                          <button
                            onClick={() => setActiveMetricGuideKey('gamescore')}
                            className="text-emerald-400 font-bold hover:text-emerald-300 underline inline-flex items-center gap-0.5 transition-colors"
                            title="Click to view Hollinger GameScore guide"
                          >
                            <span>{activePlayer.gameScore}</span>
                            <Info className="w-2.5 h-2.5" />
                          </button>
                        </p>
                      </div>
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
                  events={match.events}
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
                    {zoneSummary.map(z => (
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
                            {z.pct >= 50 ? 'HOT' : z.pct >= 33 ? 'SOLID' : z.attempts > 0 ? 'COLD' : 'NO ATTEMPTS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
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
                      title="Hollinger GameScore Guide"
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
                      <th onClick={() => handleSortBoxScore('gameScore')} className="py-2.5 px-2 text-purple-400 font-bold cursor-pointer hover:text-purple-300" title="Sort by Hollinger GameScore">
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
