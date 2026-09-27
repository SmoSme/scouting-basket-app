import React from 'react';
import { Users, CheckCircle2, User } from 'lucide-react';

export default function PlayerSelector({
  roster,
  selectedPlayer,
  onSelectPlayer,
  events
}) {
  return (
    <div className="glass-card p-2 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 flex-none">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-amber-500" />
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
            1. ROSTER (12 PLAYERS)
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {roster.map((player) => {
          const isSelected = selectedPlayer && selectedPlayer.number === player.number;
          
          const playerEvents = events.filter(e => String(e?.Numero ?? e?.numero ?? '') === String(player.number));
          const pts = playerEvents.reduce((acc, ev) => {
            const az = ev?.Azione || ev?.azione || '';
            if (az === '2PT Fatto') return acc + 2;
            if (az === '3PT Fatto') return acc + 3;
            if (az === 'TL Fatto') return acc + 1;
            return acc;
          }, 0);

          return (
            <div
              key={player.number}
              onClick={() => onSelectPlayer(isSelected ? null : player)}
              className={`player-tile-dense ${isSelected ? 'player-tile-active' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 truncate">
                  {isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-black font-black flex-none" />
                  ) : (
                    <User className="w-3 h-3 text-slate-500 flex-none" />
                  )}
                  <span className="font-black text-xs">#{player.number}</span>
                  <span className="font-bold text-xs truncate">{player.name}</span>
                  <span className={`text-[9px] font-bold px-1 rounded flex-none ${isSelected ? 'bg-black text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                    {player.pos}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-none ml-1 ${isSelected ? 'bg-black text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
                  {pts} P
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
