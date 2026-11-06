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
    <div className="bg-white p-3.5 border border-[#DDF3E9] shadow-xs rounded-2xl space-y-2.5 flex-none text-[#022D32]">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#DDF3E9]">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-rose-700" />
          <h3 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
            OPPONENT POSSESSION
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#022D32]/60 uppercase tracking-wide">
          DEFENSE & OPP OUTCOMES
        </span>
      </div>

      {/* 1. Defense Type Selector */}
      <div className="bg-[#F8F9FA] p-1 rounded-xl border border-[#DDF3E9] flex items-center justify-between gap-1">
        <span className="text-[10px] font-black text-[#022D32]/70 uppercase tracking-wider px-1.5 flex items-center gap-1 flex-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0CA17A] inline-block" />
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
                    ? 'bg-[#0CA17A] text-white font-black shadow-xs'
                    : 'text-[#022D32]/70 hover:text-[#022D32] bg-white'
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
        <div className="bg-[#F8F9FA] p-1.5 rounded-lg border border-[#DDF3E9] space-y-1">
          <div className="text-[10px] font-black text-[#022D32]/70 uppercase text-center tracking-wider">
            2-POINT
          </div>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('2PT', true)}
              className="py-1.5 px-2 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent 2PT Made (+2)"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>+2 MADE</span>
            </button>
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('2PT', false)}
              className="py-1.5 px-2 rounded bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent 2PT Missed & Resolve Rebound"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>MISS</span>
            </button>
          </div>
        </div>

        {/* 3PT Outcome */}
        <div className="bg-[#F8F9FA] p-1.5 rounded-lg border border-[#DDF3E9] space-y-1">
          <div className="text-[10px] font-black text-[#022D32]/70 uppercase text-center tracking-wider">
            3-POINT
          </div>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('3PT', true)}
              className="py-1.5 px-2 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent 3PT Made (+3)"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>+3 MADE</span>
            </button>
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('3PT', false)}
              className="py-1.5 px-2 rounded bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent 3PT Missed & Resolve Rebound"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>MISS</span>
            </button>
          </div>
        </div>

        {/* Free Throw Outcome */}
        <div className="bg-[#F8F9FA] p-1.5 rounded-lg border border-[#DDF3E9] space-y-1">
          <div className="text-[10px] font-black text-[#022D32]/70 uppercase text-center tracking-wider">
            FREE THROW
          </div>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('FT', true)}
              className="py-1.5 px-2 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Log Opponent Free Throw Made (+1)"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>+1 MADE</span>
            </button>
            <button
              type="button"
              onClick={() => onOpponentShot && onOpponentShot('FT', false)}
              className="py-1.5 px-2 rounded bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
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
          className="col-span-8 py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title={`Log Opponent Turnover (tagged with defense scheme: ${defenseType})`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-none" />
          <span>OPP TURNOVER (TOV)</span>
        </button>

        {onRecordOpponentScore && (
          <button
            type="button"
            onClick={() => onRecordOpponentScore(-1)}
            className="col-span-4 py-2 px-2 rounded-lg bg-[#F8F9FA] hover:bg-[#DDF3E9] border border-[#DDF3E9] text-[#022D32] font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
            title="Subtract 1 from Opponent Score"
          >
            <RotateCcw className="w-3 h-3 text-[#022D32]/70" />
            <span>-1 OPP</span>
          </button>
        )}
      </div>
    </div>
  );
}
