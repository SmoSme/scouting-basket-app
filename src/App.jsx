import React, { useState, useEffect } from 'react';
import { Activity, Trophy, Download, Trash2, LayoutDashboard, BarChart3, Settings, Wifi, WifiOff } from 'lucide-react';
import ScoreboardHeader from './components/ScoreboardHeader';
import PlayerSelector from './components/PlayerSelector';
import CourtPitchMap from './components/CourtPitchMap';
import ActionClusters from './components/ActionClusters';
import BoxScoreTable from './components/BoxScoreTable';
import PlayLogFeed from './components/PlayLogFeed';
import { DEFAULT_ROSTER, COURT_ZONES } from './data/roster';
import { supabase } from './services/supabase';
import {
  saveToOfflineQueue,
  getOfflineQueue,
  syncOfflineQueue,
  setupOnlineSyncListener
} from './services/offlineSync';

export default function App() {
  const [activeTab, setActiveTab] = useState('LIVE');
  const [roster, setRoster] = useState(DEFAULT_ROSTER);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedZoneKey, setSelectedZoneKey] = useState('PAINT');
  const [currentQuarter, setCurrentQuarter] = useState('Q1');
  const [events, setEvents] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(getOfflineQueue().length);

  // Fetch events from backend / Supabase & set up offline listeners
  useEffect(() => {
    fetchEvents();

    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Setup auto-sync when Wi-Fi returns
    const cleanupSync = setupOnlineSyncListener((syncedCount) => {
      showToast(`⚡ Sincronizzati ${syncedCount} eventi offline su Supabase!`);
      setOfflineQueueCount(getOfflineQueue().length);
      fetchEvents();
    });

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      cleanupSync();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      // 1. Try Supabase cloud database first
      const { data, error } = await supabase
        .from('scouting_log')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        setEvents(data);
        return;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local API:', err);
    }

    // 2. Fallback to local server API if running locally
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events from local API:', err);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Dispatch Action Payload to Supabase with Offline Resilience
  const dispatchAction = async (azione, categoria, zonaName) => {
    if (!selectedPlayer) {
      showToast('⚠️ Seleziona prima un giocatore a sinistra!');
      return;
    }

    const timestamp = new Date().toLocaleTimeString('it-IT', { hour12: false });
    const payload = {
      quarto: currentQuarter,
      numero: String(selectedPlayer.number),
      giocatore: selectedPlayer.name,
      azione: azione,
      categoria: categoria,
      zona: zonaName
    };

    // 1. Instant local state update (<5ms touch responsiveness)
    const localEv = { ...payload, Timestamp: timestamp, Quarto: currentQuarter, Numero: selectedPlayer.number, Giocatore: selectedPlayer.name, Azione: azione, Categoria: categoria, Zona: zonaName };
    setEvents(prev => [...prev, localEv]);
    showToast(`✅ #${selectedPlayer.number} ${selectedPlayer.name} -> ${azione} (${zonaName})`);

    // 2. Send to Supabase scouting_log table
    let cloudSynced = false;
    if (navigator.onLine && import.meta.env.VITE_SUPABASE_URL) {
      try {
        const { error } = await supabase
          .from('scouting_log')
          .insert([payload]);

        if (!error) {
          cloudSynced = true;
        } else {
          console.warn('Supabase insert error, queueing offline:', error);
        }
      } catch (err) {
        console.warn('Supabase network error, queueing offline:', err);
      }
    }

    // 3. Offline Resilience: if not synced to cloud, store in localStorage queue
    if (!cloudSynced) {
      saveToOfflineQueue(payload);
      setOfflineQueueCount(getOfflineQueue().length);
      showToast(`📦 Salvato offline (in coda sync Wi-Fi)`);
    }

    // 4. Asynchronous fallback sync to local Express server if running locally
    try {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Ignored if purely cloud-deployed
    }

    setSelectedPlayer(null);
  };

  const handleRecordShot = (isMade) => {
    const zoneInfo = COURT_ZONES[selectedZoneKey];
    const shotType = zoneInfo.type; // "2PT" or "3PT"
    const outcome = isMade ? 'Fatto' : 'Sbagliato';
    const azione = `${shotType} ${outcome}`;

    dispatchAction(azione, 'Tiro', zoneInfo.name);
  };

  const handleRecordAction = (azione, categoria) => {
    dispatchAction(azione, categoria, 'Generica');
  };

  const handleUndo = async () => {
    if (events.length === 0) {
      showToast('⚠️ Nessuna azione da annullare!');
      return;
    }

    const lastEv = events[events.length - 1];
    setEvents(prev => prev.slice(0, -1));
    showToast(`↩️ Annullato: #${lastEv.Numero || lastEv.numero} ${lastEv.Azione || lastEv.azione}`);

    // Try Supabase delete by latest ID if online
    if (navigator.onLine && lastEv.id) {
      try {
        await supabase
          .from('scouting_log')
          .delete()
          .eq('id', lastEv.id);
      } catch (e) {
        console.warn('Supabase delete failed:', e);
      }
    }

    try {
      await fetch('/api/events/last', { method: 'DELETE' });
    } catch (err) {
      // Local fallback
    }
  };

  const handleResetGame = async () => {
    if (window.confirm('Sei sicuro di voler resettare tutti i dati della partita?')) {
      setEvents([]);
      setSelectedPlayer(null);
      
      if (navigator.onLine) {
        try {
          await supabase.from('scouting_log').delete().neq('id', 0);
        } catch (e) {
          console.warn('Supabase reset failed:', e);
        }
      }

      try {
        await fetch('/api/reset', { method: 'POST' });
      } catch (e) {}

      showToast('🗑️ Dati gara azzerati!');
    }
  };

  const handleManualSync = async () => {
    const res = await syncOfflineQueue();
    if (res.syncedCount > 0) {
      showToast(`⚡ Sincronizzati ${res.syncedCount} eventi su Supabase!`);
      setOfflineQueueCount(getOfflineQueue().length);
      fetchEvents();
    } else if (res.offline) {
      showToast('⚠️ Ancora offline. Connettiti al Wi-Fi per il sync.');
    } else {
      showToast('ℹ️ Nessun evento in coda offline.');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#06090F] p-2 text-slate-100">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-3 right-3 z-50 bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-lg shadow-2xl border-2 border-white flex items-center gap-2 animate-pulse text-xs">
          <Activity className="w-4 h-4 text-slate-950" />
          {toastMsg}
        </div>
      )}

      {/* Top Fixed Navbar */}
      <header className="glass-card px-3 py-1.5 mb-1.5 flex items-center justify-between border-slate-800 flex-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
            <Trophy className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-wider text-slate-100 uppercase">COURTSIDE PRO</span>
            {isOnline ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
                <Wifi className="w-3 h-3" /> ONLINE (SUPABASE)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-400 font-extrabold px-2 py-0.5 rounded border border-rose-500/30">
                <WifiOff className="w-3 h-3" /> OFFLINE (RESILIENT)
              </span>
            )}

            {offlineQueueCount > 0 && (
              <button
                onClick={handleManualSync}
                className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded animate-bounce shadow"
              >
                📦 {offlineQueueCount} IN CODA (SYNC)
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-md transition-all ${
              activeTab === 'LIVE'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3 h-3" />
            LIVE DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab('BOXSCORE')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-md transition-all ${
              activeTab === 'BOXSCORE'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            FIBA BOX SCORE
          </button>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRosterModal(!showRosterModal)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
          >
            <Settings className="w-3 h-3" />
            ROSTER
          </button>
          <a
            href="/api/export-csv"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-sky-600/90 text-white hover:bg-sky-500 transition-all"
          >
            <Download className="w-3 h-3" />
            CSV
          </a>
          <button
            onClick={handleResetGame}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-rose-700/90 text-white hover:bg-rose-600 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            RESET
          </button>
        </div>
      </header>

      {/* Roster Quick Editor Modal */}
      {showRosterModal && (
        <div className="glass-card p-2.5 mb-1.5 border-amber-500/40 flex-none">
          <h3 className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2">
            ROSTER MANAGER — EDIT NUMBERS & NAMES
          </h3>
          <div className="grid grid-cols-6 gap-1.5">
            {roster.map((p, idx) => (
              <div key={idx} className="flex gap-1 items-center bg-slate-900 p-1 rounded border border-slate-800 text-xs">
                <input
                  type="text"
                  value={p.number}
                  onChange={(e) => {
                    const newR = [...roster];
                    newR[idx].number = e.target.value;
                    setRoster(newR);
                  }}
                  className="w-7 bg-slate-950 text-amber-400 font-black text-xs p-0.5 rounded text-center border border-slate-700"
                />
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => {
                    const newR = [...roster];
                    newR[idx].name = e.target.value;
                    setRoster(newR);
                  }}
                  className="w-full bg-slate-950 text-slate-100 font-bold text-xs p-0.5 rounded border border-slate-700 truncate"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Scoreboard Status Bar */}
      <ScoreboardHeader
        selectedPlayer={selectedPlayer}
        events={events}
        currentQuarter={currentQuarter}
        setCurrentQuarter={setCurrentQuarter}
        onUndo={handleUndo}
      />

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'LIVE' && (
          <div className="grid grid-cols-12 gap-2 h-full">
            <div className="col-span-3 h-full overflow-hidden">
              <PlayerSelector
                roster={roster}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
                events={events}
              />
            </div>

            <div className="col-span-6 h-full overflow-y-auto space-y-2 pr-0.5">
              <CourtPitchMap
                selectedPlayer={selectedPlayer}
                selectedZoneKey={selectedZoneKey}
                onSelectZone={setSelectedZoneKey}
                events={events}
              />

              <ActionClusters
                selectedZoneKey={selectedZoneKey}
                onRecordShot={handleRecordShot}
                onRecordAction={handleRecordAction}
              />
            </div>

            <div className="col-span-3 h-full overflow-hidden">
              <PlayLogFeed events={events} />
            </div>
          </div>
        )}

        {activeTab === 'BOXSCORE' && (
          <div className="h-full overflow-y-auto">
            <BoxScoreTable roster={roster} events={events} />
          </div>
        )}
      </div>
    </div>
  );
}
