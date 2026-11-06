import React, { useState } from 'react';
import { 
  Trophy, Shield, User, Lock, Check, AlertCircle, 
  Eye, EyeOff, ArrowRight, X, Sparkles 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AuthModal({ 
  isOpen, 
  currentRole, 
  onLogin, 
  onClose 
}) {
  const { t } = useLanguage();
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
    if (trimmed === storedPin || trimmed === 'bba2026') {
      onLogin('admin');
      setPasscode('');
    } else {
      setError(t('incorrect_passcode'));
    }
  };

  const handleGuestLogin = () => {
    onLogin('guest');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022D32]/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-[#DDF3E9] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 border-b border-[#022D32]/10 bg-[#022D32] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0CA17A]/20 border border-[#0CA17A]/40 flex items-center justify-center flex-none text-[#0CA17A]">
              <Trophy className="w-4 h-4 text-[#0CA17A]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                {t('auth_title')}
              </h2>
              <p className="text-[11px] text-[#A7F3D0] font-semibold">
                {t('auth_subtitle')}
              </p>
            </div>
          </div>
          {currentRole && (
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title={t('close')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 bg-[#F8F9FA]">
          
          {/* OPTION 1: COACH / ADMIN */}
          <div className="bg-white p-4 rounded-xl border-2 border-[#0CA17A] shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#DDF3E9] flex items-center justify-center text-[#0CA17A]">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                    {t('coach_card_title')}
                  </h3>
                  <p className="text-[11px] text-[#022D32]/70 font-medium">
                    {t('coach_card_desc')}
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-[#022D32] text-[#A7F3D0] border border-[#022D32] px-2 py-0.5 rounded font-black uppercase flex-none">
                {t('full_access')}
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
                  placeholder={t('passcode_placeholder')}
                  className="w-full bg-[#F8F9FA] border border-[#DDF3E9] focus:border-[#0CA17A] text-[#022D32] text-xs px-3 py-2 rounded-lg font-mono placeholder:text-[#022D32]/40 focus:outline-none pr-9"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#022D32]/50 hover:text-[#022D32]"
                >
                  {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {error && (
                <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2 rounded border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 flex-none" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#022D32] hover:bg-[#022D32]/90 text-white font-black text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98 border border-[#022D32]"
              >
                <Lock className="w-3.5 h-3.5" />
                {t('login_btn')}
              </button>
            </form>
          </div>

          {/* DIVIDER */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#DDF3E9]"></div>
            <span className="flex-shrink mx-3 text-[#022D32]/40 text-[10px] font-black uppercase tracking-widest">
              {t('or_divider')}
            </span>
            <div className="flex-grow border-t border-[#DDF3E9]"></div>
          </div>

          {/* OPTION 2: GUEST / PLAYER */}
          <div className="bg-white p-4 rounded-xl border border-[#DDF3E9] hover:border-[#0CA17A]/60 shadow-sm transition-all space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#DDF3E9] flex items-center justify-center text-[#022D32]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                    {t('guest_card_title')}
                  </h3>
                  <p className="text-[11px] text-[#022D32]/70 font-medium">
                    {t('guest_card_desc')}
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-[#DDF3E9] text-[#022D32] border border-[#DDF3E9] px-2 py-0.5 rounded font-black uppercase flex-none">
                {t('read_only')}
              </span>
            </div>

            <button
              onClick={handleGuestLogin}
              className="w-full bg-white hover:bg-[#DDF3E9]/50 border-2 border-[#0CA17A] text-[#022D32] font-black text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Eye className="w-3.5 h-3.5 text-[#0CA17A]" />
              {t('continue_guest')}
              <ArrowRight className="w-3.5 h-3.5 text-[#0CA17A]" />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#DDF3E9] bg-white flex items-center justify-between text-[11px] text-[#022D32]/60 font-medium">
          <span>{t('role_protection_hint')}</span>
          {currentRole && (
            <span className="text-[#022D32]/70 font-semibold">
              {t('current_role_label')} <strong className="text-[#0CA17A] uppercase">{currentRole}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
