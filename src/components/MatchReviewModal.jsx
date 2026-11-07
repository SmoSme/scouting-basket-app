import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Trophy, Download, X, PieChart, List, 
  Target, Users, Clock, Shield, Zap, Sparkles, Layers, Ghost, 
  Calendar, Hash, Search, Filter, TrendingUp, BarChart2,
  Check, ArrowRight, ArrowLeft, UserCheck, Flame, ChevronRight, ChevronLeft,
  Info, AlertTriangle, BookOpen, HelpCircle, Tag, Edit3, Pencil, Loader2
} from 'lucide-react';
import CourtPitchMap from './CourtPitchMap';
import MetricGuideModal from './MetricGuideModal';
import ScoreOverrideModal from './ScoreOverrideModal';
import { calculateMatchAnalytics, computeZoneStats } from '../utils/basketballAnalytics';
import { getScoreOverride, saveScoreOverride, clearScoreOverride } from '../utils/scoreOverride';
import { 
  saveMatchMetadataToSupabase, 
  updateScoutingMatchInSupabase, 
  formatDateForInput,
  getMatchEvents
} from '../services/matchMetadataService';
import { useLanguage } from '../context/LanguageContext';

export default function MatchReviewModal({ 
  match, 
  matchId, 
  onClose, 
  onDownloadCSV, 
  onUpdateMatchDate, 
  onUpdateMatchType, 
  onUpdateScoreOverride 
}) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'quarters' | 'players' | 'shotmap' | 'boxscore' | 'playbyplay'
  const [selectedPlayerNum, setSelectedPlayerNum] = useState(null);
  const [shotMapPlayerFilter, setShotMapPlayerFilter] = useState(null);
  const [shotMapSelectedZone, setShotMapSelectedZone] = useState('PAINT');
  const [boxScoreSortKey, setBoxScoreSortKey] = useState('pir');
  const [boxScoreSortAsc, setBoxScoreSortAsc] = useState(false);
  const [activeMetricGuideKey, setActiveMetricGuideKey] = useState(null); // 'pillars' | 'efg' | 'ts' | 'oreb' | 'asttov' | 'ballControl' | 'pir' | 'gamescore' | 'pps'
  
  // Relational match_id resolution and strict event fetching
  const activeMatchId = matchId || match?.id || match?.match_id;
  const [events, setEvents] = useState(() => Array.isArray(match?.events) ? match.events : []);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      if (!activeMatchId) {
        if (Array.isArray(match?.events)) {
          setEvents(match.events);
        }
        return;
      }
      setLoadingEvents(true);
      try {
        const data = await getMatchEvents(activeMatchId);
        if (isMounted) {
          setEvents(data || []);
        }
      } catch (err) {
        console.error('[MatchReviewModal] Error loading match events for match_id:', activeMatchId, err);
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [activeMatchId]);

  // Manual Score Override State
  const [overrideScores, setOverrideScores] = useState(() => match?.name ? getScoreOverride(match.name) : null);
  const [showScoreOverrideModal, setShowScoreOverrideModal] = useState(false);

  useEffect(() => {
    if (match?.name) {
      setOverrideScores(getScoreOverride(match.name));
    }
  }, [match?.name]);

  // Match Date State for retroactive editing (Strictly Single Source of Truth in Supabase)
  const [matchDateValue, setMatchDateValue] = useState(() => {
    return formatDateForInput(match?.match_date || match?.matchDate) || formatDateForInput(match?.createdAt) || new Date().toISOString().split('T')[0];
  });
  const [dateSaving, setDateSaving] = useState(false);
  const [dateSaved, setDateSaved] = useState(false);
  const dateInputRef = useRef(null);

  // Synchronize when active match changes or matchDate updates
  useEffect(() => {
    const formatted = formatDateForInput(match?.match_date || match?.matchDate) || formatDateForInput(match?.createdAt);
    if (formatted) {
      setMatchDateValue(formatted);
    }
  }, [match?.name, match?.match_date, match?.matchDate, match?.createdAt]);

  const handleDateChange = async (newDate) => {
    if (!newDate) return;
    setMatchDateValue(newDate);
    setDateSaving(true);
    setDateSaved(false);
    try {
      const matchIdentifier = activeMatchId || match?.name;
      if (matchIdentifier) {
        await updateScoutingMatchInSupabase(matchIdentifier, { match_date: newDate });
      }
      setDateSaving(false);
      setDateSaved(true);
      setTimeout(() => setDateSaved(false), 2000);
      if (onUpdateMatchDate && matchIdentifier) {
        onUpdateMatchDate(matchIdentifier, newDate, false /* skip duplicate save */);
      }
    } catch(e) {
      console.error('Failed to sync matchDate to Supabase:', e);
      setDateSaving(false);
    }
  };

  // Match Type State for retroactive editing
  const [matchTypeValue, setMatchTypeValue] = useState(() => {
    if (match?.matchType) return match.matchType;
    return 'Official';
  });

  const handleMatchTypeChange = async (newType) => {
    setMatchTypeValue(newType);
    const matchIdentifier = activeMatchId || match?.name;
    if (matchIdentifier) {
      try {
        await updateScoutingMatchInSupabase(matchIdentifier, { match_type: newType });
      } catch(e) {
        console.error('Failed to sync matchType to Supabase:', e);
      }
    }
    if (onUpdateMatchType && matchIdentifier) {
      onUpdateMatchType(matchIdentifier, newType);
    }
  };

  // Play-by-Play Filters
  const [playSearch, setPlaySearch] = useState('');
  const [playQuarterFilter, setPlayQuarterFilter] = useState('ALL');
  const [playCategoryFilter, setPlayCategoryFilter] = useState('ALL');
  const [playPlayerFilter, setPlayPlayerFilter] = useState('ALL');

  // STRICT DATA HIERARCHY: Resolve official scores from match object (scouting_matches / FIP)
  const officialTeamScore = (match?.home_score !== undefined && match?.home_score !== null && Number(match.home_score) > 0)
    ? Number(match.home_score)
    : (match?.displayedTeamPts !== undefined && match?.displayedTeamPts !== null && Number(match.displayedTeamPts) > 0
      ? Number(match.displayedTeamPts)
      : (match?.pts !== undefined && match?.pts !== null && Number(match.pts) > 0
        ? Number(match.pts)
        : (overrideScores?.overrideTeamScore !== null && overrideScores?.overrideTeamScore !== undefined
          ? Number(overrideScores.overrideTeamScore)
          : null)));

  const officialOppScore = (match?.away_score !== undefined && match?.away_score !== null && Number(match.away_score) > 0)
    ? Number(match.away_score)
    : (match?.displayedOppPts !== undefined && match?.displayedOppPts !== null && Number(match.displayedOppPts) > 0
      ? Number(match.displayedOppPts)
      : (match?.oppPts !== undefined && match?.oppPts !== null && Number(match.oppPts) > 0
        ? Number(match.oppPts)
        : (overrideScores?.overrideOppScore !== null && overrideScores?.overrideOppScore !== undefined
          ? Number(overrideScores.overrideOppScore)
          : null)));

  // Compute full analytics dataset strictly from relational events array
  const analytics = useMemo(() => {
    return calculateMatchAnalytics(
      events || [], 
      [], 
      [], 
      { teamScore: officialTeamScore, oppScore: officialOppScore }
    );
  }, [events, officialTeamScore, officialOppScore]);

  // Unified shot zone stats strictly filtered for 2PT/3PT attempts and reacting to player filter
  const filteredShotMapEvents = useMemo(() => {
    let evs = events || [];
    if (shotMapPlayerFilter) {
      evs = evs.filter(e => String(e.Number ?? e.number ?? e.Numero ?? e.numero ?? '') === String(shotMapPlayerFilter.number));
    }
    return evs;
  }, [events, shotMapPlayerFilter]);

  const activeZoneStats = useMemo(() => {
    return computeZoneStats(filteredShotMapEvents);
  }, [filteredShotMapEvents]);

  const {
    teamOverview = {},
    efficiencyPillars = {},
    fourFactors = {},
    quarters = [],
    playerStats = [],
    teamLeaders = {},
    zoneSummary = {},
    totalEvents = 0,
    opponentShooting = {},
    reboundingAnalysis = {},
    situational = {},
    defensiveSchemes = {}
  } = analytics || {};

  // Fallback to fourFactors alias if efficiencyPillars is not defined
  const pillars = efficiencyPillars || fourFactors || {};

  // Derived vs Overridden Official Scores (Strictly Single Source of Truth)
  const pbpTeamScore = teamOverview?.pts ?? 0;
  const pbpOppScore = teamOverview?.opponentScore ?? 0;
  const displayedTeamScore = officialTeamScore !== null ? officialTeamScore : pbpTeamScore;
  const displayedOppScore = officialOppScore !== null ? officialOppScore : pbpOppScore;
  const displayedPointDiff = displayedTeamScore - displayedOppScore;
  const isScoreOverridden = (overrideScores !== null && (overrideScores.overrideTeamScore !== null || overrideScores.overrideOppScore !== null)) ||
                            (match?.home_score > 0 || match?.away_score > 0) ||
                            Boolean(match?.isScoreOverridden);

  // Synchronize teamOverview so all overview tabs, pillars, and child cards reflect official score
  if (teamOverview) {
    teamOverview.pts = displayedTeamScore;
    teamOverview.opponentScore = displayedOppScore;
    teamOverview.pointDifferential = displayedPointDiff;
  }

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
    const rawEvents = events || [];
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
    <div className="fixed inset-0 z-50 bg-[#022D32]/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#F8F9FA] border border-[#DDF3E9] rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[94vh] overflow-hidden text-[#022D32]">
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & MATCH BRANDING BAR                                       */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 border-b border-[#0CA17A]/30 bg-[#022D32] text-white flex flex-wrap items-center justify-between gap-3 flex-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#011C20] border border-[#0CA17A]/40 flex items-center justify-center flex-none shadow-inner">
              <Trophy className="w-5 h-5 text-[#0CA17A]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  {match?.name || 'Match'}
                </h2>
                <div className="bg-[#011C20] border border-[#0CA17A]/40 text-amber-400 font-mono font-black text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                  <span className="text-white/80 font-bold">BBA</span>
                  <span className="text-amber-400 text-sm font-black">{displayedTeamScore}</span>
                  <span className="text-white/40 font-bold">-</span>
                  <span className="text-amber-400 text-sm font-black">{displayedOppScore}</span>
                  <span className="text-[10px] text-[#A7F3D0] uppercase font-bold">OPP</span>
                  {(displayedOppScore > 0 || displayedPointDiff !== 0) && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ml-0.5 ${
                      displayedPointDiff > 0 
                        ? 'bg-[#0CA17A] text-white' 
                        : displayedPointDiff < 0 
                          ? 'bg-rose-600 text-white' 
                          : 'bg-white/20 text-white'
                    }`}>
                      {displayedPointDiff > 0 ? `+${displayedPointDiff}` : displayedPointDiff}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowScoreOverrideModal(true)}
                    className={`ml-1 p-0.5 rounded transition-all ${
                      isScoreOverridden
                        ? 'text-amber-300 bg-amber-500/30'
                        : 'text-white/60 hover:text-amber-300'
                    }`}
                    title={isScoreOverridden ? `Official Table Override (${displayedTeamScore}-${displayedOppScore}). PBP: (${pbpTeamScore}-${pbpOppScore}). Click to edit.` : "Override Official Score (Sync with Table)"}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-white/70 font-semibold flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  {totalEvents} {t('logged_plays')}
                </span>
                <span>•</span>
                <div 
                  onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
                  className="flex items-center gap-1.5 bg-[#011C20] hover:bg-[#022D32] px-2.5 py-1 rounded-lg border border-[#0CA17A]/40 transition-colors cursor-pointer group shadow-xs"
                  title={language === 'it' ? 'Clicca per modificare la data della partita (Supabase)' : 'Click to edit match date (Supabase)'}
                >
                  <Calendar className="w-3.5 h-3.5 text-[#0CA17A] group-hover:text-[#A7F3D0] transition-colors shrink-0" />
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={matchDateValue}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
                  />
                  {dateSaving ? (
                    <Loader2 className="w-3 h-3 text-[#0CA17A] animate-spin shrink-0" />
                  ) : dateSaved ? (
                    <Check className="w-3 h-3 text-[#0CA17A] shrink-0" />
                  ) : (
                    <Pencil className="w-2.5 h-2.5 text-white/50 group-hover:text-white transition-colors shrink-0" />
                  )}
                </div>
                <span>•</span>
                <span className="flex items-center gap-1.5 bg-[#011C20] px-2 py-0.5 rounded border border-[#0CA17A]/30" title="Click to retroactively edit match type">
                  <Tag className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  <select
                    value={matchTypeValue}
                    onChange={(e) => handleMatchTypeChange(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Official" className="bg-white text-[#022D32] font-bold">{language === 'it' ? 'Ufficiale' : 'Official'}</option>
                    <option value="Friendly" className="bg-white text-[#022D32] font-bold">{language === 'it' ? 'Amichevole' : 'Friendly'}</option>
                  </select>
                </span>
                <span>•</span>
                <span className="text-[#A7F3D0] font-black">
                  {(quarters || []).map(q => `${q.quarter}: ${q.pts}`).join(' | ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMetricGuideKey('pillars')}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-black px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm active:scale-95"
              title={t('metric_guide')}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('metric_guide')}</span>
            </button>
            <button
              onClick={() => onDownloadCSV && onDownloadCSV(activeMatchId || match?.name || 'Match', match?.name || 'Match', events || [])}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              title={t('export_csv')}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('export_csv')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-[#011C20] hover:bg-white/10 text-emerald-200 hover:text-white border border-[#0CA17A]/30 rounded-lg transition-all"
              title={t('close_review')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. NAVIGATION TABS (6 PROFESSIONAL SCOUTING TIERS)                       */}
        {/* ========================================================================= */}
        <div className="flex border-b border-[#DDF3E9] bg-white px-2 sm:px-4 pt-2 gap-1 overflow-x-auto no-scrollbar flex-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'overview'
                ? 'bg-[#0CA17A] text-white border-[#022D32] shadow-sm font-black'
                : 'text-[#022D32]/70 border-transparent hover:text-[#022D32] hover:bg-[#DDF3E9]/50 font-bold'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            {t('tab_overview')}
          </button>

          <button
            onClick={() => setActiveTab('situational')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'situational'
                ? 'bg-[#0CA17A] text-white border-[#022D32] shadow-sm font-black'
                : 'text-[#022D32]/70 border-transparent hover:text-[#022D32] hover:bg-[#DDF3E9]/50 font-bold'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {t('tab_situational')}
          </button>

          <button
            onClick={() => setActiveTab('quarters')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'quarters'
                ? 'bg-[#0CA17A] text-white border-[#022D32] shadow-sm font-black'
                : 'text-[#022D32]/70 border-transparent hover:text-[#022D32] hover:bg-[#DDF3E9]/50 font-bold'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {t('tab_quarters')} ({quarters.length})
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'players'
                ? 'bg-[#0CA17A] text-white border-[#022D32] shadow-sm font-black'
                : 'text-[#022D32]/70 border-transparent hover:text-[#022D32] hover:bg-[#DDF3E9]/50 font-bold'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {t('tab_players')} ({playerStats.length})
          </button>

          <button
            onClick={() => setActiveTab('shotmap')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'shotmap'
                ? 'bg-[#0CA17A] text-white border-[#022D32] shadow-sm font-black'
                : 'text-[#022D32]/70 border-transparent hover:text-[#022D32] hover:bg-[#DDF3E9]/50 font-bold'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            {t('tab_shotmap')}
          </button>

          <button
            onClick={() => setActiveTab('boxscore')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'boxscore'
                ? 'bg-[#0CA17A] text-white border-[#022D32] shadow-sm font-black'
                : 'text-[#022D32]/70 border-transparent hover:text-[#022D32] hover:bg-[#DDF3E9]/50 font-bold'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            {t('tab_boxscore')}
          </button>

          <button
            onClick={() => setActiveTab('playbyplay')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-black transition-all border-b-2 flex-none ${
              activeTab === 'playbyplay'
                ? 'bg-[#0CA17A] text-white border-[#022D32] shadow-sm font-black'
                : 'text-[#022D32]/70 border-transparent hover:text-[#022D32] hover:bg-[#DDF3E9]/50 font-bold'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            {t('tab_playbyplay')} ({totalEvents})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. MODAL CONTENT CONTAINER                                                */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-[#F8F9FA] text-[#022D32]">
          {loadingEvents && events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white border border-[#DDF3E9] rounded-2xl shadow-xs">
              <Loader2 className="w-8 h-8 text-[#0CA17A] animate-spin" />
              <p className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                {language === 'it' ? 'Caricamento azioni da Supabase (match_id)...' : 'Loading events from Supabase (match_id)...'}
              </p>
            </div>
          ) : (
            <>
          {/* ===================================================================== */}
          {/* TAB 1: EXECUTIVE OVERVIEW & FOUR FACTORS                              */}
          {/* ===================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Contextual Scouting Intelligence Bar */}
              <div className="bg-[#DDF3E9] border border-[#C6E8DB] rounded-2xl p-3 px-4 flex items-center justify-between gap-3 text-xs flex-wrap shadow-xs text-[#022D32]">
                <div className="flex items-center gap-2 text-[#022D32]">
                  <Info className="w-4 h-4 text-[#0CA17A] flex-none" />
                  <span>
                    <strong className="text-[#022D32] font-black">Match Overview:</strong> Direct, measurable performance metrics across shooting, rebounding, playmaking, and defense. Click on any metric card or <span className="text-[#022D32] font-black">ⓘ</span> to view definitions and benchmarks.
                  </span>
                </div>
                <button
                  onClick={() => setActiveMetricGuideKey('pillars')}
                  className="text-[11px] font-black text-[#022D32] hover:text-[#0CA17A] flex items-center gap-1 underline flex-none"
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
                  className="bg-[#022D32] p-4 rounded-2xl text-white shadow-md hover:ring-2 hover:ring-[#0CA17A] cursor-pointer group transition-all flex flex-col justify-between active:scale-98"
                  title="Click to view Field Goals (FG%) guide and shot breakdown"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#A7F3D0] uppercase tracking-wider">
                      FIELD GOALS (FG%)
                    </span>
                    <Info className="w-3.5 h-3.5 text-[#A7F3D0]/70 group-hover:text-emerald-300 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-white">
                      {teamOverview.pctFg.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-[#A7F3D0]">FG%</span>
                  </div>
                  <span className="text-[10px] text-white/90 font-semibold truncate">
                    {teamOverview.fgm}/{teamOverview.fga} FG (2P: {teamOverview.fg2m}/{teamOverview.fg2a} • 3P: {teamOverview.fg3m}/{teamOverview.fg3a})
                  </span>
                </div>

                {/* 2. Free Throws (FT%) */}
                <div
                  onClick={() => setActiveMetricGuideKey('shotProfile')}
                  className="bg-[#022D32] p-4 rounded-2xl text-white shadow-md hover:ring-2 hover:ring-[#0CA17A] cursor-pointer group transition-all flex flex-col justify-between active:scale-98"
                  title="Click to view Free Throw and Shot Profile guide"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#A7F3D0] uppercase tracking-wider">
                      FREE THROWS (FT%)
                    </span>
                    <Info className="w-3.5 h-3.5 text-[#A7F3D0]/70 group-hover:text-sky-300 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-white">
                      {teamOverview.pctFt.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-[#A7F3D0]">FT%</span>
                  </div>
                  <span className="text-[10px] text-white/90 font-semibold truncate">
                    {teamOverview.ftm}/{teamOverview.fta} FT Made • {teamOverview.fd || 0} Fouls Drawn
                  </span>
                </div>

                {/* 3. Total Rebounds */}
                <div
                  onClick={() => setActiveMetricGuideKey('oreb')}
                  className="bg-[#022D32] p-4 rounded-2xl text-white shadow-md hover:ring-2 hover:ring-[#0CA17A] cursor-pointer group transition-all flex flex-col justify-between active:scale-98"
                  title="Click to view Rebounding & Extra Possessions guide"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#A7F3D0] uppercase tracking-wider">
                      TOTAL REBOUNDS
                    </span>
                    <Info className="w-3.5 h-3.5 text-[#A7F3D0]/70 group-hover:text-amber-300 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-white">
                      {teamOverview.reb}
                    </span>
                    <span className="text-[10px] font-bold text-[#A7F3D0]">REB</span>
                  </div>
                  <span className="text-[10px] text-white/90 font-semibold truncate">
                    {teamOverview.dreb} Defensive • {teamOverview.oreb} Offensive
                  </span>
                </div>

                {/* 4. Team FIBA PIR */}
                <div
                  onClick={() => setActiveMetricGuideKey('pir')}
                  className="bg-[#022D32] p-4 rounded-2xl text-white shadow-md hover:ring-2 hover:ring-[#0CA17A] cursor-pointer group transition-all flex flex-col justify-between active:scale-98"
                  title="Click to view FIBA Performance Index Rating (PIR) guide"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#A7F3D0] uppercase tracking-wider">
                      TEAM FIBA PIR
                    </span>
                    <Info className="w-3.5 h-3.5 text-[#A7F3D0]/70 group-hover:text-purple-300 transition-colors flex-none" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-white">
                      {teamOverview.pir}
                    </span>
                    <span className="text-[10px] font-bold text-[#A7F3D0]">PIR</span>
                  </div>
                  <span className="text-[10px] text-white/90 font-semibold truncate">
                    {teamOverview.pts} PTS • {teamOverview.ast} AST • {teamOverview.stl} STL
                  </span>
                </div>
              </div>

              {/* Game Control & Efficiency Pillars Section */}
              <div className="glass-card p-3 sm:p-4 border-[#DDF3E9]">
                <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2 mb-3">
                  <div
                    onClick={() => setActiveMetricGuideKey('pillars')}
                    className="flex items-center gap-2 cursor-pointer group"
                    title="Click to view Game Control & Efficiency Pillars guide"
                  >
                    <Shield className="w-4 h-4 text-[#0CA17A]" />
                    <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider group-hover:text-[#0CA17A] transition-colors flex items-center gap-1.5">
                      GAME CONTROL & EFFICIENCY PILLARS
                      <Info className="w-3 h-3 text-[#022D32]/50 group-hover:text-[#0CA17A]" />
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveMetricGuideKey('pillars')}
                    className="text-[10px] font-bold text-[#022D32]/70 hover:text-[#0CA17A] transition-colors underline"
                  >
                    Pillars Guide
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Pillar 1: Shooting Efficiency */}
                  <div
                    onClick={() => setActiveMetricGuideKey('efg')}
                    className="bg-white p-3 rounded-xl border border-[#DDF3E9] hover:border-emerald-500/60 cursor-pointer group transition-all flex flex-col justify-between shadow-xs"
                    title="Pillar 1: Shooting Efficiency (eFG%). Click for guide."
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#022D32]/80 mb-1">
                        <span className="group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                          1. SHOOTING EFFICIENCY <Info className="w-2.5 h-2.5 text-[#022D32]/50" />
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          pillars.shooting?.rating === 'Elite' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          pillars.shooting?.rating === 'Solid' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {pillars.shooting?.rating || 'Solid'}
                        </span>
                      </div>
                      <div className="font-mono text-2xl font-black text-[#022D32] my-1">
                        {pillars.shooting?.value || `${teamOverview.efgPct.toFixed(1)}%`}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#022D32]/75 border-t border-[#DDF3E9]/80 pt-1.5 mt-2 font-medium">
                      {pillars.shooting?.subtext || `2P: ${teamOverview.fg2m}/${teamOverview.fg2a} (${teamOverview.pct2p.toFixed(0)}%) | 3P: ${teamOverview.fg3m}/${teamOverview.fg3a} (${teamOverview.pct3p.toFixed(0)}%)`}
                    </div>
                  </div>

                  {/* Pillar 2: Paint vs Perimeter Shot Profile */}
                  <div
                    onClick={() => setActiveMetricGuideKey('shotProfile')}
                    className="bg-white p-3 rounded-xl border border-[#DDF3E9] hover:border-sky-500/60 cursor-pointer group transition-all flex flex-col justify-between shadow-xs"
                    title="Pillar 2: Paint vs Perimeter Shot Profile & FT Conversion. Click for guide."
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#022D32]/80 mb-1">
                        <span className="group-hover:text-sky-700 transition-colors flex items-center gap-1">
                          2. SHOT PROFILE BALANCE <Info className="w-2.5 h-2.5 text-[#022D32]/50" />
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-black bg-[#DDF3E9] text-[#022D32] border border-[#0CA17A]/40">
                          {pillars.shotProfile?.rating || 'Balanced'}
                        </span>
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-[#022D32] my-1">
                        {pillars.shotProfile?.value || `Paint ${teamOverview.pctPaint}% | 3PT ${teamOverview.pctThree}%`}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#022D32]/75 border-t border-[#DDF3E9]/80 pt-1.5 mt-2 font-medium">
                      {pillars.shotProfile?.subtext || `Mid: ${teamOverview.pctMid}% (${teamOverview.teamMidShots || 0} FGA) • FT: ${teamOverview.ftm}/${teamOverview.fta} (${teamOverview.pctFt.toFixed(0)}%)`}
                    </div>
                  </div>

                  {/* Pillar 3: Rebounding & Extra Possessions */}
                  <div
                    onClick={() => setActiveMetricGuideKey('oreb')}
                    className="bg-white p-3 rounded-xl border border-[#DDF3E9] hover:border-amber-500/60 cursor-pointer group transition-all flex flex-col justify-between shadow-xs"
                    title="Pillar 3: Rebounding & Extra Possessions. Click for guide."
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#022D32]/80 mb-1">
                        <span className="group-hover:text-amber-700 transition-colors flex items-center gap-1">
                          3. REBOUNDING & EXTRA POSSESSIONS <Info className="w-2.5 h-2.5 text-[#022D32]/50" />
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          (pillars.rebounding?.rating === 'Strong Glass' || pillars.rebounding?.rating === 'Elite Glass' || teamOverview.oreb >= 10 || teamOverview.orebShare >= 28) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          (pillars.rebounding?.rating === 'Solid' || teamOverview.oreb >= 7) ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-[#F8F9FA] text-[#022D32] border border-[#DDF3E9]'
                        }`}>
                          {pillars.rebounding?.rating || (teamOverview.oreb >= 10 || teamOverview.orebShare >= 28 ? 'Strong Glass' : teamOverview.oreb >= 7 ? 'Solid' : 'Passive')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between my-1">
                        <div className="font-mono text-xl sm:text-2xl font-black text-[#022D32]">
                          {pillars.rebounding?.value || `${teamOverview.oreb} OFF | ${teamOverview.dreb} DEF`}
                        </div>
                        {teamOverview.drbPct != null && (
                          <div className="text-right">
                            <span className="font-mono text-lg font-black text-emerald-700">
                              {teamOverview.drbPct.toFixed(1)}%
                            </span>
                            <span className="text-[9px] font-black text-[#022D32]/70 ml-1">DRB%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#022D32]/75 border-t border-[#DDF3E9]/80 pt-1.5 mt-2 font-medium">
                      {teamOverview.drbPct != null
                        ? `${teamOverview.reb} Total REB • DRB%: ${teamOverview.drbPct.toFixed(1)}% (${teamOverview.dreb} D-REB vs ${teamOverview.oppOffReb || 0} Opp O-REB)`
                        : (pillars.rebounding?.subtext || `${teamOverview.reb} Total REB • ${Math.round(teamOverview.orebShare)}% Offensive Rebound Share`)}
                    </div>
                  </div>

                  {/* Pillar 4: Ball Movement & Security */}
                  <div
                    onClick={() => setActiveMetricGuideKey('ballControl')}
                    className="bg-white p-3 rounded-xl border border-[#DDF3E9] hover:border-cyan-500/60 cursor-pointer group transition-all flex flex-col justify-between shadow-xs"
                    title="Pillar 4: Ball Movement & Security. Click for guide."
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#022D32]/80 mb-1">
                        <span className="group-hover:text-[#0CA17A] transition-colors flex items-center gap-1">
                          4. BALL MOVEMENT & SECURITY <Info className="w-2.5 h-2.5 text-[#022D32]/50" />
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          (pillars.ballControl?.rating === 'Great Flow' || teamOverview.astTovRatio >= 1.3) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          (pillars.ballControl?.rating === 'Balanced' || teamOverview.astTovRatio >= 0.9) ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {pillars.ballControl?.rating || (teamOverview.astTovRatio >= 1.3 ? 'Great Flow' : teamOverview.astTovRatio >= 0.9 ? 'Balanced' : 'High Turnovers')}
                        </span>
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-[#022D32] my-1">
                        {pillars.ballControl?.value || `${teamOverview.ast} AST / ${teamOverview.tov} TOV`}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#022D32]/75 border-t border-[#DDF3E9]/80 pt-1.5 mt-2 font-medium">
                      {pillars.ballControl?.subtext || `Assisted FGs: ${teamOverview.assistedFgmPct || (teamOverview.fgm > 0 ? Math.round((teamOverview.ast / teamOverview.fgm) * 100) : 0)}% (${teamOverview.ast} of ${teamOverview.fgm} FGM) • ${teamOverview.stl} Steals (STL)`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Leaders Showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {teamLeaders.scoring && (
                  <div className="glass-card p-3 border-[#DDF3E9] flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center font-mono font-black text-sm text-amber-800 flex-none">
                      #{teamLeaders.scoring.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">TOP SCORER</div>
                      <div className="text-xs font-black text-[#022D32] truncate">{teamLeaders.scoring.name}</div>
                      <div className="text-[11px] font-mono text-[#022D32] font-semibold">{teamLeaders.scoring.pts} PTS ({teamLeaders.scoring.fgm}/{teamLeaders.scoring.fga} FG)</div>
                    </div>
                  </div>
                )}

                {teamLeaders.efficiency && (
                  <div className="glass-card p-3 border-[#DDF3E9] flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-center font-mono font-black text-sm text-emerald-800 flex-none">
                      #{teamLeaders.efficiency.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">MATCH MVP (EFFICIENCY)</div>
                      <div className="text-xs font-black text-[#022D32] truncate">{teamLeaders.efficiency.name}</div>
                      <div className="text-[11px] font-mono text-[#022D32] font-semibold">{teamLeaders.efficiency.pir} PIR (GameScore: {teamLeaders.efficiency.gameScore})</div>
                    </div>
                  </div>
                )}

                {teamLeaders.rebounding && (
                  <div className="glass-card p-3 border-[#DDF3E9] flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-[#0CA17A]/40 flex items-center justify-center font-mono font-black text-sm text-[#065F46] flex-none">
                      #{teamLeaders.rebounding.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-[#065F46] uppercase tracking-wider">REBOUND DOMINATOR</div>
                      <div className="text-xs font-black text-[#022D32] truncate">{teamLeaders.rebounding.name}</div>
                      <div className="text-[11px] font-mono text-[#022D32] font-semibold">{teamLeaders.rebounding.reb} REB ({teamLeaders.rebounding.oreb} OFF + {teamLeaders.rebounding.dreb} DEF)</div>
                    </div>
                  </div>
                )}

                {teamLeaders.playmaking && (
                  <div className="glass-card p-3 border-[#DDF3E9] flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/40 flex items-center justify-center font-mono font-black text-sm text-[#022D32] flex-none">
                      #{teamLeaders.playmaking.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-[#022D32] uppercase tracking-wider">FLOOR GENERAL</div>
                      <div className="text-xs font-black text-[#022D32] truncate">{teamLeaders.playmaking.name}</div>
                      <div className="text-[11px] font-mono text-[#022D32] font-semibold">{teamLeaders.playmaking.ast} AST ({teamLeaders.playmaking.tov} TOV)</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tactical System Execution (Staggers & Ghosts) */}
              <div className="glass-card p-3 sm:p-4 border-[#DDF3E9]">
                <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0CA17A]" />
                    <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                      TACTICAL SCREENING TECHNIQUES DEPLOYED ({teamOverview.totalTactics})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#022D32]/70">
                    {teamOverview.staggerCount} Stagger • {teamOverview.ghostCount} Ghost
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="bg-white p-3 rounded-xl border border-[#DDF3E9] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-purple-700" />
                      <div>
                        <div className="text-xs font-bold text-[#022D32]">STAGGER SCREENS</div>
                        <div className="text-[10px] text-[#022D32]/65">Double sequential off-ball shooter screens</div>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-black text-purple-800">{teamOverview.staggerCount}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#DDF3E9] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Ghost className="w-5 h-5 text-teal-700" />
                      <div>
                        <div className="text-xs font-bold text-[#022D32]">GHOST SCREENS</div>
                        <div className="text-[10px] text-[#022D32]/65">Fake ball screen popping into open perimeter space</div>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-black text-teal-800">{teamOverview.ghostCount}</span>
                  </div>
                </div>

                {/* Quarter distribution of tactics */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {quarters.map(q => (
                    <div key={q.quarter} className="bg-white/80 p-2 rounded-lg border border-[#DDF3E9] text-center">
                      <div className="text-[10px] font-mono font-bold text-[#022D32]/65">{q.quarter}</div>
                      <div className="text-xs font-black text-[#022D32] mt-0.5">{q.totalTactics} Tactics</div>
                      <div className="text-[9px] text-[#022D32]/60 font-mono mt-0.5">
                        <span className="text-purple-700 font-bold">{q.stagger} S</span> • <span className="text-teal-700 font-bold">{q.ghost} G</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring Flow By Quarter Progress Bar */}
              <div className="glass-card p-3 sm:p-4 border-[#DDF3E9]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                    SCORING CONTRIBUTION BY QUARTER
                  </span>
                  <span className="text-xs font-mono font-black text-[#022D32]">{teamOverview.pts} TOTAL PTS</span>
                </div>
                <div className="h-6 w-full bg-white rounded-lg overflow-hidden flex p-0.5 gap-0.5 border border-[#DDF3E9]">
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
              <div className="bg-white/80 border border-[#DDF3E9] rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-3 text-xs flex-wrap shadow-sm">
                <div className="flex items-center gap-2 text-[#022D32]/80">
                  <Zap className="w-4 h-4 text-[#0CA17A] flex-none" />
                  <span>
                    <strong className="text-[#022D32] font-black">Situational Scouting & Opponent Breakdown:</strong> Evaluation of Fastbreak vs Half-court offense, complete opponent shooting profile, defensive rebounding cleanup (DRB%), and defensive scheme efficiency (Man, Zone, Press).
                  </span>
                </div>
                <button
                  onClick={() => setActiveMetricGuideKey('transitionPpp')}
                  className="text-[11px] font-bold text-[#0CA17A] hover:text-[#022D32] flex items-center gap-1 underline flex-none"
                >
                  <span>Situational Guide</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* 1. TRANSITION VS HALF-COURT OFFENSE COMPARISON */}
              <div className="glass-card p-3 sm:p-4 border-[#DDF3E9] space-y-3">
                <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#0CA17A]" />
                    <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                      PACE & PACE-ADJUSTED EFFICIENCY: TRANSITION VS HALF-COURT
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#022D32]/65">
                    Tagged via TRANSITION toggle
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Card A: Transition / Fastbreak Offense */}
                  <div
                    onClick={() => setActiveMetricGuideKey('transitionPpp')}
                    className="bg-white p-3.5 rounded-xl border border-amber-500/40 hover:border-amber-500 cursor-pointer group transition-all flex flex-col justify-between shadow-sm"
                    title="Click to view Transition PPP guide"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#022D32]/80 mb-1.5">
                        <span className="group-hover:text-[#022D32] transition-colors flex items-center gap-1.5 font-black text-[#022D32]">
                          <Zap className="w-3.5 h-3.5 text-[#0CA17A]" />
                          FASTBREAK / TRANSITION
                          <Info className="w-2.5 h-2.5 text-[#022D32]/50" />
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          (situational?.transition?.ppp >= 1.15) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          (situational?.transition?.ppp >= 0.95) ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-[#F8F9FA] text-[#022D32]/80 border border-[#DDF3E9]'
                        }`}>
                          {situational?.transition?.ppp >= 1.15 ? 'Elite Fastbreak' : situational?.transition?.ppp >= 0.95 ? 'Solid Pace' : (situational?.transition?.poss > 0 ? 'Low Yield' : 'No Data')}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 my-1">
                        <span className="font-mono text-3xl font-black text-[#022D32]">
                          {situational?.transition?.ppp?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-xs font-bold text-[#022D32]/65">PPP</span>
                        <span className="text-xs text-[#022D32]/50">•</span>
                        <span className="text-xs font-black text-emerald-700">
                          {situational?.transition?.pts || 0} PTS
                        </span>
                        <span className="text-[10px] text-[#022D32]/65 font-medium">
                          ({situational?.transition?.poss || 0} Possessions)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2 border-t border-[#DDF3E9] text-center">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-[#DDF3E9]">
                        <div className="text-[9px] font-bold text-[#022D32]/65 uppercase">FG CONVERSION</div>
                        <div className="font-mono text-xs font-black text-[#022D32] mt-0.5">
                          {situational?.transition?.fgm || 0}/{situational?.transition?.fga || 0}
                        </div>
                        <div className="text-[9px] font-black text-[#022D32]">
                          {situational?.transition?.efgPct || 0}% eFG%
                        </div>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-[#DDF3E9]">
                        <div className="text-[9px] font-bold text-[#022D32]/65 uppercase">TURNOVERS</div>
                        <div className="font-mono text-xs font-black text-rose-700 mt-0.5">
                          {situational?.transition?.tov || 0} TOV
                        </div>
                        <div className="text-[9px] text-[#022D32]/60">Fastbreak errors</div>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-[#DDF3E9]">
                        <div className="text-[9px] font-bold text-[#022D32]/65 uppercase">FREE THROWS</div>
                        <div className="font-mono text-xs font-black text-[#022D32] mt-0.5">
                          {situational?.transition?.ftm || 0}/{situational?.transition?.fta || 0} FT
                        </div>
                        <div className="text-[9px] text-[#022D32]/60">Contact drawn</div>
                      </div>
                    </div>
                  </div>

                  {/* Card B: Half-Court Set Offense */}
                  <div
                    className="bg-white p-3.5 rounded-xl border border-[#DDF3E9] flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#022D32]/80 mb-1.5">
                        <span className="flex items-center gap-1.5 font-black text-[#022D32]">
                          <Target className="w-3.5 h-3.5 text-[#0CA17A]" />
                          HALF-COURT SET OFFENSE
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          (situational?.halfCourt?.ppp >= 0.95) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          (situational?.halfCourt?.ppp >= 0.80) ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-[#F8F9FA] text-[#022D32]/80 border border-[#DDF3E9]'
                        }`}>
                          {situational?.halfCourt?.ppp >= 0.95 ? 'Efficient Sets' : situational?.halfCourt?.ppp >= 0.80 ? 'Standard Sets' : (situational?.halfCourt?.poss > 0 ? 'Stagnant' : 'No Data')}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 my-1">
                        <span className="font-mono text-3xl font-black text-[#022D32]">
                          {situational?.halfCourt?.ppp?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-xs font-bold text-[#022D32]/65">PPP</span>
                        <span className="text-xs text-[#022D32]/50">•</span>
                        <span className="text-xs font-black text-emerald-700">
                          {situational?.halfCourt?.pts || 0} PTS
                        </span>
                        <span className="text-[10px] text-[#022D32]/65 font-medium">
                          ({situational?.halfCourt?.poss || 0} Possessions)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2 border-t border-[#DDF3E9] text-center">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-[#DDF3E9]">
                        <div className="text-[9px] font-bold text-[#022D32]/65 uppercase">FG CONVERSION</div>
                        <div className="font-mono text-xs font-black text-[#022D32] mt-0.5">
                          {situational?.halfCourt?.fgm || 0}/{situational?.halfCourt?.fga || 0}
                        </div>
                        <div className="text-[9px] font-black text-[#022D32]">
                          {situational?.halfCourt?.efgPct || 0}% eFG%
                        </div>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-[#DDF3E9]">
                        <div className="text-[9px] font-bold text-[#022D32]/65 uppercase">TURNOVERS</div>
                        <div className="font-mono text-xs font-black text-rose-700 mt-0.5">
                          {situational?.halfCourt?.tov || 0} TOV
                        </div>
                        <div className="text-[9px] text-[#022D32]/60">Set-play giveaways</div>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-[#DDF3E9]">
                        <div className="text-[9px] font-bold text-[#022D32]/65 uppercase">FREE THROWS</div>
                        <div className="font-mono text-xs font-black text-[#022D32] mt-0.5">
                          {situational?.halfCourt?.ftm || 0}/{situational?.halfCourt?.fta || 0} FT
                        </div>
                        <div className="text-[9px] text-[#022D32]/60">Half-court fouls</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. OPPONENT SHOOTING & REBOUND PROFILE */}
              <div className="glass-card p-3 sm:p-4 border-[#DDF3E9] space-y-3">
                <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-700" />
                    <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                      OPPONENT COMPLETE SHOOTING & REBOUND PROFILE
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-rose-700">
                    {teamOverview.opponentScore || 0} Total Opponent Points
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {/* Opponent eFG% */}
                  <div
                    onClick={() => setActiveMetricGuideKey('oppEfg')}
                    className="bg-white p-3 rounded-xl border border-[#DDF3E9] hover:border-rose-500/60 cursor-pointer group transition-all flex flex-col justify-between shadow-sm"
                    title="Click to view Opponent eFG% guide"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#022D32]/65 group-hover:text-rose-700 uppercase tracking-wider">
                        OPP eFG%
                      </span>
                      <Info className="w-3 h-3 text-[#022D32]/50 group-hover:text-rose-600" />
                    </div>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-rose-700">
                        {opponentShooting?.oppEfgPct?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-[10px] text-[#022D32]/60 font-semibold">
                        {opponentShooting?.oppFgm || 0}/{opponentShooting?.oppFga || 0} FG
                      </div>
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-center border ${
                      (opponentShooting?.oppEfgPct < 46 && opponentShooting?.oppFga > 0) ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      (opponentShooting?.oppEfgPct <= 52 && opponentShooting?.oppFga > 0) ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      (opponentShooting?.oppFga > 0) ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-white text-[#022D32]/65 border-[#DDF3E9]'
                    }`}>
                      {opponentShooting?.oppEfgPct < 46 && opponentShooting?.oppFga > 0 ? 'Lockdown' :
                       opponentShooting?.oppEfgPct <= 52 && opponentShooting?.oppFga > 0 ? 'Average' :
                       opponentShooting?.oppFga > 0 ? 'Vulnerable' : 'No FGA'}
                    </div>
                  </div>

                  {/* DRB% (Defensive Rebounding Percentage) */}
                  <div
                    onClick={() => setActiveMetricGuideKey('drb')}
                    className="bg-white p-3 rounded-xl border border-[#DDF3E9] hover:border-emerald-500/60 cursor-pointer group transition-all flex flex-col justify-between shadow-sm"
                    title="Click to view DRB% guide"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#022D32]/65 group-hover:text-emerald-700 uppercase tracking-wider">
                        DRB% (CLEANUP)
                      </span>
                      <Info className="w-3 h-3 text-[#022D32]/50 group-hover:text-emerald-600" />
                    </div>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-emerald-700">
                        {reboundingAnalysis?.drbPct != null ? `${reboundingAnalysis.drbPct.toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-[#022D32]/60 font-semibold truncate">
                        {reboundingAnalysis?.bbaDefReb || teamOverview.dreb} D-REB vs {reboundingAnalysis?.oppOffReb || 0} Opp O-REB
                      </div>
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-center border ${
                      (reboundingAnalysis?.drbPct >= 72) ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      (reboundingAnalysis?.drbPct >= 65) ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      (reboundingAnalysis?.drbPct != null) ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-white text-[#022D32]/65 border-[#DDF3E9]'
                    }`}>
                      {reboundingAnalysis?.drbPct >= 72 ? 'Elite Glass' :
                       reboundingAnalysis?.drbPct >= 65 ? 'Solid Glass' :
                       reboundingAnalysis?.drbPct != null ? 'Vulnerable' : 'Track Misses'}
                    </div>
                  </div>

                  {/* Opponent 2PT Shooting */}
                  <div className="bg-white p-3 rounded-xl border border-[#DDF3E9] flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-[#022D32]/65 uppercase tracking-wider">
                      OPP 2PT FG
                    </span>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-[#022D32]">
                        {opponentShooting?.oppPct2p || 0}%
                      </div>
                      <div className="text-[10px] text-[#022D32]/50">
                        {opponentShooting?.opp2pm || 0}/{opponentShooting?.opp2pa || 0} Made
                      </div>
                    </div>
                    <div className="text-[9px] text-[#022D32]/65 border-t border-[#DDF3E9] pt-1">
                      Interior scoring
                    </div>
                  </div>

                  {/* Opponent 3PT Shooting */}
                  <div className="bg-white p-3 rounded-xl border border-[#DDF3E9] flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-[#022D32]/65 uppercase tracking-wider">
                      OPP 3PT FG
                    </span>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-[#022D32]">
                        {opponentShooting?.oppPct3p || 0}%
                      </div>
                      <div className="text-[10px] text-[#022D32]/50">
                        {opponentShooting?.opp3pm || 0}/{opponentShooting?.opp3pa || 0} Made
                      </div>
                    </div>
                    <div className="text-[9px] text-[#022D32]/65 border-t border-[#DDF3E9] pt-1">
                      Perimeter conversion
                    </div>
                  </div>

                  {/* Opponent Free Throws */}
                  <div className="bg-white p-3 rounded-xl border border-[#DDF3E9] flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-[#022D32]/65 uppercase tracking-wider">
                      OPP FREE THROWS
                    </span>
                    <div className="my-1">
                      <div className="font-mono text-2xl font-black text-[#022D32]">
                        {opponentShooting?.oppPctFt || 0}%
                      </div>
                      <div className="text-[10px] text-[#022D32]/50">
                        {opponentShooting?.oppFtm || 0}/{opponentShooting?.oppFta || 0} FT
                      </div>
                    </div>
                    <div className="text-[9px] text-[#022D32]/65 border-t border-[#DDF3E9] pt-1">
                      Foul conversion
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. OFFENSIVE EFFICIENCY VS OPPONENT DEFENSIVE SCHEMES (MAN vs ZONE vs PRESS) */}
              <div className="glass-card p-3 sm:p-4 border-[#DDF3E9] space-y-3">
                <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#0CA17A]" />
                    <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                      {language === 'it' 
                        ? 'EFFICIENZA OFFENSIVA VS DIFESE AVVERSARIE' 
                        : 'OFFENSIVE EFFICIENCY VS OPPONENT SCHEMES'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#022D32]/65">
                    {language === 'it' 
                      ? "Rendimento dell'attacco BBA contro le difese avversarie" 
                      : "BBA offensive production & execution vs opponent defenses"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { 
                      key: 'MAN', 
                      label: language === 'it' ? 'DIFESA A UOMO (MAN)' : 'MAN-TO-MAN (MAN)', 
                      scheme: defensiveSchemes?.MAN, 
                      color: 'sky' 
                    },
                    { 
                      key: 'ZONE', 
                      label: language === 'it' ? 'DIFESA A ZONA (ZONE)' : 'ZONE DEFENSE (ZONE)', 
                      scheme: defensiveSchemes?.ZONE, 
                      color: 'purple' 
                    },
                    { 
                      key: 'PRESS', 
                      label: language === 'it' ? 'PRESSING A TUTTO CAMPO (PRESS)' : 'FULL-COURT PRESS (PRESS)', 
                      scheme: defensiveSchemes?.PRESS, 
                      color: 'amber' 
                    }
                  ].map(({ key, label, scheme }) => {
                    const count = scheme?.eventsCount || 0;
                    const pts = scheme?.ptsScored !== undefined ? scheme.ptsScored : (scheme?.pts || scheme?.ptsAllowed || 0);
                    const fga = scheme?.fga || 0;
                    const efg = scheme?.efg || 0;
                    const ast = scheme?.ast || 0;
                    const tov = scheme?.tov || 0;
                    const oreb = scheme?.oreb || 0;
                    const astTovRatio = scheme?.astTovRatio !== undefined && scheme?.astTovRatio !== null
                      ? scheme.astTovRatio.toFixed(1)
                      : (tov > 0 ? (ast / tov).toFixed(1) : (ast > 0 ? `${ast}.0` : '—'));

                    return (
                      <div
                        key={key}
                        className="bg-white p-3.5 rounded-xl border border-[#DDF3E9] flex flex-col justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2 mb-2">
                            <span className="text-xs font-black text-[#022D32]">
                              {label}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-[#022D32]/80 border border-[#DDF3E9]">
                              {count} {language === 'it' ? 'Azioni' : 'Events'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 my-2">
                            <div className="bg-[#DDF3E9]/40 p-2 rounded-lg border border-[#DDF3E9]">
                              <div className="text-[9px] font-bold text-[#022D32]/65 uppercase">
                                {language === 'it' ? 'PTS SEGNATI' : 'PTS SCORED'}
                              </div>
                              <div className="font-mono text-xl font-black text-[#0CA17A]">
                                {pts} PTS
                              </div>
                            </div>
                            <div className="bg-[#DDF3E9]/40 p-2 rounded-lg border border-[#DDF3E9]">
                              <div className="text-[9px] font-bold text-[#022D32]/65 uppercase">
                                {language === 'it' ? 'BBA eFG%' : 'OUR eFG%'}
                              </div>
                              <div className="font-mono text-xl font-black text-[#022D32]">
                                {fga > 0 ? `${efg}%` : '—'}
                              </div>
                              <div className="text-[9px] text-[#022D32]/60 font-semibold">{fga} FGA</div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Offensive Execution Metrics (AST, TOV, O-REB, AST/TOV) */}
                        <div className="grid grid-cols-4 gap-1 pt-2 border-t border-[#DDF3E9] text-center">
                          <div className="bg-[#F8F9FA] p-1 rounded border border-[#DDF3E9]/40">
                            <div className="text-[8px] font-black text-[#022D32]/70 uppercase">AST</div>
                            <div className="font-mono text-xs font-black text-emerald-700">{ast}</div>
                          </div>
                          <div className="bg-[#F8F9FA] p-1 rounded border border-[#DDF3E9]/40">
                            <div className="text-[8px] font-black text-[#022D32]/70 uppercase">TOV</div>
                            <div className="font-mono text-xs font-black text-rose-700">{tov}</div>
                          </div>
                          <div className="bg-[#F8F9FA] p-1 rounded border border-[#DDF3E9]/40">
                            <div className="text-[8px] font-black text-[#022D32]/70 uppercase">O-REB</div>
                            <div className="font-mono text-xs font-black text-sky-700">{oreb}</div>
                          </div>
                          <div className="bg-[#F8F9FA] p-1 rounded border border-[#DDF3E9]/40">
                            <div className="text-[8px] font-black text-[#022D32]/70 uppercase">AST/TOV</div>
                            <div className="font-mono text-xs font-black text-[#022D32]">{astTovRatio}</div>
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
              <div className="glass-card p-4 border-[#DDF3E9] overflow-x-auto">
                <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0CA17A]" />
                    <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                      QUARTER-BY-QUARTER PERFORMANCE MATRIX
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#022D32]/65">Progression across 4 Periods + OT</span>
                </div>

                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-[#DDF3E9]/80 text-[#022D32]/70 font-black">
                      <th className="py-2.5 px-2">PERIOD</th>
                      <th className="py-2.5 px-2 text-[#022D32] font-black">PTS</th>
                      <th className="py-2.5 px-2">2PM/A</th>
                      <th className="py-2.5 px-2">2P%</th>
                      <th className="py-2.5 px-2">3PM/A</th>
                      <th className="py-2.5 px-2">3P%</th>
                      <th className="py-2.5 px-2">FTM/A</th>
                      <th className="py-2.5 px-2">FT%</th>
                      <th className="py-2.5 px-2 text-[#022D32]">eFG%</th>
                      <th className="py-2.5 px-2">REB (O/D)</th>
                      <th className="py-2.5 px-2">AST</th>
                      <th className="py-2.5 px-2 text-rose-700 font-bold">TOV</th>
                      <th className="py-2.5 px-2 text-[#022D32]">STL</th>
                      <th className="py-2.5 px-2">PF</th>
                      <th className="py-2.5 px-2 text-purple-800 font-bold">TACTICS</th>
                      <th className="py-2.5 px-2 text-emerald-800 font-black">PIR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.map((q) => (
                      <tr key={q.quarter} className="border-b border-[#DDF3E9]/60 hover:bg-[#DDF3E9]/30 transition-colors">
                        <td className="py-2.5 px-2 font-mono font-black text-[#022D32] text-sm">{q.quarter}</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-black text-base">{q.pts}</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-bold">{q.fg2m}/{q.fg2a}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80 font-mono font-bold">{q.pct2p.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-bold">{q.fg3m}/{q.fg3a}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80 font-mono font-bold">{q.pct3p.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-bold">{q.ftm}/{q.fta}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80 font-mono font-bold">{q.pctFt.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-emerald-700 font-mono font-black">{q.efgPct.toFixed(1)}%</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-bold">{q.reb} ({q.oreb}/{q.dreb})</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-bold">{q.ast}</td>
                        <td className="py-2.5 px-2 text-rose-700 font-black">{q.tov}</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-bold">{q.stl}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80 font-bold">{q.pf}</td>
                        <td className="py-2.5 px-2 text-purple-800 font-mono font-black">
                          {q.totalTactics} <span className="text-[10px] text-[#022D32]/60 font-medium">({q.stagger}S/{q.ghost}G)</span>
                        </td>
                        <td className="py-2.5 px-2 text-emerald-800 font-black text-sm">{q.pir}</td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot>
                    <tr className="bg-white/80 border-t-2 border-[#DDF3E9] text-[#022D32] font-black">
                      <td className="py-3 px-2 text-[#022D32] uppercase">MATCH TOTAL</td>
                      <td className="py-3 px-2 text-[#022D32] text-lg font-black">{teamOverview.pts}</td>
                      <td className="py-3 px-2 font-black">{teamOverview.fg2m}/{teamOverview.fg2a}</td>
                      <td className="py-3 px-2 font-mono font-black">{teamOverview.pct2p.toFixed(0)}%</td>
                      <td className="py-3 px-2 font-black">{teamOverview.fg3m}/{teamOverview.fg3a}</td>
                      <td className="py-3 px-2 font-mono font-black">{teamOverview.pct3p.toFixed(0)}%</td>
                      <td className="py-3 px-2 font-black">{teamOverview.ftm}/{teamOverview.fta}</td>
                      <td className="py-3 px-2 font-mono font-black">{teamOverview.pctFt.toFixed(0)}%</td>
                      <td className="py-3 px-2 text-emerald-700 font-mono font-black">{teamOverview.efgPct.toFixed(1)}%</td>
                      <td className="py-3 px-2 font-black">{teamOverview.reb} ({teamOverview.oreb}/{teamOverview.dreb})</td>
                      <td className="py-3 px-2 font-black">{teamOverview.ast}</td>
                      <td className="py-3 px-2 text-rose-700 font-black">{teamOverview.tov}</td>
                      <td className="py-3 px-2 text-[#022D32] font-black">{teamOverview.stl}</td>
                      <td className="py-3 px-2 font-black">{teamOverview.pf}</td>
                      <td className="py-3 px-2 text-purple-800 font-black">{teamOverview.totalTactics}</td>
                      <td className="py-3 px-2 text-emerald-800 text-base font-black">{teamOverview.pir}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Quarter Visual Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Points & Shooting % Comparison */}
                <div className="glass-card p-4 border-[#DDF3E9]">
                  <h4 className="text-xs font-black text-[#022D32] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0CA17A]" />
                    SCORING OUTPUT & SHOOTING ACCURACY PER QUARTER
                  </h4>
                  <div className="space-y-3">
                    {quarters.map(q => {
                      const maxPts = Math.max(...quarters.map(item => item.pts), 1);
                      const barWidth = Math.max(8, (q.pts / maxPts) * 100);
                      return (
                        <div key={q.quarter} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono font-black text-[#022D32]">{q.quarter}</span>
                            <span className="font-mono text-[#022D32]/80">
                              <strong className="text-[#022D32] text-sm font-black">{q.pts} PTS</strong> ({q.pct2p.toFixed(0)}% 2P | {q.pct3p.toFixed(0)}% 3P)
                            </span>
                          </div>
                          <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-[#DDF3E9]">
                            <div
                              style={{ width: `${barWidth}%` }}
                              className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Turnovers vs Assists Flow */}
                <div className="glass-card p-4 border-[#DDF3E9]">
                  <h4 className="text-xs font-black text-[#022D32] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#0CA17A]" />
                    BALL CONTROL: ASSISTS VS TURNOVERS BY PERIOD
                  </h4>
                  <div className="space-y-3">
                    {quarters.map(q => (
                      <div key={q.quarter} className="bg-white p-2.5 rounded-lg border border-[#DDF3E9] flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-[#022D32]">{q.quarter}</span>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <span>AST:</span>
                            <span className="font-mono text-sm font-black">{q.ast}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-rose-700">
                            <span>TOV:</span>
                            <span className="font-mono text-sm font-black">{q.tov}</span>
                          </div>
                          <div className="text-[11px] font-mono text-[#022D32]/70 font-bold">
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
              <div className="glass-card p-2.5 border-[#DDF3E9] space-y-1.5">
                {/* Carousel Top Helper Bar */}
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#022D32]/65">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span className="uppercase tracking-wider">SELECT PLAYER CARD</span>
                    <span className="hidden sm:inline text-[#022D32]/50 font-normal">
                      (Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#DDF3E9] text-sky-300 font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#DDF3E9] text-sky-300 font-mono text-[10px]">→</kbd> or click arrows)
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
                    className="w-9 h-11 rounded-xl bg-white hover:bg-sky-600 hover:text-white text-[#022D32]/65 border border-[#DDF3E9] hover:border-sky-500 flex items-center justify-center flex-none transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-md group"
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
                              ? 'bg-[#022D32] border-[#0CA17A] text-white shadow-lg ring-2 ring-[#0CA17A]/50 scale-[1.03]'
                              : 'bg-white border-[#DDF3E9] text-[#022D32] hover:bg-[#DDF3E9]/30'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs border flex-none ${
                            isSelected ? 'bg-[#0CA17A] text-white border-white' : 'bg-[#DDF3E9] text-[#022D32] border-[#0CA17A]/40'
                          }`}>
                            #{p.number}
                          </span>
                          <div className="text-left min-w-0">
                            <div className={`text-xs font-bold truncate max-w-[110px] leading-tight ${isSelected ? 'text-white font-black' : 'text-[#022D32]'}`}>
                              {p.name.split(' ')[0]}
                            </div>
                            <div className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#A7F3D0]' : 'text-[#022D32]/80'}`}>
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
                    className="w-9 h-11 rounded-xl bg-white hover:bg-sky-600 hover:text-white text-[#022D32]/65 border border-[#DDF3E9] hover:border-sky-500 flex items-center justify-center flex-none transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-md group"
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
                  <div className="p-4 rounded-2xl border border-[#0CA17A]/40 bg-[#022D32] text-white flex flex-wrap items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-[#011C20] border-2 border-[#0CA17A] flex items-center justify-center font-mono font-black text-2xl text-white shadow-lg">
                        #{activePlayer.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                            {activePlayer.name}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#011C20] text-[#A7F3D0] border border-[#0CA17A]/40 uppercase">
                            {activePlayer.pos || 'Active Roster'}
                          </span>
                        </div>
                        <p className="text-xs text-[#A7F3D0] font-semibold mt-0.5">
                          {activePlayer.eventsCount} logged match interactions • GameScore (GS):{' '}
                          <button
                            onClick={() => setActiveMetricGuideKey('gamescore')}
                            className="text-white font-bold hover:text-emerald-300 underline inline-flex items-center gap-0.5 transition-colors"
                            title="Click to view GameScore guide"
                          >
                            <span>{activePlayer.gameScore}</span>
                            <Info className="w-2.5 h-2.5 text-[#0CA17A]" />
                          </button>
                        </p>
                      </div>
                    </div>

                    {/* Quick Player Switcher Pill in Hero Header */}
                    <div className="flex items-center gap-1.5 bg-[#011C20] p-1.5 rounded-xl border border-[#0CA17A]/40 shadow-inner">
                      <button
                        onClick={handlePrevPlayer}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1 text-xs font-bold border border-white/20 active:scale-95"
                        title="Previous Player (Left Arrow [←])"
                      >
                        <ChevronLeft className="w-4 h-4 text-[#A7F3D0]" />
                        <span className="hidden sm:inline">PREV</span>
                      </button>
                      <span className="text-xs font-mono font-bold text-white px-1.5">
                        {activePlayerIndex + 1} / {playerStats.length}
                      </span>
                      <button
                        onClick={handleNextPlayer}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1 text-xs font-bold border border-white/20 active:scale-95"
                        title="Next Player (Right Arrow [→])"
                      >
                        <span className="hidden sm:inline">NEXT</span>
                        <ChevronRight className="w-4 h-4 text-[#A7F3D0]" />
                      </button>
                    </div>

                    {/* Big Key Metric Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DDF3E9] text-center shadow-xs">
                        <span className="text-[9px] font-black text-[#022D32]/70 uppercase tracking-widest block">POINTS</span>
                        <span className="font-mono text-2xl font-black text-[#022D32] leading-none">{activePlayer.pts}</span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DDF3E9] text-center shadow-xs">
                        <span className="text-[9px] font-black text-[#022D32]/70 uppercase tracking-widest block">REBOUNDS</span>
                        <span className="font-mono text-2xl font-black text-[#022D32] leading-none">{activePlayer.reb}</span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DDF3E9] text-center shadow-xs">
                        <span className="text-[9px] font-black text-[#022D32]/70 uppercase tracking-widest block">ASSISTS</span>
                        <span className="font-mono text-2xl font-black text-[#022D32] leading-none">{activePlayer.ast}</span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DDF3E9] text-center shadow-xs">
                        <span className="text-[9px] font-black text-[#022D32]/70 uppercase tracking-widest block">PLUS / MINUS</span>
                        <span className={`font-mono text-2xl font-black leading-none ${
                          (activePlayer.plusMinus || 0) > 0 ? 'text-emerald-700' :
                          (activePlayer.plusMinus || 0) < 0 ? 'text-rose-700' :
                          'text-[#022D32]'
                        }`}>
                          {(activePlayer.plusMinus || 0) > 0 ? `+${activePlayer.plusMinus}` : (activePlayer.plusMinus || 0)}
                        </span>
                      </div>
                      <div 
                        onClick={() => setActiveMetricGuideKey('pir')}
                        className="bg-white px-3.5 py-1.5 rounded-xl border-2 border-emerald-500 hover:border-emerald-600 text-center shadow-md cursor-pointer group transition-all"
                        title="Click to view FIBA PIR guide"
                      >
                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest flex items-center justify-center gap-1">
                          FIBA PIR <Info className="w-2.5 h-2.5 text-[#022D32]/50 group-hover:text-emerald-700" />
                        </span>
                        <span className="font-mono text-2xl font-black text-emerald-800 leading-none">{activePlayer.pir}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Section: Left Shooting & Shot Chart, Right Quarter progression & Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Column (col-span-6): Interactive Player Shot Heatmap */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="glass-card p-3 border-[#DDF3E9]">
                        <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                              PLAYER SHOT MAP (#{activePlayer.number} {activePlayer.name})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-[#022D32]/65">
                            {activePlayer.fgm}/{activePlayer.fga} FG ({activePlayer.pctFg.toFixed(0)}%)
                          </span>
                        </div>

                        <CourtPitchMap
                          selectedPlayer={{ number: activePlayer.number, name: activePlayer.name }}
                          selectedZoneKey={shotMapSelectedZone}
                          onSelectZone={(k) => setShotMapSelectedZone(k)}
                          events={events}
                        />

                        {/* Shot Distribution Bars */}
                        <div className="mt-3 pt-2 border-t border-[#DDF3E9] space-y-1.5">
                          <div className="text-[10px] font-bold text-[#022D32]/65 uppercase tracking-wider">
                            SHOT SELECTION BREAKDOWN:
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-white p-2 rounded-lg border border-[#DDF3E9]">
                              <span className="text-[9px] text-[#022D32]/65 font-bold block">PAINT 2PT</span>
                              <span className="font-mono text-sm font-black text-[#022D32]">{activePlayer.shotDist.paintMade}/{activePlayer.shotDist.paintAttempts}</span>
                              <span className="text-[10px] text-emerald-700 block font-mono font-bold">({activePlayer.shotDist.pctPaint}% volume)</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-[#DDF3E9]">
                              <span className="text-[9px] text-[#022D32]/70 font-bold block">MID-RANGE 2PT</span>
                              <span className="font-mono text-sm font-black text-[#022D32]">{activePlayer.shotDist.midMade}/{activePlayer.shotDist.midAttempts}</span>
                              <span className="text-[10px] text-amber-800 block font-mono font-bold">({activePlayer.shotDist.pctMid}% volume)</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-[#DDF3E9]">
                              <span className="text-[9px] text-[#022D32]/70 font-bold block">3-POINTERS</span>
                              <span className="font-mono text-sm font-black text-[#022D32]">{activePlayer.shotDist.threeMade}/{activePlayer.shotDist.threeAttempts}</span>
                              <span className="text-[10px] text-[#022D32] block font-mono font-bold">({activePlayer.shotDist.pctThree}% volume)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (col-span-6): Complete Stat Line & Quarter Progression */}
                    <div className="lg:col-span-6 space-y-3">
                      {/* Advanced Shooting Profile Box */}
                      <div className="glass-card p-3.5 border-[#DDF3E9]">
                        <h4 className="text-xs font-black text-[#022D32] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-[#0CA17A]" />
                          ADVANCED EFFICIENCY & SHOOTING METRICS
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="bg-white p-2 rounded-lg border border-[#DDF3E9]">
                            <span className="text-[9px] text-[#022D32]/65 font-bold block uppercase">2PT FIELD GOALS</span>
                            <span className="font-mono text-sm font-black text-[#022D32]">{activePlayer.fg2m}/{activePlayer.fg2a}</span>
                            <span className="text-[10px] text-[#022D32]/65 font-mono block">{activePlayer.pct2p.toFixed(0)}%</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-[#DDF3E9]">
                            <span className="text-[9px] text-[#022D32]/65 font-bold block uppercase">3PT FIELD GOALS</span>
                            <span className="font-mono text-sm font-black text-[#022D32]">{activePlayer.fg3m}/{activePlayer.fg3a}</span>
                            <span className="text-[10px] text-[#022D32]/65 font-mono block">{activePlayer.pct3p.toFixed(0)}%</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-[#DDF3E9]">
                            <span className="text-[9px] text-[#022D32]/65 font-bold block uppercase">FREE THROWS</span>
                            <span className="font-mono text-sm font-black text-[#022D32]">{activePlayer.ftm}/{activePlayer.fta}</span>
                            <span className="text-[10px] text-[#022D32]/65 font-mono block">{activePlayer.pctFt.toFixed(0)}%</span>
                          </div>
                          <div 
                            onClick={() => setActiveMetricGuideKey('ts')}
                            className="bg-white p-2 rounded-lg border border-[#DDF3E9] hover:border-emerald-500/60 cursor-pointer group transition-all"
                            title="Click to view TS% and eFG% guide"
                          >
                            <span className="text-[9px] text-[#022D32]/70 group-hover:text-emerald-700 font-black flex items-center justify-center gap-1 uppercase transition-colors">
                              TRUE SHOOTING <Info className="w-2.5 h-2.5 text-[#022D32]/50" />
                            </span>
                            <span className="font-mono text-sm font-black text-emerald-700">{activePlayer.tsPct.toFixed(1)}%</span>
                            <span className="text-[10px] text-[#022D32]/70 font-mono font-bold block">eFG: {activePlayer.efgPct.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* Secondary stats row */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2 text-center">
                          <div className="bg-white/70 p-1.5 rounded border border-[#DDF3E9]">
                            <span className="text-[8px] text-[#022D32]/65 font-bold block">OFF REB</span>
                            <span className="font-mono text-xs font-black text-[#022D32]">{activePlayer.oreb}</span>
                          </div>
                          <div className="bg-white/70 p-1.5 rounded border border-[#DDF3E9]">
                            <span className="text-[8px] text-[#022D32]/65 font-bold block">DEF REB</span>
                            <span className="font-mono text-xs font-black text-[#022D32]">{activePlayer.dreb}</span>
                          </div>
                          <div className="bg-white/70 p-1.5 rounded border border-[#DDF3E9]">
                            <span className="text-[8px] text-[#022D32]/65 font-bold block">STEALS</span>
                            <span className="font-mono text-xs font-black text-[#022D32]">{activePlayer.stl}</span>
                          </div>
                          <div className="bg-white/70 p-1.5 rounded border border-[#DDF3E9]">
                            <span className="text-[8px] text-[#022D32]/65 font-bold block">TURNOVERS</span>
                            <span className="font-mono text-xs font-black text-rose-700">{activePlayer.tov}</span>
                          </div>
                          <div className="bg-white/70 p-1.5 rounded border border-[#DDF3E9]">
                            <span className="text-[8px] text-[#022D32]/65 font-bold block">BLOCKS</span>
                            <span className="font-mono text-xs font-black text-purple-800">{activePlayer.blk}</span>
                          </div>
                          <div className="bg-white/70 p-1.5 rounded border border-[#DDF3E9]">
                            <span className="text-[8px] text-[#022D32]/65 font-bold block">FOULS (PF/FD)</span>
                            <span className="font-mono text-xs font-black text-[#022D32]">{activePlayer.pf}/{activePlayer.fd}</span>
                          </div>
                        </div>
                      </div>

                      {/* Player Progression by Quarter Table */}
                      <div className="glass-card p-3 border-[#DDF3E9] overflow-x-auto">
                        <h4 className="text-xs font-black text-[#022D32] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#0CA17A]" />
                          QUARTER-BY-QUARTER STAT PRODUCTION
                        </h4>
                        <table className="w-full text-left text-xs font-semibold">
                          <thead>
                            <tr className="border-b border-[#DDF3E9] text-[#022D32]/80 text-[10px] font-black uppercase">
                              <th className="py-1 px-1.5">PERIOD</th>
                              <th className="py-1 px-1.5 text-[#022D32]">PTS</th>
                              <th className="py-1 px-1.5">FGM/A</th>
                              <th className="py-1 px-1.5">FG%</th>
                              <th className="py-1 px-1.5">REB</th>
                              <th className="py-1 px-1.5">AST</th>
                              <th className="py-1 px-1.5 text-rose-700">TOV</th>
                              <th className="py-1 px-1.5">PF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quarters.map(q => {
                              const qData = activePlayer.quarters[q.quarter] || { pts: 0, fgm: 0, fga: 0, pctFg: 0, reb: 0, ast: 0, tov: 0, pf: 0 };
                              return (
                                <tr key={q.quarter} className="border-b border-[#DDF3E9] hover:bg-[#DDF3E9]/20">
                                  <td className="py-1.5 px-1.5 font-mono text-[#022D32] font-black">{q.quarter}</td>
                                  <td className="py-1.5 px-1.5 font-mono font-black text-[#022D32]">{qData.pts}</td>
                                  <td className="py-1.5 px-1.5 font-mono text-[#022D32] font-semibold">{qData.fgm}/{qData.fga}</td>
                                  <td className="py-1.5 px-1.5 font-mono text-[#022D32] font-semibold">{qData.pctFg.toFixed(0)}%</td>
                                  <td className="py-1.5 px-1.5 text-[#022D32] font-semibold">{qData.reb}</td>
                                  <td className="py-1.5 px-1.5 text-[#022D32] font-semibold">{qData.ast}</td>
                                  <td className="py-1.5 px-1.5 text-rose-700 font-bold">{qData.tov}</td>
                                  <td className="py-1.5 px-1.5 text-[#022D32]">{qData.pf}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Player Chronological Match Action Log */}
                  <div className="glass-card p-3.5 border-[#DDF3E9]">
                    <h4 className="text-xs font-black text-[#022D32] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <List className="w-3.5 h-3.5 text-[#0CA17A]" />
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
                          <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#DDF3E9] text-xs shadow-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#022D32] font-black">{q}</span>
                              <span className="text-[10px] text-[#022D32]/70 font-mono font-semibold">{ts}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                isMade ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                isMiss ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                'bg-[#F8F9FA] text-[#022D32] border border-[#DDF3E9]'
                              }`}>
                                {act}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#022D32] font-semibold">{zn}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-8 text-center text-[#022D32]/65 font-bold">
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
              <div className="glass-card p-3 border-[#DDF3E9] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-black text-[#022D32] uppercase tracking-wider">
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
                    className="bg-white border border-[#DDF3E9] text-[#022D32] text-xs rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:border-sky-400"
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
              <div className="glass-card p-4 border-[#DDF3E9]">
                <CourtPitchMap
                  selectedPlayer={shotMapPlayerFilter}
                  selectedZoneKey={shotMapSelectedZone}
                  onSelectZone={(k) => setShotMapSelectedZone(k)}
                  events={filteredShotMapEvents}
                  zoneStats={activeZoneStats}
                />
              </div>

              {/* Shot Zone Efficiency Table */}
              <div className="glass-card p-4 border-[#DDF3E9] overflow-x-auto">
                <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                      9-ZONE SHOT EFFICIENCY & VOLUME RANKING
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveMetricGuideKey('pps')}
                    className="text-[10px] font-bold text-[#022D32]/65 hover:text-amber-400 underline flex items-center gap-1 transition-colors"
                    title="Click to view Points Per Shot (PPS) guide"
                  >
                    <span>PPS = Points Per Shot (Expected Value)</span>
                    <Info className="w-2.5 h-2.5 text-amber-400" />
                  </button>
                </div>

                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-[#DDF3E9]/80 text-[#022D32]/65">
                      <th className="py-2 px-2">ZONE</th>
                      <th className="py-2 px-2">TYPE</th>
                      <th className="py-2 px-2 text-[#022D32]">FGM / FGA</th>
                      <th className="py-2 px-2">ACCURACY (FG%)</th>
                      <th className="py-2 px-2">SHOT SHARE</th>
                      <th 
                        onClick={() => setActiveMetricGuideKey('pps')}
                        className="py-2 px-2 text-[#022D32] font-black cursor-pointer hover:text-[#0CA17A] transition-colors"
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
                      <tr key={z.key} className="border-b border-[#DDF3E9] hover:bg-[#DDF3E9]/20">
                        <td className="py-2.5 px-2 font-bold text-[#022D32] flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.efficiencyColor }}></span>
                          {z.name}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[#022D32]/65">{z.type}</td>
                        <td className="py-2.5 px-2 font-mono text-[#022D32] font-black">{z.made} / {z.attempts}</td>
                        <td className="py-2.5 px-2 font-mono font-bold" style={{ color: z.efficiencyColor }}>
                          {z.pct.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[#022D32]/80">
                          {z.shotShare.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 font-mono font-black text-[#022D32]">
                          {z.pps.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            z.pct >= 50 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            z.pct >= 33 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            z.attempts > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-[#F8F9FA] text-[#022D32]/60 border border-[#DDF3E9]'
                          }`}>
                            {z.ratingLabel || (z.pct >= 50 ? 'HOT' : z.pct >= 33 ? 'SOLID' : z.attempts > 0 ? 'COLD' : 'NO ATTEMPTS')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {activeZoneStats.totalShotsCount > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#DDF3E9] bg-white/80 font-black text-[#022D32]">
                        <td className="py-2.5 px-2">TOTAL (ALL 9 ZONES)</td>
                        <td className="py-2.5 px-2 text-[#022D32]/65">FG</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-mono text-sm font-black">
                          {activeZoneStats.totalMadeCount} / {activeZoneStats.totalShotsCount}
                        </td>
                        <td className="py-2.5 px-2 text-[#022D32] font-mono text-sm font-black">
                          {((activeZoneStats.totalMadeCount / activeZoneStats.totalShotsCount) * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 font-mono">100.0%</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-mono font-black">
                          {activeZoneStats.zones.reduce((acc, z) => acc + (z.attempts * z.pps), 0) > 0
                            ? (activeZoneStats.zones.reduce((acc, z) => acc + (z.attempts * z.pps), 0) / activeZoneStats.totalShotsCount).toFixed(2)
                            : '0.00'}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#DDF3E9] text-[#022D32] border border-[#0CA17A]/40">
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
              <div className="glass-card p-4 border-[#DDF3E9] overflow-x-auto">
                <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#0CA17A]" />
                    <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                      OFFICIAL FIBA BOX SCORE — SORTABLE METRICS
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveMetricGuideKey('pir')}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 transition-colors"
                      title="FIBA PIR Calculation Guide"
                    >
                      <span>What is PIR?</span>
                      <Info className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => setActiveMetricGuideKey('gamescore')}
                      className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-1 transition-colors"
                      title="GameScore Guide"
                    >
                      <span>What is GS?</span>
                      <Info className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10px] font-bold text-[#022D32]/60 hidden sm:inline">• Click column header to sort</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-[#DDF3E9]/80 text-[#022D32]/70 font-black select-none">
                      <th onClick={() => handleSortBoxScore('number')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">N°</th>
                      <th onClick={() => handleSortBoxScore('name')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">PLAYER</th>
                      <th onClick={() => handleSortBoxScore('pts')} className="py-2.5 px-2 text-[#022D32] font-black cursor-pointer hover:text-[#0CA17A]">PTS</th>
                      <th onClick={() => handleSortBoxScore('fg2m')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">2PM/A</th>
                      <th onClick={() => handleSortBoxScore('pct2p')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">2P%</th>
                      <th onClick={() => handleSortBoxScore('fg3m')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">3PM/A</th>
                      <th onClick={() => handleSortBoxScore('pct3p')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">3P%</th>
                      <th onClick={() => handleSortBoxScore('ftm')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">FTM/A</th>
                      <th onClick={() => handleSortBoxScore('pctFt')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">FT%</th>
                      <th onClick={() => handleSortBoxScore('reb')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">REB</th>
                      <th onClick={() => handleSortBoxScore('ast')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">AST</th>
                      <th onClick={() => handleSortBoxScore('stl')} className="py-2.5 px-2 text-[#022D32] font-black cursor-pointer hover:text-[#0CA17A]">STL</th>
                      <th onClick={() => handleSortBoxScore('tov')} className="py-2.5 px-2 text-rose-700 font-black cursor-pointer hover:text-rose-800">TOV</th>
                      <th onClick={() => handleSortBoxScore('pf')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">PF</th>
                      <th onClick={() => handleSortBoxScore('fd')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">FD</th>
                      <th onClick={() => handleSortBoxScore('blk')} className="py-2.5 px-2 cursor-pointer hover:text-[#0CA17A]">BLK</th>
                      <th onClick={() => handleSortBoxScore('pir')} className="py-2.5 px-2 text-emerald-800 font-black cursor-pointer hover:text-emerald-700" title="Sort by FIBA PIR">
                        <span className="inline-flex items-center gap-0.5">
                          PIR <Info className="w-2.5 h-2.5 text-emerald-600 hover:text-emerald-700" onClick={(e) => { e.stopPropagation(); setActiveMetricGuideKey('pir'); }} />
                        </span>
                      </th>
                      <th onClick={() => handleSortBoxScore('plusMinus')} className="py-2.5 px-2 text-[#022D32] font-black cursor-pointer hover:text-[#0CA17A]" title="Sort by Plus/Minus (+/-)">
                        +/-
                      </th>
                      <th onClick={() => handleSortBoxScore('gameScore')} className="py-2.5 px-2 text-purple-800 font-black cursor-pointer hover:text-purple-700" title="Sort by GameScore">
                        <span className="inline-flex items-center gap-0.5">
                          GS <Info className="w-2.5 h-2.5 text-purple-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setActiveMetricGuideKey('gamescore'); }} />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map(r => (
                      <tr key={r.number} className="border-b border-[#DDF3E9]/50 hover:bg-[#DDF3E9]/30 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-[#022D32] font-mono">#{r.number}</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-bold truncate max-w-[150px]">{r.name}</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-black text-sm">{r.pts}</td>
                        <td className="py-2.5 px-2 text-[#022D32]">{r.fg2m}/{r.fg2a}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80 font-mono font-bold">{r.pct2p.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-[#022D32]">{r.fg3m}/{r.fg3a}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80 font-mono font-bold">{r.pct3p.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-[#022D32]">{r.ftm}/{r.fta}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80 font-mono font-bold">{r.pctFt.toFixed(0)}%</td>
                        <td className="py-2.5 px-2 text-[#022D32]">{r.reb}</td>
                        <td className="py-2.5 px-2 text-[#022D32]">{r.ast}</td>
                        <td className="py-2.5 px-2 text-[#022D32] font-bold">{r.stl}</td>
                        <td className="py-2.5 px-2 text-rose-700 font-black">{r.tov}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80">{r.pf}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80">{r.fd}</td>
                        <td className="py-2.5 px-2 text-[#022D32]/80">{r.blk}</td>
                        <td className="py-2.5 px-2 text-emerald-800 font-black">{r.pir}</td>
                        <td className={`py-2.5 px-2 font-mono font-black ${
                          (r.plusMinus || 0) > 0 ? 'text-emerald-700' :
                          (r.plusMinus || 0) < 0 ? 'text-rose-700' :
                          'text-[#022D32]'
                        }`}>
                          {(r.plusMinus || 0) > 0 ? `+${r.plusMinus}` : (r.plusMinus || 0)}
                        </td>
                        <td className="py-2.5 px-2 text-purple-800 font-mono font-bold">{r.gameScore}</td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot>
                    <tr className="bg-white border-t-2 border-[#DDF3E9] text-[#022D32] font-black">
                      <td colSpan={2} className="py-3 px-2 text-[#022D32] uppercase tracking-wider font-black">TEAM TOTALS</td>
                      <td className="py-3 px-2 text-[#022D32] text-base font-black">{teamOverview.pts}</td>
                      <td className="py-3 px-2">{teamOverview.fg2m}/{teamOverview.fg2a}</td>
                      <td className="py-3 px-2 font-mono font-black">{teamOverview.pct2p.toFixed(0)}%</td>
                      <td className="py-3 px-2">{teamOverview.fg3m}/{teamOverview.fg3a}</td>
                      <td className="py-3 px-2 font-mono font-black">{teamOverview.pct3p.toFixed(0)}%</td>
                      <td className="py-3 px-2">{teamOverview.ftm}/{teamOverview.fta}</td>
                      <td className="py-3 px-2 font-mono font-black">{teamOverview.pctFt.toFixed(0)}%</td>
                      <td className="py-3 px-2">{teamOverview.reb}</td>
                      <td className="py-3 px-2">{teamOverview.ast}</td>
                      <td className="py-3 px-2 text-[#022D32] font-black">{teamOverview.stl}</td>
                      <td className="py-3 px-2 text-rose-700 font-black">{teamOverview.tov}</td>
                      <td className="py-3 px-2">{teamOverview.pf}</td>
                      <td className="py-3 px-2">{teamOverview.fd}</td>
                      <td className="py-3 px-2">{teamOverview.blk}</td>
                      <td className="py-3 px-2 text-emerald-800 text-base font-black">{teamOverview.pir}</td>
                      <td className={`py-3 px-2 font-mono font-black ${
                        (teamOverview.pointDifferential || 0) > 0 ? 'text-emerald-700' :
                        (teamOverview.pointDifferential || 0) < 0 ? 'text-rose-700' :
                        'text-[#022D32]'
                      }`}>
                        {(teamOverview.pointDifferential || 0) > 0 ? `+${teamOverview.pointDifferential}` : (teamOverview.pointDifferential || 0)}
                      </td>
                      <td className="py-3 px-2 text-[#022D32] font-black">-</td>
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
              <div className="glass-card p-3 border-[#DDF3E9] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-[#022D32]/65 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search player, action, zone..."
                      value={playSearch}
                      onChange={(e) => setPlaySearch(e.target.value)}
                      className="w-full bg-white border border-[#DDF3E9] text-[#022D32] text-xs pl-8 pr-3 py-1.5 rounded-lg font-medium focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* Player Filter */}
                  <select
                    value={playPlayerFilter}
                    onChange={(e) => setPlayPlayerFilter(e.target.value)}
                    className="bg-white border border-[#DDF3E9] text-[#022D32] text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:border-sky-400"
                  >
                    <option value="ALL">ALL PLAYERS</option>
                    {playerStats.map(p => (
                      <option key={p.number} value={p.number}>#{p.number} {p.name}</option>
                    ))}
                    <option value="-">TEAM TACTICS</option>
                  </select>
                </div>

                {/* Quarter and Category Quick Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#DDF3E9]">
                  {/* Quarter pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold text-[#022D32]/50 uppercase mr-1">PERIOD:</span>
                    {['ALL', 'Q1', 'Q2', 'Q3', 'Q4', ...quarters.filter(q => q.quarter.startsWith('OT')).map(q => q.quarter)].map(q => (
                      <button
                        key={q}
                        onClick={() => setPlayQuarterFilter(q)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          playQuarterFilter === q
                            ? 'bg-[#022D32] text-white font-black'
                            : 'bg-white text-[#022D32]/80 hover:bg-[#DDF3E9]/40 border border-[#DDF3E9]'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Category pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold text-[#022D32]/50 uppercase mr-1">TYPE:</span>
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
                            ? 'bg-[#022D32] text-white font-black'
                            : 'bg-white text-[#022D32]/80 hover:bg-[#DDF3E9]/40 border border-[#DDF3E9]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Event Log Table */}
              <div className="glass-card p-3 border-[#DDF3E9] overflow-x-auto">
                <div className="text-[10px] text-[#022D32]/50 font-bold mb-2">
                  SHOWING {filteredEvents.length} OF {totalEvents} MATCH ACTIONS
                </div>

                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-[#DDF3E9]/80 text-[#022D32]/70 font-black">
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
                        <tr key={i} className="border-b border-[#DDF3E9] hover:bg-[#DDF3E9]/20">
                          <td className="py-2 px-2 font-mono text-[#022D32] font-black">{q}</td>
                          <td className="py-2 px-2 text-[#022D32]/65 text-[11px] font-mono">{ts}</td>
                          <td className="py-2 px-2 font-bold text-[#022D32]">
                            {num === '-' || pName === 'TEAM' ? (
                              <span className="text-[#022D32] font-black flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-[#0CA17A]" /> TEAM
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="font-mono text-[#022D32] font-black">#{num}</span> {pName}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isSuccess ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              isMiss ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              act === 'Stagger' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                              act === 'Ghost' ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                              'bg-[#F8F9FA] text-[#022D32] border border-[#DDF3E9]'
                            }`}>
                              {act}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-[#022D32]/65 text-[11px]">{cat}</td>
                          <td className="py-2 px-2 text-[#022D32]/80">{zn}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

            </>
          )}
        </div>
      </div>

      {/* Score Override Modal */}
      <ScoreOverrideModal
        isOpen={showScoreOverrideModal}
        onClose={() => setShowScoreOverrideModal(false)}
        matchName={match?.name}
        pbpTeamScore={pbpTeamScore}
        pbpOppScore={pbpOppScore}
        currentOverrideTeamScore={overrideScores?.overrideTeamScore ?? null}
        currentOverrideOppScore={overrideScores?.overrideOppScore ?? null}
        onSaveOverride={(t, o) => {
          const matchIdentifier = activeMatchId || match?.name;
          saveScoreOverride(match?.name, t, o);
          setOverrideScores({ overrideTeamScore: t, overrideOppScore: o });
          if (onUpdateScoreOverride) onUpdateScoreOverride(matchIdentifier, t, o);
        }}
        onClearOverride={() => {
          const matchIdentifier = activeMatchId || match?.name;
          clearScoreOverride(match?.name);
          setOverrideScores(null);
          if (onUpdateScoreOverride) onUpdateScoreOverride(matchIdentifier, null, null);
        }}
      />

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
