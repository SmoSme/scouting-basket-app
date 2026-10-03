import React, { useState, useRef } from 'react';
import { Users, CheckCircle2, RefreshCw, X, GripVertical, ArrowLeftRight } from 'lucide-react';

export default function PlayerSelector({
  roster,
  onCourtPlayerNums = [],
  selectedPlayer,
  onSelectPlayer,
  onSwapSubstitution,
  events
}) {
  const [subBenchPlayer, setSubBenchPlayer] = useState(null); // Bench player selected for tap substitution
  const [activeSubCourtPlayer, setActiveSubCourtPlayer] = useState(null); // On-Court player selecting bench sub menu
  const [draggedPlayer, setDraggedPlayer] = useState(null); // { number, source: 'court' | 'bench' }
  const [dragOverPlayerNum, setDragOverPlayerNum] = useState(null); // number of player hovered over

  const touchDragRef = useRef({ number: null, source: null });

  const getAz = (e) => String(e?.Action || e?.action || e?.Azione || e?.azione || '');
  const getNum = (e) => String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '');

  // Split roster into ON COURT (5) and BENCH
  const onCourtSet = new Set(onCourtPlayerNums.map(n => String(n)));
  const onCourtPlayers = roster.filter(p => onCourtSet.has(String(p.number)));
  const benchPlayers = roster.filter(p => !onCourtSet.has(String(p.number)));

  // Calculate points and fouls for a player
  const getPlayerStats = (playerNum) => {
    const playerEvents = (events || []).filter(e => getNum(e) === String(playerNum));
    const pts = playerEvents.reduce((acc, ev) => {
      const az = getAz(ev);
      if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
      if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
      if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
      return acc;
    }, 0);
    const fouls = playerEvents.filter(e => {
      const az = getAz(e);
      return az === 'Personal Foul' || az === 'Fallo Fatto';
    }).length;
    return { pts, fouls };
  };

  // --- DRAG & DROP LOGIC (HTML5 for Desktop & Mouse) ---
  const handleDragStart = (e, player, source) => {
    const data = { number: String(player.number), source };
    setDraggedPlayer(data);
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetPlayer, targetSource) => {
    if (!draggedPlayer) return;
    // Allow drop only if dragging across different zones (court <-> bench)
    if (draggedPlayer.source !== targetSource) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverPlayerNum !== String(targetPlayer.number)) {
        setDragOverPlayerNum(String(targetPlayer.number));
      }
    }
  };

  const handleDragLeave = (e, targetPlayer) => {
    if (dragOverPlayerNum === String(targetPlayer.number)) {
      setDragOverPlayerNum(null);
    }
  };

  const handleDrop = (e, targetPlayer, targetSource) => {
    e.preventDefault();
    setDragOverPlayerNum(null);

    let sourceData = draggedPlayer;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) sourceData = JSON.parse(raw);
    } catch (err) {}

    if (!sourceData || sourceData.source === targetSource) return;

    const targetNum = String(targetPlayer.number);
    const draggedNum = String(sourceData.number);

    if (sourceData.source === 'bench' && targetSource === 'court') {
      onSwapSubstitution(targetNum, draggedNum);
    } else if (sourceData.source === 'court' && targetSource === 'bench') {
      onSwapSubstitution(draggedNum, targetNum);
    }

    setDraggedPlayer(null);
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
    setDragOverPlayerNum(null);
  };

  // --- TOUCH DRAG LOGIC (TABLETS / MOBILE TOUCH) ---
  const handleTouchStart = (player, source) => {
    touchDragRef.current = { number: String(player.number), source };
  };

  const handleTouchMove = (e) => {
    if (!touchDragRef.current.number) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardElem = elem?.closest('[data-player-num]');
    if (cardElem) {
      const num = cardElem.getAttribute('data-player-num');
      const source = cardElem.getAttribute('data-player-source');
      if (source && source !== touchDragRef.current.source) {
        setDragOverPlayerNum(num);
      } else {
        setDragOverPlayerNum(null);
      }
    } else {
      setDragOverPlayerNum(null);
    }
  };

  const handleTouchEnd = () => {
    if (touchDragRef.current.number && dragOverPlayerNum) {
      const draggedNum = touchDragRef.current.number;
      const targetNum = dragOverPlayerNum;
      const draggedSource = touchDragRef.current.source;

      if (draggedSource === 'bench') {
        onSwapSubstitution(targetNum, draggedNum);
      } else if (draggedSource === 'court') {
        onSwapSubstitution(draggedNum, targetNum);
      }
    }
    touchDragRef.current = { number: null, source: null };
    setDragOverPlayerNum(null);
  };

  // --- TAP-TO-SUB FALLBACK ---
  const handleBenchClick = (benchPlayer) => {
    if (activeSubCourtPlayer) {
      // Complete swap initiated from an on-court player
      onSwapSubstitution(activeSubCourtPlayer.number, benchPlayer.number);
      setActiveSubCourtPlayer(null);
      setSubBenchPlayer(null);
    } else if (subBenchPlayer && String(subBenchPlayer.number) === String(benchPlayer.number)) {
      setSubBenchPlayer(null); // Deselect if tapped again
    } else {
      setSubBenchPlayer(benchPlayer);
    }
  };

  const handleOnCourtClick = (courtPlayer) => {
    if (subBenchPlayer) {
      // Complete swap initiated from bench player
      onSwapSubstitution(courtPlayer.number, subBenchPlayer.number);
      setSubBenchPlayer(null);
    } else {
      // Toggle active selection for stat recording
      if (selectedPlayer && String(selectedPlayer.number) === String(courtPlayer.number)) {
        onSelectPlayer(null);
      } else {
        onSelectPlayer(courtPlayer);
      }
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
    <div className="glass-card p-2.5 h-full flex flex-col overflow-hidden border-slate-800">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 flex-none">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            LINEUP & SUBSTITUTIONS
          </h2>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          <ArrowLeftRight className="w-3 h-3 text-sky-400" />
          <span>DRAG TO SUB</span>
        </div>
      </div>

      {/* TAP-TO-SUB ACTIVE BANNER */}
      {subBenchPlayer && (
        <div className="mb-2 p-2 bg-slate-900 border border-amber-500/50 rounded-lg flex items-center justify-between text-xs flex-none shadow-sm">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300 truncate">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 flex-none" />
            <span className="truncate">
              SUB: #{subBenchPlayer.number} {subBenchPlayer.name} ➔ Select ON-COURT player to replace
            </span>
          </div>
          <button
            onClick={() => setSubBenchPlayer(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded ml-1 flex-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2-COLUMN ROSTER: BENCH (LEFT) & ON COURT (RIGHT) */}
      {/* Placed ON COURT on the right so it is directly adjacent to Court & Action Clusters */}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
        
        {/* ======================================================== */}
        {/* COLUMN 1: BENCH (LEFT)                                   */}
        {/* ======================================================== */}
        <div className="flex flex-col h-full min-h-0 bg-slate-950/40 rounded-lg p-2 border border-slate-850">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/80 flex-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                BENCH ({benchPlayers.length})
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Drag / Tap</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {benchPlayers.map((player) => {
              const { pts, fouls } = getPlayerStats(player.number);
              const isSelectedBenchSub = subBenchPlayer && String(subBenchPlayer.number) === String(player.number);
              const isDragOver = dragOverPlayerNum === String(player.number);
              const isDragging = draggedPlayer && draggedPlayer.number === String(player.number);

              return (
                <div
                  key={player.number}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, player, 'bench')}
                  onDragOver={(e) => handleDragOver(e, player, 'bench')}
                  onDragLeave={(e) => handleDragLeave(e, player)}
                  onDrop={(e) => handleDrop(e, player, 'bench')}
                  onDragEnd={handleDragEnd}
                  onTouchStart={() => handleTouchStart(player, 'bench')}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  data-player-num={player.number}
                  data-player-source="bench"
                  onClick={() => handleBenchClick(player)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer select-none relative flex flex-col justify-between min-h-[58px] border ${
                    isDragOver
                      ? 'border-dashed border-sky-400 bg-sky-950/40'
                      : isSelectedBenchSub
                      ? 'bg-amber-950/40 border border-amber-500/70 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                  } ${isDragging ? 'opacity-40 border-dashed border-slate-600' : ''}`}
                >
                  {/* Top Row: Grip Handle, Number, Name */}
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GripVertical className="w-3 h-3 text-slate-600 hover:text-slate-400 flex-none cursor-grab active:cursor-grabbing" />
                      <div className="w-7 h-7 rounded bg-slate-950 flex items-center justify-center font-mono font-bold text-xs text-slate-300 border border-slate-800 flex-none">
                        #{player.number}
                      </div>
                      <div className="truncate min-w-0">
                        <div className="font-semibold text-xs text-slate-200 truncate leading-tight">
                          {player.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
                          {fouls > 0 ? (
                            <span className={fouls >= 5 ? 'text-rose-400 font-bold' : fouls === 4 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                              {fouls} {fouls === 1 ? 'PF' : 'PFs'}
                            </span>
                          ) : (
                            <span>0 PF</span>
                          )}
                          <span>•</span>
                          <span>Bench</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBenchClick(player);
                      }}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors border ${
                        isSelectedBenchSub
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isSelectedBenchSub ? 'ACTIVE' : 'SUB'}
                    </button>
                  </div>

                  {/* Bottom Row: Points Pill */}
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-950/80 px-1.5 py-0.2 rounded border border-slate-850">
                      {pts} PTS
                    </span>
                    {isDragOver ? (
                      <span className="text-[9px] font-bold text-sky-300 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-500/50">
                        ⇄ SWAP
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">
                        BENCH
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: ON COURT (RIGHT - ADJACENT TO COURT & ACTIONS) */}
        {/* ======================================================== */}
        <div className="flex flex-col h-full min-h-0 bg-slate-950/60 rounded-lg p-2 border border-slate-800">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/80 flex-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                ON COURT (5)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Select to track</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {onCourtPlayers.map((player) => {
              const isSelected = selectedPlayer && String(selectedPlayer.number) === String(player.number);
              const { pts, fouls } = getPlayerStats(player.number);
              const isPendingSubOut = subBenchPlayer !== null;
              const isTargetForSub = activeSubCourtPlayer && String(activeSubCourtPlayer.number) === String(player.number);
              const isDragOver = dragOverPlayerNum === String(player.number);
              const isDragging = draggedPlayer && draggedPlayer.number === String(player.number);

              return (
                <div key={player.number} className="relative">
                  <div
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, player, 'court')}
                    onDragOver={(e) => handleDragOver(e, player, 'court')}
                    onDragLeave={(e) => handleDragLeave(e, player)}
                    onDrop={(e) => handleDrop(e, player, 'court')}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(player, 'court')}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    data-player-num={player.number}
                    data-player-source="court"
                    onClick={() => handleOnCourtClick(player)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer select-none relative flex flex-col justify-between min-h-[58px] border ${
                      isDragOver
                        ? 'border-dashed border-sky-400 bg-sky-950/40'
                        : isSelected
                        ? 'bg-sky-950/50 border border-sky-400 ring-1 ring-sky-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 border-l-2 border-l-emerald-500'
                    } ${isPendingSubOut ? 'hover:border-amber-400/80' : ''} ${
                      isDragging ? 'opacity-40 border-dashed border-sky-400' : ''
                    }`}
                  >
                    {/* Top Row: Grip Handle, Jersey Number, Player Name & Selection Indicator */}
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical className="w-3 h-3 text-slate-600 hover:text-slate-400 flex-none cursor-grab active:cursor-grabbing" />
                        <div className="w-7 h-7 rounded bg-slate-950 flex items-center justify-center font-mono font-bold text-xs text-sky-400 border border-slate-800 flex-none">
                          #{player.number}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="font-semibold text-xs text-slate-100 truncate leading-tight">
                            {player.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                            {fouls > 0 ? (
                              <span className={fouls >= 5 ? 'text-rose-400 font-bold' : fouls === 4 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                                {fouls} {fouls === 1 ? 'PF' : 'PFs'}
                              </span>
                            ) : (
                              <span className="text-slate-500">0 PF</span>
                            )}
                            {player.pos && player.pos !== 'N/A' && (
                              <>
                                <span>•</span>
                                <span>{player.pos}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Selection Check or Sub Button */}
                      <div className="flex items-center gap-1 flex-none">
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-none" />
                        )}
                        <button
                          onClick={(e) => handleDirectSubButtonClick(e, player)}
                          title="Click to select bench replacement"
                          className="p-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/80"
                        >
                          <RefreshCw className="w-3 h-3 text-slate-300" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Points Pill & Status Badge */}
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-950/80 px-1.5 py-0.2 rounded border border-slate-850">
                        {pts} PTS
                      </span>
                      {isDragOver ? (
                        <span className="text-[9px] font-bold text-sky-300 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-500/50">
                          ⇄ SWAP
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
                          ON COURT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inline Bench Dropdown Menu for Direct Sub Button */}
                  {isTargetForSub && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-slate-950 border border-slate-700 rounded-lg shadow-xl space-y-1 z-30">
                      <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold mb-1 border-b border-slate-800 pb-1">
                        <span>SUB FOR #{player.number}:</span>
                        <button onClick={() => setActiveSubCourtPlayer(null)} className="text-slate-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
                        {benchPlayers.map((benchP) => (
                          <button
                            key={benchP.number}
                            onClick={() => {
                              onSwapSubstitution(player.number, benchP.number);
                              setActiveSubCourtPlayer(null);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs p-1.5 rounded flex items-center justify-between font-medium text-left truncate transition-colors"
                          >
                            <span className="truncate">#{benchP.number} {benchP.name}</span>
                            <RefreshCw className="w-3 h-3 text-sky-400 flex-none ml-1" />
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

      </div>
    </div>
  );
}
