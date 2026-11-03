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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                OVERRIDE OFFICIAL SCORE
              </h3>
              <p className="text-[11px] text-slate-400">
                Sync scoreboard with official referee table
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Note */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider text-[10px]">
            <Shield className="w-3.5 h-3.5" />
            <span>PLAY-BY-PLAY GROUND TRUTH PRESERVED</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            This override synchronizes the official match result without modifying or deleting your detailed play-by-play event log.
          </p>
          <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 mt-1.5">
            <span>Calculated from logged plays:</span>
            <span className="font-mono font-black text-amber-400">
              BBA {pbpTeamScore} - {pbpOppScore} OPP
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-700/60 text-rose-300 p-2 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Inputs */}
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">
                BBA SCORE (OURS)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-amber-400 font-mono font-black text-xl p-2.5 rounded-xl text-center focus:outline-none shadow-inner"
                placeholder={String(pbpTeamScore)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                OPPONENT SCORE
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={oppInput}
                onChange={(e) => setOppInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 text-slate-100 font-mono font-black text-xl p-2.5 rounded-xl text-center focus:outline-none shadow-inner"
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
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 font-black py-2.5 px-3 rounded-xl text-xs transition-all active:scale-95 border border-slate-700"
                title="Remove override and revert to calculated play-by-play score"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>CLEAR</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>SAVE OVERRIDE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
