import React from 'react';
import { Shield, Check, X, RotateCcw, AlertTriangle } from 'lucide-react';

export default function OpponentPossessionPanel({
  defenseType = 'MAN',
  onDefenseChange,
  onOpponentShot,
  onOpponentTurnover,
  onRecordOpponentScore
}) {
  return (
    <div className="glass-card p-3 border-slate-800 bg-slate-950/70 shadow-md rounded-xl space-y-2.5 flex-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
            OPPONENT POSSESSION
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          DEFENSE & OPP OUTCOMES
        </span>
      </div>

      {/* 1. Defense Type Selector */}
      <div className="bg-slate-900/80 p-1 rounded-lg border border-slate-800 flex items-center justify-between gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1.5 flex items-center gap-1 flex-none">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
          DEF SCHEME:
        </span>
        <div className="flex gap-1 flex-1 justify-end">
          {['MAN', 'ZONE', 'PRESS'].map((scheme) => {
            const isActive = defenseType === scheme;
            return (
              <button
                key={scheme}
                type="button"
                onClick={() => onDefenseChange && onDefenseChange(scheme)}
                className={`px-3 py-1 text-xs font-black rounded-md transition-all ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-sm scale-102'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 hover:bg-slate-800'
                }`}
                title={`Active defensive scheme: ${scheme}`}
              >
                {scheme}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Opponent Outcomes Grid (2PT, 3PT, FT) */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* 2PT Outcome */}
        <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80 space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase text-center tracking-wider">
            2-POINT
          </div>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('2PT', true)}
              className="py-1.5 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent 2PT Made (+2)"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>+2 MADE</span>
            </button>
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('2PT', false)}
              className="py-1.5 px-2 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent 2PT Missed & Resolve Rebound"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>MISS</span>
            </button>
          </div>
        </div>

        {/* 3PT Outcome */}
        <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80 space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase text-center tracking-wider">
            3-POINT
          </div>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('3PT', true)}
              className="py-1.5 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent 3PT Made (+3)"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>+3 MADE</span>
            </button>
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('3PT', false)}
              className="py-1.5 px-2 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent 3PT Missed & Resolve Rebound"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>MISS</span>
            </button>
          </div>
        </div>

        {/* Free Throw Outcome */}
        <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80 space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase text-center tracking-wider">
            FREE THROW
          </div>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('FT', true)}
              className="py-1.5 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent Free Throw Made (+1)"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>+1 MADE</span>
            </button>
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('FT', false)}
              className="py-1.5 px-2 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent Free Throw Missed & Resolve Rebound"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>MISS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Opponent Turnover & Score Correction */}
      <div className="grid grid-cols-12 gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => onOpponentTurnover && onOpponentTurnover()}
          className="col-span-8 py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title={`Log Opponent Turnover (tagged with defense scheme: ${defenseType})`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-none" />
          <span>OPP TURNOVER (TOV)</span>
        </button>

        {onRecordOpponentScore && (
          <button
            type="button"
            onClick={() => onRecordOpponentScore(-1)}
            className="col-span-4 py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
            title="Subtract 1 from Opponent Score"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>-1 OPP</span>
          </button>
        )}
      </div>
    </div>
  );
}
