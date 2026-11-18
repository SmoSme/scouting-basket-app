import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, LineChart, Line, BarChart, Bar, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell 
} from 'recharts';
import { 
  TrendingUp, Trophy, Target, Shield, Activity, RefreshCw, 
  Filter, Calendar, Hash, Eye, Download, AlertCircle, CheckCircle2, 
  Zap, BarChart3, ChevronRight, Layers, Flame, ShieldCheck, Clock,
  Users, Search, ChevronUp, ChevronDown, Home, Navigation, Info, AlertTriangle
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
  subscribeToMatchCache,
  getMatchEvents
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
      const opp = m.opponent || 'Avversario';
      const locPrefix = (m.isHomeGame ?? (m.location === 'Casa')) ? 'vs' : '@';
      const d = new Date(m.matchDate || m.createdAt);
      const dateStr = !isNaN(d) ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}` : '';
      const roundLabel = `G${idx + 1}`; // Chiave sempre univoca per l'asse X di Recharts

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

  // Missing scouting matches in the active game log for dynamic alert
  const missingScoutMatches = useMemo(() => {
    if (!Array.isArray(hybridLogs)) return [];
    return hybridLogs.filter(m => m && !m.hasSupabaseScout);
  }, [hybridLogs]);

  const missingMatchNames = useMemo(() => {
    if (!Array.isArray(missingScoutMatches) || missingScoutMatches.length === 0) return '';
    return missingScoutMatches
      .filter(Boolean)
      .map(m => {
        const opp = m?.opponent ? `${m.isHomeGame ? 'vs' : '@'} ${m.opponent}` : (m?.name || 'Partita');
        const d = m?.date && m.date !== 'n.a.' ? ` (${m.date})` : '';
        return `${opp}${d}`;
      })
      .filter(Boolean)
      .join(', ');
  }, [missingScoutMatches]);

  // Supercharged BBA Roster List (FIP Volume + Supabase Efficiency & Playmaking, dynamically filtered)
  const bbaRosterList = useMemo(() => {
    const bbaId = import.meta.env.VITE_BBA_TEAM_ID || BBA_TEAM_ID;
    const fipList = fipRosters?.[bbaId] || fipRosters?.['team_bba_academy'] || [];
    const bbaStarters = startersData?.[bbaId] || startersData?.['team_bba_academy'] || null;
    return buildSuperchargedBbaRoster(fipList, rawSupabaseLogs, bbaStarters, matchTypeFilter, metaMap, hybridLogs);
  }, [fipRosters, rawSupabaseLogs, startersData, matchTypeFilter, metaMap, hybridLogs]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const filteredRoster = useMemo(() => {
    let list = Array.isArray(bbaRosterList) ? bbaRosterList.filter(Boolean) : [];
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      list = list.filter(p => 
        (p?.name && p.name.toLowerCase().includes(q)) || 
        (p?.number != null && String(p.number).includes(q)) ||
        (p?.position && p.position.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      let valA = a[sortConfig?.key || 'number'];
      let valB = b[sortConfig?.key || 'number'];
      if (sortConfig?.key === 'startPercentage') {
        valA = parseInt(String(valA || '0').replace('%', ''), 10) || 0;
        valB = parseInt(String(valB || '0').replace('%', ''), 10) || 0;
      } else if (sortConfig?.key === 'number') {
        valA = parseInt(String(valA || '0'), 10) || 0;
        valB = parseInt(String(valB || '0'), 10) || 0;
      } else {
        valA = typeof valA === 'number' ? valA : (valA != null && !isNaN(valA) ? parseFloat(valA) : -9999);
        valB = typeof valB === 'number' ? valB : (valB != null && !isNaN(valB) ? parseFloat(valB) : -9999);
      }
      if (sortConfig?.direction === 'asc') {
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

  // Open match review strictly via match_id
  const handleOpenReview = async (match) => {
    setReviewLoading(true);
    try {
      const matchId = match.id || match.rawSupa?.id;
      const isFipOnly = Boolean(match.isFipOnly || (!match.hasSupabaseScout && (match.fipVerified || match.rawFip)));
      let events = match.events;

      if (!isFipOnly && (!events || events.length === 0) && matchId && !String(matchId).startsWith('fip_')) {
        events = await getMatchEvents(matchId);
      } else if (isFipOnly) {
        events = [];
      }

      const sortedEvents = [...(events || [])].sort((a, b) => (Number(a?.id) || 0) - (Number(b?.id) || 0));
      const resolvedDate = match.match_date || match.matchDate || (match.name && metaMap[match.name]?.matchDate) || (match.createdAt ? match.createdAt.split('T')[0] : 'n.a.');
      const resolvedTeamScore = match.home_score ?? match.pts ?? match.displayedTeamPts ?? (match.name && metaMap[match.name]?.overrideTeamScore) ?? null;
      const resolvedOppScore = match.away_score ?? match.oppPts ?? match.displayedOppPts ?? (match.name && metaMap[match.name]?.overrideOppScore) ?? null;

      setReviewMatch({
        ...match,
        id: matchId,
        name: match.name || match.opponent,
        events: sortedEvents,
        isFipOnly,
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
      <div className="bg-white/95 border border-slate-200/80 rounded-xl p-3 shadow-lg backdrop-blur-md text-xs space-y-1.5 z-50 text-slate-800">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5">
          <div className="font-bold text-slate-900">
            {dataPoint.chartLabel || dataPoint.matchName}
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
            dataPoint.isWin 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}>
            {dataPoint.resultText} ({dataPoint.pts} - {dataPoint.oppPts})
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center justify-between">
          <span>Data:</span>
          <span className="font-semibold text-slate-700">{dataPoint.date}</span>
        </div>
        <div className="space-y-1 pt-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="tabular-nums font-bold text-slate-900">
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
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-md text-xs space-y-2 font-sans min-w-[200px]">
        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between gap-2">
          <span>{data.fullTitle}</span>
          <span className={`text-[10px] tabular-nums font-bold px-2 py-0.5 rounded-full ${
            isWin ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'
          }`}>
            {isWin ? 'V' : 'P'}
          </span>
        </div>
        <div className="flex justify-between items-center text-[#0CA17A] font-semibold">
          <span>{language === 'it' ? 'Punti Segnati:' : 'Points Scored:'}</span>
          <span className="tabular-nums font-bold text-sm">{data.scored}</span>
        </div>
        <div className="flex justify-between items-center text-rose-600 font-semibold">
          <span>{language === 'it' ? 'Punti Subiti:' : 'Points Conceded:'}</span>
          <span className="tabular-nums font-bold text-sm">{data.conceded}</span>
        </div>
        <div className="flex justify-between items-center text-slate-800 pt-1.5 border-t border-slate-100 font-semibold text-[11px]">
          <span className="text-slate-500 uppercase tracking-wider">{language === 'it' ? 'Differenziale:' : 'Differential:'}</span>
          <span className={`tabular-nums font-bold ${data.diff > 0 ? 'text-[#0CA17A]' : data.diff < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {data.diff > 0 ? `+${data.diff}` : data.diff}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5 bg-[#F4F6F8] text-slate-900">
      {/* ========================================================================= */}
      {/* 1. HEADER BAR                                                             */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0CA17A]/10 border border-[#0CA17A]/20 flex items-center justify-center flex-none shadow-xs">
            <TrendingUp className="w-5 h-5 text-[#0CA17A]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-[#0CA17A] rounded-full inline-block" />
              <span>{t('trends_title')}</span>
              <span className="text-[10px] bg-[#0CA17A]/10 text-[#0CA17A] font-bold px-2 py-0.5 rounded border border-[#0CA17A]/20">
                MULTI-MATCH
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t('trends_subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={() => { fetchMatches(); fetchFipData(); }}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:border-[#0CA17A] text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-[#0CA17A] ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'it' ? 'AGGIORNA' : 'REFRESH'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-NAVIGATION PILLS: TRENDS vs ROSTER                                   */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSection('trends')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
            activeSection === 'trends'
              ? 'bg-[#022D32] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#0CA17A]" />
          <span>{language === 'it' ? 'Trend & Analisi Squadra' : 'Team Trends & Analytics'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('roster')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
            activeSection === 'roster'
              ? 'bg-[#022D32] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-[#0CA17A]" />
          <span>{language === 'it' ? 'Roster & Statistiche BBA' : 'BBA Roster & Stats'}</span>
          <span className={`text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full ${
            activeSection === 'roster' ? 'bg-[#0CA17A] text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {filteredRoster.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. GLOBAL FILTER BAR (ALWAYS VISIBLE & APPLIED ACROSS TABS)                */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Match Type Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#0CA17A]" />
            {language === 'it' ? 'Tipo:' : 'Type:'}
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#0CA17A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold tabular-nums ${
                  isActive ? 'bg-[#022D32] text-emerald-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chronological Split / Range */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[10px] font-semibold text-slate-500 px-2 uppercase">Split:</span>
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
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-16 text-center border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-[#0CA17A] animate-spin mx-auto" />
          <p className="text-slate-800 font-bold text-sm">{language === 'it' ? 'Aggregazione andamento storico partite...' : 'Aggregating season analytics...'}</p>
        </div>
      ) : activeSection === 'trends' ? (
        gamesPlayed === 0 ? (
          <div className="bg-white p-12 text-center border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
            <AlertCircle className="w-10 h-10 text-[#0CA17A]/70 mx-auto" />
            <h3 className="text-slate-900 font-bold text-base">{language === 'it' ? 'Nessuna Partita Trovata' : 'No Matches Found'}</h3>
            <p className="text-slate-500 font-medium text-xs max-w-md mx-auto">
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
              <div className="bg-[#022D32] p-4 sm:p-5 rounded-2xl text-white shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#0CA17A]" />
                    {t('rec_margin_title')}
                  </span>
                  <span className={`text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded border ${
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
                  <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight flex items-baseline gap-2">
                    <span>{record.wins}W - {record.losses}L</span>
                    {record.ties > 0 && <span className="text-sm text-white/50">({record.ties}T)</span>}
                  </div>
                </div>
                <div className="text-[11px] font-medium text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>PPG: <strong className="text-white tabular-nums">{scoring.avgPts}</strong> vs <strong className="text-white/70 tabular-nums">{scoring.avgOppPts}</strong></span>
                    <span className={`text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded border ${volatilityBadge.badgeClass}`}>
                      σ {sigma} • {volatilityBadge.label}
                    </span>
                  </div>
                  <span className={`tabular-nums font-bold ${scoring.avgDiff > 0 ? 'text-[#A7F3D0]' : (scoring.avgDiff < 0 ? 'text-rose-300' : 'text-white')}`}>
                    {scoring.avgDiff > 0 ? `+${scoring.avgDiff}` : scoring.avgDiff} Net
                  </span>
                </div>
              </div>

              {/* CARD 2: SHOOTING EFFICIENCY */}
              <div className="bg-[#022D32] p-4 sm:p-5 rounded-2xl text-white shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#0CA17A]" />
                    {t('shooting_eff_title')}
                  </span>
                  <span className={`text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded border ${
                    shooting.efgPct >= 50 
                      ? 'bg-[#0CA17A]/30 text-[#A7F3D0] border-[#0CA17A]' 
                      : 'bg-amber-500/30 text-amber-300 border-amber-400'
                  }`}>
                    {shooting.efgPct >= 50 ? 'TARGET' : (language === 'it' ? 'SOTTO 50%' : 'UNDER 50%')}
                  </span>
                </div>
                <div className="my-1">
                  <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                    {shooting.totalFga > 0 ? `${shooting.efgPct}%` : '—'} <span className="text-xs font-semibold text-[#A7F3D0]">eFG</span>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                  <span>2P: <strong className="text-white tabular-nums">{shooting.total2pa > 0 ? `${shooting.fg2Pct}%` : '—'}</strong></span>
                  <span>3P: <strong className="text-white tabular-nums">{shooting.total3pa > 0 ? `${shooting.fg3Pct}%` : '—'}</strong></span>
                  <span>{language === 'it' ? 'TL' : 'FT'}: <strong className="text-white tabular-nums">{shooting.totalFta > 0 ? `${shooting.ftPct}%` : '—'}</strong></span>
                </div>
              </div>

              {/* CARD 3: DEFENSIVE REBOUNDING */}
              <div className="bg-[#022D32] p-4 sm:p-5 rounded-2xl text-white shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0CA17A]" />
                    {t('glass_title')}
                  </span>
                  <span className={`text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded border ${
                    rebounding.drbPct >= 70 
                      ? 'bg-[#0CA17A]/30 text-[#A7F3D0] border-[#0CA17A]' 
                      : 'bg-amber-500/30 text-amber-300 border-amber-400'
                  }`}>
                    {rebounding.drbPct !== null ? `${rebounding.drbPct}% DRB` : '—'}
                  </span>
                </div>
                <div className="my-1">
                  <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                    {rebounding.drbPct !== null ? `${rebounding.drbPct}%` : '—'}
                  </div>
                </div>
                <div className="text-[11px] font-medium text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                  <span>DREB: <strong className="text-white tabular-nums">{rebounding.avgDreb > 0 ? `${rebounding.avgDreb}/g` : '—'}</strong></span>
                  <span>OREB: <strong className="text-white tabular-nums">{rebounding.avgOreb > 0 ? `${rebounding.avgOreb}/g` : '—'}</strong></span>
                  <span>{language === 'it' ? 'Quota' : 'Share'}: <strong className="text-white tabular-nums">{rebounding.orebShare > 0 ? `${rebounding.orebShare}%` : '—'}</strong></span>
                </div>
              </div>

              {/* CARD 4: BALL SECURITY & RATIO */}
              <div className="bg-[#022D32] p-4 sm:p-5 rounded-2xl text-white shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0CA17A]" />
                    {t('ball_care_title')}
                  </span>
                  <span className={`text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded border ${
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
                  <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                    {ballControl.totalAst > 0 || ballControl.totalTov > 0 ? ballControl.astTovRatio : '—'} <span className="text-xs font-semibold text-[#A7F3D0]">AST/TOV</span>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-[#A7F3D0] border-t border-[#0CA17A]/30 pt-2 flex items-center justify-between">
                  <span>APG: <strong className="text-white tabular-nums">{ballControl.avgAst > 0 ? ballControl.avgAst : '—'}</strong></span>
                  <span>TOPG: <strong className="text-white tabular-nums">{ballControl.avgTov > 0 ? ballControl.avgTov : '—'}</strong></span>
                  <span>SPG: <strong className="text-white tabular-nums">{ballControl.avgStl > 0 ? ballControl.avgStl : '—'}</strong></span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 2: RENDIMENTO CASA / TRASFERTA                                   */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800 flex items-center gap-2">
                  <Home className="w-4 h-4 text-[#0CA17A]" />
                  <span>{language === 'it' ? 'Rendimento Casa / Trasferta' : 'Home / Away Performance'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {language === 'it' 
                    ? 'Confronto record e produzione realizzativa tra partite casalinghe ed esterne' 
                    : 'Comparison of record and scoring between home and away games'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Casa */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-[#0CA17A]" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                        {language === 'it' ? 'Casa' : 'Home'}
                      </span>
                    </div>
                    <span className="text-xs tabular-nums font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {homeAwaySplits.home.games} {homeAwaySplits.home.games === 1 ? (language === 'it' ? 'partita' : 'game') : (language === 'it' ? 'partite' : 'games')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 block">
                        {homeAwaySplits.home.wins}W - {homeAwaySplits.home.losses}L
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                        Record
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums text-[#0CA17A] block">
                        {homeAwaySplits.home.games > 0 ? (homeAwaySplits.home.pointsScored / homeAwaySplits.home.games).toFixed(1) : '—'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                        Segnati/G
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums text-rose-600 block">
                        {homeAwaySplits.home.games > 0 ? (homeAwaySplits.home.pointsConceded / homeAwaySplits.home.games).toFixed(1) : '—'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                        Subiti/G
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {language === 'it' ? 'Differenziale Medio' : 'Average Margin'}
                    </span>
                    <span className={`text-xs tabular-nums font-bold px-2.5 py-0.5 rounded-full ${
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
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-[#0CA17A]" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                        {language === 'it' ? 'Trasferta' : 'Away'}
                      </span>
                    </div>
                    <span className="text-xs tabular-nums font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {homeAwaySplits.away.games} {homeAwaySplits.away.games === 1 ? (language === 'it' ? 'partita' : 'game') : (language === 'it' ? 'partite' : 'games')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 block">
                        {homeAwaySplits.away.wins}W - {homeAwaySplits.away.losses}L
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                        Record
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums text-[#0CA17A] block">
                        {homeAwaySplits.away.games > 0 ? (homeAwaySplits.away.pointsScored / homeAwaySplits.away.games).toFixed(1) : '—'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                        Segnati/G
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums text-rose-600 block">
                        {homeAwaySplits.away.games > 0 ? (homeAwaySplits.away.pointsConceded / homeAwaySplits.away.games).toFixed(1) : '—'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                        Subiti/G
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {language === 'it' ? 'Differenziale Medio' : 'Average Margin'}
                    </span>
                    <span className={`text-xs tabular-nums font-bold px-2.5 py-0.5 rounded-full ${
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
                  <div className="w-8 h-8 rounded-lg bg-[#0CA17A]/10 border border-[#0CA17A]/20 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-[#0CA17A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                      <span>{language === 'it' ? 'Tenuta Fisica & Intelligence' : 'Physical Stamina & Intelligence'}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                        FIP VERIFIED
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {language === 'it' 
                        ? 'Progressione 1° vs 2° Tempo e volatilità realizzativa σ' 
                        : '1st vs 2nd half progression and scoring volatility σ'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARD A: 1° TEMPO vs 2° TEMPO (TENUTA FISICA) */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#0CA17A]" />
                      {language === 'it' ? '1° Tempo vs 2° Tempo' : '1st Half vs 2nd Half'}
                    </span>
                    <span className={`text-[10px] font-bold tabular-nums px-2 py-0.5 rounded border ${
                      stamina.netSwing >= 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {stamina.netSwing >= 0 ? `+${stamina.netSwing}` : stamina.netSwing} NET SWING
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                        {language === 'it' ? '1° Tempo (Q1+Q2)' : '1st Half (Q1+Q2)'}
                      </span>
                      <div className="tabular-nums text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                        {stamina.h1ScoredAvg} <span className="text-xs text-slate-400 font-semibold">vs</span> {stamina.h1ConcededAvg}
                      </div>
                      <span className={`text-xs tabular-nums font-bold block mt-0.5 ${stamina.h1Diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {stamina.h1Diff >= 0 ? `+${stamina.h1Diff}` : stamina.h1Diff} Diff
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                        {language === 'it' ? '2° Tempo (Q3+Q4)' : '2nd Half (Q3+Q4)'}
                      </span>
                      <div className="tabular-nums text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                        {stamina.h2ScoredAvg} <span className="text-xs text-slate-400 font-semibold">vs</span> {stamina.h2ConcededAvg}
                      </div>
                      <span className={`text-xs tabular-nums font-bold block mt-0.5 ${stamina.h2Diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {stamina.h2Diff >= 0 ? `+${stamina.h2Diff}` : stamina.h2Diff} Diff
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0CA17A] flex-none" />
                    <span>{language === 'it' ? stamina.staminaSummaryIt : stamina.staminaSummaryEn}</span>
                  </div>
                </div>

                {/* CARD B: VOLATILITÀ & INDICE DI PREVEDIBILITÀ (σ) */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#0CA17A]" />
                      {language === 'it' ? 'Volatilità Punti (σ)' : 'Volatility Index (σ)'}
                    </span>
                    <span className={`text-[10px] font-bold tabular-nums px-2 py-0.5 rounded border ${volatilityBadge.badgeClass}`}>
                      {volatilityBadge.label}
                    </span>
                  </div>

                  <div>
                    <div className="tabular-nums text-3xl sm:text-4xl font-bold text-slate-900">
                      ±{sigma} <span className="text-xs font-semibold text-slate-500">PUNTI / GARA</span>
                    </div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium block mt-1">
                      {language === 'it' ? 'Deviazione standard produzione offensiva' : 'Standard deviation of points scored'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>{language === 'it' ? 'Valutazione tattica:' : 'Tactical note:'}</span>
                    <span className="font-semibold text-slate-900">{volatilityBadge.description}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 4: VISUAL ANALYTICS & TRAIETTORIE (7 cols Line + 5 cols Bar)     */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0CA17A]" />
                  <span>{language === 'it' ? 'Visual Analytics & Traiettorie' : 'Visual Analytics & Trajectories'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {language === 'it' 
                    ? 'Evoluzione cronologica dei punti segnati vs punti subiti e margine medio per singolo quarto' 
                    : 'Chronological scoring trends and period net margins'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 4A. Game Trend LineChart (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                        {language === 'it' ? 'Traiettoria & Trend di Rendimento' : 'Trajectory & Performance Trend'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {language === 'it' ? 'Evoluzione cronologica dei punti segnati vs punti subiti' : 'Chronological evolution of points scored vs conceded'}
                      </p>
                    </div>
                    {trendsLineData.length > 0 && (
                      <span className="text-xs tabular-nums font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
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
                            wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold', color: '#0F172A' }} 
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
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-[#0CA17A]" />
                      {language === 'it' ? 'Differenziale per Quarto (+/-)' : 'Quarter Differential (+/-)'}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={0.7} />
                        <XAxis dataKey="quarter" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 'bold' }} />
                        <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0CA17A]/10 border border-[#0CA17A]/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#0CA17A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                    <span>Efficienza Offensiva & Flusso Punti</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Punti segnati (asse sinistro) vs. Percentuale effettiva eFG% (asse destro)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <span className="w-3 h-0.5 bg-slate-800 inline-block" />
                  <span>Punti Segnati</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#0CA17A] font-semibold">
                  <span className="w-3 h-0.5 bg-[#0CA17A] inline-block" />
                  <span>eFG%</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 font-semibold hidden sm:flex">
                  <span className="w-3 h-0.5 border-b border-dashed border-amber-500 inline-block" />
                  <span>50% Target Benchmark</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={0.8} />
                  <XAxis 
                    dataKey="gameLabel" 
                    stroke="#64748B" 
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 11 }}
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0CA17A]/10 border border-[#0CA17A]/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#0CA17A]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                      <span>Controllo Palla: Assist vs. Perse</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Assist (AST), Palle Perse (TOV) e rapporto AST/TOV
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-slate-800 font-semibold">
                    <span className="w-2.5 h-2.5 rounded bg-slate-800 inline-block" /> AST
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" /> TOV
                  </span>
                  <span className="flex items-center gap-1 text-[#0CA17A] font-semibold">
                    <span className="w-3 h-0.5 bg-[#0CA17A] inline-block" /> Ratio
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={0.8} />
                    <XAxis 
                      dataKey="gameLabel" 
                      stroke="#64748B" 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#64748B"
                      tick={{ fill: '#64748B', fontSize: 11 }}
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0CA17A]/10 border border-[#0CA17A]/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#0CA17A]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                      <span>Dominio a Rimbalzo (DRB%)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Percentuale rimbalzi difensivi vs. target benchmark 70%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-[#0CA17A] font-semibold">
                    <span className="w-2.5 h-2.5 rounded bg-[#0CA17A] inline-block" /> DRB%
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={0.8} />
                    <XAxis 
                      dataKey="gameLabel" 
                      stroke="#64748B" 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 'bold' }}
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
          {/* 6. INDIVIDUAL MATCH LOG & BOXSCORE STRIP CARDS (HYBRID FIP + SUPABASE)   */}
          {/* ========================================================================= */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0CA17A]/10 border border-[#0CA17A]/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[#0CA17A]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#0CA17A] rounded-full inline-block" />
                  <span>{language === 'it' ? `Dettaglio Cronologico Partite (${hybridLogs.length} Gare)` : `Chronological Game Log (${hybridLogs.length} Matches)`}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                  FIP KING (PUNTEGGI & REGOLE)
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                  SUPABASE (PLAYMAKING & HUSTLE)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {hybridLogs.map((item, idx) => {
                const homeTeamName = item.isHomeGame ? 'BBA Basket Baronissi' : item.opponent;
                const awayTeamName = item.isHomeGame ? item.opponent : 'BBA Basket Baronissi';
                const homeScore = item.isHomeGame ? item.pts : item.oppPts;
                const awayScore = item.isHomeGame ? item.oppPts : item.pts;
                const isHomeWinner = homeScore > awayScore;
                const isAwayWinner = awayScore > homeScore;

                const quarterList = (item.partials && item.partials.length > 0)
                  ? item.partials.map(p => {
                      const qLabel = p.quarter || `Q${p.period}`;
                      const hQScore = p.homeScore !== undefined 
                        ? p.homeScore 
                        : (item.isHomeGame ? (p.scored ?? 0) : (p.conceded ?? 0));
                      const aQScore = p.awayScore !== undefined 
                        ? p.awayScore 
                        : (item.isHomeGame ? (p.conceded ?? 0) : (p.scored ?? 0));
                      return { label: qLabel, home: hQScore, away: aQScore };
                    })
                  : null;

                return (
                  <div
                    key={item.id || idx}
                    className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:border-[#0CA17A]/40 transition-all space-y-3"
                  >
                    {/* Top Micro-Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold tabular-nums text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          {item.gameLabel}
                        </span>
                        <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.date}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                          item.matchType === 'Official'
                            ? 'bg-slate-50 text-slate-700 border-slate-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}>
                          {item.matchType === 'Official' ? (language === 'it' ? 'Ufficiale' : 'Official') : (language === 'it' ? 'Amichevole' : 'Friendly')}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          {item.isHomeGame ? <Home className="w-3 h-3 text-slate-400" /> : <Navigation className="w-3 h-3 text-slate-400" />}
                          {item.isHomeGame ? (language === 'it' ? 'Casa' : 'Home') : (language === 'it' ? 'Trasferta' : 'Away')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.hasSupabaseScout && item.fipVerified ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                            SCOUTING + FIP
                          </span>
                        ) : item.fipVerified ? (
                          <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#0284c7]" />
                            FIP ONLY
                          </span>
                        ) : (
                          <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                            SCOUTING ONLY
                          </span>
                        )}

                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border tabular-nums ${
                          item.isWin 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {item.resultText}
                        </span>
                      </div>
                    </div>

                    {/* 2-Row Scoreboard Grid */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Scoreboard table */}
                        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1.5">
                          {/* Row 1: Home Team */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-xs sm:text-sm font-semibold truncate ${isHomeWinner ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                              {homeTeamName}
                            </span>
                            {item.isHomeGame && (
                              <span className="text-[9px] font-bold uppercase bg-[#0CA17A]/10 text-[#0CA17A] px-1.5 py-0.2 rounded border border-[#0CA17A]/20 flex-none">
                                BBA
                              </span>
                            )}
                          </div>

                          {/* Quarter Columns (Home) */}
                          <div className="flex items-center gap-2 sm:gap-3 text-xs tabular-nums text-slate-500">
                            {quarterList ? (
                              quarterList.map((q, qIdx) => (
                                <div key={qIdx} className="w-7 text-center">
                                  <span className={isHomeWinner && q.home > q.away ? 'font-semibold text-slate-700' : ''}>
                                    {q.home}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </div>

                          {/* Final Score (Home) */}
                          <div className="w-12 text-right">
                            <span className={`text-base font-bold tabular-nums ${
                              isHomeWinner ? 'text-[#022D32]' : 'text-slate-400'
                            }`}>
                              {homeScore}
                            </span>
                          </div>

                          {/* Row 2: Away Team */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-xs sm:text-sm font-semibold truncate ${isAwayWinner ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                              {awayTeamName}
                            </span>
                            {!item.isHomeGame && (
                              <span className="text-[9px] font-bold uppercase bg-[#0CA17A]/10 text-[#0CA17A] px-1.5 py-0.2 rounded border border-[#0CA17A]/20 flex-none">
                                BBA
                              </span>
                            )}
                          </div>

                          {/* Quarter Columns (Away) */}
                          <div className="flex items-center gap-2 sm:gap-3 text-xs tabular-nums text-slate-500">
                            {quarterList ? (
                              quarterList.map((q, qIdx) => (
                                <div key={qIdx} className="w-7 text-center">
                                  <span className={isAwayWinner && q.away > q.home ? 'font-semibold text-slate-700' : ''}>
                                    {q.away}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </div>

                          {/* Final Score (Away) */}
                          <div className="w-12 text-right">
                            <span className={`text-base font-bold tabular-nums ${
                              isAwayWinner ? 'text-[#022D32]' : 'text-slate-400'
                            }`}>
                              {awayScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-end sm:border-l sm:border-slate-100 sm:pl-4 flex-none pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {item.hasSupabaseScout ? (
                          <button
                            onClick={() => {
                              const bbaId = import.meta.env.VITE_BBA_TEAM_ID || BBA_TEAM_ID;
                              const fipList = fipRosters?.[bbaId] || fipRosters?.['team_bba_academy'] || [];
                              handleOpenReview({ 
                                ...(item.rawSupa || {}), 
                                ...item, 
                                id: item.rawSupa?.id || item.id, 
                                events: item.rawSupa?.events || item.events || [],
                                isFipOnly: false,
                                fipRoster: fipList
                              });
                            }}
                            className="bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            title={language === 'it' ? 'Apri analisi approfondita del match' : 'Open deep match analytics'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ANALISI</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-300 select-none px-3">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )) : (
      /* ========================================================================= */
      /* BBA ROSTER & ADVANCED HYBRID METRICS VIEW                                 */
      /* ========================================================================= */
      <div className="space-y-4">
        {/* Controls & Search Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-none">
              <Users className="w-5 h-5 text-[#0CA17A]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>{language === 'it' ? 'Roster & Statistiche BBA' : 'BBA Roster & Advanced Stats'}</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0CA17A]" />
                  FIP VERIFIED
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                  SUPABASE EFFICIENCY
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {language === 'it' 
                  ? 'Clicca su un giocatore per aprire la scheda profilo e lo storico carriera completo'
                  : 'Click any player to inspect shot profile, shooting splits and career history'}
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder={language === 'it' ? 'Cerca giocatore o numero...' : 'Search player or #...'}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-[#0CA17A] placeholder-slate-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Dynamic Missing-Data Alert (Requirement 4) */}
        {missingScoutMatches.length > 0 && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200/90 rounded-xl px-4 py-2.5 font-medium flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-none" />
            <span>
              {language === 'it' 
                ? `Dati di scouting incompleti. Mancano i dati per: ${missingMatchNames}.` 
                : `Incomplete scouting data. Missing scouting data for: ${missingMatchNames}.`}
            </span>
          </div>
        )}

        {/* Supercharged BBA Roster Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200 select-none">
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
                    title="Partite Giocate Dinamiche (PG)"
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
                    title="Punti Medi a Partita"
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
                      <span>2PT %{missingScoutMatches.length > 0 && <sup className="text-amber-600 font-black ml-0.5" title="Calcolato su partite con scouting disponibile">*</sup>}</span>
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
                      <span>3PT %{missingScoutMatches.length > 0 && <sup className="text-amber-600 font-black ml-0.5" title="Calcolato su partite con scouting disponibile">*</sup>}</span>
                      {sortConfig.key === 'threePct' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('ftAttAvg')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Volume: Tiri Liberi Fatti / Tentati per Partita (TL T/P)"
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
                      <span>REB/P{missingScoutMatches.length > 0 && <sup className="text-amber-600 font-black ml-0.5" title="Calcolato su partite con scouting disponibile">*</sup>}</span>
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
                      <span>AST/P{missingScoutMatches.length > 0 && <sup className="text-amber-600 font-black ml-0.5" title="Calcolato su partite con scouting disponibile">*</sup>}</span>
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
                      <span>TOV/P{missingScoutMatches.length > 0 && <sup className="text-amber-600 font-black ml-0.5" title="Calcolato su partite con scouting disponibile">*</sup>}</span>
                      {sortConfig.key === 'tovAvg' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('stlAvg')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Supabase: Media Palle Recuperate a Partita"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>STL/P{missingScoutMatches.length > 0 && <sup className="text-amber-600 font-black ml-0.5" title="Calcolato su partite con scouting disponibile">*</sup>}</span>
                      {sortConfig.key === 'stlAvg' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('blkAvg')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Supabase: Media Stoppate a Partita"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>BLK/P{missingScoutMatches.length > 0 && <sup className="text-amber-600 font-black ml-0.5" title="Calcolato su partite con scouting disponibile">*</sup>}</span>
                      {sortConfig.key === 'blkAvg' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('foulsAVG')}
                    className="p-3.5 text-center cursor-pointer hover:text-[#0CA17A] transition-colors"
                    title="Media Falli Commessi a Partita"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>FALLI/P</span>
                      {sortConfig.key === 'foulsAVG' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-[#0CA17A]" /> : <ChevronDown className="w-3 h-3 text-[#0CA17A]" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-left min-w-[130px]">
                    {language === 'it' ? 'TAG TATTICI' : 'TACTICAL TAGS'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="p-8 text-center text-slate-400 font-medium italic">
                      {language === 'it' ? 'Nessun giocatore corrisponde alla ricerca.' : 'No players match your search query.'}
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((player, pIdx) => {
                    if (!player) return null;
                    const startPctVal = parseInt(String(player?.startPercentage || '0').replace('%', ''), 10) || 0;
                    const tactical = getTacticalTags(player, player?.games || 0) || { tags: [], metrics: {} };
                    const tacticalTags = Array.isArray(tactical?.tags) ? tactical.tags : [];

                    return (
                      <tr 
                        key={player.fid || player.number || `p_${pIdx}`}
                        onClick={() => setSelectedPlayer(player)}
                        className={`transition-colors cursor-pointer hover:bg-slate-50/80 ${pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                      >
                        <td className="py-3 px-3.5 text-center font-semibold text-slate-400 tabular-nums text-sm">
                          #{player.number}
                        </td>
                        <td className="py-3 px-3.5 min-w-[220px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-slate-900">{player.name}</span>
                              {player.captain && (
                                <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded">
                                  CAP
                                </span>
                              )}
                            </div>
                            {player.position && player.position.trim().toLowerCase() !== 'player' && (
                              <span className="text-[11px] text-slate-500 font-medium">{player.position}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-slate-700 text-sm">
                          {player.games ?? 0}
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-slate-700 text-sm">
                          {player.timePlayedAVG != null && !isNaN(Number(player.timePlayedAVG)) && Number(player.timePlayedAVG) > 0 ? formatMinutes(player.timePlayedAVG) : '—'}
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-xs sm:text-sm">
                          {player.startPercentage != null ? (
                            <span className={`px-2 py-0.5 rounded-full tabular-nums text-xs font-semibold ${
                              startPctVal >= 80 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : startPctVal >= 40 
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'text-slate-400'
                            }`}>
                              {player.startPercentage}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-bold text-slate-900 text-sm">
                          <span>{typeof player.pointsAVG === 'number' && !isNaN(player.pointsAVG) ? player.pointsAVG.toFixed(1) : (player.pointsAVG || '0.0')}</span>
                        </td>
                        {/* 2PT F/P (Solo realizzati: media + totale) */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-sm text-slate-900 text-center font-medium tabular-nums" title={player.fg2a ? `${player.fg2m || 0}/${player.fg2a} da 2 totali` : undefined}>
                          <div className="flex flex-col items-center">
                            <span>{formatAverage(player.twoMadeAVG)}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({player.fg2m || 0} tot)
                            </span>
                          </div>
                        </td>

                        {/* 2PT % (Efficiency - Solo Scouting) */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-sm text-slate-600 text-center tabular-nums font-semibold">
                          <span>{formatPercentage(player.twoPct)}</span>
                        </td>

                        {/* 3PT F/P (Solo realizzati: media + totale) */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-sm text-slate-900 text-center font-medium tabular-nums" title={player.fg3a ? `${player.fg3m || 0}/${player.fg3a} da 3 totali` : undefined}>
                          <div className="flex flex-col items-center">
                            <span>{formatAverage(player.threeMadeAVG)}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({player.fg3m || 0} tot)
                            </span>
                          </div>
                        </td>

                        {/* 3PT % (Efficiency) */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-sm text-slate-600 text-center tabular-nums font-semibold">
                          <span>{formatPercentage(player.threePct)}</span>
                        </td>
                        {/* TL T/P (Volume: Made / Attempted) */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-sm text-slate-900 text-center font-medium tabular-nums" title={player.fta ? `${player.ftm || 0}/${player.fta} TL totali (${formatPercentage(player.ftPct)})` : undefined}>
                          <div className="flex flex-col items-center">
                            <span>
                              {player.ftAttAvg != null && Number(player.ftAttAvg) > 0
                                ? `${formatAverage(player.ftMadeAvg)} / ${formatAverage(player.ftAttAvg)}`
                                : (player.ftMadeAvg != null && Number(player.ftMadeAvg) > 0 ? formatAverage(player.ftMadeAvg) : '—')}
                            </span>
                            {Number(player.fta) > 0 && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({player.ftm || 0}/{player.fta} tot)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* TL % (Realizzazione) */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-sm text-slate-600 text-center tabular-nums font-semibold">
                          <span>{formatPercentage(player.ftPct)}</span>
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-slate-700 text-sm">
                          <span>{formatAverage(player.rebAvg)}</span>
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-slate-700 text-sm">
                          <span>{formatAverage(player.astAvg)}</span>
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-slate-700 text-sm">
                          <span>{formatAverage(player.tovAvg)}</span>
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-slate-700 text-sm">
                          <span>{formatAverage(player.stlAvg)}</span>
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-slate-700 text-sm">
                          <span>{formatAverage(player.blkAvg)}</span>
                        </td>
                        <td className="py-3 px-3.5 text-center tabular-nums font-semibold text-slate-700 text-sm">
                          <span>{formatAverage(player.foulsAVG)}</span>
                        </td>
                        <td className="py-3 px-3.5 text-left">
                          {tacticalTags.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {tacticalTags.map(tag => (
                                <span 
                                  key={tag.id || tag.label}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${tag.badgeClass || ''}`}
                                  title={language === 'it' ? (tag.labelIt || tag.label) : tag.label}
                                >
                                  <TacticalTagIcon id={tag.id} className="w-3 h-3 flex-none" />
                                  <span>{language === 'it' ? (tag.labelIt || tag.label) : tag.label}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-medium">—</span>
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
          matchId={reviewMatch.id}
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
          events={rawSupabaseLogs}
        />
      )}
    </div>
  );
}
