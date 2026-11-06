import React, { useState, useRef } from 'react';
import { Users, CheckCircle2, RefreshCw, X, GripVertical, ArrowLeftRight, UserCheck, UserPlus } from 'lucide-react';

export default function PlayerSelector({
  roster,
  onCourtPlayerNums = [],
  selectedPlayer,
  onSelectPlayer,
  onSwapSubstitution,
  events,
  plusMinusMap = {},
  isAdmin = true,
  onOpenRosterModal
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

  // Calculate points, fouls, and plus/minus for a player
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
    const plusMinus = plusMinusMap[String(playerNum)] || 0;
    return { pts, fouls, plusMinus };
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

  // --- TAP-TO-SUB / INSPECT FALLBACK ---
  const handleBenchClick = (benchPlayer) => {
    if (!isAdmin) {
      if (selectedPlayer && String(selectedPlayer.number) === String(benchPlayer.number)) {
        onSelectPlayer(null);
      } else {
        onSelectPlayer(benchPlayer);
      }
      return;
    }
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
    if (isAdmin && subBenchPlayer) {
      // Complete swap initiated from bench player
      onSwapSubstitution(courtPlayer.number, subBenchPlayer.number);
      setSubBenchPlayer(null);
    } else {
      // Toggle active selection for stat recording / inspection
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
    <div className="bg-white p-3 h-full flex flex-col overflow-hidden border border-[#DDF3E9] rounded-2xl shadow-xs text-[#022D32]">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-2 mb-2 flex-none">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#0CA17A]" />
          <h2 className="text-xs font-black text-[#022D32] uppercase tracking-wider">
            LINEUP & SUBSTITUTIONS
          </h2>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-1 text-[10px] text-[#022D32]/80 font-bold bg-[#F8F9FA] px-2 py-0.5 rounded-lg border border-[#DDF3E9]">
            <ArrowLeftRight className="w-3 h-3 text-[#0CA17A]" />
            <span>DRAG TO SUB</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] font-bold bg-[#DDF3E9] px-2 py-0.5 rounded-lg border border-[#0CA17A]/30 text-[#022D32]">
            <UserCheck className="w-3 h-3 text-[#0CA17A]" />
            <span>TAP TO VIEW STATS</span>
          </div>
        )}
      </div>

      {/* TAP-TO-SUB ACTIVE BANNER (Admin only) */}
      {isAdmin && subBenchPlayer && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-xs flex-none shadow-sm">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 truncate">
            <RefreshCw className="w-3.5 h-3.5 text-amber-700 flex-none" />
            <span className="truncate">
              SUB: #{subBenchPlayer.number} {subBenchPlayer.name} → Select ON-COURT player to replace
            </span>
          </div>
          <button
            onClick={() => setSubBenchPlayer(null)}
            className="text-[#022D32]/65 hover:text-[#022D32] p-0.5 rounded ml-1 flex-none"
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
        <div className="flex flex-col h-full min-h-0 bg-[#F8F9FA] rounded-xl p-2 border border-[#DDF3E9]">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#DDF3E9] flex-none">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-[#022D32]/40" />
              <span className="text-[11px] font-bold text-[#022D32]/65 uppercase tracking-wider">
                BENCH ({benchPlayers.length})
              </span>
              {isAdmin && onOpenRosterModal && (
                <button
                  onClick={onOpenRosterModal}
                  className="text-[9px] font-bold text-[#0CA17A] hover:text-white bg-[#F8F9FA] hover:bg-[#0CA17A] border border-[#DDF3E9] hover:border-[#0CA17A] px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5 active:scale-95 ml-1"
                  title="Add missing or late player to match bench"
                >
                  <UserPlus className="w-2.5 h-2.5" />
                  <span>ADD</span>
                </button>
              )}
            </div>
            <span className="text-[10px] text-[#022D32]/50 font-medium">
              {isAdmin ? 'Drag / Tap' : 'Tap to view'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {benchPlayers.map((player) => {
              const stats = getPlayerStats(player.number);
              const pts = stats?.pts ?? 0;
              const fouls = stats?.fouls ?? 0;
              const plusMinus = stats?.plusMinus ?? plusMinusMap?.[String(player.number)] ?? 0;
              const isSelectedBenchSub = isAdmin && subBenchPlayer && String(subBenchPlayer.number) === String(player.number);
              const isSelectedPlayer = selectedPlayer && String(selectedPlayer.number) === String(player.number);
              const isDragOver = isAdmin && dragOverPlayerNum === String(player.number);
              const isDragging = isAdmin && draggedPlayer && draggedPlayer.number === String(player.number);

              return (
                <div
                  key={player.number}
                  draggable={isAdmin}
                  onDragStart={isAdmin ? (e) => handleDragStart(e, player, 'bench') : undefined}
                  onDragOver={isAdmin ? (e) => handleDragOver(e, player, 'bench') : undefined}
                  onDragLeave={isAdmin ? (e) => handleDragLeave(e, player) : undefined}
                  onDrop={isAdmin ? (e) => handleDrop(e, player, 'bench') : undefined}
                  onDragEnd={isAdmin ? handleDragEnd : undefined}
                  onTouchStart={isAdmin ? () => handleTouchStart(player, 'bench') : undefined}
                  onTouchMove={isAdmin ? handleTouchMove : undefined}
                  onTouchEnd={isAdmin ? handleTouchEnd : undefined}
                  data-player-num={player.number}
                  data-player-source="bench"
                  onClick={() => handleBenchClick(player)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer select-none relative flex flex-col justify-between min-h-[58px] border ${
                    isDragOver
                      ? 'border-dashed border-[#0CA17A] bg-[#DDF3E9]/50'
                      : isSelectedBenchSub
                      ? 'bg-amber-50 border border-amber-500 text-amber-900'
                      : isSelectedPlayer
                      ? 'bg-[#DDF3E9]/60 border border-[#0CA17A] ring-1 ring-[#0CA17A]'
                      : 'bg-white border-[#DDF3E9] hover:border-[#0CA17A] hover:bg-[#F8F9FA]'
                  } ${isDragging ? 'opacity-40 border-dashed border-slate-600' : ''}`}
                >
                  {/* Top Row: Grip Handle, Number, Name */}
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isAdmin && (
                        <GripVertical className="w-3 h-3 text-[#022D32]/40 hover:text-[#022D32]/65 flex-none cursor-grab active:cursor-grabbing" />
                      )}
                      <div className="w-7 h-7 rounded bg-[#F8F9FA] flex items-center justify-center font-mono font-black text-xs text-[#022D32] border border-[#DDF3E9] flex-none">
                        #{player.number}
                      </div>
                      <div className="truncate min-w-0">
                        <div className="font-bold text-xs text-[#022D32] truncate leading-tight">
                          {player.name}
                        </div>
                        <div className="text-[10px] text-[#022D32]/70 font-semibold truncate flex items-center gap-1.5 mt-0.5">
                          {fouls > 0 ? (
                            <span className={fouls >= 5 ? 'text-rose-700 font-black' : fouls === 4 ? 'text-amber-800 font-black' : 'text-[#022D32] font-bold'}>
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

                    {isAdmin ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBenchClick(player);
                        }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors border ${
                          isSelectedBenchSub
                            ? 'bg-[#0CA17A] text-white border-[#0CA17A]'
                            : 'bg-[#F8F9FA] text-[#022D32] border-[#DDF3E9] hover:bg-[#DDF3E9]'
                        }`}
                      >
                        {isSelectedBenchSub ? 'ACTIVE' : 'SUB'}
                      </button>
                    ) : (
                      isSelectedPlayer && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0CA17A] flex-none" />
                      )
                    )}
                  </div>

                  {/* Bottom Row: Points Pill & +/- Badge */}
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#DDF3E9]">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono font-black text-[#022D32] bg-[#F8F9FA] px-1.5 py-0.2 rounded border border-[#DDF3E9]">
                        {pts} PTS
                      </span>
                      <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded border ${
                        (plusMinus || 0) > 0 ? 'text-emerald-800 bg-emerald-100 border-emerald-300' :
                        (plusMinus || 0) < 0 ? 'text-rose-800 bg-rose-100 border-rose-300' :
                        'text-[#022D32] bg-[#F8F9FA] border-[#DDF3E9]'
                      }`} title="Plus/Minus (+/-)">
                        {(plusMinus || 0) > 0 ? `+${plusMinus}` : (plusMinus || 0)}
                      </span>
                    </div>
                    {isDragOver ? (
                      <span className="text-[9px] font-black text-[#022D32] bg-[#DDF3E9] px-1.5 py-0.2 rounded border border-[#0CA17A]/40">
                        ⇄ SWAP
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-[#022D32]/60 uppercase tracking-wider">
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
        <div className="flex flex-col h-full min-h-0 bg-[#F8F9FA] rounded-xl p-2 border border-[#DDF3E9]">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#DDF3E9]/80 flex-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0CA17A]" />
              <span className="text-[11px] font-black text-[#022D32] uppercase tracking-wider">
                ON COURT (5)
              </span>
            </div>
            <span className="text-[10px] text-[#022D32]/65 font-medium">Select to track</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {onCourtPlayers.map((player) => {
              const isSelected = selectedPlayer && String(selectedPlayer.number) === String(player.number);
              const stats = getPlayerStats(player.number);
              const pts = stats?.pts ?? 0;
              const fouls = stats?.fouls ?? 0;
              const plusMinus = stats?.plusMinus ?? plusMinusMap?.[String(player.number)] ?? 0;
              const isPendingSubOut = subBenchPlayer !== null;
              const isTargetForSub = activeSubCourtPlayer && String(activeSubCourtPlayer.number) === String(player.number);
              const isDragOver = dragOverPlayerNum === String(player.number);
              const isDragging = draggedPlayer && draggedPlayer.number === String(player.number);

              return (
                <div key={player.number} className="relative">
                  <div
                    draggable={isAdmin}
                    onDragStart={isAdmin ? (e) => handleDragStart(e, player, 'court') : undefined}
                    onDragOver={isAdmin ? (e) => handleDragOver(e, player, 'court') : undefined}
                    onDragLeave={isAdmin ? (e) => handleDragLeave(e, player) : undefined}
                    onDrop={isAdmin ? (e) => handleDrop(e, player, 'court') : undefined}
                    onDragEnd={isAdmin ? handleDragEnd : undefined}
                    onTouchStart={isAdmin ? () => handleTouchStart(player, 'court') : undefined}
                    onTouchMove={isAdmin ? handleTouchMove : undefined}
                    onTouchEnd={isAdmin ? handleTouchEnd : undefined}
                    data-player-num={player.number}
                    data-player-source="court"
                    onClick={() => handleOnCourtClick(player)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer select-none relative flex flex-col justify-between min-h-[58px] border ${
                      isDragOver
                        ? 'border-dashed border-[#0CA17A] bg-[#DDF3E9]/50'
                        : isSelected
                        ? 'bg-[#DDF3E9]/60 border border-[#0CA17A] ring-2 ring-[#0CA17A] shadow-xs'
                        : 'bg-white border-[#DDF3E9] hover:border-[#0CA17A] hover:bg-[#F8F9FA] border-l-4 border-l-[#0CA17A]'
                    } ${isPendingSubOut ? 'hover:border-amber-400/80' : ''} ${
                      isDragging ? 'opacity-40 border-dashed border-sky-400' : ''
                    }`}
                  >
                    {/* Top Row: Grip Handle, Jersey Number, Player Name & Selection Indicator */}
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isAdmin && (
                          <GripVertical className="w-3 h-3 text-[#022D32]/40 hover:text-[#022D32]/65 flex-none cursor-grab active:cursor-grabbing" />
                        )}
                        <div className="w-7 h-7 rounded bg-[#F8F9FA] flex items-center justify-center font-mono font-black text-xs text-[#022D32] border border-[#DDF3E9] flex-none">
                          #{player.number}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="font-bold text-xs text-[#022D32] truncate leading-tight">
                            {player.name}
                          </div>
                          <div className="text-[10px] text-[#022D32]/70 font-semibold truncate flex items-center gap-1.5 mt-0.5">
                            {fouls > 0 ? (
                              <span className={fouls >= 5 ? 'text-rose-700 font-black' : fouls === 4 ? 'text-amber-800 font-black' : 'text-[#022D32] font-bold'}>
                                {fouls} {fouls === 1 ? 'PF' : 'PFs'}
                              </span>
                            ) : (
                              <span className="text-[#022D32]/60">0 PF</span>
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0CA17A] flex-none" />
                        )}
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDirectSubButtonClick(e, player)}
                            title="Click to select bench replacement"
                            className="p-1 rounded bg-[#F8F9FA] hover:bg-[#DDF3E9] text-[#022D32] transition-colors border border-[#DDF3E9]"
                          >
                            <RefreshCw className="w-3 h-3 text-[#022D32]/80" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Points Pill & Status Badge */}
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#DDF3E9]">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono font-black text-[#022D32] bg-[#F8F9FA] px-1.5 py-0.2 rounded border border-[#DDF3E9]">
                          {pts} PTS
                        </span>
                        <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded border ${
                          (plusMinus || 0) > 0 ? 'text-emerald-800 bg-emerald-100 border-emerald-300' :
                          (plusMinus || 0) < 0 ? 'text-rose-800 bg-rose-100 border-rose-300' :
                          'text-[#022D32] bg-[#F8F9FA] border-[#DDF3E9]'
                        }`} title="Plus/Minus (+/-)">
                          {(plusMinus || 0) > 0 ? `+${plusMinus}` : (plusMinus || 0)}
                        </span>
                      </div>
                      {isDragOver ? (
                        <span className="text-[9px] font-black text-[#022D32] bg-[#DDF3E9] px-1.5 py-0.2 rounded border border-[#0CA17A]/40">
                          ⇄ SWAP
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-[#0CA17A] uppercase tracking-wider">
                          ON COURT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inline Bench Dropdown Menu for Direct Sub Button (Admin only) */}
                  {isAdmin && isTargetForSub && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-[#F8F9FA] border border-[#DDF3E9] rounded-lg shadow-xl space-y-1 z-30">
                      <div className="flex justify-between items-center text-[10px] text-[#022D32]/80 font-bold mb-1 border-b border-[#DDF3E9] pb-1">
                        <span>SUB FOR #{player.number}:</span>
                        <button onClick={() => setActiveSubCourtPlayer(null)} className="text-[#022D32]/65 hover:text-[#022D32]">
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
                            className="w-full bg-white hover:bg-[#DDF3E9]/50 border border-[#DDF3E9] text-[#022D32] text-xs p-1.5 rounded flex items-center justify-between font-medium text-left truncate transition-colors"
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
