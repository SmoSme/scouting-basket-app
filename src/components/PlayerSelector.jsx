import React from 'react';
import { Users, CheckCircle2, User } from 'lucide-react';

export default function PlayerSelector({
  roster,
  selectedPlayer,
  onSelectPlayer,
  events
}) {
  const getAz = (e) => String(e?.Azione || e?.azione || '');
  const getNum = (e) => String(e?.Numero ?? e?.numero ?? '');

  return (
    <div className="glass-card p-2.5 h-full flex flex-col overflow-hidden border-slate-700/60">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 flex-none">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
            1. ROSTER ({roster.length} PLAYERS)
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {roster.map((player) => {
          const isSelected = selectedPlayer && String(selectedPlayer.number) === String(player.number);
          
          const playerEvents = events.filter(e => getNum(e) === String(player.number));
          const pts = playerEvents.reduce((acc, ev) => {
            const az = getAz(ev);
            if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
            if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
            if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
            return acc;
          }, 0);

          return (
            <div
              key={player.number}
              onClick={() => onSelectPlayer(isSelected ? null : player)}
              className={`player-tile-dense ${isSelected ? 'player-tile-active' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 truncate">
                  {isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 font-black flex-none" />
                  ) : (
                    <User className="w-3 h-3 text-slate-500 flex-none" />
                  )}
                  <span className="font-mono font-black text-xs text-sky-400">#{player.number}</span>
                  <span className="font-bold text-xs text-slate-100 truncate">{player.name}</span>
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 flex-none">
                    {player.pos}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded flex-none ml-1 ${
                  isSelected ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-950 text-slate-300 border border-slate-800'
                }`}>
                  {pts} PTS
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
