import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Archive as ArchiveIcon, TrendingUp, Trophy,
  WifiOff, Edit3, Settings, Shield, Lock, LogOut, Languages 
} from 'lucide-react';
import bbaLogo from '../assets/bba-logo.png';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({
  isOnline,
  offlineQueueCount,
  onManualSync,
  gameSession,
  onEditGameSession,
  onToggleRosterModal,
  authRole = 'admin',
  onOpenAuth,
  onLogout
}) {
  const isAdmin = authRole === 'admin';
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-[#022D32] text-white flex-none w-full shadow-lg z-30 select-none border-b-4 border-[#0CA17A]">
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-6 flex-wrap">
        
        {/* ========================================================================= */}
        {/* BRAND & FULLY INTEGRATED LOGO (TOP LEFT)                                 */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 sm:gap-4 flex-none">
          <div className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center flex-none bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
            <img 
              src={bbaLogo} 
              alt="Baronissi Basketball Academy" 
              className="w-full h-full object-contain filter drop-shadow-md" 
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-lg tracking-wider text-white uppercase leading-none">
                {t('app_title')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#A7F3D0]">
                {gameSession ? `${t('app_subtitle_game')}${gameSession}` : t('app_subtitle')}
              </span>
              <span className="text-white/50 text-xs hidden sm:inline">•</span>
              {isOnline ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0CA17A] animate-pulse" />
                  {t('online')}
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-500/30">
                  <WifiOff className="w-2.5 h-2.5" /> {t('offline')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GLOBAL NAVIGATION TABS                                                    */}
        {/* ========================================================================= */}
        <nav className="flex items-center gap-1 bg-[#011C20] p-1 rounded-xl border border-[#0CA17A]/30 shadow-inner order-3 lg:order-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isActive
                  ? 'bg-[#0CA17A] text-white font-black shadow-md'
                  : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5 flex-none" />
            <span>{t('nav_live')}</span>
          </NavLink>
          <NavLink
            to="/archive"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isActive
                  ? 'bg-[#0CA17A] text-white font-black shadow-md'
                  : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <ArchiveIcon className="w-3.5 h-3.5 flex-none" />
            <span>{t('nav_archive')}</span>
          </NavLink>
          <NavLink
            to="/trends"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isActive
                  ? 'bg-[#0CA17A] text-white font-black shadow-md'
                  : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <TrendingUp className="w-3.5 h-3.5 flex-none" />
            <span>{t('nav_trends')}</span>
          </NavLink>
          <NavLink
            to="/league-hub"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isActive
                  ? 'bg-[#0CA17A] text-white font-black shadow-md'
                  : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Trophy className="w-3.5 h-3.5 flex-none" />
            <span>{t('nav_league')}</span>
          </NavLink>
        </nav>

        {/* ========================================================================= */}
        {/* RIGHT CONTROLS & SESSION METADATA                                         */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 flex-none order-2 lg:order-3">
          {/* Language Switcher (IT / EN) */}
          <div className="flex items-center bg-[#011C20] p-0.5 rounded-lg border border-[#0CA17A]/40 shadow-inner">
            <Languages className="w-3.5 h-3.5 text-[#A7F3D0] ml-1.5 mr-0.5 hidden sm:inline" />
            <button
              onClick={() => setLanguage('it')}
              className={`px-2 py-1 text-[11px] font-black rounded transition-all ${
                language === 'it'
                  ? 'bg-[#0CA17A] text-white shadow-sm'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
              title="Passa a Italiano"
            >
              IT
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-[11px] font-black rounded transition-all ${
                language === 'en'
                  ? 'bg-[#0CA17A] text-white shadow-sm'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
              title="Switch to English"
            >
              EN
            </button>
          </div>

          {offlineQueueCount > 0 && (
            <button
              onClick={onManualSync}
              className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-1 rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-1 shadow-sm"
              title="Sync offline queue"
            >
              <span>📦</span>
              <span>{offlineQueueCount} SYNC</span>
            </button>
          )}

          {/* Match Name Display */}
          {isAdmin ? (
            <button
              onClick={onEditGameSession}
              className="flex items-center gap-1.5 bg-[#011C20] border border-[#0CA17A]/40 hover:border-[#0CA17A] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              title="Edit Game Session Name"
            >
              <span className="text-[10px] text-[#A7F3D0] uppercase font-black hidden sm:inline">{t('match')}</span>
              <span className="truncate max-w-[80px] sm:max-w-[120px] text-white font-medium">{gameSession || 'Match'}</span>
              <Edit3 className="w-3 h-3 text-[#A7F3D0] flex-none" />
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-[#011C20] border border-[#0CA17A]/30 px-2.5 py-1.5 rounded-lg text-xs">
              <span className="text-[10px] text-[#A7F3D0] uppercase font-bold hidden sm:inline">{t('match')}</span>
              <span className="truncate max-w-[80px] sm:max-w-[120px] text-white font-bold">{gameSession || 'Match'}</span>
            </div>
          )}

          {/* Coach-only Roster Settings */}
          {isAdmin && (
            <button
              onClick={onToggleRosterModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#011C20] text-emerald-100 hover:text-white hover:bg-white/10 transition-colors border border-[#0CA17A]/40"
              title="Manage Match Roster"
            >
              <Settings className="w-3.5 h-3.5 text-[#0CA17A] flex-none" />
              <span className="hidden sm:inline">{t('roster')}</span>
            </button>
          )}

          {/* Role Status Badge & Switcher */}
          {isAdmin ? (
            <div className="flex items-center gap-1 bg-[#011C20] border border-[#0CA17A]/50 rounded-lg p-0.5 pl-2">
              <span className="text-[10px] font-black text-[#0CA17A] flex items-center gap-1 uppercase tracking-wider">
                <Shield className="w-3 h-3 text-[#0CA17A]" />
                <span className="hidden sm:inline">{t('coach')}</span>
              </span>
              <button
                onClick={onLogout}
                className="p-1 hover:bg-white/10 text-emerald-200 hover:text-white rounded transition-colors ml-1"
                title="Switch role / Logout"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black text-xs px-3 py-1.5 rounded-lg transition-all shadow-md active:scale-95"
              title="Login as Coach to record matches"
            >
              <Lock className="w-3 h-3" />
              <span>{t('coach_login')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIGNATURE SECONDARY ACCENT STRIPE (UNDER BANNER)                           */}
      {/* ========================================================================= */}
      <div className="h-1 sm:h-1.5 bg-[#0CA17A] w-full flex-none shadow-xs" />
    </header>
  );
}
