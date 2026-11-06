import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, LineChart, Line, BarChart, Bar, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell 
} from 'recharts';
import { 
  TrendingUp, Trophy, Target, Shield, Activity, RefreshCw, 
  Filter, Calendar, Hash, Eye, Download, AlertCircle, CheckCircle2, 
  Zap, BarChart3, ChevronRight, Layers, Flame, ShieldCheck, Clock,
  Users, Search, ChevronUp, ChevronDown, Home, Navigation, Info
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { aggregateSeasonStats } from '../utils/seasonAggregator';
import { 
  calculateStandardDeviation, 
  getVolatilityBadge, 
  calculatePhysicalStamina, 
  buildHybridGameLog, 
  buildSuperchargedBbaRoster,
  buildUnifiedMatchList,
  formatPlayerFullName,
  formatPercentage,
  formatAverage,
  BBA_TEAM_ID 
} from '../utils/hybridDataService';
import { 
  extractMatchMetadataMap, 
  saveMatchMetadataToSupabase, 
  fetchScoutingMatches, 
  updateScoutingMatchInSupabase, 
  subscribeToMatchCache 
} from '../services/matchMetadataService';
import { TacticalTagIcon, getTacticalTags, formatMinutes } from './LeagueHub';
import PlayerProfileModal from '../components/PlayerProfileModal';
import MatchReviewModal from '../components/MatchReviewModal';
import { useLanguage } from '../context/LanguageContext';

export default function SeasonTrends({ showToast, authRole = 'admin' }) {
  const { language, t } = useLanguage();
  const [activeSection, setActiveSection] = useState('trends'); // 'trends' | 'roster'
  const [matches, setMatches] = useState([]);
  const [fipTrends, setFipTrends] = useState(null);
  const [fipRosters, setFipRosters] = useState(null);
  const [startersData, setStartersData] = useState(null);
  const [rawSupabaseLogs, setRawSupabaseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchTypeFilter, setMatchTypeFilter] = useState('ALL'); // 'ALL' | 'OFFICIAL' | 'FRIENDLY'
  const [splitFilter, setSplitFilter] = useState('ALL'); // 'ALL' | 'LAST_5' | 'LAST_10'
  
  // Roster Tab state
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'pointsAVG', direction: 'desc' });

  // Review Modal state
  const [reviewMatch, setReviewMatch] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchFipData();
    // Invalidate and re-fetch instantly on any match metadata / date update
    const unsubscribe = subscribeToMatchCache(() => {
      fetchMatches();
    });
    return () => unsubscribe();
  }, []);

  const fetchFipData = async () => {
    try {
      const bbaId = import.meta.env.VITE_BBA_TEAM_ID || BBA_TEAM_ID;

      // 1. Team Trends
      try {
        const res = await fetch('/data/team_trends.json', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const bbaData = json[bbaId] || json['team_bba_academy'] || null;
          if (bbaData) setFipTrends(bbaData);
        }
      } catch (e) {
        console.warn('Could not load FIP trends for BBA:', e);
      }

      // 2. League Rosters
      try {
        const resRosters = await fetch('/data/league_rosters.json', { cache: 'no-store' });
        if (resRosters.ok) {
          const json = await resRosters.json();
          setFipRosters(json);
        }
      } catch (e) {
        console.warn('Could not load league rosters for BBA:', e);
      }

      // 3. Team Starters
      try {
        const resStarters = await fetch('/data/team_starters.json', { cache: 'no-store' });
        if (resStarters.ok) {
          const json = await resStarters.json();
          setStartersData(json);
        }
      } catch (e) {
        console.warn('Could not load team starters for BBA:', e);
      }
    } catch (e) {
      console.warn('FIP Data fetch general note:', e);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // 1. Query normalized matches from scouting_matches
      const normalizedMatches = await fetchScoutingMatches();

      // 2. Query all events from Supabase scouting_log
      const { data, error } = await supabase
        .from('scouting_log')
        .select('*')
        .order('id', { ascending: false });

      const rawLogs = data || [];
      setRawSupabaseLogs(rawLogs);

      // Extract Match Metadata map directly from Supabase logs (Single Source of Truth)
      const metaMap = extractMatchMetadataMap(rawLogs);

      // Group events by match_id and distinct Match_Name
      const eventsByMatchId = {};
      const eventsByName = {};

      rawLogs.forEach(item => {
        if (item.Action === 'MATCH_METADATA' || item.Player === 'METADATA') return;

        if (item.match_id) {
          if (!eventsByMatchId[item.match_id]) eventsByMatchId[item.match_id] = [];
          eventsByMatchId[item.match_id].push(item);
        }

        const gameName = item.Match_Name || item.match_name || item.nome_partita || item.Nome_Partita || 'Unnamed Match';
        if (!eventsByName[gameName]) {
          eventsByName[gameName] = [];
        }
        eventsByName[gameName].push(item);
      });

      let parsedMatches = [];

      if (normalizedMatches && normalizedMatches.length > 0) {
        // Use normalized relational matches as primary structure
        parsedMatches = normalizedMatches.map(nm => {
          const mEvents = eventsByMatchId[nm.id] || eventsByName[nm.match_name] || [];
          const meta = metaMap[nm.match_name] || {};
          const storedDate = nm.match_date ? String(nm.match_date).split('T')[0] : (meta.matchDate || 'n.a.');
          const storedType = nm.match_type || meta.matchType || 'Official';
          
          const teamScore = (nm.home_score !== undefined && nm.home_score !== null && Number(nm.home_score) > 0)
            ? Number(nm.home_score)
            : (meta.overrideTeamScore !== undefined && meta.overrideTeamScore !== null ? Number(meta.overrideTeamScore) : null);
          const oppScore = (nm.away_score !== undefined && nm.away_score !== null && Number(nm.away_score) > 0)
            ? Number(nm.away_score)
            : (meta.overrideOppScore !== undefined && meta.overrideOppScore !== null ? Number(meta.overrideOppScore) : null);

          return {
            id: nm.id,
            name: nm.match_name,
            createdAt: nm.created_at,
            matchType: storedType,
            match_type: storedType,
            matchDate: storedDate,
            match_date: storedDate,
            home_score: teamScore,
            away_score: oppScore,
            pts: teamScore,
            oppPts: oppScore,
            displayedTeamPts: teamScore,
            displayedOppPts: oppScore,
            is_home: nm.is_home,
            opponentName: nm.opponent_name || nm.match_name.replace(/^BBA\s*(vs|contro|-)\s*/i, '').trim(),
            events: mEvents
          };
        });
      } else {
        // Fallback to grouping by Match_Name
        parsedMatches = Object.keys(eventsByName).map(name => {
          const mEvents = eventsByName[name] || [];
          const meta = metaMap[name] || {};
          const storedType = meta.matchType || 'Official';
          const storedDate = meta.matchDate || (mEvents[0]?.created_at ? mEvents[0].created_at.split('T')[0] : 'n.a.');
          const teamScore = meta.overrideTeamScore ?? null;
          const oppScore = meta.overrideOppScore ?? null;

          return {
            id: meta.matchId || null,
            name,
            createdAt: mEvents[0]?.created_at || 'n.a.',
            matchType: storedType,
            match_type: storedType,
            matchDate: storedDate,
            match_date: storedDate,
            home_score: teamScore,
            away_score: oppScore,
            pts: teamScore,
            oppPts: oppScore,
            displayedTeamPts: teamScore,
            displayedOppPts: oppScore,
            events: mEvents
          };
        });
      }

      setMatches(parsedMatches);
    } catch (err) {
      console.error('Error fetching matches for season trends:', err);
      if (showToast) showToast('Error loading match records');
    } finally {
      setLoading(false);
    }
  };

  // Match metadata map extracted from raw Supabase logs (Single Source of Truth)
  const metaMap = useMemo(() => extractMatchMetadataMap(rawSupabaseLogs), [rawSupabaseLogs]);

  // Unified matches list: FIP King (Official) + Supabase Scouting (Friendlies / Scrimmages + Events)
  const unifiedMatches = useMemo(() => {
    return buildUnifiedMatchList(fipTrends?.log || [], matches, metaMap);
  }, [fipTrends, matches, metaMap]);

  // Compute aggregate stats across matches given active filters
  const seasonStats = useMemo(() => {
    return aggregateSeasonStats(unifiedMatches, {
      matchType: matchTypeFilter,
      split: splitFilter
    });
  }, [unifiedMatches, matchTypeFilter, splitFilter]);

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

  // Derived Intelligence & Hybrid Metrics (Strictly Reactive to Active Filter)
  const stamina = useMemo(() => calculatePhysicalStamina(filteredMatches), [filteredMatches]);
  const sigma = useMemo(() => {
    const ptsList = (filteredMatches || []).map(m => Number(m.pts ?? 0));
    if (ptsList.length === 0) return 0;
    return calculateStandardDeviation(ptsList);
  }, [filteredMatches]);
  const volatilityBadge = useMemo(() => getVolatilityBadge(sigma, language), [sigma, language]);

  const quarterBarData = useMemo(() => {
    const list = filteredMatches && filteredMatches.length > 0 ? filteredMatches : [];
    let qCount = 0;
    const totals = {
      Q1: { scored: 0, conceded: 0 },
      Q2: { scored: 0, conceded: 0 },
      Q3: { scored: 0, conceded: 0 },
      Q4: { scored: 0, conceded: 0 }
    };

    list.forEach(m => {
      const isHome = Boolean(m.isHomeGame ?? (m.location === 'Casa'));
      if (Array.isArray(m.partials) && m.partials.length >= 4) {
        qCount++;
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach((qk, qIdx) => {
          const p = m.partials[qIdx];
          const sc = p?.scored !== undefined ? Number(p.scored) : (p?.pts !== undefined ? Number(p.pts) : (isHome ? Number(p?.homeScore ?? 0) : Number(p?.awayScore ?? 0)));
          const cc = p?.conceded !== undefined ? Number(p.conceded) : (p?.oppPts !== undefined ? Number(p.oppPts) : (isHome ? Number(p?.awayScore ?? 0) : Number(p?.homeScore ?? 0)));
          totals[qk].scored += sc;
          totals[qk].conceded += cc;
        });
      } else if (Array.isArray(m.analytics?.quarters) && m.analytics.quarters.length >= 4) {
        qCount++;
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach((qk, qIdx) => {
          totals[qk].scored += Number(m.analytics.quarters[qIdx]?.pts ?? 0);
          totals[qk].conceded += Number(m.analytics.quarters[qIdx]?.oppPts ?? 0);
        });
      }
    });

    if (qCount > 0) {
      return ['Q1', 'Q2', 'Q3', 'Q4'].map(qKey => {
        const scAvg = Number((totals[qKey].scored / qCount).toFixed(1));
        const ccAvg = Number((totals[qKey].conceded / qCount).toFixed(1));
        return {
          quarter: qKey,
          diff: Number((scAvg - ccAvg).toFixed(1)),
          scored: scAvg,
          conceded: ccAvg
        };
      });
    }

    const qAvg = fipTrends?.quarterAverages || {};
    return ['Q1', 'Q2', 'Q3', 'Q4'].map(qKey => ({
      quarter: qKey,
      diff: qAvg[qKey]?.diff ?? 0,
      scored: qAvg[qKey]?.scoredAvg ?? 0,
      conceded: qAvg[qKey]?.concededAvg ?? 0
    }));
  }, [filteredMatches, fipTrends]);

  // Home vs Away Splits computed from active filtered matches with fallback to fipTrends
  const homeAwaySplits = useMemo(() => {
    const home = { games: 0, wins: 0, losses: 0, pointsScored: 0, pointsConceded: 0 };
    const away = { games: 0, wins: 0, losses: 0, pointsScored: 0, pointsConceded: 0 };

    const list = filteredMatches && filteredMatches.length > 0 ? filteredMatches : [];

    list.forEach(m => {
      const isHome = Boolean(m.isHomeGame ?? (m.location === 'Casa'));
      const scored = Number(m.pts ?? 0);
      const conceded = Number(m.oppPts ?? 0);
      const isWin = Boolean(m.isWin);

      if (isHome) {
        home.games += 1;
        if (isWin) home.wins += 1;
        else home.losses += 1;
        home.pointsScored += scored;
        home.pointsConceded += conceded;
      } else {
        away.games += 1;
        if (isWin) away.wins += 1;
        else away.losses += 1;
        away.pointsScored += scored;
        away.pointsConceded += conceded;
      }
    });

    if (home.games === 0 && away.games === 0 && fipTrends) {
      if (fipTrends.home) {
        home.games = fipTrends.home.games || 0;
        home.wins = fipTrends.home.wins || 0;
        home.losses = fipTrends.home.losses || 0;
        home.pointsScored = fipTrends.home.pointsScored || 0;
        home.pointsConceded = fipTrends.home.pointsConceded || 0;
      }
      if (fipTrends.away) {
        away.games = fipTrends.away.games || 0;
        away.wins = fipTrends.away.wins || 0;
        away.losses = fipTrends.away.losses || 0;
        away.pointsScored = fipTrends.away.pointsScored || 0;
        away.pointsConceded = fipTrends.away.pointsConceded || 0;
      }
    }

    const homeDiff = home.games > 0 ? Number(((home.pointsScored - home.pointsConceded) / home.games).toFixed(1)) : 0;
    const awayDiff = away.games > 0 ? Number(((away.pointsScored - away.pointsConceded) / away.games).toFixed(1)) : 0;

    return { home, away, homeDiff, awayDiff };
  }, [filteredMatches, fipTrends]);

  // Chronological Game Trends (Oldest to Newest) for Recharts LineChart
  const trendsLineData = useMemo(() => {
    if (!filteredMatches || filteredMatches.length === 0) return [];
    const list = [...filteredMatches].sort((a, b) => new Date(a.matchDate || a.createdAt) - new Date(b.matchDate || b.createdAt));
    return list.map((m, idx) => {
      const scored = Number(m.pts) || 0;
      const conceded = Number(m.oppPts) || 0;
      const opp = m.opponent || (m.isHomeGame ? 'Avversario' : 'Avversario');
      const locPrefix = (m.isHomeGame ?? (m.location === 'Casa')) ? 'vs' : '@';
      const d = new Date(m.matchDate || m.createdAt);
      const dateStr = !isNaN(d) ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}` : '';
      const roundLabel = m.round ? (String(m.round).startsWith('G') ? m.round : `G${m.round}`) : `#${idx + 1}`;

      return {
        round: roundLabel,
        fullTitle: `${roundLabel} • ${locPrefix} ${opp.trim()}`,
        date: dateStr,
        scored,
        conceded,
        diff: scored - conceded,
        isWin: m.isWin,
        isHome: m.isHomeGame
      };
    });
  }, [filteredMatches]);

  const hybridLogs = useMemo(() => {
    return buildHybridGameLog(fipTrends?.log || [], filteredMatches, matchTypeFilter, metaMap);
  }, [fipTrends, filteredMatches, matchTypeFilter, metaMap]);

  // Supercharged BBA Roster List (FIP Volume + Supabase Efficiency & Playmaking, dynamically filtered)
  const bbaRosterList = useMemo(() => {
    const bbaId = import.meta.env.VITE_BBA_TEAM_ID || BBA_TEAM_ID;
    const fipList = fipRosters?.[bbaId] || fipRosters?.['team_bba_academy'] || [];
    const bbaStarters = startersData?.[bbaId] || startersData?.['team_bba_academy'] || null;
    return buildSuperchargedBbaRoster(fipList, rawSupabaseLogs, bbaStarters, matchTypeFilter, metaMap);
  }, [fipRosters, rawSupabaseLogs, startersData, matchTypeFilter, metaMap]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const filteredRoster = useMemo(() => {
    let list = [...bbaRosterList];
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        String(p.number).includes(q) ||
        (p.position && p.position.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key === 'startPercentage') {
        valA = parseInt(String(valA || '0').replace('%', ''), 10) || 0;
        valB = parseInt(String(valB || '0').replace('%', ''), 10) || 0;
      } else if (sortConfig.key === 'number') {
        valA = parseInt(String(valA || '0'), 10) || 0;
        valB = parseInt(String(valB || '0'), 10) || 0;
      } else {
        valA = typeof valA === 'number' ? valA : (valA != null ? parseFloat(valA) : -9999);
        valB = typeof valB === 'number' ? valB : (valB != null ? parseFloat(valB) : -9999);
      }
      if (sortConfig.direction === 'asc') {
        return valA > valB ? 1 : (valA < valB ? -1 : 0);
      }
      return valA < valB ? 1 : (valA > valB ? -1 : 0);
    });
    return list;
  }, [bbaRosterList, rosterSearch, sortConfig]);

  // Match Date mutation (Strictly Centralized in Supabase)
  const handleUpdateMatchDate = async (matchName, newDate, shouldSave = true) => {
    if (!newDate) return;
    setMatches(prev => prev.map(m => m.name === matchName ? { ...m, matchDate: newDate } : m));
    if (reviewMatch && reviewMatch.name === matchName) {
      setReviewMatch(prev => ({ ...prev, matchDate: newDate }));
    }
    if (shouldSave) {
      const ok = await saveMatchMetadataToSupabase(matchName, { matchDate: newDate });
      if (ok) {
        if (showToast) showToast(language === 'it' ? 'Data salvata su Supabase' : 'Date saved to Supabase');
        fetchMatches();
      }
    } else {
      if (showToast) showToast(language === 'it' ? 'Data salvata su Supabase' : 'Date saved to Supabase');
      fetchMatches();
    }
  };

  // Match Type mutation (Strictly Centralized in Supabase)
  const handleUpdateMatchType = async (matchName, newType) => {
    setMatches(prev => prev.map(m => m.name === matchName ? { ...m, matchType: newType } : m));
    if (reviewMatch && reviewMatch.name === matchName) {
      setReviewMatch(prev => ({ ...prev, matchType: newType }));
    }
    const ok = await saveMatchMetadataToSupabase(matchName, { matchType: newType });
    if (ok) {
      if (showToast) showToast(language === 'it' ? 'Tipo partita salvato su Supabase' : 'Match type saved to Supabase');
      fetchMatches();
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
      const resolvedDate = match.match_date || match.matchDate || metaMap[match.name]?.matchDate || (match.createdAt ? match.createdAt.split('T')[0] : 'n.a.');
      const resolvedTeamScore = match.home_score ?? match.pts ?? match.displayedTeamPts ?? metaMap[match.name]?.overrideTeamScore ?? null;
      const resolvedOppScore = match.away_score ?? match.oppPts ?? match.displayedOppPts ?? metaMap[match.name]?.overrideOppScore ?? null;

      setReviewMatch({
        ...match,
        id: match.id,
        name: match.name,
        events: sortedEvents,
        home_score: resolvedTeamScore,
        away_score: resolvedOppScore,
        pts: resolvedTeamScore,
        oppPts: resolvedOppScore,
        displayedTeamPts: resolvedTeamScore,
        displayedOppPts: resolvedOppScore,
        is_home: match.is_home ?? match.isHomeGame ?? true,
        createdAt: match.createdAt,
        matchType: match.matchType || 'Official',
        matchDate: resolvedDate,
        match_date: resolvedDate
      });
    } catch (err) {
      console.error('Error opening match review from trends:', err);
      if (showToast) showToast('Error opening match review');
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

  // Custom Trend Tooltip for Scored vs Conceded LineChart
  const CustomTrendTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;
    const isWin = data.isWin;
    return (
      <div className="bg-white p-3.5 rounded-2xl border border-[#DDF3E9] shadow-md text-xs space-y-2 font-sans min-w-[200px]">
        <div className="font-black text-[#022D32] border-b border-[#DDF3E9] pb-1.5 flex items-center justify-between gap-2">
          <span>{data.fullTitle}</span>
          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
            isWin ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'
          }`}>
            {isWin ? 'V' : 'P'}
          </span>
        </div>
        <div className="flex justify-between items-center text-[#0CA17A] font-bold">
          <span>{language === 'it' ? 'Punti Segnati:' : 'Points Scored:'}</span>
          <span className="font-mono font-black text-sm">{data.scored}</span>
        </div>
        <div className="flex justify-between items-center text-rose-600 font-bold">
          <span>{language === 'it' ? 'Punti Subiti:' : 'Points Conceded:'}</span>
          <span className="font-mono font-black text-sm">{data.conceded}</span>
        </div>
        <div className="flex justify-between items-center text-[#022D32] pt-1.5 border-t border-[#DDF3E9] font-bold text-[11px]">
          <span className="text-slate-500 uppercase tracking-wider">{language === 'it' ? 'Differenziale:' : 'Differential:'}</span>
          <span className={`font-mono font-black ${data.diff > 0 ? 'text-[#0CA17A]' : data.diff < 0 ? 'text-rose-600' : 'text-[#022D32]'}`}>
            {data.diff > 0 ? `+${data.diff}` : data.diff}
          </span>
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
          onClick={() => { fetchMatches(); fetchFipData(); }}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-[#0CA17A] ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'it' ? 'AGGIORNA' : 'REFRESH'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-NAVIGATION PILLS: TRENDS vs ROSTER                                   */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-[#DDF3E9] pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSection('trends')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
            activeSection === 'trends'
              ? 'bg-[#022D32] text-[#A7F3D0] shadow-sm'
              : 'bg-white text-[#022D32]/70 hover:text-[#022D32] hover:bg-[#DDF3E9] border border-[#DDF3E9]'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#0CA17A]" />
          <span>{language === 'it' ? 'TREND & ANALISI SQUADRA' : 'TEAM TRENDS & ANALYTICS'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('roster')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
            activeSection === 'roster'
              ? 'bg-[#022D32] text-[#A7F3D0] shadow-sm'
              : 'bg-white text-[#022D32]/70 hover:text-[#022D32] hover:bg-[#DDF3E9] border border-[#DDF3E9]'
          }`}
        >
          <Users className="w-4 h-4 text-[#0CA17A]" />
          <span>{language === 'it' ? 'ROSTER & STATISTICHE BBA' : 'BBA ROSTER & STATS'}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            activeSection === 'roster' ? 'bg-[#0CA17A] text-white' : 'bg-[#DDF3E9] text-[#022D32]'
          }`}>
            {filteredRoster.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. GLOBAL FILTER BAR (ALWAYS VISIBLE & APPLIED ACROSS TABS)                */}
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
            { id: 'FRIENDLY', label: language === 'it' ? 'Amichevoli' : 'Friendly', count: typeCounts?.FRIENDLY || 0 }
          ].map((tab) => {
            const isActive = matchTypeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMatchTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
      ) : activeSection === 'trends' ? (
        gamesPlayed === 0 ? (
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
            {/* 1. AGGREGATE 4-CARD PRIMARY KPI STRIP                                     */}
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
                <div className="text-[11px] font-semibold text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>PPG: <strong className="text-white">{scoring.avgPts}</strong> vs <strong className="text-white/70">{scoring.avgOppPts}</strong></span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${volatilityBadge.badgeClass}`}>
                      σ {sigma} • {volatilityBadge.label}
                    </span>
                  </div>
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
                    {shooting.totalFga > 0 ? `${shooting.efgPct}%` : '—'} <span className="text-xs font-bold text-[#A7F3D0]">eFG</span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                  <span>2P: <strong className="text-white">{shooting.total2pa > 0 ? `${shooting.fg2Pct}%` : '—'}</strong></span>
                  <span>3P: <strong className="text-white">{shooting.total3pa > 0 ? `${shooting.fg3Pct}%` : '—'}</strong></span>
                  <span>{language === 'it' ? 'TL' : 'FT'}: <strong className="text-white">{shooting.totalFta > 0 ? `${shooting.ftPct}%` : '—'}</strong></span>
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
                    {rebounding.drbPct !== null ? `${rebounding.drbPct}% DRB` : '—'}
                  </span>
                </div>
                <div className="my-1">
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {rebounding.drbPct !== null ? `${rebounding.drbPct}%` : '—'}
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                  <span>DREB: <strong className="text-white">{rebounding.avgDreb > 0 ? `${rebounding.avgDreb}/g` : '—'}</strong></span>
                  <span>OREB: <strong className="text-white">{rebounding.avgOreb > 0 ? `${rebounding.avgOreb}/g` : '—'}</strong></span>
                  <span>{language === 'it' ? 'Quota' : 'Share'}: <strong className="text-white">{rebounding.orebShare > 0 ? `${rebounding.orebShare}%` : '—'}</strong></span>
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
                    {ballControl.totalAst > 0 || ballControl.totalTov > 0 ? ballControl.astTovRatio : '—'} <span className="text-xs font-bold text-[#A7F3D0]">AST/TOV</span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                  <span>APG: <strong className="text-white">{ballControl.avgAst > 0 ? ballControl.avgAst : '—'}</strong></span>
                  <span>TOPG: <strong className="text-white">{ballControl.avgTov > 0 ? ballControl.avgTov : '—'}</strong></span>
                  <span>SPG: <strong className="text-white">{ballControl.avgStl > 0 ? ballControl.avgStl : '—'}</strong></span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 2: RENDIMENTO CASA / TRASFERTA                                   */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#022D32] flex items-center gap-2">
                  <Home className="w-4 h-4 text-[#0CA17A]" />
                  <span>{language === 'it' ? 'RENDIMENTO CASA / TRASFERTA' : 'HOME / AWAY PERFORMANCE'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {language === 'it' 
                    ? 'Confronto record e produzione realizzativa tra partite casalinghe ed esterne' 
                    : 'Comparison of record and scoring between home and away games'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Casa */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDF3E9] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-[#0CA17A]" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#022D32]">
                        {language === 'it' ? 'CASA' : 'HOME'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {homeAwaySplits.home.games} {homeAwaySplits.home.games === 1 ? (language === 'it' ? 'partita' : 'game') : (language === 'it' ? 'partite' : 'games')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#022D32] block">
                        {homeAwaySplits.home.wins}W - {homeAwaySplits.home.losses}L
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                        RECORD
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0CA17A] block">
                        {homeAwaySplits.home.games > 0 ? (homeAwaySplits.home.pointsScored / homeAwaySplits.home.games).toFixed(1) : '—'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                        SEGNATI/G
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 block">
                        {homeAwaySplits.home.games > 0 ? (homeAwaySplits.home.pointsConceded / homeAwaySplits.home.games).toFixed(1) : '—'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                        SUBITI/G
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'it' ? 'Differenziale Medio' : 'Average Margin'}
                    </span>
                    <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                      homeAwaySplits.homeDiff > 0 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : homeAwaySplits.homeDiff < 0 
                          ? 'bg-rose-50 text-rose-700' 
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {homeAwaySplits.homeDiff > 0 ? `+${homeAwaySplits.homeDiff}` : homeAwaySplits.homeDiff} pts
                    </span>
                  </div>
                </div>

                {/* Trasferta */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDF3E9] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-[#0CA17A]" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#022D32]">
                        {language === 'it' ? 'TRASFERTA' : 'AWAY'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {homeAwaySplits.away.games} {homeAwaySplits.away.games === 1 ? (language === 'it' ? 'partita' : 'game') : (language === 'it' ? 'partite' : 'games')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#022D32] block">
                        {homeAwaySplits.away.wins}W - {homeAwaySplits.away.losses}L
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                        RECORD
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0CA17A] block">
                        {homeAwaySplits.away.games > 0 ? (homeAwaySplits.away.pointsScored / homeAwaySplits.away.games).toFixed(1) : '—'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                        SEGNATI/G
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 block">
                        {homeAwaySplits.away.games > 0 ? (homeAwaySplits.away.pointsConceded / homeAwaySplits.away.games).toFixed(1) : '—'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                        SUBITI/G
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'it' ? 'Differenziale Medio' : 'Average Margin'}
                    </span>
                    <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                      homeAwaySplits.awayDiff > 0 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : homeAwaySplits.awayDiff < 0 
                          ? 'bg-rose-50 text-rose-700' 
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {homeAwaySplits.awayDiff > 0 ? `+${homeAwaySplits.awayDiff}` : homeAwaySplits.awayDiff} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 3: 1° TEMPO vs 2° TEMPO (TENUTA FISICA) & VOLATILITÀ (σ)         */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-[#0CA17A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                      <span>{language === 'it' ? 'TENUTA FISICA & INTELLIGENCE' : 'PHYSICAL STAMINA & INTELLIGENCE'}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                        FIP VERIFIED
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#022D32]/70">
                      {language === 'it' 
                        ? 'Progressione 1° vs 2° Tempo e volatilità realizzativa σ' 
                        : '1st vs 2nd half progression and scoring volatility σ'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARD A: 1° TEMPO vs 2° TEMPO (TENUTA FISICA) */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDF3E9] flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#0CA17A]" />
                      {language === 'it' ? '1° TEMPO vs 2° TEMPO' : '1ST HALF vs 2ND HALF'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                      stamina.netSwing >= 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {stamina.netSwing >= 0 ? `+${stamina.netSwing}` : stamina.netSwing} NET SWING
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        {language === 'it' ? '1° TEMPO (Q1+Q2)' : '1ST HALF (Q1+Q2)'}
                      </span>
                      <div className="font-mono text-xl sm:text-2xl font-black text-[#022D32] mt-0.5">
                        {stamina.h1ScoredAvg} <span className="text-xs text-slate-400 font-semibold">vs</span> {stamina.h1ConcededAvg}
                      </div>
                      <span className={`text-xs font-mono font-black block mt-0.5 ${stamina.h1Diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {stamina.h1Diff >= 0 ? `+${stamina.h1Diff}` : stamina.h1Diff} Diff
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        {language === 'it' ? '2° TEMPO (Q3+Q4)' : '2ND HALF (Q3+Q4)'}
                      </span>
                      <div className="font-mono text-xl sm:text-2xl font-black text-[#022D32] mt-0.5">
                        {stamina.h2ScoredAvg} <span className="text-xs text-slate-400 font-semibold">vs</span> {stamina.h2ConcededAvg}
                      </div>
                      <span className={`text-xs font-mono font-black block mt-0.5 ${stamina.h2Diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {stamina.h2Diff >= 0 ? `+${stamina.h2Diff}` : stamina.h2Diff} Diff
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs font-bold text-[#022D32] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0CA17A] flex-none" />
                    <span>{language === 'it' ? stamina.staminaSummaryIt : stamina.staminaSummaryEn}</span>
                  </div>
                </div>

                {/* CARD B: VOLATILITÀ & INDICE DI PREVEDIBILITÀ (σ) */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDF3E9] flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#0CA17A]" />
                      {language === 'it' ? 'VOLATILITÀ PUNTI (σ)' : 'VOLATILITY INDEX (σ)'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${volatilityBadge.badgeClass}`}>
                      {volatilityBadge.label}
                    </span>
                  </div>

                  <div>
                    <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32]">
                      ±{sigma} <span className="text-xs font-bold text-slate-500">PUNTI / GARA</span>
                    </div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mt-1">
                      {language === 'it' ? 'Deviazione standard produzione offensiva' : 'Standard deviation of points scored'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#022D32]/80">
                    <span>{language === 'it' ? 'Valutazione tattica:' : 'Tactical note:'}</span>
                    <span className="font-bold text-[#022D32]">{volatilityBadge.description}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 4: VISUAL ANALYTICS & TRAIETTORIE (7 cols Line + 5 cols Bar)     */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#022D32] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0CA17A]" />
                  <span>{language === 'it' ? 'VISUAL ANALYTICS & TRAIETTORIE' : 'VISUAL ANALYTICS & TRAJECTORIES'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {language === 'it' 
                    ? 'Evoluzione cronologica dei punti segnati vs punti subiti e margine medio per singolo quarto' 
                    : 'Chronological scoring trends and period net margins'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 4A. Game Trend LineChart (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-xs border border-[#DDF3E9] flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-[#022D32] uppercase tracking-wider">
                        {language === 'it' ? 'TRAIETTORIA & TREND DI RENDIMENTO' : 'TRAJECTORY & PERFORMANCE TREND'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {language === 'it' ? 'Evoluzione cronologica dei punti segnati vs punti subiti' : 'Chronological evolution of points scored vs conceded'}
                      </p>
                    </div>
                    {trendsLineData.length > 0 && (
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {trendsLineData.length} {trendsLineData.length === 1 ? (language === 'it' ? 'partita' : 'game') : (language === 'it' ? 'partite' : 'games')}
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
                            name={language === 'it' ? 'Punti Segnati' : 'Points Scored'} 
                            stroke="#0CA17A" 
                            strokeWidth={3} 
                            dot={{ r: 4.5, fill: '#0CA17A', stroke: '#FFFFFF', strokeWidth: 2 }} 
                            activeDot={{ r: 6.5 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="conceded" 
                            name={language === 'it' ? 'Punti Subiti' : 'Points Conceded'} 
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
                      {language === 'it' ? 'Nessuna gara disputata registrata a referto.' : 'No recorded matches found.'}
                    </p>
                  )}
                </div>

                {/* 4B. Differenziali per Quarto (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-xs border border-[#DDF3E9] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-[#0CA17A]" />
                      {language === 'it' ? 'DIFFERENZIALE PER QUARTO (+/-)' : 'QUARTER DIFFERENTIAL (+/-)'}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <span className="w-2 h-2 rounded bg-[#0CA17A] inline-block" /> + Vantaggio
                      </span>
                      <span className="flex items-center gap-1 text-rose-700">
                        <span className="w-2 h-2 rounded bg-rose-500 inline-block" /> - Passivo
                      </span>
                    </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.7} />
                        <XAxis dataKey="quarter" stroke="#022D32" tick={{ fill: '#022D32', fontSize: 11, fontWeight: 'bold' }} />
                        <YAxis stroke="#022D32" tick={{ fill: '#022D32', fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val, name, item) => [
                            `${val > 0 ? `+${val}` : val} net (Segnati: ${item.payload.scored}, Subiti: ${item.payload.conceded})`,
                            'Differenziale'
                          ]}
                        />
                        <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1.5} />
                        <Bar dataKey="diff" name="Diff (+/-)" radius={[4, 4, 0, 0]}>
                          {quarterBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.diff >= 0 ? '#0CA17A' : '#F43F5E'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
          {/* 6. INDIVIDUAL MATCH LOG & DETAILS TABLE (HYBRID FIP + SUPABASE)           */}
          {/* ========================================================================= */}
          <div className="bg-white p-5 rounded-2xl border border-[#DDF3E9] shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0CA17A]" />
                <h3 className="text-sm font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                  <span>{language === 'it' ? `DETTAGLIO CRONOLOGICO PARTITE (${hybridLogs.length} GARE)` : `CHRONOLOGICAL GAME LOG (${hybridLogs.length} MATCHES)`}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                  FIP KING (PUNTEGGI & REGOLE)
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                  SUPABASE (PLAYMAKING & HUSTLE)
                </span>
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
                    <th className="p-3 text-center">QUARTI (PARTIALS)</th>
                    <th className="p-3 text-center">+/-</th>
                    <th className="p-3 text-center">eFG%</th>
                    <th className="p-3 text-center">AST/TOV</th>
                    <th className="p-3 text-center">DRB%</th>
                    <th className="p-3 text-center">VERIFICA</th>
                    <th className="p-3 text-right">AZIONE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDF3E9]">
                  {hybridLogs.map((item, idx) => (
                    <tr key={item.id} className={`transition-colors hover:bg-[#DDF3E9]/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#DDF3E9]/15'}`}>
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
                        <div className="flex items-center gap-1.5">
                          <span>{item.opponent}</span>
                          <span className="text-[9px] text-slate-400 font-bold">({item.location})</span>
                        </div>
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
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                        {item.partials && item.partials.length > 0 ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {item.partials.map(p => {
                              const sScored = p.scored !== undefined ? p.scored : (item.isHomeGame ? p.homeScore : p.awayScore);
                              const sConc = p.conceded !== undefined ? p.conceded : (item.isHomeGame ? p.awayScore : p.homeScore);
                              const isPositive = sScored >= sConc;
                              return (
                                <span 
                                  key={p.period || p.quarter}
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    isPositive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                  }`}
                                  title={`${p.quarter || `Q${p.period}`}: ${sScored}-${sConc}`}
                                >
                                  {p.quarter || `Q${p.period}`}:{sScored}-{sConc}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-black">
                        <span className={item.diff > 0 ? 'text-emerald-700' : (item.diff < 0 ? 'text-rose-700' : 'text-[#022D32]')}>
                          {item.diff > 0 ? `+${item.diff}` : item.diff}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#022D32]">
                        {item.efgPct != null ? `${item.efgPct}%` : '—'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#022D32]">
                        {item.astTovRatio != null ? item.astTovRatio : '—'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#022D32]">
                        {item.drbPct != null ? `${item.drbPct}%` : '—'}
                      </td>
                      <td className="p-3 text-center">
                        {item.fipVerified ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 shadow-2xs">
                            <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                            FIP VERIFIED
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                            AMICHEVOLE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {(item.rawSupa && Array.isArray(item.rawSupa.events) && item.rawSupa.events.length > 0) || (Array.isArray(item.events) && item.events.length > 0) ? (
                          <button
                            onClick={() => handleOpenReview({ ...(item.rawSupa || {}), ...item, events: item.rawSupa?.events || item.events })}
                            className="bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 ml-auto active:scale-95 cursor-pointer"
                            title="Apri analisi approfondita del match"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ANALISI</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic font-medium pr-2">
                            {item.fipVerified ? 'FIP ONLY' : 'NO SCOUT'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )) : (
      /* ========================================================================= */
      /* BBA ROSTER & ADVANCED HYBRID METRICS VIEW                                 */
      /* ========================================================================= */
      <div className="space-y-4">
        {/* Controls & Search Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DDF3E9] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center flex-none shadow-inner">
              <Users className="w-5 h-5 text-[#0CA17A]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>{language === 'it' ? 'ROSTER & STATISTICHE BBA' : 'BBA ROSTER & ADVANCED STATS'}</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                  FIP VERIFIED
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                  SUPABASE EFFICIENCY
                </span>
              </h2>
              <p className="text-xs text-[#022D32]/70 font-semibold mt-0.5">
                {language === 'it' 
                  ? 'Clicca su un giocatore per aprire la scheda profilo e lo storico carriera completo'
                  : 'Click any player to inspect shot profile, shooting splits and career history'}
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#022D32]/50" />
            <input
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder={language === 'it' ? 'Cerca giocatore o numero...' : 'Search player or #...'}
              className="w-full bg-[#F8F9FA] border border-[#DDF3E9] text-[#022D32] text-xs font-bold pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-[#0CA17A] placeholder-[#022D32]/40 shadow-xs"
            />
          </div>
        </div>

        {/* Supercharged BBA Roster Table */}
        <div className="bg-white rounded-2xl border border-[#DDF3E9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#DDF3E9] text-[#022D32] font-black uppercase text-[10px] tracking-wider border-b border-[#DDF3E9]">
                  <th 
                    onClick={() => handleSort('number')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Ordina per Numero di Maglia"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>#</span>
                      {sortConfig.key === 'number' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="p-3.5 cursor-pointer hover:text-[#0CA17A] transition-colors min-w-[220px]"
                    title="Ordina per Nome"
                  >
                    <div className="flex items-center gap-1">
                      <span>{language === 'it' ? 'GIOCATORE' : 'PLAYER'}</span>
                      {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('games')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="FIP Official: Partite Giocate"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>PG</span>
                      {sortConfig.key === 'games' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('timePlayedAVG')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="FIP Official: Minuti Medi a Partita"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>MIN</span>
                      {sortConfig.key === 'timePlayedAVG' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('startPercentage')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Frequenza di Partenza in Quintetto (team_starters.json)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>START %</span>
                      {sortConfig.key === 'startPercentage' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('pointsAVG')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="FIP Official: Punti Medi a Partita"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>PUNTI/P</span>
                      {sortConfig.key === 'pointsAVG' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('twoMadeAVG')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Volume: 2 Punti Fatti per Partita (2PT F/P)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>2PT F/P</span>
                      {sortConfig.key === 'twoMadeAVG' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('twoPct')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Efficienza: Percentuale da 2 Punti (2PT %)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>2PT %</span>
                      {sortConfig.key === 'twoPct' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('threeMadeAVG')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Volume: 3 Punti Fatti per Partita (3PT F/P)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>3PT F/P</span>
                      {sortConfig.key === 'threeMadeAVG' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('threePct')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Efficienza: Percentuale da 3 Punti (3PT %)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>3PT %</span>
                      {sortConfig.key === 'threePct' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('ftAttAvg')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Volume: Tiri Liberi Tentati per Partita (TL T/P)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>TL T/P</span>
                      {sortConfig.key === 'ftAttAvg' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('ftPct')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Realizzazione: Percentuale Tiri Liberi (TL %)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>TL %</span>
                      {sortConfig.key === 'ftPct' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('rebAvg')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Supabase: Media Rimbalzi a Partita"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>REB/P</span>
                      {sortConfig.key === 'rebAvg' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('astAvg')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Supabase: Media Assist a Partita"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>AST/P</span>
                      {sortConfig.key === 'astAvg' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('tovAvg')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Supabase: Media Palle Perse a Partita"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>TOV/P</span>
                      {sortConfig.key === 'tovAvg' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-left min-w-[130px]">
                    {language === 'it' ? 'TAG TATTICI' : 'TACTICAL TAGS'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDF3E9]">
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-8 text-center text-slate-400 font-medium italic">
                      {language === 'it' ? 'Nessun giocatore corrisponde alla ricerca.' : 'No players match your search query.'}
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((player, pIdx) => {
                    const startPctVal = parseInt(String(player.startPercentage || '0').replace('%', ''), 10) || 0;
                    const tactical = getTacticalTags(player, player.games);

                    return (
                      <tr 
                        key={player.fid || player.number}
                        onClick={() => setSelectedPlayer(player)}
                        className={`transition-colors cursor-pointer hover:bg-[#DDF3E9]/50 ${pIdx % 2 === 0 ? 'bg-white' : 'bg-[#DDF3E9]/15'}`}
                      >
                        <td className="p-3.5 text-center font-mono font-black text-[#022D32] text-sm">
                          #{player.number}
                        </td>
                        <td className="p-3.5 font-black text-[#022D32]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-black">{player.name}</span>
                              {player.captain && (
                                <span className="text-[10px] font-black uppercase bg-slate-100 text-[#022D32] border border-slate-200 px-1.5 py-0.2 rounded">
                                  CAP
                                </span>
                              )}
                              {player.fipVerified ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                                  FIP VERIFIED
                                </span>
                              ) : (
                                <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-300 font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                  AMICHEVOLE
                                </span>
                              )}
                            </div>
                            {player.position && player.position.trim().toLowerCase() !== 'player' && (
                              <span className="text-[11px] text-slate-500 font-semibold">{player.position}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-[#022D32]">
                          {player.games}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-[#022D32]">
                          {player.timePlayedAVG != null ? formatMinutes(player.timePlayedAVG) : '—'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          {player.startPercentage != null ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              startPctVal >= 80 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : startPctVal >= 40 
                                  ? 'bg-sky-50 text-sky-800 border border-sky-300'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {player.startPercentage}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">N/A</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-[#022D32]">
                          {typeof player.pointsAVG === 'number' ? player.pointsAVG.toFixed(1) : (player.pointsAVG || '0.0')}
                        </td>
                        {/* 2PT F/P (Volume) - Comes from FIP twoMadeAVG or Supabase fg2m/gp */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                          {formatAverage(player.twoMadeAVG)}
                        </td>

                        {/* 2PT % (Efficiency) - Comes strictly from Supabase twoPct */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {formatPercentage(player.twoPct)}
                        </td>

                        {/* 3PT F/P (Volume) */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                          {formatAverage(player.threeMadeAVG)}
                        </td>

                        {/* 3PT % (Efficiency) */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {formatPercentage(player.threePct)}
                        </td>
                        {/* TL T/P (Volume Tentati) */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium" title={player.ftAtt ? `${player.ftAtt} TL tentati totali (${player.ftMade || 0} realizzati)` : undefined}>
                          <div className="flex flex-col items-center">
                            <span>{formatAverage(player.ftAttAvg)}</span>
                            {player.ftAtt > 0 && (
                              <span className="text-[10px] text-gray-400 font-normal">
                                ({player.ftAtt} tot)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* TL % (Realizzazione) */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {formatPercentage(player.ftPct)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-[#022D32]">
                          {formatAverage(player.rebAvg)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-[#022D32]">
                          {formatAverage(player.astAvg)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-[#022D32]">
                          {formatAverage(player.tovAvg)}
                        </td>
                        <td className="p-3.5 text-left">
                          {tactical.tags.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {tactical.tags.map(tag => (
                                <span 
                                  key={tag.id}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${tag.badgeClass}`}
                                  title={language === 'it' ? tag.labelIt : tag.label}
                                >
                                  <TacticalTagIcon id={tag.id} className="w-3 h-3 flex-none" />
                                  <span>{language === 'it' ? tag.labelIt : tag.label}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
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

      {/* Dedicated Player Profile Modal */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          teamName="BBA Basket Baronissi"
          language={language}
          t={t}
        />
      )}
    </div>
  );
}
