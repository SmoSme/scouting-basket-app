import React from 'react';
import { Target, Crosshair, Shield, Zap, AlertCircle, Check, X } from 'lucide-react';
import { COURT_ZONES } from '../data/roster.js';

export default function ActionClusters({
  selectedZoneKey,
  onRecordShot,
  onRecordAction
}) {
  const currentZone = COURT_ZONES[selectedZoneKey];

  return (
    <div className="space-y-1.5">
      {/* CLUSTER 1: FIELD GOALS (Auto-Crossed 2PT/3PT) */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Target className="w-3 h-3 text-amber-500" />
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
          <Crosshair className="w-3 h-3 text-emerald-500" />
          2. FREE THROWS (TL)
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('TL Fatto', 'Tiro')}
            className="action-btn-dense btn-ft-made-bg"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            FT MADE
          </button>
          <button
            onClick={() => onRecordAction('TL Sbagliato', 'Tiro')}
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
          <Zap className="w-3 h-3 text-sky-500" />
          3. POSSESSION & DEFENSE
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onRecordAction('Palla Recuperata', 'Difesa')}
            className="action-btn-dense btn-stl-bg"
          >
            STEAL (STL)
          </button>
          <button
            onClick={() => onRecordAction('Palla Persa', 'Errore')}
            className="action-btn-dense btn-tov-bg"
          >
            TURNOVER (TOV)
          </button>
          <button
            onClick={() => onRecordAction('Stoppata Data', 'Difesa')}
            className="action-btn-dense btn-foul-bg"
          >
            BLOCK (BLK)
          </button>
        </div>
      </div>

      {/* CLUSTER 4: REBOUNDS & PLAYMAKING */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <Shield className="w-3 h-3 text-amber-500" />
          4. REBOUNDS & PLAYMAKING
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onRecordAction('Rimb Offensivo', 'Rimbalzo')}
            className="action-btn-dense btn-reb-bg"
          >
            OFF REBOUND
          </button>
          <button
            onClick={() => onRecordAction('Rimb Difensivo', 'Rimbalzo')}
            className="action-btn-dense btn-reb-bg"
          >
            DEF REBOUND
          </button>
          <button
            onClick={() => onRecordAction('Assist', 'Passaggio')}
            className="action-btn-dense btn-ast-bg"
          >
            ASSIST (AST)
          </button>
        </div>
      </div>

      {/* CLUSTER 5: FOULS */}
      <div className="cluster-panel-dense">
        <div className="cluster-header-title">
          <AlertCircle className="w-3 h-3 text-rose-500" />
          5. FOULS & DRAWN FOULS
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onRecordAction('Fallo Fatto', 'Fallo')}
            className="action-btn-dense btn-foul-bg"
          >
            PERSONAL FOUL (PF)
          </button>
          <button
            onClick={() => onRecordAction('Fallo Subito', 'Fallo')}
            className="action-btn-dense btn-ast-bg"
          >
            FOUL DRAWN (FD)
          </button>
        </div>
      </div>
    </div>
  );
}
