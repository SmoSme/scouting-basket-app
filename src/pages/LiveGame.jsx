import React, { useState, useEffect } from 'react';
import ScoreboardHeader from '../components/ScoreboardHeader';
import PlayerSelector from '../components/PlayerSelector';
import CourtPitchMap from '../components/CourtPitchMap';
import ActionClusters from '../components/ActionClusters';
import BoxScoreTable from '../components/BoxScoreTable';
import PlayLogFeed from '../components/PlayLogFeed';
import { COURT_ZONES } from '../data/roster';
import { Play, CheckSquare, Square, Plus, Users, UserPlus, Trash2, X, ArrowLeftRight, Eye, Shield, Lock } from 'lucide-react';

export default function LiveGame({
  gameSession,
  setGameSession,
  events,
  setEvents,
  masterRoster,
  setMasterRoster,
  roster,
  setRoster,
  onCourtPlayerNums,
  setOnCourtPlayerNums,
  handleSwapSubstitution,
  selectedPlayer,
  setSelectedPlayer,
  selectedZoneKey,
  setSelectedZoneKey,
  currentQuarter,
  setCurrentQuarter,
  showRosterModal,
  setShowRosterModal,
  showSessionModal,
  setShowSessionModal,
  dispatchAction,
  handleUndo,
  handleResetGame,
  onDeleteEvent,
  onEditEvent,
  authRole = 'admin'
}) {
  const isAdmin = authRole === 'admin';
  const [activeTab, setActiveTab] = useState('LIVE'); // 'LIVE' | 'BOXSCORE'
  const [mobileView, setMobileView] = useState('COURT'); // 'COURT' | 'ROSTER' | 'STREAM'
  const [showMobileQuickSub, setShowMobileQuickSub] = useState(false);
  const [quickSubOutNum, setQuickSubOutNum] = useState(null);

  const onCourtSet = new Set(onCourtPlayerNums.map(n => String(n)));

  // New Match Session Creation Form States
  const [homeTeam, setHomeTeam] = useState('BBA');
  const [awayTeam, setAwayTeam] = useState('');
  const [customMatchName, setCustomMatchName] = useState('');
  
  // Selected player IDs/numbers for current match session squad
  const [selectedSquadNums, setSelectedSquadNums] = useState(() => {
    return masterRoster.map(p => String(p.number));
  });

  // Inline Quick Add Player states inside Session Modal
  const [newNum, setNewNum] = useState('');
  const [newName, setNewName] = useState('');

  // Keep selected squad in sync if masterRoster changes
  useEffect(() => {
    if (selectedSquadNums.length === 0 && masterRoster.length > 0) {
      setSelectedSquadNums(masterRoster.map(p => String(p.number)));
    }
  }, [masterRoster]);

  // Derived match name
  const generatedMatchName = awayTeam.trim()
    ? `${homeTeam.trim() || 'BBA'} vs ${awayTeam.trim()}`
    : customMatchName.trim() || (gameSession || 'BBA Match');

  const toggleSquadPlayer = (numStr) => {
    if (selectedSquadNums.includes(numStr)) {
      setSelectedSquadNums(selectedSquadNums.filter(n => n !== numStr));
    } else {
      setSelectedSquadNums([...selectedSquadNums, numStr]);
    }
  };

  const handleSelectAllSquad = () => {
    setSelectedSquadNums(masterRoster.map(p => String(p.number)));
  };

  const handleDeselectAllSquad = () => {
    setSelectedSquadNums([]);
  };

  const handleAddPlayerToMaster = (e) => {
    e.preventDefault();
    if (!newNum.trim() || !newName.trim()) return;
    const playerObj = { number: newNum.trim(), name: newName.trim(), pos: 'N/A' };
    
    // Check if number already exists
    const exists = masterRoster.some(p => String(p.number) === String(newNum.trim()));
    if (exists) {
      alert(`Jersey number #${newNum.trim()} already exists in roster!`);
      return;
    }

    const updatedMaster = [...masterRoster, playerObj].sort((a, b) => Number(a.number) - Number(b.number));
    setMasterRoster(updatedMaster);
    setSelectedSquadNums([...selectedSquadNums, String(newNum.trim())]);
    setNewNum('');
    setNewName('');
  };

  const handleStartSession = (e) => {
    e.preventDefault();
    const matchName = awayTeam.trim()
      ? `${homeTeam.trim() || 'BBA'} vs ${awayTeam.trim()}`
      : customMatchName.trim() || 'BBA Match';

    if (!matchName) return;

    if (selectedSquadNums.length === 0) {
      alert('Please select at least one player for the match squad!');
      return;
    }

    // Filter master roster to selected match squad
    const matchSquad = masterRoster.filter(p => selectedSquadNums.includes(String(p.number)));
    
    setGameSession(matchName);
    localStorage.setItem('current_game_session', matchName);
    setRoster(matchSquad);
    setShowSessionModal(false);
  };

  const handleRecordShot = (isMade) => {
    if (!isAdmin) return;
    const zoneInfo = COURT_ZONES[selectedZoneKey];
    const shotType = zoneInfo.type; // "2PT" or "3PT"
    const outcome = isMade ? 'Made' : 'Missed';
    const actionName = `${shotType} ${outcome}`;

    dispatchAction(actionName, 'Shot', zoneInfo.name);
  };

  const handleRecordAction = (actionName, categoryName) => {
    if (!isAdmin) return;
    dispatchAction(actionName, categoryName, 'Generic');
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {/* 1. NEW MATCH SESSION & SQUAD SELECTION MODAL */}
      {isAdmin && showSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
          <div className="glass-card max-w-2xl w-full p-5 border-slate-700/80 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-black text-slate-100 uppercase tracking-wider">
                  START NEW MATCH SESSION
                </h2>
              </div>
              {gameSession && (
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleStartSession} className="space-y-4">
              {/* Teams & Match Name Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                    OUR TEAM (HOME)
                  </label>
                  <input
                    type="text"
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder="e.g. BBA"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-bold p-2.5 rounded-lg text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                    OPPONENT TEAM (AWAY)
                  </label>
                  <input
                    type="text"
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="e.g. Virtus Bologna"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-bold p-2.5 rounded-lg text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                  DERIVED MATCH NAME
                </label>
                <input
                  type="text"
                  value={awayTeam ? `${homeTeam} vs ${awayTeam}` : customMatchName}
                  onChange={(e) => setCustomMatchName(e.target.value)}
                  placeholder="e.g. BBA vs Virtus - Friendly"
                  required
                  className="w-full bg-slate-950 border border-sky-500/50 text-sky-400 font-black p-2.5 rounded-lg text-xs focus:outline-none"
                />
              </div>

              {/* Master Squad Selection Checklist */}
              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                      SELECT SQUAD FOR THIS MATCH ({selectedSquadNums.length} / {masterRoster.length})
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllSquad}
                      className="text-[10px] font-bold text-sky-400 hover:underline"
                    >
                      SELECT ALL
                    </button>
                    <span className="text-slate-600 text-xs">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllSquad}
                      className="text-[10px] font-bold text-rose-400 hover:underline"
                    >
                      DESELECT ALL
                    </button>
                  </div>
                </div>

                {/* Squad Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  {masterRoster.map((player) => {
                    const numStr = String(player.number);
                    const isChecked = selectedSquadNums.includes(numStr);
                    return (
                      <div
                        key={numStr}
                        onClick={() => toggleSquadPlayer(numStr)}
                        className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-sky-500/20 border-sky-500/60 text-slate-100 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-sky-400 flex-none" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 flex-none" />
                        )}
                        <span className="font-mono font-black text-xs text-sky-400">#{player.number}</span>
                        <span className="text-xs truncate">{player.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inline Quick Add Guest Player */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400 flex-none" />
                <span className="text-xs font-bold text-slate-300 flex-none whitespace-nowrap">Add Guest:</span>
                <input
                  type="text"
                  placeholder="#"
                  value={newNum}
                  onChange={(e) => setNewNum(e.target.value)}
                  className="w-12 bg-slate-950 border border-slate-700 text-amber-400 font-bold text-xs p-1.5 rounded text-center"
                />
                <input
                  type="text"
                  placeholder="Player Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 font-bold text-xs p-1.5 rounded"
                />
                <button
                  type="button"
                  onClick={handleAddPlayerToMaster}
                  className="bg-amber-400/90 text-slate-950 font-black text-xs px-3 py-1.5 rounded hover:bg-amber-300 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 text-slate-950 font-black py-3 rounded-lg text-xs hover:bg-sky-400 transition-all uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> START MATCH SESSION
                </button>
                {gameSession && (
                  <button
                    type="button"
                    onClick={() => setShowSessionModal(false)}
                    className="bg-slate-800 text-slate-300 font-bold px-4 py-3 rounded-lg text-xs hover:bg-slate-700 transition-all border border-slate-700"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ROSTER MANAGER MODAL (Admin only) */}
      {isAdmin && showRosterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="glass-card max-w-3xl w-full p-5 border-slate-700/80 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider">
                MASTER ROSTER MANAGER — TEAM PLAYER LIST ({masterRoster.length} PLAYERS)
              </h3>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-1 pr-2">
              {masterRoster.map((p, idx) => (
                <div key={idx} className="flex gap-1.5 items-center bg-slate-900 p-1.5 rounded-md border border-slate-800 text-xs">
                  <input
                    type="text"
                    value={p.number}
                    onChange={(e) => {
                      const newMaster = [...masterRoster];
                      newMaster[idx].number = e.target.value;
                      setMasterRoster(newMaster);
                    }}
                    className="w-10 bg-slate-950 text-sky-400 font-mono font-black text-xs p-1 rounded text-center border border-slate-700"
                  />
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => {
                      const newMaster = [...masterRoster];
                      newMaster[idx].name = e.target.value;
                      setMasterRoster(newMaster);
                    }}
                    className="flex-1 bg-slate-950 text-slate-100 font-bold text-xs p-1 rounded border border-slate-700 truncate"
                  />
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete player #${p.number} ${p.name} from master roster?`)) {
                        const newMaster = masterRoster.filter((_, i) => i !== idx);
                        setMasterRoster(newMaster);
                        setRoster(roster.filter(pr => String(pr.number) !== String(p.number)));
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Player Row */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <form onSubmit={handleAddPlayerToMaster} className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  placeholder="#"
                  value={newNum}
                  onChange={(e) => setNewNum(e.target.value)}
                  className="w-14 bg-slate-950 border border-slate-700 text-sky-400 font-bold text-xs p-2 rounded text-center"
                />
                <input
                  type="text"
                  placeholder="Player Full Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 font-bold text-xs p-2 rounded"
                />
                <button
                  type="submit"
                  className="bg-sky-500 text-slate-950 font-black text-xs px-3 py-2 rounded-lg hover:bg-sky-400 transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> ADD PLAYER
                </button>
              </form>

              <button
                onClick={() => setShowRosterModal(false)}
                className="bg-slate-800 text-slate-300 font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-700 transition-all border border-slate-700"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE QUICK SUBSTITUTION MODAL (Admin only) */}
      {isAdmin && showMobileQuickSub && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-3">
          <div className="glass-card w-full max-w-md mx-auto p-4 border-slate-700 shadow-2xl flex flex-col max-h-[85vh] rounded-xl my-auto">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 flex-none">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                  QUICK SUBSTITUTION
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowMobileQuickSub(false);
                  setQuickSubOutNum(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Player on Court to Sub Out */}
            <div className="mb-3 flex-none">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>1. TAP COURT PLAYER TO BENCH:</span>
                </div>
                {quickSubOutNum && (
                  <span className="text-[10px] text-rose-400 font-bold">
                    Subbing out #{quickSubOutNum}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {roster.filter(p => onCourtSet.has(String(p.number))).map(p => {
                  const isSelected = quickSubOutNum === String(p.number);
                  return (
                    <button
                      key={p.number}
                      type="button"
                      onClick={() => setQuickSubOutNum(isSelected ? null : String(p.number))}
                      className={`p-2 rounded-lg text-center flex flex-col items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 scale-105'
                          : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <span className="font-mono text-xs font-black text-sky-400">#{p.number}</span>
                      <span className="text-[10px] font-bold truncate max-w-[50px]">{p.name.split(' ')[0]}</span>
                      <span className="text-[8px] text-slate-400 uppercase">COURT</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Bench Player to Sub In */}
            <div className="flex-1 overflow-y-auto">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>2. TAP BENCH PLAYER TO ENTER COURT:</span>
                </div>
                {!quickSubOutNum && (
                  <span className="text-[10px] text-amber-400 font-bold">
                    (Pick court player first)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                {roster.filter(p => !onCourtSet.has(String(p.number))).map(benchP => {
                  return (
                    <button
                      key={benchP.number}
                      type="button"
                      onClick={() => {
                        if (!quickSubOutNum) {
                          alert('Please tap an on-court player to sub out first!');
                          return;
                        }
                        handleSwapSubstitution(quickSubOutNum, benchP.number);
                        setShowMobileQuickSub(false);
                        setQuickSubOutNum(null);
                      }}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all active:scale-95"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center font-mono font-bold text-xs text-amber-400 border border-slate-800 flex-none">
                          #{benchP.number}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-200 truncate">{benchP.name}</div>
                          <div className="text-[9px] text-slate-500 uppercase">{benchP.pos || 'Bench'}</div>
                        </div>
                      </div>
                      <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 flex-none ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Scoreboard Status Bar */}
      <ScoreboardHeader
        selectedPlayer={selectedPlayer}
        events={events}
        currentQuarter={currentQuarter}
        setCurrentQuarter={setCurrentQuarter}
        onUndo={handleUndo}
        isAdmin={isAdmin}
      />

      {/* Main Nav Sub-Bar & Mobile View Switcher */}
      <div className="flex justify-between items-center mb-1.5 flex-none gap-2">
        <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeTab === 'LIVE' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            COURT & ACTIONS
          </button>
          <button
            onClick={() => setActiveTab('BOXSCORE')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeTab === 'BOXSCORE' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            FIBA BOX SCORE
          </button>
        </div>

        {/* Mobile View Switcher (Only visible on phones < 768px when activeTab === 'LIVE') */}
        {activeTab === 'LIVE' && (
          <div className="flex md:hidden gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setMobileView('COURT')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-colors ${
                mobileView === 'COURT' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              COURT
            </button>
            <button
              onClick={() => setMobileView('ROSTER')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-colors ${
                mobileView === 'ROSTER' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              ROSTER ({roster.length})
            </button>
            <button
              onClick={() => setMobileView('STREAM')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-colors ${
                mobileView === 'STREAM' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              FEED ({events.length})
            </button>
          </div>
        )}

        {/* Action Buttons: New Match & Clear Screen (Admin only) */}
        {isAdmin ? (
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => setShowSessionModal(true)}
              className="text-[11px] bg-sky-700/80 hover:bg-sky-600 text-white font-semibold px-2.5 py-1 rounded transition-colors uppercase tracking-wider flex items-center gap-1.5 border border-sky-600"
            >
              <Play className="w-3 h-3" /> NEW MATCH
            </button>
            <button
              onClick={handleResetGame}
              className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold px-2.5 py-1 rounded transition-colors border border-slate-800 hover:border-slate-700"
            >
              CLEAR SCREEN
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-slate-400 text-[10px] font-bold">
            <Eye className="w-3 h-3 text-sky-400" />
            <span className="hidden xs:inline">GUEST SPECTATOR MODE</span>
            <span className="xs:hidden">GUEST</span>
          </div>
        )}
      </div>

      {/* MAIN VIEWPORT CONTAINER (Responsive for Desktop, Tablet & Mobile) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'LIVE' && (
          <>
            {/* TIER 1: DESKTOP & LARGE TABLET LANDSCAPE VIEW (>= 1024px) */}
            <div className="hidden lg:grid grid-cols-12 gap-2 h-full">
              {/* Panel 1: Left Roster List (Bench on Left, On Court on Right) */}
              <div className="col-span-4 h-full overflow-hidden">
                <PlayerSelector
                  roster={roster}
                  onCourtPlayerNums={onCourtPlayerNums}
                  selectedPlayer={selectedPlayer}
                  onSelectPlayer={setSelectedPlayer}
                  onSwapSubstitution={handleSwapSubstitution}
                  events={events}
                  isAdmin={isAdmin}
                />
              </div>

              {/* Panel 2: Center Main Stage (Court Heatmap + Clustered Actions) */}
              <div className="col-span-5 h-full overflow-y-auto space-y-2 pr-0.5">
                <CourtPitchMap
                  selectedPlayer={selectedPlayer}
                  selectedZoneKey={selectedZoneKey}
                  onSelectZone={setSelectedZoneKey}
                  events={events}
                />

                {isAdmin ? (
                  <ActionClusters
                    selectedZoneKey={selectedZoneKey}
                    onRecordShot={handleRecordShot}
                    onRecordAction={handleRecordAction}
                  />
                ) : (
                  <div className="glass-card p-3 border-slate-800 text-center rounded-lg space-y-1.5 bg-slate-950/70 shadow-inner">
                    <div className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>GUEST / PLAYER SPECTATOR MODE</span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                      You are viewing this match in read-only mode. Select players and court zones to inspect live shot charts and shooting efficiency. Event recording is reserved for coaches.
                    </p>
                  </div>
                )}
              </div>

              {/* Panel 3: Right Live Play Stream Feed */}
              <div className="col-span-3 h-full overflow-hidden">
                <PlayLogFeed
                  events={events}
                  roster={roster}
                  onDeleteEvent={onDeleteEvent}
                  onEditEvent={onEditEvent}
                  isAdmin={isAdmin}
                />
              </div>
            </div>

            {/* TIER 2: TABLET PORTRAIT VIEW (768px - 1023px) — UNIFIED 2-COLUMN VIEW (ZERO TAB HOPPING!) */}
            <div className="hidden md:grid lg:hidden grid-cols-12 gap-2 h-full">
              {/* Left Column (5 cols, ~320-410px): Full PlayerSelector (Bench Left, On Court Right) */}
              <div className="col-span-5 h-full overflow-hidden">
                <PlayerSelector
                  roster={roster}
                  onCourtPlayerNums={onCourtPlayerNums}
                  selectedPlayer={selectedPlayer}
                  onSelectPlayer={setSelectedPlayer}
                  onSwapSubstitution={handleSwapSubstitution}
                  events={events}
                  isAdmin={isAdmin}
                />
              </div>

              {/* Right Column (7 cols): Court Shot Map + Clustered Actions + Live Play Log Feed */}
              <div className="col-span-7 h-full overflow-y-auto space-y-2 pr-0.5">
                <CourtPitchMap
                  selectedPlayer={selectedPlayer}
                  selectedZoneKey={selectedZoneKey}
                  onSelectZone={setSelectedZoneKey}
                  events={events}
                />

                {isAdmin ? (
                  <ActionClusters
                    selectedZoneKey={selectedZoneKey}
                    onRecordShot={handleRecordShot}
                    onRecordAction={handleRecordAction}
                  />
                ) : (
                  <div className="glass-card p-3 border-slate-800 text-center rounded-lg space-y-1.5 bg-slate-950/70 shadow-inner">
                    <div className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>GUEST / PLAYER SPECTATOR MODE</span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                      You are viewing this match in read-only mode. Select players and court zones to inspect live shot charts and shooting efficiency. Event recording is reserved for coaches.
                    </p>
                  </div>
                )}

                <div className="h-64 min-h-[220px]">
                  <PlayLogFeed
                    events={events}
                    roster={roster}
                    onDeleteEvent={onDeleteEvent}
                    onEditEvent={onEditEvent}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>
            </div>

            {/* TIER 3: MOBILE PHONES (< 768px) — FOCUSED TOUCH WORKFLOW WITH QUICK SUB BOTTOM SHEET */}
            <div className="md:hidden h-full overflow-hidden">
              {mobileView === 'ROSTER' && (
                <div className="h-full overflow-hidden">
                  <PlayerSelector
                    roster={roster}
                    onCourtPlayerNums={onCourtPlayerNums}
                    selectedPlayer={selectedPlayer}
                    onSelectPlayer={(p) => {
                      setSelectedPlayer(p);
                      if (p) setMobileView('COURT'); // Auto switch to court after selecting player
                    }}
                    onSwapSubstitution={handleSwapSubstitution}
                    events={events}
                    isAdmin={isAdmin}
                  />
                </div>
              )}

              {mobileView === 'COURT' && (
                <div className="h-full overflow-y-auto space-y-1.5 pr-0.5 pb-2">
                  {/* Compact Mobile Quick On-Court Player Strip + 1-Tap Quick Sub Button */}
                  <div className="glass-card p-1.5 flex items-center justify-between gap-1 border-slate-800">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 pr-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-1 flex-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        5:
                      </span>
                      {roster.filter(p => onCourtSet.has(String(p.number))).map(p => {
                        const isSel = selectedPlayer && String(selectedPlayer.number) === String(p.number);
                        return (
                          <button
                            key={p.number}
                            onClick={() => setSelectedPlayer(isSel ? null : p)}
                            className={`px-2 py-1 text-xs font-semibold rounded flex items-center gap-1 flex-none transition-all ${
                              isSel
                                ? 'bg-sky-500 text-slate-950 font-black shadow-md scale-105'
                                : 'bg-slate-900 text-slate-200 border border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-mono font-black text-sky-400">#{p.number}</span>
                            <span className="truncate max-w-[70px]">{p.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Instant Quick-Sub Trigger Button (Admin only) */}
                    {isAdmin && (
                      <button
                        onClick={() => setShowMobileQuickSub(true)}
                        className="text-[10px] font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-2 py-1 rounded flex items-center gap-1 flex-none shadow-sm active:scale-95"
                      >
                        <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                        SUB
                      </button>
                    )}
                  </div>

                  <CourtPitchMap
                    selectedPlayer={selectedPlayer}
                    selectedZoneKey={selectedZoneKey}
                    onSelectZone={setSelectedZoneKey}
                    events={events}
                  />

                  {isAdmin ? (
                    <ActionClusters
                      selectedZoneKey={selectedZoneKey}
                      onRecordShot={handleRecordShot}
                      onRecordAction={handleRecordAction}
                    />
                  ) : (
                    <div className="glass-card p-3 border-slate-800 text-center rounded-lg space-y-1.5 bg-slate-950/70 shadow-inner">
                      <div className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>GUEST / PLAYER SPECTATOR MODE</span>
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                        You are viewing this match in read-only mode. Select players and court zones to inspect live shot charts and shooting efficiency. Event recording is reserved for coaches.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {mobileView === 'STREAM' && (
                <div className="h-full overflow-hidden">
                  <PlayLogFeed
                    events={events}
                    roster={roster}
                    onDeleteEvent={onDeleteEvent}
                    onEditEvent={onEditEvent}
                    isAdmin={isAdmin}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'BOXSCORE' && (
          <div className="h-full overflow-y-auto">
            <BoxScoreTable roster={roster} events={events} />
          </div>
        )}
      </div>
    </div>
  );
}
