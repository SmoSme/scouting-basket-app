import React, { useState, useEffect } from 'react';
import ScoreboardHeader from '../components/ScoreboardHeader';
import PlayerSelector from '../components/PlayerSelector';
import CourtPitchMap from '../components/CourtPitchMap';
import ActionClusters from '../components/ActionClusters';
import BoxScoreTable from '../components/BoxScoreTable';
import PlayLogFeed from '../components/PlayLogFeed';
import OpponentPossessionPanel from '../components/OpponentPossessionPanel';
import { COURT_ZONES } from '../data/roster';
import { 
  Play, CheckSquare, Square, Plus, Users, UserPlus, Trash2, X, 
  ArrowLeftRight, Eye, Shield, Lock, Target, Check, Sparkles, Zap, AlertCircle 
} from 'lucide-react';

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
  dispatchMultipleActions,
  dispatchOpponentScore,
  dispatchOpponentShot,
  plusMinusMap = {},
  handleUndo,
  handleResetGame,
  onDeleteEvent,
  onEditEvent,
  authRole = 'admin',
  matchDate: matchDateProp,
  onUpdateMatchDate,
  matchType: matchTypeProp,
  onUpdateMatchType,
  overrideTeamScore,
  overrideOppScore,
  onSaveScoreOverride,
  onClearScoreOverride
}) {
  const isAdmin = authRole === 'admin';
  const [activeTab, setActiveTab] = useState('LIVE'); // 'LIVE' | 'BOXSCORE'
  const [mobileView, setMobileView] = useState('COURT'); // 'COURT' | 'ROSTER' | 'STREAM'
  const [showMobileQuickSub, setShowMobileQuickSub] = useState(false);
  const [quickSubOutNum, setQuickSubOutNum] = useState(null);

  // Court-First Contextual Action Popover State
  const [courtShotPopover, setCourtShotPopover] = useState(null); // { zoneKey, outcome: 'MADE' | 'MISSED', step: 'SHOOTER' | 'ASSIST' | 'REBOUND', shooter }
  // Non-Shot Single-Click 5-Player Action Prompt State
  const [pendingActionPrompt, setPendingActionPrompt] = useState(null); // { actionName, categoryName, zoneName }

  // Defensive Scheme State (MAN, ZONE, PRESS)
  const [defenseType, setDefenseType] = useState(() => {
    try {
      return localStorage.getItem('bba_defense_type') || 'MAN';
    } catch (e) {
      return 'MAN';
    }
  });
  // Opponent Missed Shot Rebound Prompt State
  const [opponentMissPopover, setOpponentMissPopover] = useState(null); // { shotType: 'FT' | '2PT' | '3PT' }

  const handleDefenseChange = (scheme) => {
    setDefenseType(scheme);
    try {
      localStorage.setItem('bba_defense_type', scheme);
    } catch (e) {}
  };

  const handleOpponentShot = (shotType, isMade) => {
    if (!isAdmin) return;
    if (isMade) {
      if (dispatchOpponentShot) {
        dispatchOpponentShot(shotType, true, defenseType);
      } else if (dispatchOpponentScore) {
        const pts = (shotType === '3PT') ? 3 : (shotType === '2PT') ? 2 : 1;
        dispatchOpponentScore(pts);
      }
    } else {
      // Missed shot opens contextual rebound popover
      setOpponentMissPopover({ shotType: shotType || '2PT' });
    }
  };

  const handleResolveOpponentMissRebound = (optionType, bbaPlayer = null) => {
    try {
      if (!opponentMissPopover) return;
      const shotType = opponentMissPopover.shotType || '2PT';

      if (optionType === 'BBA_DEF_REB' && bbaPlayer) {
        if (dispatchOpponentShot) {
          dispatchOpponentShot(shotType, false, defenseType, {
            actionName: 'Def Rebound',
            categoryName: 'Rebound',
            zoneName: null,
            targetPlayer: bbaPlayer,
            defenseType
          });
        }
      } else if (optionType === 'OPP_OFF_REB') {
        if (dispatchOpponentShot) {
          dispatchOpponentShot(shotType, false, defenseType, {
            actionName: 'OPP_OFF_REBOUND',
            categoryName: 'Opponent',
            zoneName: null,
            targetPlayer: { number: 'OPP', name: 'OPPONENT' },
            defenseType
          });
        }
      } else {
        // DEAD_BALL or SKIP
        if (dispatchOpponentShot) {
          dispatchOpponentShot(shotType, false, defenseType);
        }
      }
    } catch (err) {
      console.warn('Error resolving opponent miss rebound:', err);
    } finally {
      setOpponentMissPopover(null);
    }
  };

  const handleOpponentTurnover = () => {
    if (!isAdmin) return;
    dispatchAction('OPP_TURNOVER', 'Opponent', null, { number: 'OPP', name: 'OPPONENT' }, null, { defenseType });
  };

  const isDefensiveAction = (act, cat) => {
    const s = `${act} ${cat}`.toLowerCase();
    return s.includes('def') || s.includes('difensivo') || s.includes('steal') || s.includes('recuperata') || 
           (s.includes('block') && !s.includes('allowed')) || s.includes('stoppata data') || 
           s.includes('personal foul') || s.includes('fallo fatto');
  };

  const isOffensiveAction = (act, cat) => {
    const s = `${act} ${cat}`.toLowerCase();
    return s.includes('turnover') || s.includes('persa') || s.includes('ft ') || s.includes('tl ') || 
           s.includes('foul drawn') || s.includes('fallo subito') || s.includes('shot') || s.includes('off rebound');
  };

  const onCourtSet = new Set(onCourtPlayerNums.map(n => String(n)));
  const onCourtPlayers = roster.filter(p => onCourtSet.has(String(p.number)));

  // New Match Session Creation Form States
  const [homeTeam, setHomeTeam] = useState('BBA');
  const [awayTeam, setAwayTeam] = useState('');
  const [customMatchName, setCustomMatchName] = useState('');
  const [matchDate, setMatchDate] = useState(() => matchDateProp || new Date().toISOString().split('T')[0]);
  const [matchType, setMatchType] = useState(() => matchTypeProp || 'Official');

  useEffect(() => {
    if (matchDateProp) {
      setMatchDate(matchDateProp);
    }
  }, [matchDateProp]);

  useEffect(() => {
    if (matchTypeProp) {
      setMatchType(matchTypeProp);
    }
  }, [matchTypeProp]);

  const handleDateChange = (val) => {
    setMatchDate(val);
    if (onUpdateMatchDate) {
      onUpdateMatchDate(val);
    }
  };

  const handleMatchTypeChange = (val) => {
    setMatchType(val);
    if (onUpdateMatchType) {
      onUpdateMatchType(val);
    }
  };
  
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
    
    // Automatically add to active match squad as well so they immediately appear on BENCH
    if (setRoster && Array.isArray(roster)) {
      setRoster([...roster, playerObj].sort((a, b) => Number(a.number) - Number(b.number)));
    }

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
    // Save match date and match type
    const todayDate = matchDate || new Date().toISOString().split('T')[0];
    if (onUpdateMatchDate) {
      onUpdateMatchDate(todayDate);
    } else {
      try { localStorage.setItem(`match_date_${matchName}`, todayDate); } catch(e) {}
    }
    const currentType = matchType || 'Official';
    if (onUpdateMatchType) {
      onUpdateMatchType(currentType);
    } else {
      try { localStorage.setItem(`match_type_${matchName}`, currentType); } catch(e) {}
    }
    setRoster(matchSquad);
    if (setOnCourtPlayerNums && matchSquad.length >= 5) {
      const startingFive = matchSquad.slice(0, 5).map(p => String(p.number));
      setOnCourtPlayerNums(startingFive);
      try {
        localStorage.setItem(`starting_on_court_nums_${matchName}`, JSON.stringify(startingFive));
      } catch (err) {}
    }
    setShowSessionModal(false);
  };

  const handleZoneClick = (zoneKey) => {
    setSelectedZoneKey(zoneKey);
    if (isAdmin) {
      setCourtShotPopover({
        zoneKey,
        outcome: 'MADE',
        step: 'SHOOTER',
        shooter: null,
        isTransition: false
      });
    }
  };

  const handleRecordShot = (isMade) => {
    if (!isAdmin) return;
    const shooter = selectedPlayer;
    if (shooter) {
      setCourtShotPopover({
        zoneKey: selectedZoneKey,
        outcome: isMade ? 'MADE' : 'MISSED',
        step: isMade ? 'ASSIST' : 'REBOUND',
        shooter,
        isTransition: false
      });
    } else {
      setCourtShotPopover({
        zoneKey: selectedZoneKey,
        outcome: isMade ? 'MADE' : 'MISSED',
        step: 'SHOOTER',
        shooter: null,
        isTransition: false
      });
    }
  };

  const handleRecordAction = (actionName, categoryName) => {
    if (!isAdmin) return;
    const isTeamEvent = actionName === 'Stagger' || actionName === 'Ghost' || categoryName === 'Technique';
    const isDef = isDefensiveAction(actionName, categoryName);

    let situ = {};
    if (isDef) situ.defenseType = defenseType;

    if (isTeamEvent) {
      dispatchAction(actionName, categoryName, null, null, null, situ);
    } else if (selectedPlayer) {
      dispatchAction(actionName, categoryName, null, selectedPlayer, null, situ);
    } else {
      setPendingActionPrompt({ actionName, categoryName, zoneName: null });
    }
  };

  const handleShooterSelected = (player) => {
    if (courtShotPopover.outcome === 'MADE') {
      setCourtShotPopover(prev => ({
        ...prev,
        step: 'ASSIST',
        shooter: player
      }));
    } else {
      // Move to REBOUND step where user can toggle transition and choose rebounder / skip
      setCourtShotPopover(prev => ({
        ...prev,
        step: 'REBOUND',
        shooter: player
      }));
    }
  };

  const handleCompleteMadeShotWithAssist = (assistPlayer) => {
    const zoneInfo = COURT_ZONES[courtShotPopover.zoneKey] || COURT_ZONES.PAINT;
    const shotType = zoneInfo.type;
    const shooter = courtShotPopover.shooter;
    const isTrans = Boolean(courtShotPopover.isTransition);

    if (dispatchMultipleActions) {
      dispatchMultipleActions([
        {
          actionName: `${shotType} Made`,
          categoryName: 'Shot',
          zoneName: zoneInfo.name,
          targetPlayer: shooter,
          isTransition: isTrans
        },
        {
          actionName: 'Assist',
          categoryName: 'Passing',
          zoneName: null,
          targetPlayer: assistPlayer,
          isTransition: isTrans
        }
      ], null, { isTransition: isTrans });
    } else {
      dispatchAction(`${shotType} Made`, 'Shot', zoneInfo.name, shooter, null, { isTransition: isTrans });
      dispatchAction('Assist', 'Passing', null, assistPlayer, null, { isTransition: isTrans });
    }

    setCourtShotPopover(null);
  };

  const handleCompleteMadeShotUnassisted = () => {
    const zoneInfo = COURT_ZONES[courtShotPopover.zoneKey] || COURT_ZONES.PAINT;
    const shotType = zoneInfo.type;
    const shooter = courtShotPopover.shooter;
    const isTrans = Boolean(courtShotPopover.isTransition);

    dispatchAction(`${shotType} Made`, 'Shot', zoneInfo.name, shooter, null, { isTransition: isTrans });
    setCourtShotPopover(null);
  };

  const handleCompleteMissedShotRebound = (rebAction, rebPlayer) => {
    const zoneInfo = COURT_ZONES[courtShotPopover.zoneKey] || COURT_ZONES.PAINT;
    const shotType = zoneInfo.type;
    const shooter = courtShotPopover.shooter;
    const isTrans = Boolean(courtShotPopover.isTransition);

    if (dispatchMultipleActions) {
      dispatchMultipleActions([
        {
          actionName: `${shotType} Missed`,
          categoryName: 'Shot',
          zoneName: zoneInfo.name,
          targetPlayer: shooter,
          isTransition: isTrans
        },
        {
          actionName: rebAction,
          categoryName: 'Rebound',
          zoneName: null,
          targetPlayer: rebPlayer,
          isTransition: isTrans
        }
      ], null, { isTransition: isTrans });
    } else {
      dispatchAction(`${shotType} Missed`, 'Shot', zoneInfo.name, shooter, null, { isTransition: isTrans });
      dispatchAction(rebAction, 'Rebound', null, rebPlayer, null, { isTransition: isTrans });
    }

    setCourtShotPopover(null);
  };

  const handleSkipMissedShotRebound = () => {
    const zoneInfo = COURT_ZONES[courtShotPopover.zoneKey] || COURT_ZONES.PAINT;
    const shotType = zoneInfo.type;
    const shooter = courtShotPopover.shooter;
    const isTrans = Boolean(courtShotPopover.isTransition);

    dispatchAction(`${shotType} Missed`, 'Shot', zoneInfo.name, shooter, null, { isTransition: isTrans });
    setCourtShotPopover(null);
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                    MATCH DATE
                  </label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-bold p-2.5 rounded-lg text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase flex items-center justify-between">
                    <span>MATCH TYPE</span>
                    <span className="text-amber-400 font-mono text-[10px]">REQUIRED</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-700">
                    {['Official', 'Friendly', 'Scrimmage'].map((type) => {
                      const isSel = matchType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleMatchTypeChange(type)}
                          className={`py-1.5 px-1 rounded text-xs font-black transition-all text-center ${
                            isSel
                              ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
              <div>
                <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  MATCH ROSTER & SQUAD MANAGER
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Current Match Squad: <strong className="text-emerald-400">{roster.length} players</strong> ({onCourtPlayerNums.length} on court, {roster.length - onCourtPlayerNums.length} on bench). Tap <span className="text-amber-300 font-bold">+ BENCH</span> to add late-arriving players.
                </p>
              </div>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-1 pr-2">
              {masterRoster.map((p, idx) => {
                const numStr = String(p.number);
                const inMatch = roster.some(pr => String(pr.number) === numStr);
                const isOnCourt = onCourtPlayerNums.map(n => String(n)).includes(numStr);

                return (
                  <div key={idx} className={`flex gap-1.5 items-center p-2 rounded-lg border text-xs transition-all ${
                    inMatch ? 'bg-slate-900 border-slate-700 shadow-sm' : 'bg-slate-950/70 border-slate-850 opacity-80 hover:opacity-100'
                  }`}>
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

                    {/* Match Squad Status & Quick Toggle */}
                    {inMatch ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-none ${
                        isOnCourt
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-sky-950 text-sky-300 border border-sky-800'
                      }`}>
                        {isOnCourt ? 'COURT' : 'BENCH'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (setRoster && Array.isArray(roster)) {
                            setRoster([...roster, p].sort((a, b) => Number(a.number) - Number(b.number)));
                          }
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/50 transition-colors flex-none"
                        title="Add this player to current match bench"
                      >
                        + BENCH
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete player #${p.number} ${p.name} from club roster?`)) {
                          const newMaster = masterRoster.filter((_, i) => i !== idx);
                          setMasterRoster(newMaster);
                          setRoster(roster.filter(pr => String(pr.number) !== String(p.number)));
                        }
                      }}
                      className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/50 flex-none"
                      title="Delete from club roster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Player Row */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <form onSubmit={handleAddPlayerToMaster} className="flex items-center gap-2 flex-1 min-w-[280px]">
                <input
                  type="text"
                  placeholder="#"
                  value={newNum}
                  onChange={(e) => setNewNum(e.target.value)}
                  className="w-14 bg-slate-950 border border-slate-700 text-sky-400 font-bold text-xs p-2 rounded text-center"
                />
                <input
                  type="text"
                  placeholder="Player Full Name (New / Guest)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 font-bold text-xs p-2 rounded"
                />
                <button
                  type="submit"
                  className="bg-sky-500 text-slate-950 font-black text-xs px-3 py-2 rounded-lg hover:bg-sky-400 transition-all flex items-center gap-1 flex-none"
                >
                  <Plus className="w-4 h-4" /> ADD TO MATCH
                </button>
              </form>

              <button
                onClick={() => setShowRosterModal(false)}
                className="bg-slate-800 text-slate-300 font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-700 transition-all border border-slate-700 flex-none"
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

      {/* 4. COURT-FIRST CONTEXTUAL ACTION POPOVER / MODAL */}
      {isAdmin && courtShotPopover && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="glass-card max-w-md w-full p-4 border-slate-700 shadow-2xl rounded-xl space-y-3 my-auto">
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-sky-400" />
                <div className="text-xs font-black text-slate-100 uppercase tracking-wider">
                  {COURT_ZONES[courtShotPopover.zoneKey]?.name.toUpperCase()} ({COURT_ZONES[courtShotPopover.zoneKey]?.type})
                </div>
              </div>
              <button
                onClick={() => setCourtShotPopover(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Outcome Toggle & Select Shooter */}
            {courtShotPopover.step === 'SHOOTER' && (
              <div className="space-y-3">
                {/* Made / Missed Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCourtShotPopover(prev => ({ ...prev, outcome: 'MADE' }))}
                    className={`py-2 px-3 rounded-md text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      courtShotPopover.outcome === 'MADE'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    ✓ SHOT MADE
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourtShotPopover(prev => ({ ...prev, outcome: 'MISSED' }))}
                    className={`py-2 px-3 rounded-md text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      courtShotPopover.outcome === 'MISSED'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                    ✕ SHOT MISSED
                  </button>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                    SELECT SHOOTER (5 ON-COURT):
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {onCourtPlayers.map(p => (
                      <button
                        key={p.number}
                        type="button"
                        onClick={() => handleShooterSelected(p)}
                        className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/60 flex items-center justify-between transition-all active:scale-98 group text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded bg-slate-950 flex items-center justify-center font-mono font-black text-xs text-sky-400 border border-slate-800 group-hover:border-sky-500/50">
                            #{p.number}
                          </span>
                          <span className="text-xs font-black text-slate-100 group-hover:text-white">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300">{p.pos}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Conditional Assist (If MADE) */}
            {courtShotPopover.step === 'ASSIST' && (
              <div className="space-y-3">
                <div className="bg-emerald-950/40 border border-emerald-500/50 p-2.5 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-300">
                    🎯 #{courtShotPopover.shooter?.number} {courtShotPopover.shooter?.name} — {COURT_ZONES[courtShotPopover.zoneKey]?.type} MADE
                  </span>
                </div>

                {/* Just-in-Time Fastbreak / Transition Toggle */}
                <button
                  type="button"
                  onClick={() => setCourtShotPopover(prev => ({ ...prev, isTransition: !prev?.isTransition }))}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm ${
                    courtShotPopover.isTransition
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                      : 'bg-slate-950/80 text-slate-300 border-slate-700/80 hover:border-amber-400/50 hover:text-amber-300'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${courtShotPopover.isTransition ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
                  <span>⚡ FASTBREAK / TRANSITION PLAY</span>
                  {courtShotPopover.isTransition && (
                    <span className="text-[9px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded font-black uppercase">
                      ACTIVE
                    </span>
                  )}
                </button>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    ASSISTED BY? (4 ON-COURT TEAMMATES):
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {onCourtPlayers
                      .filter(p => String(p.number) !== String(courtShotPopover.shooter?.number))
                      .map(teammate => (
                        <button
                          key={teammate.number}
                          type="button"
                          onClick={() => handleCompleteMadeShotWithAssist(teammate)}
                          className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/60 flex items-center gap-2 transition-all active:scale-98 group text-left"
                        >
                          <span className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center font-mono font-bold text-xs text-teal-400 border border-slate-800">
                            #{teammate.number}
                          </span>
                          <span className="text-xs font-bold text-slate-200 truncate">{teammate.name}</span>
                        </button>
                      ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCompleteMadeShotUnassisted()}
                    className="w-full py-2.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>⚡ UNASSISTED / NO ASSIST</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Rebound Follow-up (If MISSED) */}
            {courtShotPopover.step === 'REBOUND' && (
              <div className="space-y-3">
                <div className="bg-rose-950/40 border border-rose-500/50 p-2.5 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-black text-rose-300">
                    ✕ #{courtShotPopover.shooter?.number} {courtShotPopover.shooter?.name} — {COURT_ZONES[courtShotPopover.zoneKey]?.type} MISSED
                  </span>
                </div>

                {/* Just-in-Time Fastbreak / Transition Toggle */}
                <button
                  type="button"
                  onClick={() => setCourtShotPopover(prev => ({ ...prev, isTransition: !prev?.isTransition }))}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm ${
                    courtShotPopover.isTransition
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                      : 'bg-slate-950/80 text-slate-300 border-slate-700/80 hover:border-amber-400/50 hover:text-amber-300'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${courtShotPopover.isTransition ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
                  <span>⚡ FASTBREAK / TRANSITION PLAY</span>
                  {courtShotPopover.isTransition && (
                    <span className="text-[9px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded font-black uppercase">
                      ACTIVE
                    </span>
                  )}
                </button>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    REBOUND SECURED BY?
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {onCourtPlayers.map(p => (
                      <button
                        key={p.number}
                        type="button"
                        onClick={() => handleCompleteMissedShotRebound('Off Rebound', p)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 flex items-center gap-1.5 transition-all active:scale-98 text-left"
                      >
                        <span className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center font-mono font-bold text-xs text-amber-400 border border-slate-800">
                          #{p.number}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-200 truncate">{p.name}</div>
                          <div className="text-[9px] text-amber-400 font-bold uppercase">OFF REB</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSkipMissedShotRebound()}
                    className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>⏩ SKIP / OPPONENT DEF REB</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. NON-SHOT SINGLE-CLICK 5-PLAYER ACTION PROMPT */}
      {isAdmin && pendingActionPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="glass-card max-w-sm w-full p-4 border-slate-700 shadow-2xl rounded-xl space-y-3 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                  ASSIGN: {pendingActionPrompt.actionName.toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setPendingActionPrompt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SELECT ON-COURT PLAYER:
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {onCourtPlayers.map(p => (
                <button
                  key={p.number}
                  type="button"
                  onClick={() => {
                    const isDef = isDefensiveAction(pendingActionPrompt.actionName, pendingActionPrompt.categoryName);
                    const isOff = isOffensiveAction(pendingActionPrompt.actionName, pendingActionPrompt.categoryName);
                    let situ = {};
                    if (isDef) situ.defenseType = defenseType;
                    if (isOff && isTransition) {
                      situ.isTransition = true;
                      setIsTransition(false);
                    }
                    dispatchAction(pendingActionPrompt.actionName, pendingActionPrompt.categoryName, null, p, null, situ);
                    setPendingActionPrompt(null);
                  }}
                  className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/60 flex items-center justify-between transition-all active:scale-98 group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded bg-slate-950 flex items-center justify-center font-mono font-black text-xs text-sky-400 border border-slate-800">
                      #{p.number}
                    </span>
                    <span className="text-xs font-black text-slate-100">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">{pendingActionPrompt.actionName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. OPPONENT MISSED SHOT REBOUND SELECTION POPOVER */}
      {isAdmin && opponentMissPopover && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="glass-card max-w-sm w-full p-4 border-slate-700 shadow-2xl rounded-xl space-y-3 my-auto">
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-xs font-black text-rose-300 uppercase tracking-wider">
                    OPPONENT {opponentMissPopover.shotType} MISSED
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Who secured the rebound?
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpponentMissPopover(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: 5 On-Court BBA Players (DEF REB) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                BBA DEFENSIVE REBOUND (5 ON COURT):
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {onCourtPlayers.map(p => (
                  <button
                    key={p.number}
                    type="button"
                    onClick={() => handleResolveOpponentMissRebound('BBA_DEF_REB', p)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/60 flex items-center justify-between transition-all active:scale-98 group text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center font-mono font-black text-xs text-emerald-400 border border-slate-800 group-hover:border-emerald-500/50">
                        #{p.number}
                      </span>
                      <span className="text-xs font-black text-slate-100 group-hover:text-emerald-200">{p.name}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      + DEF REB
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Option 2 & 3: Opponent Offensive Rebound OR Dead Ball */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleResolveOpponentMissRebound('OPP_OFF_REB')}
                className="p-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/70 text-amber-300 font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm text-center"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-none" />
                <span>OPP OFF REB</span>
              </button>
              <button
                type="button"
                onClick={() => handleResolveOpponentMissRebound('DEAD_BALL')}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center"
              >
                <span>DEAD BALL / OUT</span>
              </button>
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
        onRecordOpponentScore={dispatchOpponentScore}
        plusMinusMap={plusMinusMap}
        isAdmin={isAdmin}
        matchDate={matchDate}
        onUpdateMatchDate={handleDateChange}
        matchName={gameSession}
        overrideTeamScore={overrideTeamScore}
        overrideOppScore={overrideOppScore}
        onSaveScoreOverride={onSaveScoreOverride}
        onClearScoreOverride={onClearScoreOverride}
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
                  plusMinusMap={plusMinusMap}
                  isAdmin={isAdmin}
                  onOpenRosterModal={() => setShowRosterModal(true)}
                />
              </div>

              {/* Panel 2: Center Main Stage (Court Heatmap + Clustered Actions) */}
              <div className="col-span-5 h-full overflow-y-auto space-y-2 pr-0.5">
                <CourtPitchMap
                  selectedPlayer={selectedPlayer}
                  selectedZoneKey={selectedZoneKey}
                  onSelectZone={handleZoneClick}
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

              {/* Panel 3: Right Live Play Stream Feed & Opponent Possession */}
              <div className="col-span-3 h-full overflow-hidden flex flex-col gap-2">
                {isAdmin && (
                  <OpponentPossessionPanel
                    defenseType={defenseType}
                    onDefenseChange={handleDefenseChange}
                    onOpponentShot={handleOpponentShot}
                    onOpponentTurnover={handleOpponentTurnover}
                    onRecordOpponentScore={dispatchOpponentScore}
                  />
                )}
                <div className="flex-1 min-h-0 overflow-hidden">
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
                  plusMinusMap={plusMinusMap}
                  isAdmin={isAdmin}
                  onOpenRosterModal={() => setShowRosterModal(true)}
                />
              </div>

              {/* Right Column (7 cols): Court Shot Map + Clustered Actions + Opponent Panel + Live Play Log Feed */}
              <div className="col-span-7 h-full overflow-y-auto space-y-2 pr-0.5">
                <CourtPitchMap
                  selectedPlayer={selectedPlayer}
                  selectedZoneKey={selectedZoneKey}
                  onSelectZone={handleZoneClick}
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

                {isAdmin && (
                  <OpponentPossessionPanel
                    defenseType={defenseType}
                    onDefenseChange={handleDefenseChange}
                    onOpponentShot={handleOpponentShot}
                    onOpponentTurnover={handleOpponentTurnover}
                    onRecordOpponentScore={dispatchOpponentScore}
                  />
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
                    plusMinusMap={plusMinusMap}
                    isAdmin={isAdmin}
                    onOpenRosterModal={() => setShowRosterModal(true)}
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
                    onSelectZone={handleZoneClick}
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

                  {isAdmin && (
                    <OpponentPossessionPanel
                      defenseType={defenseType}
                      onDefenseChange={handleDefenseChange}
                      onOpponentShot={handleOpponentShot}
                      onOpponentTurnover={handleOpponentTurnover}
                      onRecordOpponentScore={dispatchOpponentScore}
                    />
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
            <BoxScoreTable roster={roster} events={events} plusMinusMap={plusMinusMap} />
          </div>
        )}
      </div>
    </div>
  );
}
