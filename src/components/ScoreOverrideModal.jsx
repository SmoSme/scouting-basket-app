import React, { useState, useEffect } from 'react';
import { Edit3, Check, RotateCcw, X, AlertCircle, Shield } from 'lucide-react';

export default function ScoreOverrideModal({
  isOpen,
  onClose,
  matchName,
  pbpTeamScore = 0,
  pbpOppScore = 0,
  currentOverrideTeamScore = null,
  currentOverrideOppScore = null,
  onSaveOverride,
  onClearOverride
}) {
  const [teamInput, setTeamInput] = useState('');
  const [oppInput, setOppInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTeamInput(
        currentOverrideTeamScore !== null && currentOverrideTeamScore !== undefined
          ? String(currentOverrideTeamScore)
          : String(pbpTeamScore)
      );
      setOppInput(
        currentOverrideOppScore !== null && currentOverrideOppScore !== undefined
          ? String(currentOverrideOppScore)
          : String(pbpOppScore)
      );
      setErrorMsg('');
    }
  }, [isOpen, currentOverrideTeamScore, currentOverrideOppScore, pbpTeamScore, pbpOppScore]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const tVal = teamInput.trim();
    const oVal = oppInput.trim();

    const tNum = tVal === '' ? null : Number(tVal);
    const oNum = oVal === '' ? null : Number(oVal);

    if (tNum !== null && (isNaN(tNum) || tNum < 0)) {
      setErrorMsg('BBA score must be a positive number');
      return;
    }
    if (oNum !== null && (isNaN(oNum) || oNum < 0)) {
      setErrorMsg('Opponent score must be a positive number');
      return;
    }

    onSaveOverride(tNum, oNum);
    onClose();
  };

  const handleClear = () => {
    onClearOverride();
    onClose();
  };

  const hasActiveOverride = currentOverrideTeamScore !== null || currentOverrideOppScore !== null;

  return (
    <div className="fixed inset-0 z-50 bg-[#022D32]/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white border border-[#DDF3E9] rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 space-y-4 text-[#022D32]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-[#0CA17A]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#022D32] uppercase tracking-wider">
                OVERRIDE OFFICIAL SCORE
              </h3>
              <p className="text-[11px] text-[#022D32]/70">
                Sincronizza il tabellone con il referto ufficiale del tavolo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#022D32]/60 hover:text-[#022D32] p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Note */}
        <div className="bg-[#DDF3E9] p-3.5 rounded-xl border border-[#C6E8DB] text-[11px] text-[#022D32] space-y-1">
          <div className="flex items-center gap-1.5 text-[#022D32] font-black uppercase tracking-wider text-[10px]">
            <Shield className="w-3.5 h-3.5 text-[#0CA17A]" />
            <span>PLAY-BY-PLAY GROUND TRUTH PRESERVED</span>
          </div>
          <p className="text-[#022D32]/80 leading-relaxed">
            Questo override sincronizza il risultato finale senza modificare o cancellare il dettaglio delle singole azioni registrate.
          </p>
          <div className="pt-1.5 text-[11px] text-[#022D32]/70 flex items-center justify-between border-t border-[#C6E8DB] mt-1.5">
            <span>Calcolato dal campo:</span>
            <span className="font-mono font-black text-[#022D32]">
              BBA {pbpTeamScore} - {pbpOppScore} OPP
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Inputs */}
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#022D32] mb-1">
                BBA SCORE (OURS)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#DDF3E9] focus:border-[#0CA17A] text-[#022D32] font-mono font-black text-xl p-2.5 rounded-xl text-center focus:outline-none shadow-xs"
                placeholder={String(pbpTeamScore)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#022D32]/70 mb-1">
                OPPONENT SCORE
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={oppInput}
                onChange={(e) => setOppInput(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#DDF3E9] focus:border-[#0CA17A] text-[#022D32] font-mono font-black text-xl p-2.5 rounded-xl text-center focus:outline-none shadow-xs"
                placeholder={String(pbpOppScore)}
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {hasActiveOverride && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-all active:scale-95 border border-rose-200 cursor-pointer"
                title="Rimuovi override e ripristina calcolo play-by-play"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RIPRISTINA</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>SALVA RISULTATO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
