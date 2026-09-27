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
          const actionStr = String(ev?.Azione || ev?.azione || '');
          const isSuccess = actionStr.includes('Fatto');
          const isNegative = actionStr.includes('Sbagliato') || actionStr.includes('Persa');
          const badgeColor = isSuccess ? '#10B981' : (isNegative ? '#EF4444' : '#38BDF8');

          const timestamp = ev?.Timestamp || ev?.timestamp || '';
          const quarto = ev?.Quarto || ev?.quarto || '';
          const zona = ev?.Zona || ev?.zona || '';
          const numero = ev?.Numero ?? ev?.numero ?? '';
          const giocatore = ev?.Giocatore || ev?.giocatore || '';

          return (
            <div
              key={ev?.id || idx}
              className="bg-slate-900/90 border-l-4 rounded p-1.5 px-2 text-xs"
              style={{ borderLeftColor: badgeColor }}
            >
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{timestamp} [{quarto}]</span>
                <span className="truncate max-w-[100px]">{zona}</span>
              </div>
              <div className="font-bold text-slate-100 truncate mt-0.5">
                #{numero} {giocatore}
              </div>
              <div className="font-black text-[11px] uppercase tracking-wide" style={{ color: badgeColor }}>
                {actionStr}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
