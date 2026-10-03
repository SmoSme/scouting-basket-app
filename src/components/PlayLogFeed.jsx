import React, { useState } from 'react';
import { History, Edit3, Trash2, Check, X } from 'lucide-react';
import { COURT_ZONES } from '../data/roster';

const ACTION_OPTIONS = [
  '2PT Made', '2PT Missed',
  '3PT Made', '3PT Missed',
  'FT Made', 'FT Missed',
  'Steal', 'Turnover',
  'Off Rebound', 'Def Rebound',
  'Assist', 'Personal Foul',
  'Foul Drawn', 'Block', 'Block Allowed',
  'Stagger', 'Ghost'
];

const QUARTER_OPTIONS = ['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2'];

export default function PlayLogFeed({ events, roster = [], onDeleteEvent, onEditEvent }) {
  const [editingKey, setEditingKey] = useState(null);

  // Edit form state
  const [editNum, setEditNum] = useState('');
  const [editName, setEditName] = useState('');
  const [editAction, setEditAction] = useState('');
  const [editQuarter, setEditQuarter] = useState('Q1');
  const [editZone, setEditZone] = useState('');

  if (!events || events.length === 0) {
    return (
      <div className="glass-card p-4 text-center text-slate-500 font-semibold text-xs border-slate-700/60">
        No play events logged yet.
      </div>
    );
  }

  const reversedEvents = [...events].reverse().slice(0, 15);

  const startEditing = (ev, key) => {
    setEditingKey(key);
    setEditNum(String(ev?.Number ?? ev?.number ?? ev?.Numero ?? ev?.numero ?? ''));
    setEditName(ev?.Player || ev?.player || ev?.Giocatore || ev?.giocatore || '');
    setEditAction(ev?.Action || ev?.action || ev?.Azione || ev?.azione || '2PT Made');
    setEditQuarter(ev?.Quarter || ev?.quarter || ev?.Quarto || ev?.quarto || 'Q1');
    setEditZone(ev?.Zone || ev?.zone || ev?.Zona || ev?.zona || 'Paint / Key');
  };

  const handleSaveEdit = (ev, key) => {
    if (!onEditEvent) return;

    // Find player from roster if available
    let finalName = editName;
    if (editNum === '-') {
      finalName = 'TEAM';
    } else {
      const matchedPlayer = roster.find(p => String(p.number) === String(editNum));
      if (matchedPlayer) finalName = matchedPlayer.name;
    }

    const payload = {
      Number: editNum,
      number: editNum,
      Numero: editNum,
      numero: editNum,
      Player: finalName,
      player: finalName,
      Giocatore: finalName,
      giocatore: finalName,
      Action: editAction,
      action: editAction,
      Azione: editAction,
      azione: editAction,
      Quarter: editQuarter,
      quarter: editQuarter,
      Quarto: editQuarter,
      quarto: editQuarter,
      Zone: editZone,
      zone: editZone,
      Zona: editZone,
      zona: editZone
    };

    onEditEvent(ev?.id, events.length - 1 - events.indexOf(ev), payload);
    setEditingKey(null);
  };

  return (
    <div className="glass-card p-2.5 h-full flex flex-col overflow-hidden border-slate-700/60">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 flex-none">
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-sky-400" />
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
            LIVE AUDIT STREAM ({events.length})
          </h2>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold">Hover/Tap to Edit or Delete</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {reversedEvents.map((ev, idx) => {
          const itemKey = ev?.id || `idx-${events.length - 1 - idx}`;
          const isEditing = editingKey === itemKey;

          const actionStr = String(ev?.Action || ev?.action || ev?.Azione || ev?.azione || '');
          const isSuccess = actionStr.includes('Made') || actionStr.includes('Fatto') || actionStr.includes('Steal') || actionStr.includes('Assist');
          const isNegative = actionStr.includes('Missed') || actionStr.includes('Sbagliato') || actionStr.includes('Turnover') || actionStr.includes('Persa');
          let badgeColor = '#0284C7';
          if (isSuccess) badgeColor = '#059669';
          else if (isNegative) badgeColor = '#BE123C';
          else if (actionStr === 'Stagger') badgeColor = '#8B5CF6';
          else if (actionStr === 'Ghost') badgeColor = '#06B6D4';

          const timestamp = ev?.Timestamp || ev?.timestamp || '';
          const quarto = ev?.Quarter || ev?.quarter || ev?.Quarto || ev?.quarto || '';
          const zona = ev?.Zone || ev?.zone || ev?.Zona || ev?.zona || '';
          const numero = ev?.Number ?? ev?.number ?? ev?.Numero ?? ev?.numero ?? '';
          const giocatore = ev?.Player || ev?.player || ev?.Giocatore || ev?.giocatore || '';

          if (isEditing) {
            return (
              <div key={itemKey} className="bg-slate-900 border border-sky-500/60 rounded-md p-2 text-xs space-y-2 shadow-lg">
                <div className="text-[10px] font-black text-sky-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                  EDIT PLAY EVENT
                </div>

                {/* Player Selection Dropdown */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">PLAYER / SQUAD</label>
                  <select
                    value={editNum}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditNum(val);
                      if (val === '-') {
                        setEditName('TEAM');
                      } else {
                        const p = roster.find(r => String(r.number) === String(val));
                        if (p) setEditName(p.name);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-bold p-1 rounded text-xs"
                  >
                    <option value="-">⚡ TEAM (Tactical Screen / Team Play)</option>
                    {roster.map(p => (
                      <option key={p.number} value={p.number}>
                        #{p.number} {p.name}
                      </option>
                    ))}
                    {editNum !== '-' && !roster.some(p => String(p.number) === String(editNum)) && (
                      <option value={editNum}>#{editNum} {editName}</option>
                    )}
                  </select>
                </div>

                {/* Action & Quarter Selection */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">ACTION</label>
                    <select
                      value={editAction}
                      onChange={(e) => setEditAction(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold p-1 rounded text-[11px]"
                    >
                      {ACTION_OPTIONS.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">QUARTER</label>
                    <select
                      value={editQuarter}
                      onChange={(e) => setEditQuarter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-bold p-1 rounded text-[11px]"
                    >
                      {QUARTER_OPTIONS.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Zone Selection */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">ZONE</label>
                  <select
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-bold p-1 rounded text-[11px]"
                  >
                    {Object.values(COURT_ZONES).map(z => (
                      <option key={z.name} value={z.name}>{z.name} ({z.type})</option>
                    ))}
                    <option value="Generic">Generic / Field</option>
                  </select>
                </div>

                {/* Save / Cancel buttons */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleSaveEdit(ev, itemKey)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2 rounded text-xs flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> SAVE
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1 px-2 rounded text-xs flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> CANCEL
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={itemKey}
              className="bg-slate-900/90 border-l-4 rounded-md p-2 text-xs border-r border-t border-b border-slate-800/60 group relative hover:border-slate-700 transition-all"
              style={{ borderLeftColor: badgeColor }}
            >
              <div className="flex justify-between items-start text-[10px] text-slate-400 font-mono">
                <span>{timestamp} [{quarto}]</span>
                <div className="flex items-center gap-1">
                  <span className="truncate max-w-[90px] text-slate-400">{zona}</span>
                  
                  {/* Quick Edit & Delete Actions */}
                  <div className="flex items-center gap-1 ml-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(ev, itemKey)}
                      title="Edit event"
                      className="p-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete event #${numero} ${giocatore} -> ${actionStr}?`)) {
                          onDeleteEvent(ev?.id, events.length - 1 - idx);
                        }
                      }}
                      title="Delete event"
                      className="p-1 rounded bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="font-bold text-slate-100 truncate mt-0.5 flex items-center gap-1.5">
                {numero === '-' || giocatore === 'TEAM' ? (
                  <>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-950/80 text-purple-300 border border-purple-500/40">
                      TEAM PLAY
                    </span>
                    <span className="text-slate-300 text-xs">BBA Squad</span>
                  </>
                ) : (
                  <span>#{numero} {giocatore}</span>
                )}
              </div>

              <div className="font-black text-[11px] uppercase tracking-wide mt-0.5" style={{ color: badgeColor }}>
                {actionStr}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
