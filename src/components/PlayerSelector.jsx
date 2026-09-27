import React, { useState } from 'react';
import { Users, CheckCircle2, User, RefreshCw, X, AlertCircle } from 'lucide-react';

export default function PlayerSelector({
  roster,
  onCourtPlayerNums = [],
  selectedPlayer,
  onSelectPlayer,
  onSwapSubstitution,
  events
}) {
  const [subBenchPlayer, setSubBenchPlayer] = useState(null); // Bench player selected for substitution
  const [activeSubCourtPlayer, setActiveSubCourtPlayer] = useState(null); // On-Court player selecting bench sub

  const getAz = (e) => String(e?.Azione || e?.azione || '');
  const getNum = (e) => String(e?.Numero ?? e?.numero ?? '');

  // Split roster into ON COURT (5) and BENCH
  const onCourtSet = new Set(onCourtPlayerNums.map(n => String(n)));
  const onCourtPlayers = roster.filter(p => onCourtSet.has(String(p.number)));
  const benchPlayers = roster.filter(p => !onCourtSet.has(String(p.number)));

  // Calculate points scored by a player
  const getPlayerPts = (playerNum) => {
    const playerEvents = events.filter(e => getNum(e) === String(playerNum));
    return playerEvents.reduce((acc, ev) => {
      const az = getAz(ev);
      if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
      if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
      if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
      return acc;
    }, 0);
  };

  const handleOnCourtClick = (player) => {
    // If a bench player is pending substitution IN:
    if (subBenchPlayer) {
      onSwapSubstitution(player.number, subBenchPlayer.number);
      setSubBenchPlayer(null);
      setActiveSubCourtPlayer(null);
      return;
    }

    // Normal selection for field action (shots, rebounds, etc.)
    const isSelected = selectedPlayer && String(selectedPlayer.number) === String(player.number);
    onSelectPlayer(isSelected ? null : player);
  };

  const handleBenchClick = (player) => {
    // If clicking the same bench player, toggle off
    if (subBenchPlayer && String(subBenchPlayer.number) === String(player.number)) {
      setSubBenchPlayer(null);
    } else {
      setSubBenchPlayer(player);
      setActiveSubCourtPlayer(null);
    }
  };

  const handleDirectSubButtonClick = (e, courtPlayer) => {
    e.stopPropagation();
    if (activeSubCourtPlayer && String(activeSubCourtPlayer.number) === String(courtPlayer.number)) {
      setActiveSubCourtPlayer(null);
    } else {
      setActiveSubCourtPlayer(courtPlayer);
      setSubBenchPlayer(null);
    }
  };

  return (
    <div className="glass-card p-2.5 h-full flex flex-col overflow-hidden border-slate-700/60">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 flex-none">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
            SQUAD ROSTER ({onCourtPlayers.length} COURT / {benchPlayers.length} BENCH)
          </h2>
        </div>
      </div>

      {/* SUB IN BANNER (When a bench player is selected for substitution) */}
      {subBenchPlayer && (
        <div className="mb-2 p-2 bg-amber-400/20 border border-amber-400/50 rounded-lg flex items-center justify-between text-xs animate-pulse flex-none">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 truncate">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 flex-none" />
            <span className="truncate">SUB IN: #{subBenchPlayer.number} {subBenchPlayer.name} ➔ Tap an ON-COURT player to sub OUT</span>
          </div>
          <button
            onClick={() => setSubBenchPlayer(null)}
            className="text-amber-400 hover:text-white p-0.5 rounded ml-1 flex-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SCROLLABLE ROSTER CONTAINER */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        
        {/* SECTION 1: 🏀 ON COURT (5 PLAYERS - ACTIVE FOR ACTIONS) */}
        <div>
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              ON COURT ({onCourtPlayers.length})
            </span>
            <span className="text-[9px] text-slate-400 font-bold">Select for game actions</span>
          </div>

          <div className="space-y-1">
            {onCourtPlayers.map((player) => {
              const isSelected = selectedPlayer && String(selectedPlayer.number) === String(player.number);
              const pts = getPlayerPts(player.number);
              const isPendingSubOut = subBenchPlayer !== null;
              const isTargetForSub = activeSubCourtPlayer && String(activeSubCourtPlayer.number) === String(player.number);

              return (
                <div key={player.number} className="relative">
                  <div
                    onClick={() => handleOnCourtClick(player)}
                    className={`player-tile-dense transition-all relative ${
                      isSelected ? 'player-tile-active' : 'bg-slate-900 border-emerald-500/40 border-l-4 border-l-emerald-500 hover:border-emerald-400'
                    } ${isPendingSubOut ? 'hover:bg-amber-400/20 hover:border-amber-400' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 truncate">
                        {isSelected ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 font-black flex-none" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-emerald-400 flex-none" />
                        )}
                        <span className="font-mono font-black text-xs text-sky-400">#{player.number}</span>
                        <span className="font-bold text-xs text-slate-100 truncate">{player.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-none ml-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          isSelected ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-950 text-slate-300 border border-slate-800'
                        }`}>
                          {pts} PTS
                        </span>

                        {/* Quick Substitution Button */}
                        <button
                          onClick={(e) => handleDirectSubButtonClick(e, player)}
                          title="Sub this player"
                          className="text-[10px] bg-slate-800 hover:bg-amber-500/30 hover:border-amber-400 text-slate-300 hover:text-amber-300 font-bold px-1.5 py-0.5 rounded border border-slate-700 transition-all flex items-center gap-0.5"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-400" />
                          <span className="text-[9px]">SUB</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Bench Dropdown Menu for Direct Sub Button */}
                  {isTargetForSub && (
                    <div className="mt-1 p-2 bg-slate-950 border border-amber-500/60 rounded-lg shadow-xl space-y-1 z-10">
                      <div className="flex justify-between items-center text-[10px] text-amber-400 font-bold mb-1 border-b border-slate-800 pb-1">
                        <span>SELECT BENCH PLAYER TO SUB IN FOR #{player.number}:</span>
                        <button onClick={() => setActiveSubCourtPlayer(null)} className="text-slate-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto">
                        {benchPlayers.map((benchP) => (
                          <button
                            key={benchP.number}
                            onClick={() => {
                              onSwapSubstitution(player.number, benchP.number);
                              setActiveSubCourtPlayer(null);
                            }}
                            className="bg-slate-900 hover:bg-sky-500/20 border border-slate-800 hover:border-sky-400 text-slate-200 text-xs p-1.5 rounded flex items-center justify-between font-bold text-left truncate"
                          >
                            <span className="truncate">#{benchP.number} {benchP.name}</span>
                            <RefreshCw className="w-3 h-3 text-sky-400 flex-none" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: 🪑 BENCH PLAYERS (DISABLED FOR DIRECT ACTION INPUT, CLICK TO SUB) */}
        <div>
          <div className="flex items-center justify-between mb-1 px-1 border-t border-slate-800/80 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
              BENCH ({benchPlayers.length})
            </span>
            <span className="text-[9px] text-slate-500 font-bold">Tap bench player to SUB IN</span>
          </div>

          <div className="space-y-1">
            {benchPlayers.map((player) => {
              const pts = getPlayerPts(player.number);
              const isSelectedBenchSub = subBenchPlayer && String(subBenchPlayer.number) === String(player.number);

              return (
                <div
                  key={player.number}
                  onClick={() => handleBenchClick(player)}
                  className={`player-tile-dense transition-all ${
                    isSelectedBenchSub
                      ? 'bg-amber-400/20 border-amber-400 border-l-4 border-l-amber-400 shadow-lg text-amber-200'
                      : 'bg-slate-950/70 border-slate-800/80 border-l-3 border-l-slate-700 opacity-75 hover:opacity-100 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3 h-3 text-slate-500 flex-none" />
                      <span className="font-mono font-bold text-xs text-slate-400">#{player.number}</span>
                      <span className="font-semibold text-xs text-slate-300 truncate">{player.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-none ml-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {pts} PTS
                      </span>

                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded transition-all ${
                        isSelectedBenchSub
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-amber-300'
                      }`}>
                        {isSelectedBenchSub ? '⇄ SUB IN' : 'SUB'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
