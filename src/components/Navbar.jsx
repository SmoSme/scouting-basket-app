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
    <header className="glass-card px-3 py-2 mb-1.5 flex items-center justify-between border-slate-700/60 flex-none">
      {/* Brand & Live Connection Pulse Badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-md">
          <Trophy className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-sm tracking-wider text-slate-100 uppercase">COURTSIDE PRO</span>
          {isOnline ? (
            <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
              <Wifi className="w-3 h-3" /> ONLINE (SUPABASE)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] bg-rose-500/15 text-rose-400 font-extrabold px-2 py-0.5 rounded border border-rose-500/30">
              <WifiOff className="w-3 h-3" /> OFFLINE
            </span>
          )}

          {offlineQueueCount > 0 && (
            <button
              onClick={onManualSync}
              className="text-[10px] bg-amber-400/90 text-slate-950 font-black px-2 py-0.5 rounded animate-bounce shadow hover:bg-amber-300 transition-all"
            >
              📦 {offlineQueueCount} QUEUED (SYNC)
            </button>
          )}
        </div>
      </div>

      {/* Global Navigation Links */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-md transition-all ${
              isActive
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          LIVE GAME
        </NavLink>
        <NavLink
          to="/archive"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-md transition-all ${
              isActive
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`
          }
        >
          <ArchiveIcon className="w-3.5 h-3.5" />
          ARCHIVE
        </NavLink>
      </div>

      {/* Active Game Session & Roster Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onEditGameSession}
          className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 hover:border-sky-400 text-slate-100 px-2.5 py-1 rounded text-xs font-bold transition-all"
        >
          <span className="text-[10px] text-sky-400 uppercase font-black">MATCH:</span>
          <span className="truncate max-w-[140px] text-slate-200">{gameSession || 'Unnamed Match'}</span>
          <Edit3 className="w-3 h-3 text-sky-400" />
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
