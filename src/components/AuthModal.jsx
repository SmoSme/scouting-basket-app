import React, { useState } from 'react';
import { 
  Trophy, Shield, User, Lock, Check, AlertCircle, 
  Eye, EyeOff, ArrowRight, X, Sparkles 
} from 'lucide-react';

export default function AuthModal({ 
  isOpen, 
  currentRole, 
  onLogin, 
  onClose 
}) {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleCoachLogin = (e) => {
    e.preventDefault();
    setError(null);

    const storedPin = localStorage.getItem('bba_coach_pin') || 'bba2026';
    const trimmed = passcode.trim();

    // Accept custom pin, default 'bba2026', or fallback 'coach'
    if (trimmed === storedPin || trimmed.toLowerCase() === 'coach' || trimmed === 'bba2026') {
      onLogin('admin');
      setPasscode('');
    } else {
      setError('Incorrect passcode. Try "coach" or "bba2026"');
    }
  };

  const handleGuestLogin = () => {
    onLogin('guest');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center flex-none">
              <Trophy className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                BBA COURTSIDE ACCESS CONTROL
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Select your role to access the application
              </p>
            </div>
          </div>
          {currentRole && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* OPTION 1: COACH / ADMIN */}
          <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/30 hover:border-sky-500/60 transition-all space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                    COACH / ADMIN LOGIN
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Start new match, scout on court, substitutions & roster management
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800/80 px-2 py-0.5 rounded font-black uppercase flex-none">
                FULL ACCESS
              </span>
            </div>

            <form onSubmit={handleCoachLogin} className="space-y-2.5 pt-1">
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter Coach Passcode (e.g. coach or bba2026)"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 text-slate-100 text-xs px-3 py-2 rounded-lg font-mono placeholder:text-slate-500 focus:outline-none pr-9"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {error && (
                <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 bg-rose-950/40 p-2 rounded border border-rose-900/50">
                  <AlertCircle className="w-3.5 h-3.5 flex-none" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98"
              >
                <Lock className="w-3.5 h-3.5" />
                LOGIN AS COACH
              </button>
            </form>
          </div>

          {/* DIVIDER */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              OR
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* OPTION 2: GUEST / PLAYER */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                    GUEST / PLAYER ACCESS
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Review match archive, player cards, shot heatmaps & box scores
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-black uppercase flex-none">
                READ-ONLY
              </span>
            </div>

            <button
              onClick={handleGuestLogin}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-black text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              CONTINUE AS GUEST (REVIEW STATS)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Role controls protect match data from accidental edits</span>
          {currentRole && (
            <span className="text-slate-400 font-semibold">
              Current: <strong className="text-sky-400 uppercase">{currentRole}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
