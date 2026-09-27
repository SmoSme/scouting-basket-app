import React, { useState } from 'react';
import ScoreboardHeader from '../components/ScoreboardHeader';
import PlayerSelector from '../components/PlayerSelector';
import CourtPitchMap from '../components/CourtPitchMap';
import ActionClusters from '../components/ActionClusters';
import BoxScoreTable from '../components/BoxScoreTable';
import PlayLogFeed from '../components/PlayLogFeed';
import { COURT_ZONES } from '../data/roster';
import { Play } from 'lucide-react';

export default function LiveGame({
  gameSession,
  setGameSession,
  events,
  setEvents,
  roster,
  setRoster,
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
  handleResetGame
}) {
  const [activeTab, setActiveTab] = useState('LIVE');
  const [sessionInput, setSessionInput] = useState(gameSession || '');

  const handleStartSession = (e) => {
    e.preventDefault();
    if (!sessionInput.trim()) return;
    setGameSession(sessionInput.trim());
    localStorage.setItem('current_game_session', sessionInput.trim());
    setShowSessionModal(false);
  };

  const handleRecordShot = (isMade) => {
    const zoneInfo = COURT_ZONES[selectedZoneKey];
    const shotType = zoneInfo.type; // "2PT" or "3PT"
    const outcome = isMade ? 'Made' : 'Missed';
    const azione = `${shotType} ${outcome}`;

    dispatchAction(azione, 'Shot', zoneInfo.name);
  };

  const handleRecordAction = (azione, categoria) => {
    dispatchAction(azione, categoria, 'Generic');
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {/* Session Modal if no gameSession or user clicks edit */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-slate-700/80 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider">
                START NEW MATCH SESSION
              </h2>
            </div>
            
            <p className="text-xs text-slate-300 font-semibold mb-4">
              Enter the match identifier (e.g. <em>"Olimpia vs Virtus - Game 5"</em>). This session name will be attached to cloud records on Supabase and enables CSV export and archiving.
            </p>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                  Match Name / Identifier
                </label>
                <input
                  type="text"
                  value={sessionInput}
                  onChange={(e) => setSessionInput(e.target.value)}
                  placeholder="e.g. Olimpia vs Virtus - Game 5"
                  required
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-bold p-3 rounded-lg text-sm focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 text-slate-950 font-black py-3 rounded-lg text-sm hover:bg-sky-400 transition-all uppercase tracking-wider shadow-md"
                >
                  CONFIRM & START
                </button>
                {gameSession && (
                  <button
                    type="button"
                    onClick={() => setShowSessionModal(false)}
                    className="bg-slate-800 text-slate-300 font-bold px-4 py-3 rounded-lg text-sm hover:bg-slate-700 transition-all border border-slate-700"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Quick Editor Modal */}
      {showRosterModal && (
        <div className="glass-card p-2.5 mb-1.5 border-slate-700/80 flex-none">
          <h3 className="text-[11px] font-black text-sky-400 uppercase tracking-wider mb-2">
            ROSTER MANAGER — EDIT NUMBERS & NAMES
          </h3>
          <div className="grid grid-cols-6 gap-1.5">
            {roster.map((p, idx) => (
              <div key={idx} className="flex gap-1 items-center bg-slate-900 p-1 rounded-md border border-slate-800 text-xs">
                <input
                  type="text"
                  value={p.number}
                  onChange={(e) => {
                    const newR = [...roster];
                    newR[idx].number = e.target.value;
                    setRoster(newR);
                  }}
                  className="w-7 bg-slate-950 text-sky-400 font-mono font-black text-xs p-0.5 rounded text-center border border-slate-700"
                />
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => {
                    const newR = [...roster];
                    newR[idx].name = e.target.value;
                    setRoster(newR);
                  }}
                  className="w-full bg-slate-950 text-slate-100 font-bold text-xs p-0.5 rounded border border-slate-700 truncate"
                />
              </div>
            ))}
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
      />

      {/* Live / Box Score Tab Sub-Nav */}
      <div className="flex justify-between items-center mb-1.5 flex-none">
        <div className="flex gap-2 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-3 py-1 text-xs font-black rounded-md transition-all ${
              activeTab === 'LIVE' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            COURT & ACTIONS
          </button>
          <button
            onClick={() => setActiveTab('BOXSCORE')}
            className={`px-3 py-1 text-xs font-black rounded-md transition-all ${
              activeTab === 'BOXSCORE' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            FIBA BOX SCORE
          </button>
        </div>

        <button
          onClick={handleResetGame}
          className="text-[10px] bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-bold px-2.5 py-1 rounded-md transition-all"
        >
          RESET MATCH DATA
        </button>
      </div>

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'LIVE' && (
          <div className="grid grid-cols-12 gap-2 h-full">
            {/* Panel 1: Left Roster List */}
            <div className="col-span-3 h-full overflow-hidden">
              <PlayerSelector
                roster={roster}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
                events={events}
              />
            </div>

            {/* Panel 2: Center Main Stage (Court Heatmap + Clustered Actions) */}
            <div className="col-span-6 h-full overflow-y-auto space-y-2 pr-0.5">
              <CourtPitchMap
                selectedPlayer={selectedPlayer}
                selectedZoneKey={selectedZoneKey}
                onSelectZone={setSelectedZoneKey}
                events={events}
              />

              <ActionClusters
                selectedZoneKey={selectedZoneKey}
                onRecordShot={handleRecordShot}
                onRecordAction={handleRecordAction}
              />
            </div>

            {/* Panel 3: Right Live Play Stream Feed */}
            <div className="col-span-3 h-full overflow-hidden">
              <PlayLogFeed events={events} />
            </div>
          </div>
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
