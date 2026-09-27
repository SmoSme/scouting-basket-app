import React from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, LayoutDashboard, Archive as ArchiveIcon, Wifi, WifiOff, Edit3, Settings } from 'lucide-react';

export default function Navbar({
  isOnline,
  offlineQueueCount,
  onManualSync,
  gameSession,
  onEditGameSession,
  onToggleRosterModal
}) {
  return (
    <header className="glass-card px-3 py-1.5 mb-1.5 flex items-center justify-between border-slate-800 flex-none">
      {/* Brand & Live Pulse Badge */}
      <div className="flex items-center gap-2.5">
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
              <WifiOff className="w-3 h-3" /> OFFLINE
            </span>
          )}

          {offlineQueueCount > 0 && (
            <button
              onClick={onManualSync}
              className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded animate-bounce shadow"
            >
              📦 {offlineQueueCount} IN CODA (SYNC)
            </button>
          )}
        </div>
      </div>

      {/* Global Navigation Menu Links (React Router NavLink) */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-md transition-all ${
              isActive
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-3 h-3" />
          PARTITA LIVE
        </NavLink>
        <NavLink
          to="/archive"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-md transition-all ${
              isActive
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`
          }
        >
          <ArchiveIcon className="w-3 h-3" />
          ARCHIVIO
        </NavLink>
      </div>

      {/* Active Game Session & Roster Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onEditGameSession}
          className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/50 hover:border-amber-400 text-slate-100 px-2.5 py-1 rounded text-xs font-bold transition-all"
        >
          <span className="text-[10px] text-amber-400 uppercase font-black">PARTITA:</span>
          <span className="truncate max-w-[140px]">{gameSession || 'Partita Senza Nome'}</span>
          <Edit3 className="w-3 h-3 text-amber-400" />
        </button>

        <button
          onClick={onToggleRosterModal}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
        >
          <Settings className="w-3 h-3" />
          ROSTER
        </button>
      </div>
    </header>
  );
}
