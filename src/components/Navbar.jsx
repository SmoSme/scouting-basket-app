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
    <header className="glass-card px-3 py-1.5 mb-2 flex items-center justify-between border-slate-800 flex-none">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <div className="w-6 h-6 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center flex-none">
          <Trophy className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-bold text-xs tracking-wider text-slate-100 uppercase hidden sm:inline">
            BBA COURTSIDE ANALYTICS
          </span>
          <span className="font-bold text-xs tracking-wider text-slate-100 uppercase sm:hidden">
            BBA
          </span>
          {isOnline ? (
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-emerald-950/50 text-emerald-400 font-medium px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/30 flex-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ONLINE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-rose-950/50 text-rose-400 font-medium px-1.5 sm:px-2 py-0.5 rounded border border-rose-500/30 flex-none">
              <WifiOff className="w-3 h-3" /> OFFLINE
            </span>
          )}

          {offlineQueueCount > 0 && (
            <button
              onClick={onManualSync}
              className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold px-1.5 sm:px-2 py-0.5 rounded hover:bg-amber-500/30 transition-colors flex-none"
            >
              📦 {offlineQueueCount}
            </button>
          )}
        </div>
      </div>

      {/* Global Navigation Tabs */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-xs font-semibold rounded transition-colors ${
              isActive
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`
          }
        >
          <LayoutDashboard className="w-3.5 h-3.5 flex-none" />
          <span className="hidden xs:inline">LIVE</span> GAME
        </NavLink>
        <NavLink
          to="/archive"
          className={({ isActive }) =>
            `flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-xs font-semibold rounded transition-colors ${
              isActive
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`
          }
        >
          <ArchiveIcon className="w-3.5 h-3.5 flex-none" />
          <span className="hidden xs:inline">ARCHIVE</span>
        </NavLink>
      </div>

      {/* Active Game Session & Roster Management */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onEditGameSession}
          className="flex items-center gap-1 sm:gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 px-2 sm:px-2.5 py-1 rounded text-xs font-semibold transition-colors"
        >
          <span className="text-[10px] text-sky-400 uppercase font-bold hidden sm:inline">MATCH:</span>
          <span className="truncate max-w-[80px] sm:max-w-[150px] text-slate-300">{gameSession || 'Match'}</span>
          <Edit3 className="w-3 h-3 text-slate-400 flex-none" />
        </button>

        <button
          onClick={onToggleRosterModal}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors border border-slate-800 hover:border-slate-700"
        >
          <Settings className="w-3 h-3 text-slate-400 flex-none" />
          <span className="hidden sm:inline">ROSTER</span>
        </button>
      </div>
    </header>
  );
}
