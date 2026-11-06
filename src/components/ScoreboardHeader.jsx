import React, { useState } from 'react';
import { Clock, RotateCcw, UserCheck, ShieldAlert, Plus, Minus, Calendar, Edit3 } from 'lucide-react';
import { calculateTeamScore, calculateOpponentScore } from '../utils/basketballAnalytics';
import ScoreOverrideModal from './ScoreOverrideModal';

export default function ScoreboardHeader({
  selectedPlayer,
  events,
  currentQuarter,
  setCurrentQuarter,
  onUndo,
  onRecordOpponentScore,
  onOpponentShot,
  plusMinusMap = {},
  isAdmin = true,
  matchDate,
  onUpdateMatchDate,
  matchName = '',
  overrideTeamScore = null,
  overrideOppScore = null,
  onSaveScoreOverride,
  onClearScoreOverride
}) {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const getAz = (e) => String(e?.Action || e?.action || e?.Azione || e?.azione || '');
  const getNum = (e) => String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '');

  const teamPts = calculateTeamScore(events);
  const oppPts = calculateOpponentScore(events);

  const displayedTeamPts = overrideTeamScore !== null && overrideTeamScore !== undefined ? overrideTeamScore : teamPts;
  const displayedOppPts = overrideOppScore !== null && overrideOppScore !== undefined ? overrideOppScore : oppPts;
  const diff = displayedTeamPts - displayedOppPts;
  const isOverridden = overrideTeamScore !== null || overrideOppScore !== null;

  const teamStagger = (events || []).filter(e => getAz(e) === 'Stagger').length;
  const teamGhost = (events || []).filter(e => getAz(e) === 'Ghost').length;

  const getPlayerStats = () => {
    if (!selectedPlayer) return null;
    const pEvents = (events || []).filter(e => getNum(e) === String(selectedPlayer.number));
    
    const fg2_m = pEvents.filter(e => { const az = getAz(e); return az === '2PT Made' || az === '2PT Fatto'; }).length;
    const fg2_miss = pEvents.filter(e => { const az = getAz(e); return az === '2PT Missed' || az === '2PT Sbagliato'; }).length;
    const fg2_a = fg2_m + fg2_miss;
    
    const fg3_m = pEvents.filter(e => { const az = getAz(e); return az === '3PT Made' || az === '3PT Fatto'; }).length;
    const fg3_miss = pEvents.filter(e => { const az = getAz(e); return az === '3PT Missed' || az === '3PT Sbagliato'; }).length;
    const fg3_a = fg3_m + fg3_miss;
    
    const ft_m = pEvents.filter(e => { const az = getAz(e); return az === 'FT Made' || az === 'TL Fatto'; }).length;
    const ft_miss = pEvents.filter(e => { const az = getAz(e); return az === 'FT Missed' || az === 'TL Sbagliato'; }).length;
    const ft_a = ft_m + ft_miss;
    
    const pts = (fg2_m * 2) + (fg3_m * 3) + (ft_m * 1);
    const oreb = pEvents.filter(e => { const az = getAz(e); return az === 'Off Rebound' || az === 'Rimb Offensivo'; }).length;
    const dreb = pEvents.filter(e => { const az = getAz(e); return az === 'Def Rebound' || az === 'Rimb Difensivo'; }).length;
    const treb = oreb + dreb;
    const ast = pEvents.filter(e => { const az = getAz(e); return az === 'Assist'; }).length;
    const stl = pEvents.filter(e => { const az = getAz(e); return az === 'Steal' || az === 'Palla Recuperata'; }).length;
    const tov = pEvents.filter(e => { const az = getAz(e); return az === 'Turnover' || az === 'Palla Persa'; }).length;
    const pf = pEvents.filter(e => { const az = getAz(e); return az === 'Personal Foul' || az === 'Fallo Fatto'; }).length;
    const fd = pEvents.filter(e => { const az = getAz(e); return az === 'Fallo Subito' || az === 'Foul Drawn'; }).length;
    const blk = pEvents.filter(e => { const az = getAz(e); return az === 'Block' || az === 'Stoppata Data'; }).length;
    const blka = pEvents.filter(e => { const az = getAz(e); return az === 'Block Allowed' || az === 'Stoppata Subita'; }).length;
    
    const pct2p = fg2_a > 0 ? ((fg2_m / fg2_a) * 100).toFixed(0) : '0';
    const pct3p = fg3_a > 0 ? ((fg3_m / fg3_a) * 100).toFixed(0) : '0';
    const pir = (pts + treb + ast + stl + blk + fd) - ((fg2_miss + fg3_miss) + ft_miss + tov + pf + blka);
    const plusMinus = plusMinusMap[String(selectedPlayer.number)] || 0;

    return {
      pts,
      fg2: `${fg2_m}/${fg2_a} (${pct2p}%)`,
      fg3: `${fg3_m}/${fg3_a} (${pct3p}%)`,
      ft: `${ft_m}/${ft_a}`,
      reb: treb, ast, stl, tov, pf, pir, plusMinus
    };
  };

  const pStats = getPlayerStats();

  return (
    <div className="bg-white p-2.5 px-3 mb-2 flex-none border border-[#DDF3E9] rounded-2xl flex flex-col gap-2 shadow-xs">
      {/* Top Row: Quarter Selector + Tactical Counters + Dual Scoreboard + Quick Opp Scoring + Undo */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap xs:flex-nowrap">
        {/* Touch-Optimized Quarter Selector */}
        <div className="flex items-center gap-1 flex-wrap xs:flex-nowrap">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-[#F8F9FA] p-1 rounded-xl border border-[#DDF3E9] shadow-xs flex-none">
            <Clock className="w-3.5 h-3.5 text-[#0CA17A] ml-1 mr-0.5 flex-none hidden sm:inline" />
            {['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2'].map((q) => {
              const isCurrent = currentQuarter === q;
              return (
                <button
                  key={q}
                  onClick={() => setCurrentQuarter(q)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black transition-all ${
                    isCurrent
                      ? 'bg-[#0CA17A] text-white shadow-sm scale-105'
                      : 'text-[#022D32]/70 hover:text-[#022D32] hover:bg-white'
                  }`}
                >
                  {q}
                </button>
              );
            })}
          </div>

          {/* Editable Match Date Widget */}
          {matchDate && (
            <div className="hidden xs:flex items-center gap-1.5 bg-[#F8F9FA] px-2.5 py-1 rounded-xl border border-[#DDF3E9] text-xs font-bold shadow-xs flex-none">
              <Calendar className="w-3.5 h-3.5 text-[#0CA17A] flex-none" />
              {isAdmin && onUpdateMatchDate ? (
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => onUpdateMatchDate(e.target.value)}
                  className="bg-transparent border-none text-[#022D32] text-xs font-bold focus:outline-none focus:ring-0 p-0 cursor-pointer"
                  title="Click to edit match date (YYYY-MM-DD)"
                />
              ) : (
                <span className="text-[#022D32] text-xs font-mono">{matchDate}</span>
              )}
            </div>
          )}
        </div>

        {/* Right Group: Tactical Counters + Dual Scoreboard + Quick Opp Buttons + Undo */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-none flex-wrap sm:flex-nowrap justify-end">
          {/* Tactical Counters */}
          <div className="hidden md:flex flex-col justify-center gap-0.5 bg-[#022D32] px-2.5 py-1 rounded-xl border border-[#0CA17A]/30 flex-none text-white shadow-xs">
            <div className="flex items-center gap-1 text-[10px] font-bold text-violet-300" title="Team Stagger Screens">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-none"></span>
              <span>STAG:</span>
              <span className="font-mono font-black text-white">{teamStagger}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300" title="Team Ghost Screens">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-none"></span>
              <span>GHOST:</span>
              <span className="font-mono font-black text-white">{teamGhost}</span>
            </div>
          </div>

          {/* DUAL SCOREBOARD: BBA [Score] - [Opp Score] OPPONENT + Live Differential + Manual Override */}
          <div className="flex items-center bg-[#022D32] px-3 sm:px-4 py-1.5 rounded-xl border border-[#0CA17A]/40 shadow-md flex-none gap-2 sm:gap-3 relative group">
            {/* BBA Team */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider leading-none mb-0.5">
                BBA
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 leading-none tabular-nums">
                {displayedTeamPts}
              </span>
            </div>

            {/* Live Differential Pill */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-white/40 font-bold text-xs">-</span>
              <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded border leading-none ${
                diff > 0 
                  ? 'text-white bg-[#0CA17A] border-[#0CA17A]' 
                  : diff < 0 
                  ? 'text-white bg-rose-600 border-rose-500' 
                  : 'text-white/80 bg-white/20 border-white/30'
              }`}>
                {diff > 0 ? `+${diff}` : diff}
              </span>
            </div>

            {/* OPPONENT Team */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-[#A7F3D0] uppercase tracking-wider leading-none mb-0.5">
                OPP
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black text-white leading-none tabular-nums">
                {displayedOppPts}
              </span>
            </div>

            {/* Edit / Pencil Icon for Manual Score Override (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowOverrideModal(true)}
                className={`p-1 rounded transition-all flex items-center justify-center ${
                  isOverridden 
                    ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 shadow-sm' 
                    : 'text-white/50 hover:text-amber-400 hover:bg-white/10'
                }`}
                title={isOverridden ? `Official Table Override Active (${displayedTeamPts}-${displayedOppPts}). PBP: (${teamPts}-${oppPts}). Click to edit.` : "Override Official Score (Sync with Table)"}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Undo Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={onUndo}
              className="action-btn-dense btn-undo-bg text-xs px-2.5 sm:px-3 py-1 min-h-[32px] border-[#C6E8DB] hover:border-[#0CA17A] font-bold flex items-center gap-1 sm:gap-1.5 rounded-xl shadow-xs"
              title="Undo last recorded play event"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#022D32]" />
              <span className="hidden xs:inline">UNDO</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Active Player Live Stat Summary Banner / Ticker */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-1.5 border-t border-[#DDF3E9]">
        {selectedPlayer && pStats ? (
          <>
            <span className="stat-pill-gold-dense flex-none">
              <UserCheck className="w-3.5 h-3.5 text-amber-800" />
              #{selectedPlayer.number} {selectedPlayer.name} ({selectedPlayer.pos})
            </span>
            <span className="stat-pill-dense text-[#022D32] font-black border-[#0CA17A]/40 flex-none">
              {pStats.pts} PTS
            </span>
            <span className={`stat-pill-dense font-mono font-black flex-none ${
              (pStats?.plusMinus || 0) > 0 ? 'text-emerald-700 border-emerald-300' :
              (pStats?.plusMinus || 0) < 0 ? 'text-rose-700 border-rose-300' :
              'text-[#022D32] border-[#DDF3E9]'
            }`}>
              +/-: {(pStats?.plusMinus || 0) > 0 ? `+${pStats.plusMinus}` : (pStats?.plusMinus || 0)}
            </span>
            <span className="stat-pill-dense text-[#022D32] flex-none">
              2P: {pStats.fg2}
            </span>
            <span className="stat-pill-dense text-[#022D32] flex-none">
              3P: {pStats.fg3}
            </span>
            <span className="stat-pill-dense text-[#022D32] flex-none">
              FT: {pStats.ft}
            </span>
            <span className="stat-pill-dense text-[#022D32] flex-none">
              REB: {pStats.reb}
            </span>
            <span className="stat-pill-dense text-[#022D32] flex-none">
              AST: {pStats.ast}
            </span>
            <span className="stat-pill-dense text-[#022D32] font-bold border-[#DDF3E9] flex-none">
              STL: {pStats.stl}
            </span>
            <span className="stat-pill-dense text-rose-700 font-bold border-rose-200 flex-none">
              TOV: {pStats.tov}
            </span>
            <span className="stat-pill-dense text-emerald-800 font-black border-emerald-300 flex-none">
              PIR: {pStats.pir}
            </span>
          </>
        ) : (
          <span className="text-[#022D32]/70 text-[11px] sm:text-xs font-bold tracking-wide py-0.5 px-1 truncate">
            Seleziona un giocatore in campo per visualizzare i dettagli in tempo reale
          </span>
        )}
      </div>

      {/* Manual Score Override Modal (Sync with Official Referee Table) */}
      <ScoreOverrideModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        matchName={matchName}
        pbpTeamScore={teamPts}
        pbpOppScore={oppPts}
        currentOverrideTeamScore={overrideTeamScore}
        currentOverrideOppScore={overrideOppScore}
        onSaveOverride={(tScore, oScore) => {
          if (onSaveScoreOverride) onSaveScoreOverride(tScore, oScore, matchName);
        }}
        onClearOverride={() => {
          if (onClearScoreOverride) onClearScoreOverride(matchName);
        }}
      />
    </div>
  );
}
