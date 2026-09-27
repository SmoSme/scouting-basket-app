import React from 'react';
import { History } from 'lucide-react';

export default function PlayLogFeed({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="glass-card p-3 text-center text-slate-500 font-semibold text-xs border-slate-800">
        No play events logged yet.
      </div>
    );
  }

  const reversedEvents = [...events].reverse().slice(0, 8);

  return (
    <div className="glass-card p-2.5 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 mb-1.5 flex-none">
        <History className="w-3.5 h-3.5 text-sky-500" />
        <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
          LIVE PLAY STREAM AUDIT TRAIL
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {reversedEvents.map((ev, idx) => {
          const isSuccess = ev.Azione.includes('Fatto');
          const isNegative = ev.Azione.includes('Sbagliato') || ev.Azione.includes('Persa');
          const badgeColor = isSuccess ? '#10B981' : (isNegative ? '#EF4444' : '#38BDF8');

          return (
            <div
              key={idx}
              className="bg-slate-900/90 border-l-4 rounded p-1.5 px-2 text-xs"
              style={{ borderLeftColor: badgeColor }}
            >
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{ev.Timestamp} [{ev.Quarto}]</span>
                <span className="truncate max-w-[100px]">{ev.Zona}</span>
              </div>
              <div className="font-bold text-slate-100 truncate mt-0.5">
                #{ev.Numero} {ev.Giocatore}
              </div>
              <div className="font-black text-[11px] uppercase tracking-wide" style={{ color: badgeColor }}>
                {ev.Azione}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
