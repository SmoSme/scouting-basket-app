import React from 'react';
import { Target, Crosshair, Shield, Zap, AlertCircle, Check, X, Sparkles, Layers, Ghost } from 'lucide-react';
import { COURT_ZONES } from '../data/roster.js';

export default function ActionClusters({
  selectedZoneKey,
  onRecordShot,
  onRecordAction
}) {
  const currentZone = COURT_ZONES[selectedZoneKey] || COURT_ZONES.PAINT;

  return (
    <div className="space-y-1.5">
      {/* CLUSTER 1: FIELD GOALS */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Target className="w-3 h-3 text-sky-400" />
          1. FIELD GOAL — TARGET ZONE: {currentZone.name.toUpperCase()} ({currentZone.type})
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordShot(true)}
            className="action-btn-dense btn-made-bg"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            SHOT MADE ({currentZone.type})
          </button>
          <button
            onClick={() => onRecordShot(false)}
            className="action-btn-dense btn-miss-bg"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            SHOT MISSED ({currentZone.type})
          </button>
        </div>
      </div>

      {/* CLUSTER 2: FREE THROWS */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Crosshair className="w-3 h-3 text-emerald-400" />
          2. FREE THROWS (FT)
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('FT Made', 'Shot')}
            className="action-btn-dense btn-ft-made-bg"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            FT MADE
          </button>
          <button
            onClick={() => onRecordAction('FT Missed', 'Shot')}
            className="action-btn-dense btn-ft-miss-bg"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            FT MISSED
          </button>
        </div>
      </div>

      {/* CLUSTER 3: POSSESSION & DEFENSE */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Zap className="w-3 h-3 text-sky-400" />
          3. POSSESSION & DEFENSE
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onRecordAction('Steal', 'Defense')}
            className="action-btn-dense btn-stl-bg"
          >
            STEAL (STL)
          </button>
          <button
            onClick={() => onRecordAction('Turnover', 'Turnover')}
            className="action-btn-dense btn-tov-bg"
          >
            TURNOVER (TOV)
          </button>
          <button
            onClick={() => onRecordAction('Block', 'Defense')}
            className="action-btn-dense btn-stl-bg"
          >
            BLOCK (BLK)
          </button>
        </div>
      </div>

      {/* CLUSTER 4: REBOUNDS & PLAYMAKING */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Shield className="w-3 h-3 text-amber-400" />
          4. REBOUNDS & PLAYMAKING
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onRecordAction('Off Rebound', 'Rebound')}
            className="action-btn-dense btn-reb-bg"
          >
            OFF REBOUND
          </button>
          <button
            onClick={() => onRecordAction('Def Rebound', 'Rebound')}
            className="action-btn-dense btn-reb-bg"
          >
            DEF REBOUND
          </button>
          <button
            onClick={() => onRecordAction('Assist', 'Passing')}
            className="action-btn-dense btn-ast-bg"
          >
            ASSIST (AST)
          </button>
        </div>
      </div>

      {/* CLUSTER 5: FOULS */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          5. FOULS & DRAWN FOULS
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('Personal Foul', 'Foul')}
            className="action-btn-dense btn-foul-bg"
          >
            PERSONAL FOUL (PF)
          </button>
          <button
            onClick={() => onRecordAction('Foul Drawn', 'Foul')}
            className="action-btn-dense btn-ast-bg"
          >
            FOUL DRAWN (FD)
          </button>
        </div>
      </div>

      {/* CLUSTER 6: TACTICAL TECHNIQUES (STAGGER & GHOST) */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Sparkles className="w-3 h-3 text-purple-400" />
          6. TACTICAL TECHNIQUES
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('Stagger', 'Technique')}
            className="action-btn-dense btn-tactics-stagger"
          >
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
            STAGGER
          </button>
          <button
            onClick={() => onRecordAction('Ghost', 'Technique')}
            className="action-btn-dense btn-tactics-ghost"
          >
            <Ghost className="w-3.5 h-3.5 stroke-[2.5]" />
            GHOST
          </button>
        </div>
      </div>
    </div>
  );
}
