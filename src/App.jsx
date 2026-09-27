import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Navbar from './components/Navbar';
import LiveGame from './pages/LiveGame';
import Archive from './pages/Archive';
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
  const [gameSession, setGameSession] = useState(() => {
    return localStorage.getItem('current_game_session') || '';
  });
  
  const [masterRoster, setMasterRoster] = useState(() => {
    try {
      const saved = localStorage.getItem('master_roster');
      return saved ? JSON.parse(saved) : DEFAULT_MASTER_ROSTER;
    } catch (e) {
      return DEFAULT_MASTER_ROSTER;
    }
  });

  const [activeRoster, setActiveRoster] = useState(() => {
    try {
      const saved = localStorage.getItem('current_match_roster');
      return saved ? JSON.parse(saved) : (localStorage.getItem('master_roster') ? JSON.parse(localStorage.getItem('master_roster')) : DEFAULT_MASTER_ROSTER);
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
      const Azione = ev.Azione || ev.azione || '';
      const Giocatore = ev.Giocatore || ev.giocatore || '';
      const Numero = String(ev.Numero ?? ev.numero ?? '');
      const Quarto = ev.Quarto || ev.quarto || '';
      const Zona = ev.Zona || ev.zona || '';
      const Categoria = ev.Categoria || ev.categoria || '';
      const Timestamp = ev.Timestamp || ev.timestamp || (ev.created_at ? new Date(ev.created_at).toLocaleTimeString('it-IT', { hour12: false }) : '');

      return {
        ...ev,
        Azione, azione: Azione,
        Giocatore, giocatore: Giocatore,
        Numero, numero: Numero,
        Quarto, quarto: Quarto,
        Zona, zona: Zona,
        Categoria, categoria: Categoria,
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
      const { data, error } = await supabase
        .from('scouting_log')
        .select('*')
        .eq('nome_partita', gameSession)
        .order('id', { ascending: true });

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

  const dispatchAction = async (azione, categoria, zonaName) => {
    if (!selectedPlayer) {
      showToast('⚠️ Please select a player first!');
      return;
    }

    if (!gameSession) {
      setShowSessionModal(true);
      showToast('⚠️ Please enter a match name first!');
      return;
    }

    const timestamp = new Date().toLocaleTimeString('it-IT', { hour12: false });
    const payload = {
      nome_partita: gameSession,
      quarto: currentQuarter,
      numero: String(selectedPlayer.number),
      giocatore: selectedPlayer.name,
      azione: azione,
      categoria: categoria,
      zona: zonaName
    };

    // 1. Instant local state update (<5ms)
    const localEv = { ...payload, Timestamp: timestamp, Quarto: currentQuarter, Numero: selectedPlayer.number, Giocatore: selectedPlayer.name, Azione: azione, Categoria: categoria, Zona: zonaName };
    setEvents(prev => [...prev, localEv]);

    // 2. Try Supabase insert
    let cloudSynced = false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (navigator.onLine && supabaseUrl && !supabaseUrl.includes('your-supabase-project')) {
      try {
        const { error } = await supabase
          .from('scouting_log')
          .insert([payload]);

        if (!error) {
          cloudSynced = true;
          showToast(`✅ #${selectedPlayer.number} ${selectedPlayer.name} -> ${azione} (Supabase Cloud)`);
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
      saveToOfflineQueue(payload);
      const newQueueLength = getOfflineQueue().length;
      setOfflineQueueCount(newQueueLength);
      showToast(`📦 Saved to offline queue (${newQueueLength} pending sync)`);
    }

    // Local server fallback
    try {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    setSelectedPlayer(null);
  };

  const handleUndo = async () => {
    if (events.length === 0) {
      showToast('⚠️ No action to undo!');
      return;
    }

    const lastEv = events[events.length - 1];
    setEvents(prev => prev.slice(0, -1));
    showToast(`↩️ Undone: #${lastEv.Numero || lastEv.numero} ${lastEv.Azione || lastEv.azione}`);

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

  const handleResetGame = async () => {
    if (window.confirm(`Are you sure you want to reset all data for match "${gameSession}"?`)) {
      setEvents([]);
      setSelectedPlayer(null);

      if (navigator.onLine && gameSession) {
        try {
          await supabase.from('scouting_log').delete().eq('nome_partita', gameSession);
        } catch (e) {}
      }

      try {
        await fetch('/api/reset', { method: 'POST' });
      } catch (e) {}

      showToast('🗑️ Match data reset!');
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
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#06090F] p-2 text-slate-100">
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
              />
            }
          />
          <Route
            path="/archive"
            element={<Archive showToast={showToast} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
