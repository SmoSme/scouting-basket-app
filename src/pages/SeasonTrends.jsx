import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, LineChart, Line, BarChart, Bar, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, Trophy, Target, Shield, Activity, RefreshCw, 
  Filter, Calendar, Hash, Eye, Download, AlertCircle, CheckCircle2, 
  Zap, BarChart3, ChevronRight, Layers, Flame
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { aggregateSeasonStats } from '../utils/seasonAggregator';
import MatchReviewModal from '../components/MatchReviewModal';

export default function SeasonTrends({ showToast, authRole = 'admin' }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchTypeFilter, setMatchTypeFilter] = useState('ALL'); // 'ALL' | 'OFFICIAL' | 'FRIENDLY' | 'SCRIMMAGE'
  const [splitFilter, setSplitFilter] = useState('ALL'); // 'ALL' | 'LAST_5' | 'LAST_10'
  
  // Review Modal state
  const [reviewMatch, setReviewMatch] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // 1. Fetch from Supabase scouting_log
      const { data, error } = await supabase
        .from('scouting_log')
        .select('*')
        .order('id', { ascending: false });

      const grouped = {};
      (data || []).forEach(item => {
        const gameName = item.Match_Name || item.match_name || item.nome_partita || item.Nome_Partita || 'Unnamed Match';
        if (!grouped[gameName]) {
          grouped[gameName] = {
            name: gameName,
            events: [],
            createdAt: item.created_at || item.Timestamp || item.timestamp || 'n.a.'
          };
        }
        grouped[gameName].events.push(item);
      });

      // 2. Scan localStorage for offline/local match sessions
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('bba_events_')) {
            const gameName = key.replace('bba_events_', '');
            if (gameName && !grouped[gameName]) {
              try {
                const localEvs = JSON.parse(localStorage.getItem(key));
                if (Array.isArray(localEvs) && localEvs.length > 0) {
                  grouped[gameName] = {
                    name: gameName,
                    events: localEvs,
                    createdAt: localEvs[0]?.timestamp || new Date().toISOString()
                  };
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      // 3. Normalize into match items
      const parsedMatches = Object.values(grouped).map(m => {
        const storedType = localStorage.getItem(`match_type_${m.name}`) || 'Official';
        const storedDate = localStorage.getItem(`match_date_${m.name}`) || (m.createdAt ? m.createdAt.split('T')[0] : 'n.a.');

        return {
          name: m.name,
          createdAt: m.createdAt,
          matchType: storedType,
          matchDate: storedDate,
          events: m.events
        };
      });

      setMatches(parsedMatches);
    } catch (err) {
      console.error('Error fetching matches for season trends:', err);
      if (showToast) showToast('❌ Error loading match records');
    } finally {
      setLoading(false);
    }
  };

  // Compute aggregate stats across matches given active filters
  const seasonStats = useMemo(() => {
    return aggregateSeasonStats(matches, {
      matchType: matchTypeFilter,
      split: splitFilter
    });
  }, [matches, matchTypeFilter, splitFilter]);

  const {
    gamesPlayed,
    record,
    scoring,
    shooting,
    rebounding,
    ballControl,
    typeCounts,
    timeline,
    matches: filteredMatches
  } = seasonStats;

  // Retroactive date update
  const handleUpdateMatchDate = (matchName, newDate) => {
    try {
      localStorage.setItem(`match_date_${matchName}`, newDate);
    } catch (e) {}
    setMatches(prev => prev.map(m => m.name === matchName ? { ...m, matchDate: newDate } : m));
    if (reviewMatch && reviewMatch.name === matchName) {
      setReviewMatch(prev => ({ ...prev, matchDate: newDate }));
    }
  };

  // Retroactive match type update
  const handleUpdateMatchType = (matchName, newType) => {
    try {
      localStorage.setItem(`match_type_${matchName}`, newType);
    } catch (e) {}
    setMatches(prev => prev.map(m => m.name === matchName ? { ...m, matchType: newType } : m));
    if (reviewMatch && reviewMatch.name === matchName) {
      setReviewMatch(prev => ({ ...prev, matchType: newType }));
    }
  };

  // Open match review
  const handleOpenReview = async (match) => {
    setReviewLoading(true);
    try {
      let events = match.events;
      if (!events || events.length === 0) {
        let { data, error } = await supabase
          .from('scouting_log')
          .select('*')
          .eq('Match_Name', match.name)
          .order('id', { ascending: true });

        if (error || !data || data.length === 0) {
          const fallback = await supabase
            .from('scouting_log')
            .select('*')
            .eq('nome_partita', match.name)
            .order('id', { ascending: true });
          if (!fallback.error && fallback.data) data = fallback.data;
        }

        events = data || [];
      }

      const sortedEvents = [...(events || [])].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      setReviewMatch({
        name: match.name,
        events: sortedEvents,
        createdAt: match.createdAt,
        matchType: match.matchType || localStorage.getItem(`match_type_${match.name}`) || 'Official',
        matchDate: match.matchDate || localStorage.getItem(`match_date_${match.name}`)
      });
    } catch (err) {
      console.error('Error opening match review from trends:', err);
      if (showToast) showToast('❌ Error opening match review');
    } finally {
      setReviewLoading(false);
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    return (
      <div className="bg-slate-900/95 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
          <div className="font-black text-slate-200">
            {dataPoint.chartLabel || dataPoint.matchName}
          </div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
            dataPoint.isWin 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          }`}>
            {dataPoint.resultText} ({dataPoint.pts} - {dataPoint.oppPts})
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>Date:</span>
          <span className="font-semibold text-slate-300">{dataPoint.date}</span>
        </div>
        <div className="space-y-1 pt-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-black text-slate-100">
                {entry.value}{entry.name.includes('%') || entry.name.includes('eFG') || entry.name.includes('DRB') ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 max-w-7xl mx-auto w-full space-y-4">
      {/* ========================================================================= */}
      {/* 1. HEADER BAR                                                             */}
      {/* ========================================================================= */}
      <div className="glass-card p-4 border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-none shadow-inner">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              SEASON TRENDS & ANALYTICS
              <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/40">
                MULTI-MATCH
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Track team efficiency curves, ball control, and rebounding dominance over time
            </p>
          </div>
        </div>

        <button
          onClick={fetchMatches}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. GLOBAL FILTER BAR                                                      */}
      {/* ========================================================================= */}
      <div className="glass-card p-3 border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
        {/* Match Type Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            TYPE:
          </span>
          {[
            { id: 'ALL', label: 'All Matches', count: typeCounts?.ALL || 0 },
            { id: 'OFFICIAL', label: 'Official', count: typeCounts?.OFFICIAL || 0 },
            { id: 'FRIENDLY', label: 'Friendly', count: typeCounts?.FRIENDLY || 0 },
            { id: 'SCRIMMAGE', label: 'Scrimmage', count: typeCounts?.SCRIMMAGE || 0 }
          ].map((tab) => {
            const isActive = matchTypeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMatchTypeFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chronological Split / Range */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">SPLIT:</span>
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'LAST_5', label: 'Last 5' },
            { id: 'LAST_10', label: 'Last 10' }
          ].map(s => {
            const isActive = splitFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSplitFilter(s.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-16 text-center border-slate-800 space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-slate-300 font-bold text-sm">Aggregating historical match performance...</p>
        </div>
      ) : gamesPlayed === 0 ? (
        <div className="glass-card p-12 text-center border-slate-800 space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400/70 mx-auto" />
          <h3 className="text-slate-200 font-black text-base uppercase">No Matches Found</h3>
          <p className="text-slate-400 font-semibold text-xs max-w-md mx-auto">
            No matches found matching the selected filter ({matchTypeFilter}). Try switching filters or start a new match session from the Live Game tab.
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 3. AGGREGATE 4-CARD KPI STRIP                                             */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* CARD 1: RECORD & NET MARGIN */}
            <div className="glass-card p-3.5 border-slate-800 bg-slate-900/90 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  RECORD & MARGIN
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  record.winRate >= 60 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : record.winRate >= 40 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  {record.winRate}% WIN
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight flex items-baseline gap-2">
                  <span>{record.wins}W - {record.losses}L</span>
                  {record.ties > 0 && <span className="text-sm text-slate-400">({record.ties}T)</span>}
                </div>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                <span>PPG: <strong className="text-slate-200">{scoring.avgPts}</strong> vs <strong className="text-slate-400">{scoring.avgOppPts}</strong></span>
                <span className={`font-mono font-black ${scoring.avgDiff > 0 ? 'text-emerald-400' : (scoring.avgDiff < 0 ? 'text-rose-400' : 'text-slate-400')}`}>
                  {scoring.avgDiff > 0 ? `+${scoring.avgDiff}` : scoring.avgDiff} Net
                </span>
              </div>
            </div>

            {/* CARD 2: SHOOTING EFFICIENCY */}
            <div className="glass-card p-3.5 border-slate-800 bg-slate-900/90 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-sky-400" />
                  SHOOTING (eFG%)
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  shooting.efgPct >= 50 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  {shooting.efgPct >= 50 ? 'TARGET MET' : 'SUB-50%'}
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-tight">
                  {shooting.efgPct}% <span className="text-xs font-bold text-slate-400">eFG</span>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                <span>2P: <strong className="text-slate-200">{shooting.fg2Pct}%</strong></span>
                <span>3P: <strong className="text-slate-200">{shooting.fg3Pct}%</strong></span>
                <span>FT: <strong className="text-slate-200">{shooting.ftPct}%</strong></span>
              </div>
            </div>

            {/* CARD 3: DEFENSIVE REBOUNDING */}
            <div className="glass-card p-3.5 border-slate-800 bg-slate-900/90 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  DEFENSIVE GLASS
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  rebounding.drbPct >= 70 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  {rebounding.drbPct !== null ? `${rebounding.drbPct}% DRB` : 'N/A'}
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  {rebounding.drbPct !== null ? `${rebounding.drbPct}%` : 'N/A'}
                </div>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                <span>DREB: <strong className="text-slate-200">{rebounding.avgDreb}</strong>/g</span>
                <span>OREB: <strong className="text-slate-200">{rebounding.avgOreb}</strong>/g</span>
                <span>Share: <strong className="text-slate-300">{rebounding.orebShare}%</strong></span>
              </div>
            </div>

            {/* CARD 4: BALL SECURITY & RATIO */}
            <div className="glass-card p-3.5 border-slate-800 bg-slate-900/90 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  BALL SECURITY
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  ballControl.astTovRatio >= 1.3 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : ballControl.astTovRatio >= 1.0 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  {ballControl.astTovRatio >= 1.0 ? 'POSITIVE' : 'NEGATIVE'}
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
                  {ballControl.astTovRatio} <span className="text-xs font-bold text-slate-400">AST/TOV</span>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                <span>APG: <strong className="text-slate-200">{ballControl.avgAst}</strong></span>
                <span>TOPG: <strong className="text-slate-200">{ballControl.avgTov}</strong></span>
                <span>SPG: <strong className="text-slate-300">{ballControl.avgStl}</strong></span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. VISUALIZATION 1: EFFICIENCY TREND (LINE CHART)                         */}
          {/* ========================================================================= */}
          <div className="glass-card p-4 border-slate-800 bg-slate-900/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                    OFFENSIVE EFFICIENCY & SCORING FLOW
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Points Scored (left axis) vs. Effective FG% (right axis) chronologically
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                  <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                  <span>Points Scored</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                  <span>eFG%</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold hidden sm:flex">
                  <span className="w-3 h-0.5 border-b border-dashed border-emerald-400 inline-block" />
                  <span>50% Target Benchmark</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis 
                    dataKey="gameLabel" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#38bdf8"
                    tick={{ fill: '#38bdf8', fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#f59e0b"
                    tick={{ fill: '#f59e0b', fontSize: 11 }}
                    domain={[20, 80]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    yAxisId="right" 
                    y={50} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ value: '50% Target', position: 'insideTopRight', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="pts" 
                    name="Points Scored"
                    stroke="#38bdf8" 
                    strokeWidth={3}
                    dot={{ fill: '#0284c7', r: 4, stroke: '#38bdf8', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="efgPct" 
                    name="Effective FG%"
                    stroke="#f59e0b" 
                    strokeWidth={2.5}
                    dot={{ fill: '#d97706', r: 4, stroke: '#f59e0b', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. VISUALIZATION 2 & 3: BALL SECURITY (COMBO) & REBOUND BATTLE (AREA)     */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CHART 2: BALL SECURITY (AST vs TOV) */}
            <div className="glass-card p-4 border-slate-800 bg-slate-900/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                      BALL CONTROL: ASSISTS VS. TURNOVERS
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Assists (AST), Turnovers (TOV), and AST/TOV ratio
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-sky-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block" /> AST
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-rose-400 inline-block" /> TOV
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Ratio
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis 
                      dataKey="gameLabel" 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#10b981"
                      tick={{ fill: '#10b981', fontSize: 11 }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left" dataKey="ast" name="Assists" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="left" dataKey="tov" name="Turnovers" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="astTovRatio" 
                      name="AST/TOV Ratio" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      dot={{ fill: '#059669', r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 3: REBOUNDING BATTLE (DRB% AREA) */}
            <div className="glass-card p-4 border-slate-800 bg-slate-900/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                      DEFENSIVE GLASS DOMINANCE (DRB%)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Defensive Rebound % vs. Regional 70% Target Benchmark
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> DRB%
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <span className="w-3 h-0.5 border-b border-dashed border-amber-400 inline-block" /> 70% Target
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drbGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis 
                      dataKey="gameLabel" 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke="#10b981"
                      tick={{ fill: '#10b981', fontSize: 11 }}
                      domain={[40, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine 
                      y={70} 
                      stroke="#f59e0b" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ value: '70% Target', position: 'insideTopLeft', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="drbPct" 
                      name="Defensive Rebound %"
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#drbGradient)" 
                      dot={{ fill: '#059669', r: 4, stroke: '#10b981', strokeWidth: 1.5 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. INDIVIDUAL MATCH LOG & DETAILS TABLE                                   */}
          {/* ========================================================================= */}
          <div className="glass-card p-4 border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                  CHRONOLOGICAL MATCH BREAKDOWN ({filteredMatches.length} GAMES)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="p-2.5">GAME</th>
                    <th className="p-2.5">DATE</th>
                    <th className="p-2.5">TYPE</th>
                    <th className="p-2.5">OPPONENT</th>
                    <th className="p-2.5 text-center">RESULT</th>
                    <th className="p-2.5 text-center">SCORE</th>
                    <th className="p-2.5 text-center">+/-</th>
                    <th className="p-2.5 text-center">eFG%</th>
                    <th className="p-2.5 text-center">AST/TOV</th>
                    <th className="p-2.5 text-center">DRB%</th>
                    <th className="p-2.5 text-center">PIR</th>
                    <th className="p-2.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {timeline.map((item) => (
                    <tr key={item.matchId} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-2.5 font-bold text-sky-400 font-mono">
                        {item.gameLabel}
                      </td>
                      <td className="p-2.5 text-slate-300 font-medium">
                        {item.date}
                      </td>
                      <td className="p-2.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          item.matchType === 'Official'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : item.matchType === 'Friendly'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        }`}>
                          {item.matchType}
                        </span>
                      </td>
                      <td className="p-2.5 font-black text-slate-200">
                        {item.opponent}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`font-mono font-black px-2 py-0.5 rounded text-[11px] ${
                          item.isWin 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {item.resultText}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-slate-100">
                        {item.pts} - {item.oppPts}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">
                        <span className={item.diff > 0 ? 'text-emerald-400' : (item.diff < 0 ? 'text-rose-400' : 'text-slate-400')}>
                          {item.diff > 0 ? `+${item.diff}` : item.diff}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-200">
                        {item.efgPct}%
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-200">
                        {item.astTovRatio}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-200">
                        {item.drbPct !== null ? `${item.drbPct}%` : '-'}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-amber-300">
                        {item.pir}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => handleOpenReview(item.rawMatch)}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-black px-2.5 py-1 rounded text-xs transition-all shadow-sm flex items-center gap-1 ml-auto active:scale-95"
                          title="Open deep match review"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>REVIEW</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Match Review Modal */}
      {reviewMatch && (
        <MatchReviewModal
          match={reviewMatch}
          onClose={() => setReviewMatch(null)}
          onDownloadCSV={() => {}}
          onUpdateMatchDate={handleUpdateMatchDate}
          onUpdateMatchType={handleUpdateMatchType}
        />
      )}
    </div>
  );
}
