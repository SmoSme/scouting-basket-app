import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Navbar from './components/Navbar';
import LiveGame from './pages/LiveGame';
import Archive from './pages/Archive';
import AuthModal from './components/AuthModal';
import { DEFAULT_MASTER_ROSTER } from './data/roster';
import { supabase } from './services/supabase';
import {
  saveToOfflineQueue,
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
    return rawList.map(p => {
      if (String(p.number) === '31' && p.name === 'Giuseppe Macinante') {
        return { ...p, name: 'Emanuele Cuomo' };
      }
      return p;
    });
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

  const handleSwapSubstitution = (subOutNum, subInNum) => {
    const outStr = String(subOutNum);
    const inStr = String(subInNum);

    const outPlayer = activeRoster.find(p => String(p.number) === outStr);
    const inPlayer = activeRoster.find(p => String(p.number) === inStr);

    const newOnCourt = onCourtPlayerNums.map(num => String(num) === outStr ? inStr : String(num));
    updateOnCourtPlayerNums(newOnCourt);

    if (selectedPlayer && String(selectedPlayer.number) === outStr) {
      setSelectedPlayer(null);
    }

    const outName = outPlayer ? `#${outPlayer.number} ${outPlayer.name}` : `#${outStr}`;
    const inName = inPlayer ? `#${inPlayer.number} ${inPlayer.name}` : `#${inStr}`;

    showToast(`🔁 SUB: ${outName} ➔ BENCH | ${inName} ➔ COURT`);
  };

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedZoneKey, setSelectedZoneKey] = useState('PAINT');
  const [currentQuarter, setCurrentQuarter] = useState('Q1');
  const [events, setEvents] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(!localStorage.getItem('current_game_session'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(() => {
    return cleanStaleOfflineQueue(localStorage.getItem('current_game_session') || '').length;
  });

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
    return rawEvents.map(ev => {
      if (!ev) return {};
      const Action = ev.Action || ev.action || ev.Azione || ev.azione || '';
      const Player = ev.Player || ev.player || ev.Giocatore || ev.giocatore || '';
      const NumberVal = String(ev.Number ?? ev.number ?? ev.Numero ?? ev.numero ?? '');
      const Quarter = ev.Quarter || ev.quarter || ev.Quarto || ev.quarto || '';
      const Zone = ev.Zone || ev.zone || ev.Zona || ev.zona || '';
      const Category = ev.Category || ev.category || ev.Categoria || ev.categoria || '';
      const Match_Name = ev.Match_Name || ev.match_name || ev.nome_partita || ev.Nome_Partita || '';
      const Timestamp = ev.Timestamp || ev.timestamp || (ev.created_at ? new Date(ev.created_at).toLocaleTimeString('en-US', { hour12: false }) : '');

      return {
        ...ev,
        Action, action: Action, Azione: Action, azione: Action,
        Player, player: Player, Giocatore: Player, giocatore: Player,
        Number: NumberVal, number: NumberVal, Numero: NumberVal, numero: NumberVal,
        Quarter, quarter: Quarter, Quarto: Quarter, quarto: Quarter,
        Zone, zone: Zone, Zona: Zone, zona: Zone,
        Category, category: Category, Categoria: Category, categoria: Category,
        Match_Name, match_name: Match_Name, nome_partita: Match_Name, Nome_Partita: Match_Name,
        Timestamp, timestamp: Timestamp
      };
    });
  };

  const fetchEvents = async () => {
    if (!gameSession) {
      setEvents([]);
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
        setEvents(normalizeEvents(data));
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
        setEvents(normalizeEvents(data));
      }
    } catch (err) {}
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const dispatchAction = async (actionName, categoryName, zoneName) => {
    const isTeamEvent = actionName === 'Stagger' || actionName === 'Ghost' || categoryName === 'Technique';

    if (!isTeamEvent && !selectedPlayer) {
      showToast('⚠️ Please select a player first!');
      return;
    }

    if (!gameSession) {
      setShowSessionModal(true);
      showToast('⚠️ Please enter a match name first!');
      return;
    }

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const playerNum = isTeamEvent ? '-' : String(selectedPlayer.number);
    const playerName = isTeamEvent ? 'TEAM' : selectedPlayer.name;
    
    // Exact schema payload matching the 8 Supabase scouting_log columns
    const supabasePayload = {
      Timestamp: timestamp,
      Quarter: currentQuarter,
      Number: playerNum,
      Player: playerName,
      Action: actionName,
      Category: categoryName,
      Zone: zoneName,
      Match_Name: gameSession
    };

    // 1. Instant local state update (<5ms)
    const localEv = {
      ...supabasePayload,
      action: actionName,
      player: playerName,
      number: playerNum,
      quarter: currentQuarter,
      zone: zoneName,
      category: categoryName,
      timestamp
    };
    setEvents(prev => [...prev, localEv]);

    // 2. Try Supabase insert
    let cloudSynced = false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (navigator.onLine && supabaseUrl && !supabaseUrl.includes('your-supabase-project')) {
      try {
        const { error } = await supabase
          .from('scouting_log')
          .insert([supabasePayload]);

        if (!error) {
          cloudSynced = true;
          const label = isTeamEvent ? `[TEAM] ${actionName}` : `#${selectedPlayer.number} ${selectedPlayer.name} -> ${actionName}`;
          showToast(`✅ ${label} (Supabase Cloud)`);
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
      saveToOfflineQueue(supabasePayload);
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

    // Only deselect player if this was an individual player action
    if (!isTeamEvent) {
      setSelectedPlayer(null);
    }
  };

  const handleUndo = async () => {
    if (events.length === 0) {
      showToast('⚠️ No action to undo!');
      return;
    }

    const lastEv = events[events.length - 1];
    setEvents(prev => prev.slice(0, -1));
    showToast(`↩️ Undone: #${lastEv.Number || lastEv.number || lastEv.Numero} ${lastEv.Action || lastEv.action || lastEv.Azione}`);

    if (navigator.onLine && lastEv.id) {
      try {
        await supabase
          .from('scouting_log')
          .delete()
          .eq('id', lastEv.id);
      } catch (e) {}
    }

    try {
      await fetch('/api/events/last', { method: 'DELETE' });
    } catch (e) {}
  };

  const handleResetGame = () => {
    if (window.confirm(`Clear current live screen tracking for "${gameSession || 'Current Match'}"? (Archived database data will remain safe in Supabase)`)) {
      setEvents([]);
      setSelectedPlayer(null);
      showToast('🧹 Live screen cleared! Match remains saved in Archive.');
    }
  };

  const handleDeleteEvent = async (eventId, eventIndex) => {
    // 1. Local state update
    setEvents(prev => prev.filter((ev, idx) => {
      if (eventId && ev.id) return ev.id !== eventId;
      return idx !== eventIndex;
    }));

    showToast('🗑️ Event deleted from feed!');

    // 2. Supabase Cloud delete
    if (navigator.onLine && eventId) {
      try {
        await supabase
          .from('scouting_log')
          .delete()
          .eq('id', eventId);
      } catch (e) {
        console.warn('Supabase delete event error:', e);
      }
    }
  };

  const handleEditEvent = async (eventId, eventIndex, updatedFields) => {
    // 1. Local state update
    setEvents(prev => prev.map((ev, idx) => {
      const isTarget = eventId && ev.id ? ev.id === eventId : idx === eventIndex;
      if (!isTarget) return ev;

      const merged = { ...ev, ...updatedFields };
      const Action = merged.Action || merged.action || merged.Azione || merged.azione || '';
      const Player = merged.Player || merged.player || merged.Giocatore || merged.giocatore || '';
      const NumberVal = String(merged.Number ?? merged.number ?? merged.Numero ?? merged.numero ?? '');
      const Quarter = merged.Quarter || merged.quarter || merged.Quarto || merged.quarto || '';
      const Zone = merged.Zone || merged.zone || merged.Zona || merged.zona || '';
      const Category = merged.Category || merged.category || merged.Categoria || merged.categoria || '';

      return {
        ...merged,
        Action, action: Action, Azione: Action, azione: Action,
        Player, player: Player, Giocatore: Player, giocatore: Player,
        Number: NumberVal, number: NumberVal, Numero: NumberVal, numero: NumberVal,
        Quarter, quarter: Quarter, Quarto: Quarter, quarto: Quarter,
        Zone, zone: Zone, Zona: Zone, zona: Zone,
        Category, category: Category, Categoria: Category, categoria: Category
      };
    }));

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

  return (
    <BrowserRouter>
      <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-[#06090F] p-1 sm:p-2 text-slate-100">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed top-3 right-3 z-50 bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-lg shadow-2xl border-2 border-white flex items-center gap-2 animate-pulse text-xs">
            <Activity className="w-4 h-4 text-slate-950" />
            {toastMsg}
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
                handleUndo={handleUndo}
                handleResetGame={handleResetGame}
                onDeleteEvent={handleDeleteEvent}
                onEditEvent={handleEditEvent}
                authRole={authRole}
              />
            }
          />
          <Route
            path="/archive"
            element={<Archive showToast={showToast} authRole={authRole} />}
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
