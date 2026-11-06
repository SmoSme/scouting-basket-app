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
import { calculatePlusMinus, calculateTeamScore, calculateOpponentScore } from './utils/basketballAnalytics';
import { getScoreOverride, saveScoreOverride, clearScoreOverride } from './utils/scoreOverride';
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
    showToast(role === 'admin' ? '🛡️ Logged in as Coach (Full Access)' : '👤 Guest Mode (Read-Only)');
  };

  const handleLogout = () => {
    setAuthRole('guest');
    localStorage.setItem('bba_auth_role', 'guest');
    showToast('👤 Switched to Guest / Player view');
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

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedZoneKey, setSelectedZoneKey] = useState('PAINT');
  const [currentQuarter, setCurrentQuarter] = useState('Q1');
  const [matchDate, setMatchDate] = useState(() => {
    const session = localStorage.getItem('current_game_session');
    if (session) {
      const savedDate = localStorage.getItem(`match_date_${session}`);
      if (savedDate) return savedDate;
    }
    return new Date().toISOString().split('T')[0];
  });

  const [matchType, setMatchType] = useState(() => {
    const session = localStorage.getItem('current_game_session');
    if (session) {
      const savedType = localStorage.getItem(`match_type_${session}`);
      if (savedType) return savedType;
    }
    return 'Official';
  });

  const [overrideTeamScore, setOverrideTeamScore] = useState(() => {
    const session = localStorage.getItem('current_game_session');
    if (session) {
      const saved = getScoreOverride(session);
      return saved?.overrideTeamScore ?? null;
    }
    return null;
  });

  const [overrideOppScore, setOverrideOppScore] = useState(() => {
    const session = localStorage.getItem('current_game_session');
    if (session) {
      const saved = getScoreOverride(session);
      return saved?.overrideOppScore ?? null;
    }
    return null;
  });

  const handleUpdateMatchDate = (newDate) => {
    setMatchDate(newDate);
    if (gameSession) {
      try {
        localStorage.setItem(`match_date_${gameSession}`, newDate);
      } catch (e) {}
    }
  };

  const handleUpdateMatchType = (newType) => {
    setMatchType(newType);
    if (gameSession) {
      try {
        localStorage.setItem(`match_type_${gameSession}`, newType);
      } catch (e) {}
    }
  };

  const handleSaveScoreOverride = (newTeamScore, newOppScore, targetMatch = gameSession) => {
    saveScoreOverride(targetMatch, newTeamScore, newOppScore);
    if (targetMatch === gameSession) {
      setOverrideTeamScore(newTeamScore);
      setOverrideOppScore(newOppScore);
    }
    showToast('⚖️ Official score override saved');
  };

  const handleClearScoreOverride = (targetMatch = gameSession) => {
    clearScoreOverride(targetMatch);
    if (targetMatch === gameSession) {
      setOverrideTeamScore(null);
      setOverrideOppScore(null);
    }
    showToast('🔄 Reverted to play-by-play calculated score');
  };

  useEffect(() => {
    if (gameSession) {
      const savedDate = localStorage.getItem(`match_date_${gameSession}`);
      if (savedDate) {
        setMatchDate(savedDate);
      } else {
        setMatchDate(new Date().toISOString().split('T')[0]);
      }

      const savedType = localStorage.getItem(`match_type_${gameSession}`);
      if (savedType) {
        setMatchType(savedType);
      } else {
        setMatchType('Official');
      }

      const override = getScoreOverride(gameSession);
      setOverrideTeamScore(override?.overrideTeamScore ?? null);
      setOverrideOppScore(override?.overrideOppScore ?? null);
    }
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
      if (online) {
        cleanStaleOfflineQueue(gameSession);
        syncOfflineQueue((syncedCount) => {
          showToast(`⚡ Synced ${syncedCount} offline events to Supabase!`);
          setOfflineQueueCount(getOfflineQueue().length);
          fetchEvents();
        });
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Online listener
    const cleanupSync = setupOnlineSyncListener((syncedCount) => {
      showToast(`⚡ Synced ${syncedCount} offline events to Supabase!`);
      setOfflineQueueCount(getOfflineQueue().length);
      fetchEvents();
    });

    // Standby & Tab Refocus / Visibility listener for courtside tablets
    const cleanupRefocus = setupStandbyRefocusListener(() => {
      setIsOnline(navigator.onLine);
      cleanStaleOfflineQueue(gameSession);
      syncOfflineQueue((syncedCount) => {
        showToast(`⚡ Synced ${syncedCount} offline events to Supabase!`);
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
      // Query using Match_Name primary column
      let { data, error } = await supabase
        .from('scouting_log')
        .select('*')
        .eq('Match_Name', gameSession)
        .order('id', { ascending: true });

      if (error || !data || data.length === 0) {
        // Fallback to nome_partita column
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

      if (!error && data) {
        const tombstones = getDeletedTombstones();
        const nonDeleted = data.filter(ev => !isEventTombstoned(ev, tombstones));
        persistMatchState(normalizeEvents(nonDeleted));
        return;
      }
    } catch (err) {
      console.warn('Supabase fetch failed:', err);
    }

    // Local API fallback
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        const tombstones = getDeletedTombstones();
        const nonDeleted = Array.isArray(data) ? data.filter(ev => !isEventTombstoned(ev, tombstones)) : [];
        persistMatchState(normalizeEvents(nonDeleted));
      }
    } catch (err) {}
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
      showToast('⚠️ Please select a player first!');
      return;
    }

    if (!gameSession) {
      setShowSessionModal(true);
      showToast('⚠️ Please enter a match name first!');
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
      playerName = targetPlayer?.name || 'SUB';
    } else if (!isTeamEvent && effectivePlayer) {
      playerNum = String(effectivePlayer.number);
      playerName = effectivePlayer.name;
    }

    const currentOnCourt = (
      Array.isArray(customOnCourt) && customOnCourt.length > 0
        ? customOnCourt
        : onCourtPlayerNums
    ).map(id => String(id));

    // Strict schema hygiene: Only true 2PT/3PT field goal events carry a court zone; all other events get null
    const isShotEvent = (actionName === '2PT Made' || actionName === '2PT Missed' || actionName === '2PT Fatto' || actionName === '2PT Sbagliato' ||
                         actionName === '3PT Made' || actionName === '3PT Missed' || actionName === '3PT Fatto' || actionName === '3PT Sbagliato') && !isOpponent;
    const safeZone = isShotEvent && zoneName && zoneName !== 'Generic' && zoneName !== 'Bench' ? zoneName : null;

    const isTransition = situational.isTransition === true;
    const defenseType = situational.defenseType || null;

    // Exact schema payload matching the 8 Supabase scouting_log columns
    const supabasePayload = {
      Timestamp: timestamp,
      Quarter: currentQuarter,
      Number: playerNum,
      Player: playerName,
      Action: actionName,
      Category: categoryName,
      Zone: safeZone,
      Match_Name: gameSession
    };

    // 1. Instant local state update (<5ms) with onCourtPlayerIds snapshot and synchronous persistence
    const localEv = {
      ...supabasePayload,
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
    persistMatchState([...events, localEv]);

    // 2. Try Supabase insert with .select() to retrieve generated ID
    let cloudSynced = false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (navigator.onLine && supabaseUrl && !supabaseUrl.includes('your-supabase-project')) {
      try {
        const { data, error } = await supabase
          .from('scouting_log')
          .insert([supabasePayload])
          .select();

        if (!error) {
          cloudSynced = true;
          if (data && data[0]?.id) {
            localEv.id = data[0].id;
            setEvents(prev => {
              const updated = prev.map(e => (e === localEv || (!e.id && e.timestamp === timestamp && e.action === actionName && e.number === playerNum)) ? { ...e, id: data[0].id } : e);
              persistMatchState(updated);
              return updated;
            });
          }
          let label = actionName;
          if (isOpponent) label = `[OPP] ${actionName}`;
          else if (isSub) label = `[SUB] ${actionName}`;
          else if (isTeamEvent) label = `[TEAM] ${actionName}`;
          else label = `#${playerNum} ${playerName} -> ${actionName}`;
          showToast(`✅ ${label}`);
        } else {
          console.warn('Supabase insert error:', error);
          showToast(`⚠️ Supabase: ${error.message || 'Column/Permission error'}`);
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
      showToast(`📦 Saved to offline queue (${newQueueLength} pending sync)`);
    }

    // Local server fallback
    try {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supabasePayload)
      });
    } catch (e) {}

    // Strict State Reset after Every Logged Action: Clear selected player immediately
    setSelectedPlayer(null);
  };

  const dispatchMultipleActions = async (actionsList = [], customOnCourt = null, situational = {}) => {
    if (!Array.isArray(actionsList) || actionsList.length === 0) return;
    if (!gameSession) {
      setShowSessionModal(true);
      showToast('⚠️ Please enter a match name first!');
      return;
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
        playerName = targetPlayer?.name || 'SUB';
      } else if (!isTeamEvent && effectivePlayer) {
        playerNum = String(effectivePlayer.number);
        playerName = effectivePlayer.name;
      }

      // Only true 2PT/3PT field goals carry a court zone
      const isShotEvent = (actionName === '2PT Made' || actionName === '2PT Missed' || actionName === '2PT Fatto' || actionName === '2PT Sbagliato' ||
                           actionName === '3PT Made' || actionName === '3PT Missed' || actionName === '3PT Fatto' || actionName === '3PT Sbagliato') && !isOpponent;
      const safeZone = isShotEvent && zoneName && zoneName !== 'Generic' && zoneName !== 'Bench' ? zoneName : null;

      const p = {
        Timestamp: timestamp,
        Quarter: currentQuarter,
        Number: playerNum,
        Player: playerName,
        Action: actionName,
        Category: categoryName,
        Zone: safeZone,
        Match_Name: gameSession
      };
      payloads.push(p);
      localEvs.push({
        ...p,
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

    persistMatchState([...events, ...localEvs]);

    let cloudSynced = false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (navigator.onLine && supabaseUrl && !supabaseUrl.includes('your-supabase-project')) {
      try {
        const { data, error } = await supabase.from('scouting_log').insert(payloads).select();
        if (!error) {
          cloudSynced = true;
          if (Array.isArray(data) && data.length > 0) {
            setEvents(prev => {
              const updated = [...prev];
              for (let i = 0; i < data.length; i++) {
                const targetIdx = updated.length - data.length + i;
                if (updated[targetIdx] && data[i]?.id) {
                  updated[targetIdx] = { ...updated[targetIdx], id: data[i].id };
                }
              }
              persistMatchState(updated);
              return updated;
            });
          }
          showToast(`✅ ${payloads.map(p => p.Action).join(' + ')}`);
        }
      } catch (e) {
        console.warn('Supabase batch insert error:', e);
      }
    }

    if (!cloudSynced) {
      payloads.forEach(p => saveToOfflineQueue({ ...p, onCourtPlayerIds: [...currentOnCourt.map(id => String(id))] }));
      const newQueueLength = getOfflineQueue().length;
      setOfflineQueueCount(newQueueLength);
      showToast(`📦 Saved ${payloads.length} events to offline queue`);
    }

    payloads.forEach(p => {
      try {
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
      } catch (e) {}
    });

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

    showToast(`🔁 SUB: ${outName} ➔ BENCH | ${inName} ➔ COURT`);

    if (gameSession) {
      const subAction = `SUB: ${inName} IN for ${outName} - ${currentQuarter}`;
      dispatchAction(subAction, 'Substitution', null, { number: 'SUB', name: `${inStr} / ${outStr}` }, newOnCourt);
    }
  };

  const handleUndo = async () => {
    if (events.length === 0) {
      showToast('⚠️ No action to undo!');
      return;
    }

    const lastEv = events[events.length - 1];
    const updatedEvents = events.slice(0, -1);

    // 1. Immediately persist mutated array and derived states to localStorage
    persistMatchState(updatedEvents);
    setSelectedPlayer(null);

    // 2. Record tombstone and purge from offline queue
    recordDeletedEvent(lastEv.id, lastEv);
    removeFromOfflineQueue(lastEv.id, lastEv);

    showToast(`↩️ Undone: #${lastEv.Number || lastEv.number || lastEv.Numero} ${lastEv.Action || lastEv.action || lastEv.Azione}`);

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

    // 4. Delete from Supabase Cloud
    if (navigator.onLine) {
      try {
        if (lastEv.id) {
          await supabase
            .from('scouting_log')
            .delete()
            .eq('id', lastEv.id);
        } else if (gameSession) {
          const actionVal = lastEv.Action || lastEv.action;
          const numVal = String(lastEv.Number ?? lastEv.number);
          const tsVal = lastEv.Timestamp || lastEv.timestamp;

          let query = supabase.from('scouting_log').delete().eq('Match_Name', gameSession);
          if (actionVal) query = query.eq('Action', actionVal);
          if (numVal && numVal !== '-') query = query.eq('Number', numVal);
          if (tsVal) query = query.eq('Timestamp', tsVal);
          await query;
        }
      } catch (e) {}
    }

    try {
      await fetch('/api/events/last', { method: 'DELETE' });
    } catch (e) {}
  };

  const handleResetGame = () => {
    if (window.confirm(`Clear current live screen tracking for "${gameSession || 'Current Match'}"? (Archived database data will remain safe in Supabase)`)) {
      persistMatchState([]);
      setSelectedPlayer(null);
      showToast('🧹 Live screen cleared! Match remains saved in Archive.');
    }
  };

  const handleDeleteEvent = async (eventId, eventIndex, targetEventObj = null) => {
    // 1. Identify the event being deleted
    const targetEv = targetEventObj || events[eventIndex] || events.find(e => eventId && e.id === eventId);

    // 2. Compute updated events immutably
    const updatedEvents = events.filter((ev, idx) => {
      if (eventId && ev.id) return ev.id !== eventId;
      if (targetEv && !ev.id && !eventId) {
        const matchTs = (ev.Timestamp || ev.timestamp) === (targetEv.Timestamp || targetEv.timestamp);
        const matchNum = String(ev.Number ?? ev.number) === String(targetEv.Number ?? targetEv.number);
        const matchAction = (ev.Action || ev.action) === (targetEv.Action || targetEv.action);
        if (matchTs && matchNum && matchAction) return false;
      }
      return idx !== eventIndex;
    });

    // 3. CRITICAL: Immediately persist mutated array and derived states to localStorage INSIDE delete handler
    persistMatchState(updatedEvents);

    // 4. Record tombstone so background fetchEvents never resurrects it
    recordDeletedEvent(eventId, targetEv);

    // 5. Purge from offline queue if queued
    removeFromOfflineQueue(eventId, targetEv);

    showToast('🗑️ Event deleted from feed!');

    // 6. Delete from Supabase Cloud
    if (navigator.onLine) {
      try {
        if (eventId) {
          await supabase
            .from('scouting_log')
            .delete()
            .eq('id', eventId);
        } else if (targetEv && gameSession) {
          const actionVal = targetEv.Action || targetEv.action;
          const numVal = String(targetEv.Number ?? targetEv.number);
          const tsVal = targetEv.Timestamp || targetEv.timestamp;

          let query = supabase.from('scouting_log').delete().eq('Match_Name', gameSession);
          if (actionVal) query = query.eq('Action', actionVal);
          if (numVal && numVal !== '-') query = query.eq('Number', numVal);
          if (tsVal) query = query.eq('Timestamp', tsVal);
          await query;
        }
      } catch (e) {
        console.warn('Supabase delete event error:', e);
      }
    }

    try {
      if (eventId) fetch(`/api/events/${eventId}`, { method: 'DELETE' });
    } catch (e) {}
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
    showToast('✏️ Event updated!');

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
      showToast(`⚡ Successfully synced ${res.syncedCount} events to Supabase!`);
      fetchEvents();
    } else if (res.unconfigured) {
      showToast(`⚠️ ${res.message}`);
    } else if (res.error) {
      showToast(`❌ Supabase Sync Error: ${res.error}`);
    } else if (res.offline) {
      showToast('⚠️ Still offline. Connect to Wi-Fi to sync.');
    } else if (res.queueEmpty) {
      showToast('ℹ️ No offline events in queue.');
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
