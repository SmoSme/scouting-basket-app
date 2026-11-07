import React from 'react';
import { Target, Crosshair, Shield, Zap, AlertCircle, Check, X, Sparkles, Layers, Ghost } from 'lucide-react';
import { COURT_ZONES } from '../data/roster.js';

export default function ActionClusters({
  selectedZoneKey,
  onRecordShot,
  onRecordAction,
  disabled = false
}) {
  const currentZone = COURT_ZONES[selectedZoneKey] || COURT_ZONES.PAINT;

  return (
    <div className={`space-y-1.5 transition-opacity duration-150 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      {/* CLUSTER 1: FIELD GOALS */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-[#0CA17A]" />
            <span>1. FIELD GOAL — TARGET ZONE: {currentZone.name.toUpperCase()} ({currentZone.type})</span>
          </div>
          {disabled && (
            <span className="text-[9px] font-bold text-[#0CA17A] tracking-wider animate-pulse uppercase">
              REGISTRAZIONE...
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordShot(true)}
            disabled={disabled}
            className="action-btn-dense btn-made-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            SHOT MADE ({currentZone.type})
          </button>
          <button
            onClick={() => onRecordShot(false)}
            disabled={disabled}
            className="action-btn-dense btn-miss-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            SHOT MISSED ({currentZone.type})
          </button>
        </div>
      </div>

      {/* CLUSTER 2: FREE THROWS */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Crosshair className="w-3 h-3 text-[#0CA17A]" />
          2. FREE THROWS (FT)
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('FT Made', 'Shot')}
            disabled={disabled}
            className="action-btn-dense btn-ft-made-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            FT MADE
          </button>
          <button
            onClick={() => onRecordAction('FT Missed', 'Shot')}
            disabled={disabled}
            className="action-btn-dense btn-ft-miss-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            FT MISSED
          </button>
        </div>
      </div>

      {/* CLUSTER 3: POSSESSION & DEFENSE */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Zap className="w-3 h-3 text-[#0CA17A]" />
          3. POSSESSION & DEFENSE
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onRecordAction('Steal', 'Defense')}
            disabled={disabled}
            className="action-btn-dense btn-stl-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            STEAL (STL)
          </button>
          <button
            onClick={() => onRecordAction('Turnover', 'Turnover')}
            disabled={disabled}
            className="action-btn-dense btn-tov-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            TURNOVER (TOV)
          </button>
          <button
            onClick={() => onRecordAction('Block', 'Defense')}
            disabled={disabled}
            className="action-btn-dense btn-blk-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            BLOCK (BLK)
          </button>
        </div>
      </div>

      {/* CLUSTER 4: REBOUNDS */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Shield className="w-3 h-3 text-amber-700" />
          4. REBOUNDS
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('Off Rebound', 'Rebound')}
            disabled={disabled}
            className="action-btn-dense btn-oreb-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            OFF REB
          </button>
          <button
            onClick={() => onRecordAction('Def Rebound', 'Rebound')}
            disabled={disabled}
            className="action-btn-dense btn-dreb-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            DEF REB
          </button>
        </div>
      </div>

      {/* CLUSTER 5: FOULS */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <AlertCircle className="w-3 h-3 text-rose-700" />
          5. FOULS & DRAWN FOULS
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('Personal Foul', 'Foul')}
            disabled={disabled}
            className="action-btn-dense btn-foul-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PERSONAL FOUL (PF)
          </button>
          <button
            onClick={() => onRecordAction('Foul Drawn', 'Foul')}
            disabled={disabled}
            className="action-btn-dense btn-fd-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            FOUL DRAWN (FD)
          </button>
        </div>
      </div>

      {/* CLUSTER 6: TACTICAL TECHNIQUES */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Sparkles className="w-3 h-3 text-purple-700" />
          6. TACTICAL TECHNIQUES
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('Stagger', 'Technique')}
            disabled={disabled}
            className="action-btn-dense btn-tactics-stagger disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
            STAGGER
          </button>
          <button
            onClick={() => onRecordAction('Ghost', 'Technique')}
            disabled={disabled}
            className="action-btn-dense btn-tactics-ghost disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Ghost className="w-3.5 h-3.5 stroke-[2.5]" />
            GHOST
          </button>
        </div>
      </div>
    </div>
  );
}
