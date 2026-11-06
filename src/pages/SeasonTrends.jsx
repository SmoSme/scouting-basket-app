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
import { useLanguage } from '../context/LanguageContext';

export default function SeasonTrends({ showToast, authRole = 'admin' }) {
  const { language, t } = useLanguage();
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
      <div className="bg-white/95 border border-[#DDF3E9] rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 z-50 text-[#022D32]">
        <div className="flex items-center justify-between gap-3 border-b border-[#DDF3E9] pb-1.5">
          <div className="font-black text-[#022D32]">
            {dataPoint.chartLabel || dataPoint.matchName}
          </div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
            dataPoint.isWin 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}>
            {dataPoint.resultText} ({dataPoint.pts} - {dataPoint.oppPts})
          </span>
        </div>
        <div className="text-[11px] text-[#022D32]/70 flex items-center justify-between">
          <span>Data:</span>
          <span className="font-semibold text-[#022D32]">{dataPoint.date}</span>
        </div>
        <div className="space-y-1 pt-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#022D32]/80 font-medium">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-black text-[#022D32]">
                {entry.value}{entry.name.includes('%') || entry.name.includes('eFG') || entry.name.includes('DRB') ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5 bg-[#F8F9FA] text-[#022D32]">
      {/* ========================================================================= */}
      {/* 1. HEADER BAR                                                             */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDF3E9] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center flex-none shadow-inner">
            <TrendingUp className="w-5 h-5 text-[#0CA17A]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-[#0CA17A] rounded-full inline-block" />
              <span>{t('trends_title')}</span>
              <span className="text-[10px] bg-[#DDF3E9] text-[#0CA17A] font-bold px-2 py-0.5 rounded border border-[#0CA17A]/30">
                MULTI-MATCH
              </span>
            </h1>
            <p className="text-xs text-[#022D32]/70 font-semibold mt-0.5">
              {t('trends_subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={fetchMatches}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#0CA17A] ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'it' ? 'AGGIORNA' : 'REFRESH'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. GLOBAL FILTER BAR                                                      */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#DDF3E9] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Match Type Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black text-[#022D32] uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#0CA17A]" />
            {language === 'it' ? 'TIPO:' : 'TYPE:'}
          </span>
          {[
            { id: 'ALL', label: language === 'it' ? 'Tutte le Partite' : 'All Matches', count: typeCounts?.ALL || 0 },
            { id: 'OFFICIAL', label: language === 'it' ? 'Ufficiali' : 'Official', count: typeCounts?.OFFICIAL || 0 },
            { id: 'FRIENDLY', label: language === 'it' ? 'Amichevoli' : 'Friendly', count: typeCounts?.FRIENDLY || 0 },
            { id: 'SCRIMMAGE', label: language === 'it' ? 'Allenamenti' : 'Scrimmage', count: typeCounts?.SCRIMMAGE || 0 }
          ].map((tab) => {
            const isActive = matchTypeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMatchTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0CA17A] text-white shadow-sm scale-100'
                    : 'bg-[#F8F9FA] text-[#022D32]/70 hover:text-[#022D32] hover:bg-[#DDF3E9] border border-[#DDF3E9]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-[#022D32] text-[#A7F3D0]' : 'bg-[#DDF3E9] text-[#022D32]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chronological Split / Range */}
        <div className="flex items-center gap-1 bg-[#F8F9FA] p-1 rounded-xl border border-[#DDF3E9]">
          <span className="text-[10px] font-bold text-[#022D32]/60 px-2 uppercase">SPLIT:</span>
          {[
            { id: 'ALL', label: language === 'it' ? 'Tutte' : 'All' },
            { id: 'LAST_5', label: language === 'it' ? 'Ultime 5' : 'Last 5' },
            { id: 'LAST_10', label: language === 'it' ? 'Ultime 10' : 'Last 10' }
          ].map(s => {
            const isActive = splitFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSplitFilter(s.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#0CA17A] text-white font-black shadow-xs'
                    : 'text-[#022D32]/70 hover:text-[#022D32]'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-16 text-center border border-[#DDF3E9] rounded-2xl shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-[#0CA17A] animate-spin mx-auto" />
          <p className="text-[#022D32] font-black text-sm">{language === 'it' ? 'Aggregazione andamento storico partite...' : 'Aggregating season analytics...'}</p>
        </div>
      ) : gamesPlayed === 0 ? (
        <div className="bg-white p-12 text-center border border-[#DDF3E9] rounded-2xl shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-[#0CA17A]/70 mx-auto" />
          <h3 className="text-[#022D32] font-black text-base uppercase">{language === 'it' ? 'Nessuna Partita Trovata' : 'No Matches Found'}</h3>
          <p className="text-[#022D32]/70 font-semibold text-xs max-w-md mx-auto">
            {language === 'it' ? `Nessuna partita corrisponde al filtro selezionato (${matchTypeFilter}).` : `No matches match the selected filter (${matchTypeFilter}).`}
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 3. AGGREGATE 4-CARD PRIMARY KPI STRIP                                     */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* CARD 1: RECORD & NET MARGIN */}
            <div className="bg-[#022D32] p-4 sm:p-5 rounded-2xl text-white shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#0CA17A]" />
                  {t('rec_margin_title')}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  record.winRate >= 60 
                    ? 'bg-[#0CA17A]/30 text-[#A7F3D0] border-[#0CA17A]'
                    : record.winRate >= 40 
                      ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                      : 'bg-rose-500/30 text-rose-300 border-rose-400'
                }`}>
                  {record.winRate}% WIN
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                  <span>{record.wins}W - {record.losses}L</span>
                  {record.ties > 0 && <span className="text-sm text-white/50">({record.ties}T)</span>}
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                <span>PPG: <strong className="text-white">{scoring.avgPts}</strong> vs <strong className="text-white/70">{scoring.avgOppPts}</strong></span>
                <span className={`font-mono font-black ${scoring.avgDiff > 0 ? 'text-[#A7F3D0]' : (scoring.avgDiff < 0 ? 'text-rose-300' : 'text-white')}`}>
                  {scoring.avgDiff > 0 ? `+${scoring.avgDiff}` : scoring.avgDiff} Net
                </span>
              </div>
            </div>

            {/* CARD 2: SHOOTING EFFICIENCY */}
            <div className="bg-[#022D32] p-4 sm:p-5 rounded-2xl text-white shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#0CA17A]" />
                  {t('shooting_eff_title')}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  shooting.efgPct >= 50 
                    ? 'bg-[#0CA17A]/30 text-[#A7F3D0] border-[#0CA17A]' 
                    : 'bg-amber-500/30 text-amber-300 border-amber-400'
                }`}>
                  {shooting.efgPct >= 50 ? 'TARGET' : (language === 'it' ? 'SOTTO 50%' : 'UNDER 50%')}
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {shooting.efgPct}% <span className="text-xs font-bold text-[#A7F3D0]">eFG</span>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                <span>2P: <strong className="text-white">{shooting.fg2Pct}%</strong></span>
                <span>3P: <strong className="text-white">{shooting.fg3Pct}%</strong></span>
                <span>{language === 'it' ? 'TL' : 'FT'}: <strong className="text-white">{shooting.ftPct}%</strong></span>
              </div>
            </div>

            {/* CARD 3: DEFENSIVE REBOUNDING */}
            <div className="bg-[#022D32] p-4 sm:p-5 rounded-2xl text-white shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#0CA17A]" />
                  {t('glass_title')}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  rebounding.drbPct >= 70 
                    ? 'bg-[#0CA17A]/30 text-[#A7F3D0] border-[#0CA17A]' 
                    : 'bg-amber-500/30 text-amber-300 border-amber-400'
                }`}>
                  {rebounding.drbPct !== null ? `${rebounding.drbPct}% DRB` : 'N/A'}
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {rebounding.drbPct !== null ? `${rebounding.drbPct}%` : 'N/A'}
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                <span>DREB: <strong className="text-white">{rebounding.avgDreb}</strong>/g</span>
                <span>OREB: <strong className="text-white">{rebounding.avgOreb}</strong>/g</span>
                <span>{language === 'it' ? 'Quota' : 'Share'}: <strong className="text-white">{rebounding.orebShare}%</strong></span>
              </div>
            </div>

            {/* CARD 4: BALL SECURITY & RATIO */}
            <div className="bg-[#022D32] p-4 sm:p-5 rounded-2xl text-white shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#0CA17A]" />
                  {t('ball_care_title')}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  ballControl.astTovRatio >= 1.3 
                    ? 'bg-[#0CA17A]/30 text-[#A7F3D0] border-[#0CA17A]' 
                    : ballControl.astTovRatio >= 1.0 
                      ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                      : 'bg-rose-500/30 text-rose-300 border-rose-400'
                }`}>
                  {ballControl.astTovRatio >= 1.0 ? 'POSITIVO' : 'NEGATIVO'}
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {ballControl.astTovRatio} <span className="text-xs font-bold text-[#A7F3D0]">AST/TOV</span>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                <span>APG: <strong className="text-white">{ballControl.avgAst}</strong></span>
                <span>TOPG: <strong className="text-white">{ballControl.avgTov}</strong></span>
                <span>SPG: <strong className="text-white">{ballControl.avgStl}</strong></span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. VISUALIZATION 1: EFFICIENCY TREND (LINE CHART)                         */}
          {/* ========================================================================= */}
          <div className="bg-white p-5 rounded-2xl border border-[#DDF3E9] shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#0CA17A]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                    <span>EFFICIENZA OFFENSIVA & FLUSSO PUNTI</span>
                  </h3>
                  <p className="text-[11px] text-[#022D32]/70">
                    Punti segnati (asse sinistro) vs. Percentuale effettiva eFG% (asse destro)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-[#022D32] font-bold">
                  <span className="w-3 h-0.5 bg-[#022D32] inline-block" />
                  <span>Punti Segnati</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#0CA17A] font-bold">
                  <span className="w-3 h-0.5 bg-[#0CA17A] inline-block" />
                  <span>eFG%</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 font-bold hidden sm:flex">
                  <span className="w-3 h-0.5 border-b border-dashed border-amber-500 inline-block" />
                  <span>50% Target Benchmark</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
                  <XAxis 
                    dataKey="gameLabel" 
                    stroke="#022D32" 
                    tick={{ fill: '#022D32', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#022D32"
                    tick={{ fill: '#022D32', fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#0CA17A"
                    tick={{ fill: '#0CA17A', fontSize: 11 }}
                    domain={[20, 80]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    yAxisId="right" 
                    y={50} 
                    stroke="#D97706" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ value: '50% Target', position: 'insideTopRight', fill: '#D97706', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="pts" 
                    name="Punti Segnati"
                    stroke="#022D32" 
                    strokeWidth={3}
                    dot={{ fill: '#022D32', r: 4, stroke: '#0CA17A', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="efgPct" 
                    name="Effective FG%"
                    stroke="#0CA17A" 
                    strokeWidth={2.5}
                    dot={{ fill: '#0CA17A', r: 4, stroke: '#022D32', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. VISUALIZATION 2 & 3: BALL SECURITY & REBOUND BATTLE                    */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CHART 2: BALL SECURITY (AST vs TOV) */}
            <div className="bg-white p-5 rounded-2xl border border-[#DDF3E9] shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#0CA17A]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                      <span>CONTROLLO PALLA: ASSIST VS. PERSE</span>
                    </h3>
                    <p className="text-[11px] text-[#022D32]/70">
                      Assist (AST), Palle Perse (TOV) e rapporto AST/TOV
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-[#022D32] font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-[#022D32] inline-block" /> AST
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" /> TOV
                  </span>
                  <span className="flex items-center gap-1 text-[#0CA17A] font-bold">
                    <span className="w-3 h-0.5 bg-[#0CA17A] inline-block" /> Ratio
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
                    <XAxis 
                      dataKey="gameLabel" 
                      stroke="#022D32" 
                      tick={{ fill: '#022D32', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#022D32"
                      tick={{ fill: '#022D32', fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#0CA17A"
                      tick={{ fill: '#0CA17A', fontSize: 11 }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left" dataKey="ast" name="Assist" fill="#022D32" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="tov" name="Palle Perse" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="astTovRatio" 
                      name="AST/TOV Ratio" 
                      stroke="#0CA17A" 
                      strokeWidth={2.5}
                      dot={{ fill: '#0CA17A', r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 3: REBOUNDING BATTLE (DRB% AREA) */}
            <div className="bg-white p-5 rounded-2xl border border-[#DDF3E9] shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#0CA17A]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                      <span>DOMINIO A RIMBALZO (DRB%)</span>
                    </h3>
                    <p className="text-[11px] text-[#022D32]/70">
                      Percentuale rimbalzi difensivi vs. target benchmark 70%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-[#0CA17A] font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-[#0CA17A] inline-block" /> DRB%
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <span className="w-3 h-0.5 border-b border-dashed border-amber-500 inline-block" /> 70% Target
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drbGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0CA17A" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0CA17A" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
                    <XAxis 
                      dataKey="gameLabel" 
                      stroke="#022D32" 
                      tick={{ fill: '#022D32', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke="#0CA17A"
                      tick={{ fill: '#0CA17A', fontSize: 11 }}
                      domain={[40, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine 
                      y={70} 
                      stroke="#D97706" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ value: '70% Target', position: 'insideTopLeft', fill: '#D97706', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="drbPct" 
                      name="Defensive Rebound %"
                      stroke="#0CA17A" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#drbGradient)" 
                      dot={{ fill: '#0CA17A', r: 4, stroke: '#022D32', strokeWidth: 1.5 }}
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
          <div className="bg-white p-5 rounded-2xl border border-[#DDF3E9] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0CA17A]" />
                <h3 className="text-sm font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                  <span>DETTAGLIO CRONOLOGICO PARTITE ({filteredMatches.length} GARE)</span>
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#DDF3E9]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#DDF3E9] text-[#022D32] font-black uppercase text-[10px] tracking-wider border-b border-[#DDF3E9]">
                    <th className="p-3">GARA</th>
                    <th className="p-3">DATA</th>
                    <th className="p-3">TIPO</th>
                    <th className="p-3">AVVERSARIO</th>
                    <th className="p-3 text-center">ESITO</th>
                    <th className="p-3 text-center">PUNTEGGIO</th>
                    <th className="p-3 text-center">+/-</th>
                    <th className="p-3 text-center">eFG%</th>
                    <th className="p-3 text-center">AST/TOV</th>
                    <th className="p-3 text-center">DRB%</th>
                    <th className="p-3 text-center">PIR</th>
                    <th className="p-3 text-right">AZIONE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDF3E9]">
                  {timeline.map((item, idx) => (
                    <tr key={item.matchId} className={`transition-colors hover:bg-[#DDF3E9]/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#DDF3E9]/15'}`}>
                      <td className="p-3 font-black text-[#022D32] font-mono">
                        {item.gameLabel}
                      </td>
                      <td className="p-3 text-[#022D32]/80 font-medium">
                        {item.date}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          item.matchType === 'Official'
                            ? 'bg-[#DDF3E9] text-[#022D32] border-[#0CA17A]/40'
                            : item.matchType === 'Friendly'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : 'bg-purple-50 text-purple-800 border-purple-300'
                        }`}>
                          {item.matchType}
                        </span>
                      </td>
                      <td className="p-3 font-black text-[#022D32]">
                        {item.opponent}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-mono font-black px-2 py-0.5 rounded text-[11px] ${
                          item.isWin 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}>
                          {item.resultText}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-[#022D32]">
                        <span>{item.pts} - {item.oppPts}</span>
                        {item.isScoreOverridden && (
                          <span className="block text-[8px] font-black text-[#022D32] bg-[#DDF3E9] rounded px-1 mt-0.5 border border-[#0CA17A]/40" title="Official table override applied">
                            SYNCED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-black">
                        <span className={item.diff > 0 ? 'text-emerald-700' : (item.diff < 0 ? 'text-rose-700' : 'text-[#022D32]')}>
                          {item.diff > 0 ? `+${item.diff}` : item.diff}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#022D32]">
                        {item.efgPct}%
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#022D32]">
                        {item.astTovRatio}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#022D32]">
                        {item.drbPct !== null ? `${item.drbPct}%` : '-'}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-[#022D32]">
                        {item.pir}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenReview(item.rawMatch)}
                          className="bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 ml-auto active:scale-95 cursor-pointer"
                          title="Apri analisi approfondita del match"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ANALISI</span>
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
          onUpdateScoreOverride={() => fetchMatches()}
        />
      )}
    </div>
  );
}
