import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Navbar from './components/Navbar';
import LiveGame from './pages/LiveGame';
import Archive from './pages/Archive';
import SeasonTrends from './pages/SeasonTrends';
import OpponentScout from './pages/OpponentScout';
import LeagueHub from './pages/LeagueHub';
import AuthModal from './components/AuthModal';
import { DEFAULT_MASTER_ROSTER } from './data/roster';
import { supabase } from './services/supabase';
import {
  saveMatchMetadataToSupabase,
  findOrCreateScoutingMatch,
  syncMatchScores,
  updateScoutingMatchInSupabase
} from './services/matchMetadataService';
import {
  calculatePlusMinus,
  calculateTeamScore,
  calculateOpponentScore,
  isOpponentScoreEvent
} from './utils/basketballAnalytics';
import { getScoreOverride, saveScoreOverride, clearScoreOverride } from './utils/scoreOverride';
import { generateUUID } from './utils/uuid';
import {
  saveToOfflineQueue,
  removeFromOfflineQueue,
  getOfflineQueue,
  syncOfflineQueue,
  setupOnlineSyncListener,
  cleanStaleOfflineQueue,
  setupStandbyRefocusListener,
  unregisterLegacyServiceWorkers
} from './services/offlineSync';

export default function App() {
  const [authRole, setAuthRole] = useState(() => {
    return localStorage.getItem('bba_auth_role') || 'admin';
  });
  const [showAuthModal, setShowAuthModal] = useState(() => {
    return !localStorage.getItem('bba_auth_role');
  });

  const handleLoginRole = (role) => {
    setAuthRole(role);
    localStorage.setItem('bba_auth_role', role);
    setShowAuthModal(false);
    showToast(role === 'admin' ? 'Logged in as Coach (Full Access)' : 'Guest Mode (Read-Only)');
  };

  const handleLogout = () => {
    setAuthRole('guest');
    localStorage.setItem('bba_auth_role', 'guest');
    showToast('Switched to Guest / Player view');
  };

  const [gameSession, setGameSession] = useState(() => {
    return localStorage.getItem('current_game_session') || '';
  });
  
  const sanitizeRoster = (rawList) => {
    if (!Array.isArray(rawList) || rawList.length === 0) return DEFAULT_MASTER_ROSTER;
    const list = rawList.map(p => {
      if (String(p.number) === '31' && p.name === 'Giuseppe Macinante') {
        return { ...p, name: 'Emanuele Cuomo' };
      }
      return p;
    });

    // Ensure #35 Marco Girardi is included in master roster if missing from cached localStorage
    const hasGirardi = list.some(p => String(p.number) === '35' || (p.name && p.name.toLowerCase().includes('girardi')));
    if (!hasGirardi) {
      list.push({ number: "35", name: "Marco Girardi", pos: "N/A" });
    }

    return list.sort((a, b) => Number(a.number) - Number(b.number));
  };

  const [masterRoster, setMasterRoster] = useState(() => {
    try {
      const saved = localStorage.getItem('master_roster');
      const list = saved ? sanitizeRoster(JSON.parse(saved)) : DEFAULT_MASTER_ROSTER;
      localStorage.setItem('master_roster', JSON.stringify(list));
      return list;
    } catch (e) {
      return DEFAULT_MASTER_ROSTER;
    }
  });

  const [activeRoster, setActiveRoster] = useState(() => {
    try {
      const saved = localStorage.getItem('current_match_roster');
      const list = saved ? sanitizeRoster(JSON.parse(saved)) : (localStorage.getItem('master_roster') ? sanitizeRoster(JSON.parse(localStorage.getItem('master_roster'))) : DEFAULT_MASTER_ROSTER);
      localStorage.setItem('current_match_roster', JSON.stringify(list));
      return list;
    } catch (e) {
      return DEFAULT_MASTER_ROSTER;
    }
  });

  const updateMasterRoster = (newMaster) => {
    setMasterRoster(newMaster);
    localStorage.setItem('master_roster', JSON.stringify(newMaster));
  };

  const updateActiveRoster = (newActive) => {
    setActiveRoster(newActive);
    localStorage.setItem('current_match_roster', JSON.stringify(newActive));
    
    // Automatically keep 5 players on court if active roster changes
    const activeNumSet = new Set(newActive.map(p => String(p.number)));
    const validOnCourt = onCourtPlayerNums.filter(n => activeNumSet.has(String(n)));
    if (validOnCourt.length < 5 && newActive.length >= 5) {
      const remaining = newActive.filter(p => !validOnCourt.includes(String(p.number)));
      const filled = [...validOnCourt, ...remaining.slice(0, 5 - validOnCourt.length).map(p => String(p.number))];
      updateOnCourtPlayerNums(filled);
    }
  };

  const [onCourtPlayerNums, setOnCourtPlayerNums] = useState(() => {
    try {
      const saved = localStorage.getItem('current_on_court_nums');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const defaultSquad = (localStorage.getItem('current_match_roster') 
      ? JSON.parse(localStorage.getItem('current_match_roster')) 
      : DEFAULT_MASTER_ROSTER);
    return defaultSquad.slice(0, 5).map(p => String(p.number));
  });

  const updateOnCourtPlayerNums = (newNums) => {
    setOnCourtPlayerNums(newNums);
    localStorage.setItem('current_on_court_nums', JSON.stringify(newNums));
  };

  const [currentMatchId, setCurrentMatchId] = useState(() => {
    return localStorage.getItem('current_match_id') || null;
  });

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedZoneKey, setSelectedZoneKey] = useState('PAINT');
  const [currentQuarter, setCurrentQuarter] = useState('Q1');
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [matchType, setMatchType] = useState('Official');
  const [overrideTeamScore, setOverrideTeamScore] = useState(null);
  const [overrideOppScore, setOverrideOppScore] = useState(null);

  // Sync / resolve active match_id whenever gameSession changes
  useEffect(() => {
    let isCancelled = false;
    async function resolveActiveSession() {
      if (!gameSession) {
        setCurrentMatchId(null);
        localStorage.removeItem('current_match_id');
        return;
      }
      try {
        const matchRecord = await findOrCreateScoutingMatch({
          matchName: gameSession,
          matchDate,
          matchType
        });
        if (!isCancelled && matchRecord?.id) {
          setCurrentMatchId(matchRecord.id);
          localStorage.setItem('current_match_id', matchRecord.id);
        }
      } catch (err) {
        console.warn('Could not resolve active session match_id:', err);
      }
    }
    resolveActiveSession();
    return () => { isCancelled = true; };
  }, [gameSession]);

  const handleStartNewMatchSession = async ({
    matchName,
    matchDate: newDate,
    matchType: newType,
    opponentName,
    isHome,
    squad
  }) => {
    setGameSession(matchName);
    localStorage.setItem('current_game_session', matchName);
    const finalDate = newDate || new Date().toISOString().split('T')[0];
    const finalType = newType || 'Official';
    setMatchDate(finalDate);
    setMatchType(finalType);

    try {
      const matchRecord = await findOrCreateScoutingMatch({
        matchName,
        matchDate: finalDate,
        matchType: finalType,
        opponentName,
        isHome
      });
      if (matchRecord?.id) {
        setCurrentMatchId(matchRecord.id);
        localStorage.setItem('current_match_id', matchRecord.id);
      }
      // Also update legacy metadata row for backward compatibility
      await saveMatchMetadataToSupabase(matchName, { matchDate: finalDate, matchType: finalType });
      return matchRecord;
    } catch (e) {
      console.warn('Error during match initialization in Supabase:', e);
    }
    return null;
  };

  const handleUpdateMatchDate = async (newDate) => {
    setMatchDate(newDate);
    const activeId = currentMatchId || localStorage.getItem('current_match_id');
    if (activeId) {
      try {
        await updateScoutingMatchInSupabase(activeId, { match_date: newDate });
      } catch (e) {
        console.error('Failed to sync match_date to scouting_matches:', e);
      }
    }
    if (gameSession) {
      try {
        await saveMatchMetadataToSupabase(gameSession, { matchDate: newDate });
      } catch (e) {
        console.error('Failed to sync matchDate to Supabase:', e);
      }
    }
  };

  const handleUpdateMatchType = async (newType) => {
    setMatchType(newType);
    const activeId = currentMatchId || localStorage.getItem('current_match_id');
    if (activeId) {
      try {
        await updateScoutingMatchInSupabase(activeId, { match_type: newType });
      } catch (e) {
        console.error('Failed to sync match_type to scouting_matches:', e);
      }
    }
    if (gameSession) {
      try {
        await saveMatchMetadataToSupabase(gameSession, { matchType: newType });
      } catch (e) {
        console.error('Failed to sync matchType to Supabase:', e);
      }
    }
  };

  const handleSaveScoreOverride = async (newTeamScore, newOppScore, targetMatch = gameSession) => {
    if (targetMatch === gameSession) {
      setOverrideTeamScore(newTeamScore);
      setOverrideOppScore(newOppScore);
    }
    try {
      await saveMatchMetadataToSupabase(targetMatch, {
        overrideTeamScore: newTeamScore,
        overrideOppScore: newOppScore
      });
      showToast('Official score override saved to database');
    } catch (e) {
      console.error('Failed to save score override:', e);
      showToast('Error saving score override to database');
    }
  };

  const handleClearScoreOverride = async (targetMatch = gameSession) => {
    if (targetMatch === gameSession) {
      setOverrideTeamScore(null);
      setOverrideOppScore(null);
    }
    try {
      await saveMatchMetadataToSupabase(targetMatch, {
        overrideTeamScore: null,
        overrideOppScore: null
      });
      showToast('Reverted to play-by-play calculated score');
    } catch (e) {
      console.error('Failed to clear score override:', e);
      showToast('Error resetting score override');
    }
  };

  useEffect(() => {
    async function loadSessionMeta() {
      if (!gameSession) return;
      try {
        const { data } = await supabase
          .from('scouting_log')
          .select('Zone')
          .eq('Match_Name', gameSession)
          .eq('Action', 'MATCH_METADATA');

        if (data && data.length > 0) {
          try {
            const parsed = JSON.parse(data[0].Zone);
            if (parsed.matchDate) setMatchDate(parsed.matchDate);
            if (parsed.matchType) setMatchType(parsed.matchType);
            if (parsed.overrideTeamScore !== undefined) setOverrideTeamScore(parsed.overrideTeamScore);
            if (parsed.overrideOppScore !== undefined) setOverrideOppScore(parsed.overrideOppScore);
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Error loading session meta from Supabase:', e);
      }
    }
    loadSessionMeta();
  }, [gameSession]);
  const [events, setEvents] = useState(() => {
    const session = localStorage.getItem('current_game_session');
    if (session) {
      try {
        const saved = localStorage.getItem(`bba_events_${session}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [toastMsg, setToastMsg] = useState(null);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(!localStorage.getItem('current_game_session'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(() => {
    return cleanStaleOfflineQueue(localStorage.getItem('current_game_session') || '').length;
  });

  const getStartingLineup = (sessionName) => {
    try {
      const saved = localStorage.getItem(`starting_on_court_nums_${sessionName}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 5) return parsed;
      }
    } catch (e) {}
    return onCourtPlayerNums;
  };

  const recordDeletedEvent = (eventId, eventObj) => {
    if (!gameSession) return;
    try {
      const key = `bba_deleted_events_${gameSession}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const tombstone = {
        id: eventId ? String(eventId) : null,
        timestamp: eventObj?.Timestamp || eventObj?.timestamp || null,
        number: String(eventObj?.Number ?? eventObj?.number ?? ''),
        action: eventObj?.Action || eventObj?.action || null,
        deletedAt: Date.now()
      };
      existing.push(tombstone);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {}
  };

  const getDeletedTombstones = () => {
    if (!gameSession) return [];
    try {
      return JSON.parse(localStorage.getItem(`bba_deleted_events_${gameSession}`) || '[]');
    } catch (e) {
      return [];
    }
  };

  const isEventTombstoned = (ev, deletedList) => {
    if (!Array.isArray(deletedList) || deletedList.length === 0) return false;
    const evId = ev?.id ? String(ev.id) : null;
    const evTs = ev?.Timestamp || ev?.timestamp || '';
    const evNum = String(ev?.Number ?? ev?.number ?? '');
    const evAction = ev?.Action || ev?.action || '';

    return deletedList.some(t => {
      if (evId && t.id && evId === t.id) return true;
      if (t.timestamp && t.action && t.number) {
        return t.timestamp === evTs && t.action === evAction && t.number === evNum;
      }
      return false;
    });
  };

  const persistMatchState = (updatedEvents) => {
    const safeEvents = Array.isArray(updatedEvents) ? updatedEvents : [];
    setEvents(safeEvents);

    if (gameSession) {
      try {
        localStorage.setItem(`bba_events_${gameSession}`, JSON.stringify(safeEvents));
        
        // Recalculate and persist all derived states immediately
        const teamScore = calculateTeamScore(safeEvents);
        const opponentScore = calculateOpponentScore(safeEvents);
        const lineup = getStartingLineup(gameSession);
        const pmMap = calculatePlusMinus(safeEvents, lineup, activeRoster);

        localStorage.setItem(`bba_score_${gameSession}`, JSON.stringify({ teamScore, opponentScore }));
        localStorage.setItem(`bba_plusminus_${gameSession}`, JSON.stringify(pmMap));
      } catch (e) {
        console.warn('Failed to persist match state to localStorage:', e);
      }
    }
  };

  useEffect(() => {
    // 1. Unregister legacy service workers if present in tablet browser cache
    unregisterLegacyServiceWorkers();

    // 2. Clean stale queue items from previous/mismatched match sessions or >24h old
    const validQueue = cleanStaleOfflineQueue(gameSession);
    setOfflineQueueCount(validQueue.length);

    // 3. Fetch latest match events from Supabase Cloud
    fetchEvents();

    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Online listener
    const cleanupSync = setupOnlineSyncListener((syncedCount) => {
      showToast(`Synced ${syncedCount} offline events to Supabase`);
      setOfflineQueueCount(getOfflineQueue().length);
      fetchEvents();
    });

    // Standby & Tab Refocus / Visibility listener for courtside tablets
    const cleanupRefocus = setupStandbyRefocusListener(() => {
      setIsOnline(navigator.onLine);
      cleanStaleOfflineQueue(gameSession);
      syncOfflineQueue((syncedCount) => {
        showToast(`Synced ${syncedCount} offline events to Supabase`);
        setOfflineQueueCount(getOfflineQueue().length);
      });
      setOfflineQueueCount(getOfflineQueue().length);
      fetchEvents();
    });

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      cleanupSync();
      cleanupRefocus();
    };
  }, [gameSession]);

  const normalizeEvents = (rawEvents) => {
    if (!Array.isArray(rawEvents)) return [];

    // Retrieve cached local events with onCourtPlayerIds snapshots if available
    let cachedEvents = [];
    try {
      const saved = localStorage.getItem(`bba_events_${gameSession}`);
      if (saved) cachedEvents = JSON.parse(saved);
    } catch (e) {}

    return rawEvents.map((ev, idx) => {
      if (!ev) return {};
      const Action = ev.Action || ev.action || ev.Azione || ev.azione || '';
      const Player = ev.Player || ev.player || ev.Giocatore || ev.giocatore || '';
      const NumberVal = String(ev.Number ?? ev.number ?? ev.Numero ?? ev.numero ?? '');
      const Quarter = ev.Quarter || ev.quarter || ev.Quarto || ev.quarto || '';
      const rawZone = ev.Zone || ev.zone || ev.Zona || ev.zona || '';
      const Category = ev.Category || ev.category || ev.Categoria || ev.categoria || '';
      const Match_Name = ev.Match_Name || ev.match_name || ev.nome_partita || ev.Nome_Partita || '';
      const Timestamp = ev.Timestamp || ev.timestamp || (ev.created_at ? new Date(ev.created_at).toLocaleTimeString('en-US', { hour12: false }) : '');

      // Strict event schema hygiene: Only true 2PT/3PT field goals may store a court zone ID
      const isFieldGoal = Action === '2PT Made' || Action === '2PT Missed' || Action === '2PT Fatto' || Action === '2PT Sbagliato' ||
                          Action === '3PT Made' || Action === '3PT Missed' || Action === '3PT Fatto' || Action === '3PT Sbagliato';
      const Zone = isFieldGoal && rawZone && rawZone !== 'Generic' && rawZone !== 'Bench' ? rawZone : null;

      let onCourtPlayerIds = ev.onCourtPlayerIds || ev.onCourtNums || null;
      if (!onCourtPlayerIds && cachedEvents[idx]) {
        const cached = cachedEvents[idx];
        if (cached && (cached.onCourtPlayerIds || cached.onCourtNums)) {
          onCourtPlayerIds = cached.onCourtPlayerIds || cached.onCourtNums;
        }
      }

      if (Array.isArray(onCourtPlayerIds)) {
        onCourtPlayerIds = onCourtPlayerIds.map(String);
      } else {
        onCourtPlayerIds = null;
      }

      const isTransition = ev.isTransition === true || cachedEvents[idx]?.isTransition === true || false;
      const defenseType = ev.defenseType || cachedEvents[idx]?.defenseType || null;

      return {
        ...ev,
        Action, action: Action, Azione: Action, azione: Action,
        Player, player: Player, Giocatore: Player, giocatore: Player,
        Number: NumberVal, number: NumberVal, Numero: NumberVal, numero: NumberVal,
        Quarter, quarter: Quarter, Quarto: Quarter, quarto: Quarter,
        Zone, zone: Zone, Zona: Zone, zona: Zone,
        Category, category: Category, Categoria: Category, categoria: Category,
        Match_Name, match_name: Match_Name, nome_partita: Match_Name, Nome_Partita: Match_Name,
        Timestamp, timestamp: Timestamp,
        onCourtPlayerIds: onCourtPlayerIds ? [...onCourtPlayerIds] : null,
        onCourtNums: onCourtPlayerIds ? [...onCourtPlayerIds] : null,
        isTransition,
        defenseType
      };
    });
  };

  const fetchEvents = async () => {
    if (!gameSession) {
      persistMatchState([]);
      return;
    }

    try {
      const activeMatchId = currentMatchId || localStorage.getItem('current_match_id');
      let data = null;
      let error = null;

      if (activeMatchId) {
        const res = await supabase
          .from('scouting_log')
          .select('*')
          .eq('match_id', activeMatchId)
          .order('id', { ascending: true });
        data = res.data;
        error = res.error;
      }

      if (!data || data.length === 0) {
        const res = await supabase
          .from('scouting_log')
          .select('*')
          .eq('Match_Name', gameSession)
          .order('id', { ascending: true });
        if (!res.error && res.data && res.data.length > 0) {
          data = res.data;
          error = null;
        }
      }

      if ((!data || data.length === 0) && !activeMatchId) {
        // Fallback to legacy nome_partita column
        const fallback = await supabase
          .from('scouting_log')
          .select('*')
          .eq('nome_partita', gameSession)
          .order('id', { ascending: true });

        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data;
          error = null;
        }
      }

      if (!error && Array.isArray(data)) {
        const tombstones = getDeletedTombstones();
        const nonDeleted = data.filter(ev => !isEventTombstoned(ev, tombstones));
        persistMatchState(normalizeEvents(nonDeleted));
        return;
      }
    } catch (err) {
      console.warn('Supabase fetch failed:', err);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (gameSession) {
      try {
        localStorage.setItem(`bba_events_${gameSession}`, JSON.stringify(events));
        const teamScore = calculateTeamScore(events);
        const opponentScore = calculateOpponentScore(events);
        const lineup = getStartingLineup(gameSession);
        const pmMap = calculatePlusMinus(events, lineup, activeRoster);
        localStorage.setItem(`bba_score_${gameSession}`, JSON.stringify({ teamScore, opponentScore }));
        localStorage.setItem(`bba_plusminus_${gameSession}`, JSON.stringify(pmMap));
      } catch (e) {}
    }
  }, [events, gameSession]);

  const dispatchAction = async (actionName, categoryName, zoneName, targetPlayer = null, customOnCourt = null, situational = {}) => {
    const isTeamEvent = actionName === 'Stagger' || actionName === 'Ghost' || categoryName === 'Technique';
    const isOpponent = categoryName === 'Opponent' || actionName.startsWith('Opponent') || actionName.startsWith('OPP_');
    const isSub = categoryName === 'Substitution' || actionName.startsWith('SUB:');

    const effectivePlayer = targetPlayer || selectedPlayer;

    if (!isTeamEvent && !isOpponent && !isSub && !effectivePlayer) {
      showToast('Please select a player first');
      return;
    }

    if (!gameSession) {
      setShowSessionModal(true);
      showToast('Please enter a match name first');
      return;
    }

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    let playerNum = '-';
    let playerName = 'TEAM';

    if (isOpponent) {
      playerNum = 'OPP';
      playerName = 'OPPONENT';
    } else if (isSub) {
      playerNum = 'SUB';
      playerName = targetPlayer?.name || targetPlayer?.Player || 'SUB';
    } else if (!isTeamEvent && effectivePlayer) {
      playerNum = String(effectivePlayer.number ?? effectivePlayer.Number ?? effectivePlayer.numero ?? effectivePlayer.num ?? '-');
      playerName = String(effectivePlayer.name ?? effectivePlayer.Player ?? effectivePlayer.nome ?? effectivePlayer.playerName ?? 'Player');
    }

    const currentOnCourt = (
      Array.isArray(customOnCourt) && customOnCourt.length > 0
        ? customOnCourt
        : onCourtPlayerNums
    ).map(id => String(id));

    // Strict schema hygiene: 2PT/3PT carry court zone; non-shot events carry active defensive scheme in Zone
    const isShotEvent = (actionName === '2PT Made' || actionName === '2PT Missed' || actionName === '2PT Fatto' || actionName === '2PT Sbagliato' ||
                         actionName === '3PT Made' || actionName === '3PT Missed' || actionName === '3PT Fatto' || actionName === '3PT Sbagliato') && !isOpponent;
    const safeZone = isShotEvent && zoneName && zoneName !== 'Generic' && zoneName !== 'Bench' ? zoneName : null;

    const isTransition = situational.isTransition === true;
    const defenseType = situational.defenseType || (zoneName && (zoneName === 'MAN' || zoneName === 'ZONE' || zoneName === 'PRESS') ? zoneName : null);

    // Resolve active match_id from situational, state, localStorage, or Supabase
    let activeMatchId = situational.match_id || currentMatchId || localStorage.getItem('current_match_id');
    if (!activeMatchId && gameSession) {
      try {
        const m = await findOrCreateScoutingMatch({ matchName: gameSession, matchDate, matchType });
        if (m?.id) {
          activeMatchId = m.id;
          setCurrentMatchId(m.id);
          localStorage.setItem('current_match_id', m.id);
        }
      } catch (err) {}
    }

    // Failsafe: if activeMatchId is still missing, generate an RFC4122 UUID so events are never blocked
    if (!activeMatchId && gameSession) {
      activeMatchId = generateUUID();
      setCurrentMatchId(activeMatchId);
      localStorage.setItem('current_match_id', activeMatchId);
    }

    // Generate RFC4122 UUIDv4 on client at exact millisecond 0 or reuse provided id
    const eventId = situational.id || generateUUID();

    // Exact schema payload matching the Supabase scouting_log columns (including client-generated id & match_id)
    const supabasePayload = {
      id: eventId,
      match_id: activeMatchId,
      Timestamp: timestamp,
      Quarter: currentQuarter,
      Number: playerNum,
      Player: playerName,
      Action: actionName,
      Category: categoryName,
      Zone: safeZone || defenseType || null,
      Match_Name: gameSession
    };

    // Strict validation failsafe check: prevent orphaned events without match_id
    if (!supabasePayload.match_id) {
      console.error('[CRITICAL] Missing match_id in event payload:', supabasePayload);
      throw new Error(`Missing match_id for match session "${gameSession}". Events cannot be orphaned.`);
    }

    // 1. Instant local state update (<5ms) with onCourtPlayerIds snapshot and synchronous persistence
    const localEv = {
      ...supabasePayload,
      id: eventId,
      action: actionName,
      player: playerName,
      number: playerNum,
      quarter: currentQuarter,
      zone: safeZone,
      category: categoryName,
      timestamp,
      onCourtPlayerIds: [...currentOnCourt.map(id => String(id))],
      onCourtNums: [...currentOnCourt.map(id => String(id))],
      isTransition,
      defenseType
    };
    const nextEvents = [...events, localEv];
    if (!situational.skipLocalPush) {
      persistMatchState(nextEvents);
    }

    // Live Score Synchronization: Update scouting_matches if this action affected the score
    const isBbaScore = (actionName === '2PT Made' || actionName === '2PT Fatto' ||
                        actionName === '3PT Made' || actionName === '3PT Fatto' ||
                        actionName === 'FT Made' || actionName === 'TL Fatto') && !isOpponent;
    const isOppScore = isOpponent || isOpponentScoreEvent({ Action: actionName, Category: categoryName, Number: playerNum, Player: playerName });

    if (isBbaScore || isOppScore) {
      const nextTeamScore = calculateTeamScore(nextEvents);
      const nextOppScore = calculateOpponentScore(nextEvents);
      syncMatchScores(activeMatchId, nextTeamScore, nextOppScore);
    }

    // 2. Try Supabase idempotent upsert using client-generated primary key id
    let cloudSynced = false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (navigator.onLine && supabaseUrl && !supabaseUrl.includes('your-supabase-project')) {
      try {
        const { error } = await supabase
          .from('scouting_log')
          .upsert([supabasePayload], { onConflict: 'id', ignoreDuplicates: true });

        if (!error || error.code === '23505') {
          cloudSynced = true;
          // AGGRESSIVELY PURGE FROM OFFLINE QUEUE THE EXACT MILLISECOND PROMISE RESOLVES
          removeFromOfflineQueue(eventId, supabasePayload);
          let label = actionName;
          if (isOpponent) label = `[OPP] ${actionName}`;
          else if (isSub) label = `[SUB] ${actionName}`;
          else if (isTeamEvent) label = `[TEAM] ${actionName}`;
          else label = `#${playerNum} ${playerName} -> ${actionName}`;
          showToast(`${label}`);
        } else {
          console.warn('Supabase upsert error:', error);
          showToast(`Supabase: ${error.message || 'Column/Permission error'}`);
        }
      } catch (err) {
        console.warn('Supabase network exception:', err);
      }
    }

    // 3. If cloud insert failed or offline, save to local queue
    if (!cloudSynced) {
      saveToOfflineQueue({ ...supabasePayload, onCourtPlayerIds: [...currentOnCourt.map(id => String(id))] });
      const newQueueLength = getOfflineQueue().length;
      setOfflineQueueCount(newQueueLength);
      showToast(`Saved to offline queue (${newQueueLength} pending sync)`);
    }

    // Strict State Reset after Every Logged Action: Clear selected player immediately
    setSelectedPlayer(null);
  };

  const dispatchMultipleActions = async (actionsList = [], customOnCourt = null, situational = {}) => {
    if (!Array.isArray(actionsList) || actionsList.length === 0) return;
    if (!gameSession) {
      setShowSessionModal(true);
      showToast('Please enter a match name first');
      return;
    }

    // Resolve active match_id from state, localStorage, or Supabase
    let activeMatchId = currentMatchId || localStorage.getItem('current_match_id');
    if (!activeMatchId && gameSession) {
      try {
        const m = await findOrCreateScoutingMatch({ matchName: gameSession, matchDate, matchType });
        if (m?.id) {
          activeMatchId = m.id;
          setCurrentMatchId(m.id);
          localStorage.setItem('current_match_id', m.id);
        }
      } catch (err) {}
    }

    // Failsafe: if activeMatchId is still missing, generate an RFC4122 UUID so events are never blocked
    if (!activeMatchId && gameSession) {
      activeMatchId = generateUUID();
      setCurrentMatchId(activeMatchId);
      localStorage.setItem('current_match_id', activeMatchId);
    }

    if (!activeMatchId) {
      console.error('[CRITICAL] Missing match_id for batch events');
      throw new Error(`Missing match_id for match session "${gameSession}". Events cannot be orphaned.`);
    }

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const payloads = [];
    const localEvs = [];

    const currentOnCourt = (
      Array.isArray(customOnCourt) && customOnCourt.length > 0
        ? customOnCourt
        : onCourtPlayerNums
    ).map(id => String(id));

    actionsList.forEach(item => {
      const { actionName, categoryName, zoneName, targetPlayer, isTransition: itemTrans, defenseType: itemDef } = item;
      const isTeamEvent = actionName === 'Stagger' || actionName === 'Ghost' || categoryName === 'Technique';
      const isOpponent = categoryName === 'Opponent' || actionName.startsWith('Opponent') || actionName.startsWith('OPP_');
      const isSub = categoryName === 'Substitution' || actionName.startsWith('SUB:');
      const effectivePlayer = targetPlayer || selectedPlayer;

      let playerNum = '-';
      let playerName = 'TEAM';
      if (isOpponent) {
        playerNum = 'OPP';
        playerName = 'OPPONENT';
      } else if (isSub) {
        playerNum = 'SUB';
        playerName = targetPlayer?.name || targetPlayer?.Player || 'SUB';
      } else if (!isTeamEvent && effectivePlayer) {
        playerNum = String(effectivePlayer.number ?? effectivePlayer.Number ?? effectivePlayer.numero ?? effectivePlayer.num ?? '-');
        playerName = String(effectivePlayer.name ?? effectivePlayer.Player ?? effectivePlayer.nome ?? effectivePlayer.playerName ?? 'Player');
      }

      // Only true 2PT/3PT field goals carry a court zone; non-shot events carry active scheme
      const isShotEvent = (actionName === '2PT Made' || actionName === '2PT Missed' || actionName === '2PT Fatto' || actionName === '2PT Sbagliato' ||
                           actionName === '3PT Made' || actionName === '3PT Missed' || actionName === '3PT Fatto' || actionName === '3PT Sbagliato') && !isOpponent;
      const safeZone = isShotEvent && zoneName && zoneName !== 'Generic' && zoneName !== 'Bench' ? zoneName : null;
      const effectiveDef = itemDef !== undefined ? itemDef : (situational.defenseType || (zoneName && (zoneName === 'MAN' || zoneName === 'ZONE' || zoneName === 'PRESS') ? zoneName : null));

      // Generate unique RFC4122 UUIDv4 for each batch action item
      const itemEventId = generateUUID();

      const p = {
        id: itemEventId,
        match_id: activeMatchId,
        Timestamp: timestamp,
        Quarter: currentQuarter,
        Number: playerNum,
        Player: playerName,
        Action: actionName,
        Category: categoryName,
        Zone: safeZone || effectiveDef || null,
        Match_Name: gameSession
      };
      payloads.push(p);
      localEvs.push({
        ...p,
        id: itemEventId,
        action: actionName,
        player: playerName,
        number: playerNum,
        quarter: currentQuarter,
        zone: safeZone,
        category: categoryName,
        timestamp,
        onCourtPlayerIds: [...currentOnCourt.map(id => String(id))],
        onCourtNums: [...currentOnCourt.map(id => String(id))],
        isTransition: itemTrans !== undefined ? Boolean(itemTrans) : (situational.isTransition === true),
        defenseType: itemDef !== undefined ? itemDef : (situational.defenseType || null)
      });
    });

    const nextEvents = [...events, ...localEvs];
    persistMatchState(nextEvents);

    // Live score synchronization for batch actions
    const hasScoringAction = actionsList.some(item => {
      const az = item.actionName;
      const cat = item.categoryName;
      const isOpp = cat === 'Opponent' || az.startsWith('Opponent') || az.startsWith('OPP_');
      const isBba = (az === '2PT Made' || az === '2PT Fatto' || az === '3PT Made' || az === '3PT Fatto' || az === 'FT Made' || az === 'TL Fatto') && !isOpp;
      return isBba || isOpp || isOpponentScoreEvent({ Action: az, Category: cat });
    });

    if (hasScoringAction) {
      const nextTeamScore = calculateTeamScore(nextEvents);
      const nextOppScore = calculateOpponentScore(nextEvents);
      syncMatchScores(activeMatchId, nextTeamScore, nextOppScore);
    }

    let cloudSynced = false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (navigator.onLine && supabaseUrl && !supabaseUrl.includes('your-supabase-project')) {
      try {
        const { error } = await supabase
          .from('scouting_log')
          .upsert(payloads, { onConflict: 'id', ignoreDuplicates: true });
        if (!error || error.code === '23505') {
          cloudSynced = true;
          // AGGRESSIVELY PURGE FROM OFFLINE QUEUE THE EXACT MILLISECOND PROMISE RESOLVES
          payloads.forEach(p => removeFromOfflineQueue(p.id, p));
          showToast(`${payloads.map(p => p.Action).join(' + ')}`);
        } else {
          console.warn('Supabase batch upsert error:', error);
        }
      } catch (e) {
        console.warn('Supabase batch upsert exception:', e);
      }
    }

    if (!cloudSynced) {
      payloads.forEach(p => saveToOfflineQueue({ ...p, onCourtPlayerIds: [...currentOnCourt.map(id => String(id))] }));
      const newQueueLength = getOfflineQueue().length;
      setOfflineQueueCount(newQueueLength);
      showToast(`Saved ${payloads.length} events to offline queue`);
    }

    // Clear selected player immediately
    setSelectedPlayer(null);
  };

  const dispatchOpponentScore = (points) => {
    const bbaPts = calculateTeamScore(events);
    const oppPts = calculateOpponentScore(events);
    const newOppPts = Math.max(0, oppPts + points);

    let actionName = `Opponent Scored +${points} (${bbaPts}-${newOppPts})`;
    if (points < 0) {
      actionName = `Opponent Score Corrected ${points} (${bbaPts}-${newOppPts})`;
    }

    dispatchAction(actionName, 'Opponent', null, { number: 'OPP', name: 'OPPONENT' });
  };

  const dispatchOpponentShot = (shotType, isMade, defenseType = 'MAN', extraReboundAction = null) => {
    let actionName = '';
    if (isMade) {
      if (shotType === 'FT' || shotType === '1PT') actionName = 'OPP_FT_MADE';
      else if (shotType === '2PT') actionName = 'OPP_2PT_MADE';
      else if (shotType === '3PT') actionName = 'OPP_3PT_MADE';
      else actionName = `OPP_${shotType}_MADE`;
    } else {
      if (shotType === 'FT' || shotType === '1PT') actionName = 'OPP_FT_MISSED';
      else if (shotType === '2PT') actionName = 'OPP_2PT_MISSED';
      else if (shotType === '3PT') actionName = 'OPP_3PT_MISSED';
      else actionName = `OPP_${shotType}_MISSED`;
    }

    if (extraReboundAction) {
      dispatchMultipleActions([
        {
          actionName,
          categoryName: 'Opponent',
          zoneName: null,
          targetPlayer: { number: 'OPP', name: 'OPPONENT' },
          defenseType
        },
        extraReboundAction
      ], null, { defenseType });
    } else {
      dispatchAction(actionName, 'Opponent', null, { number: 'OPP', name: 'OPPONENT' }, null, { defenseType });
    }
  };

  const handleSwapSubstitution = (subOutNum, subInNum) => {
    const outStr = String(subOutNum);
    const inStr = String(subInNum);

    const outPlayer = activeRoster.find(p => String(p.number) === outStr);
    const inPlayer = activeRoster.find(p => String(p.number) === inStr);

    const newOnCourt = onCourtPlayerNums.map(num => String(num) === outStr ? inStr : String(num));
    updateOnCourtPlayerNums(newOnCourt);

    setSelectedPlayer(null);

    const outName = outPlayer ? `#${outPlayer.number} ${outPlayer.name}` : `#${outStr}`;
    const inName = inPlayer ? `#${inPlayer.number} ${inPlayer.name}` : `#${inStr}`;

    showToast(`SUB: ${outName} → BENCH | ${inName} → COURT`);

    if (gameSession) {
      const subAction = `SUB: ${inName} IN for ${outName} - ${currentQuarter}`;
      dispatchAction(subAction, 'Substitution', null, { number: 'SUB', name: `${inStr} / ${outStr}` }, newOnCourt);
    }
  };

  const handleUndo = async () => {
    if (events.length === 0) {
      showToast('No action to undo');
      return;
    }

    const lastEv = events[events.length - 1];
    const updatedEvents = events.slice(0, -1);
    const resolvedId = lastEv?.id;

    // 1. Immediately persist mutated array and derived states to localStorage
    persistMatchState(updatedEvents);
    setSelectedPlayer(null);

    // Sync score update to scouting_matches
    const activeUndoId = currentMatchId || localStorage.getItem('current_match_id');
    if (activeUndoId) {
      const nextTeamScore = calculateTeamScore(updatedEvents);
      const nextOppScore = calculateOpponentScore(updatedEvents);
      syncMatchScores(activeUndoId, nextTeamScore, nextOppScore);
    }

    // 2. Record tombstone and purge from offline queue
    recordDeletedEvent(resolvedId, lastEv);
    removeFromOfflineQueue(resolvedId, lastEv);

    showToast(`Undone: #${lastEv.Number || lastEv.number || lastEv.Numero} ${lastEv.Action || lastEv.action || lastEv.Azione}`);

    // 3. If undone event was a SUB, revert onCourtPlayerNums
    const lastAz = String(lastEv.Action || lastEv.action || '');
    const lastCat = String(lastEv.Category || lastEv.category || '');
    if (lastCat === 'Substitution' || lastAz.startsWith('SUB:') || lastAz.startsWith('Sub:')) {
      const match = lastAz.match(/SUB:\s*#?([A-Za-z0-9_-]+).*?IN\s+for\s+#?([A-Za-z0-9_-]+)/i);
      if (match) {
        const inNum = match[1].trim();
        const outNum = match[2].trim();
        setOnCourtPlayerNums(prev => {
          const reverted = prev.map(n => String(n) === inNum ? outNum : String(n));
          try { localStorage.setItem('current_on_court_nums', JSON.stringify(reverted)); } catch(e) {}
          return reverted;
        });
      }
    }

    // 4. Delete from Supabase Cloud strictly by id
    if (navigator.onLine && resolvedId) {
      try {
        await supabase
          .from('scouting_log')
          .delete()
          .eq('id', String(resolvedId));
      } catch (e) {
        console.warn('Supabase undo delete error:', e);
      }
    }
  };

  const handleResetGame = () => {
    if (window.confirm(`Clear current live screen tracking for "${gameSession || 'Current Match'}"? (Archived database data will remain safe in Supabase)`)) {
      persistMatchState([]);
      setSelectedPlayer(null);
      showToast('Live screen cleared. Match remains saved in Archive.');
    }
  };

  const handleDeleteEvent = async (eventId, eventIndex, targetEventObj = null) => {
    // 1. Identify the event being deleted
    const targetEv = targetEventObj || events[eventIndex] || events.find(e => eventId && e.id === eventId);
    const resolvedId = eventId || targetEv?.id;

    // 2. Compute updated events immutably
    const updatedEvents = events.filter((ev, idx) => {
      if (resolvedId && ev.id) return String(ev.id) !== String(resolvedId);
      if (targetEv && !ev.id && !resolvedId) {
        const matchTs = (ev.Timestamp || ev.timestamp) === (targetEv.Timestamp || targetEv.timestamp);
        const matchNum = String(ev.Number ?? ev.number) === String(targetEv.Number ?? targetEv.number);
        const matchAction = (ev.Action || ev.action) === (targetEv.Action || targetEv.action);
        if (matchTs && matchNum && matchAction) return false;
      }
      return idx !== eventIndex;
    });

    // 3. Immediately persist mutated array and derived states to localStorage INSIDE delete handler
    persistMatchState(updatedEvents);

    // Sync score update to scouting_matches
    const activeDelId = currentMatchId || localStorage.getItem('current_match_id');
    if (activeDelId) {
      const nextTeamScore = calculateTeamScore(updatedEvents);
      const nextOppScore = calculateOpponentScore(updatedEvents);
      syncMatchScores(activeDelId, nextTeamScore, nextOppScore);
    }

    // 4. Record tombstone so background fetchEvents never resurrects it
    recordDeletedEvent(resolvedId, targetEv);

    // 5. Purge from offline queue if queued
    removeFromOfflineQueue(resolvedId, targetEv);

    showToast('Event deleted from feed');

    // 6. Delete from Supabase Cloud strictly by id
    if (navigator.onLine && resolvedId) {
      try {
        await supabase
          .from('scouting_log')
          .delete()
          .eq('id', String(resolvedId));
      } catch (e) {
        console.warn('Supabase delete event error:', e);
      }
    }
  };

  const handleEditEvent = async (eventId, eventIndex, updatedFields) => {
    // 1. Local state update immutably
    const updatedEvents = events.map((ev, idx) => {
      const isTarget = eventId && ev.id ? ev.id === eventId : idx === eventIndex;
      if (!isTarget) return ev;

      const merged = { ...ev, ...updatedFields };
      const Action = merged.Action || merged.action || merged.Azione || merged.azione || '';
      const Player = merged.Player || merged.player || merged.Giocatore || merged.giocatore || '';
      const NumberVal = String(merged.Number ?? merged.number ?? merged.Numero ?? merged.numero ?? '');
      const Quarter = merged.Quarter || merged.quarter || merged.Quarto || merged.quarto || '';
      const Zone = merged.Zone || merged.zone || merged.Zona || merged.zona || '';
      const Category = merged.Category || merged.category || merged.Categoria || merged.categoria || '';
      const onCourtPlayerIds = merged.onCourtPlayerIds || ev.onCourtPlayerIds || ev.onCourtNums || null;

      return {
        ...merged,
        Action, action: Action, Azione: Action, azione: Action,
        Player, player: Player, Giocatore: Player, giocatore: Player,
        Number: NumberVal, number: NumberVal, Numero: NumberVal, numero: NumberVal,
        Quarter, quarter: Quarter, Quarto: Quarter, quarto: Quarter,
        Zone, zone: Zone, Zona: Zone, zona: Zone,
        Category, category: Category, Categoria: Category, categoria: Category,
        onCourtPlayerIds,
        onCourtNums: onCourtPlayerIds
      };
    });

    persistMatchState(updatedEvents);
    showToast('Event updated');

    // 2. Supabase Cloud update
    if (navigator.onLine && eventId) {
      try {
        const valPlayer = updatedFields.Player || updatedFields.player || updatedFields.Giocatore || updatedFields.giocatore;
        const valNum = String(updatedFields.Number ?? updatedFields.number ?? updatedFields.Numero ?? updatedFields.numero);
        const valAction = updatedFields.Action || updatedFields.action || updatedFields.Azione || updatedFields.azione;
        const valQuarter = updatedFields.Quarter || updatedFields.quarter || updatedFields.Quarto || updatedFields.quarto;
        const valZone = updatedFields.Zone || updatedFields.zone || updatedFields.Zona || updatedFields.zona;
        const valCat = updatedFields.Category || updatedFields.category || updatedFields.Categoria || updatedFields.categoria;

        const payload = {
          Player: valPlayer,
          Number: valNum,
          Action: valAction,
          Quarter: valQuarter,
          Zone: valZone,
          Category: valCat
        };

        await supabase
          .from('scouting_log')
          .update(payload)
          .eq('id', eventId);
      } catch (e) {
        console.warn('Supabase edit event error:', e);
      }
    }
  };

  const handleManualSync = async () => {
    const res = await syncOfflineQueue();
    setOfflineQueueCount(getOfflineQueue().length);
    
    if (res.syncedCount > 0) {
      showToast(`Successfully synced ${res.syncedCount} events to Supabase`);
      fetchEvents();
    } else if (res.unconfigured) {
      showToast(`${res.message}`);
    } else if (res.error) {
      showToast(`Supabase Sync Error: ${res.error}`);
    } else if (res.offline) {
      showToast('Still offline. Connect to Wi-Fi to sync.');
    } else if (res.queueEmpty) {
      showToast('No offline events in queue');
    }
  };

  const startingOnCourtNums = getStartingLineup(gameSession);

  const plusMinusMap = calculatePlusMinus(events, startingOnCourtNums, activeRoster);

  return (
    <BrowserRouter>
      <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-[#F8F9FA] text-[#022D32]">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed top-4 right-4 z-[9999] bg-[#022D32] text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl border-2 border-[#0CA17A] flex items-center gap-2.5 text-xs animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#0CA17A] animate-ping" />
            <Activity className="w-4 h-4 text-[#0CA17A]" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Global Navigation Header */}
        <Navbar
          isOnline={isOnline}
          offlineQueueCount={offlineQueueCount}
          onManualSync={handleManualSync}
          gameSession={gameSession}
          onEditGameSession={() => setShowSessionModal(true)}
          onToggleRosterModal={() => setShowRosterModal(!showRosterModal)}
          authRole={authRole}
          onOpenAuth={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <LiveGame
                gameSession={gameSession}
                setGameSession={setGameSession}
                matchId={currentMatchId}
                setMatchId={setCurrentMatchId}
                onStartNewMatchSession={handleStartNewMatchSession}
                events={events}
                setEvents={setEvents}
                masterRoster={masterRoster}
                setMasterRoster={updateMasterRoster}
                roster={activeRoster}
                setRoster={updateActiveRoster}
                onCourtPlayerNums={onCourtPlayerNums}
                setOnCourtPlayerNums={updateOnCourtPlayerNums}
                handleSwapSubstitution={handleSwapSubstitution}
                selectedPlayer={selectedPlayer}
                setSelectedPlayer={setSelectedPlayer}
                selectedZoneKey={selectedZoneKey}
                setSelectedZoneKey={setSelectedZoneKey}
                currentQuarter={currentQuarter}
                setCurrentQuarter={setCurrentQuarter}
                showRosterModal={showRosterModal}
                setShowRosterModal={setShowRosterModal}
                showSessionModal={showSessionModal}
                setShowSessionModal={setShowSessionModal}
                dispatchAction={dispatchAction}
                dispatchMultipleActions={dispatchMultipleActions}
                dispatchOpponentScore={dispatchOpponentScore}
                dispatchOpponentShot={dispatchOpponentShot}
                plusMinusMap={plusMinusMap}
                handleUndo={handleUndo}
                handleResetGame={handleResetGame}
                onDeleteEvent={handleDeleteEvent}
                onEditEvent={handleEditEvent}
                authRole={authRole}
                matchDate={matchDate}
                onUpdateMatchDate={handleUpdateMatchDate}
                matchType={matchType}
                onUpdateMatchType={handleUpdateMatchType}
                overrideTeamScore={overrideTeamScore}
                overrideOppScore={overrideOppScore}
                onSaveScoreOverride={handleSaveScoreOverride}
                onClearScoreOverride={handleClearScoreOverride}
              />
            }
          />
          <Route
            path="/archive"
            element={<Archive showToast={showToast} authRole={authRole} />}
          />
          <Route
            path="/trends"
            element={<SeasonTrends showToast={showToast} authRole={authRole} />}
          />
          <Route
            path="/bba-analytics"
            element={<SeasonTrends showToast={showToast} authRole={authRole} />}
          />
          <Route
            path="/league-hub"
            element={<LeagueHub showToast={showToast} />}
          />
          <Route
            path="/opponent-scout"
            element={<LeagueHub showToast={showToast} />}
          />
        </Routes>

        {/* Role Selection / Passcode Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          currentRole={authRole}
          onLogin={handleLoginRole}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    </BrowserRouter>
  );
}
