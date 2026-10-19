import React from 'react';
import { Clock, RotateCcw, UserCheck, ShieldAlert, Plus, Minus } from 'lucide-react';
import { calculateTeamScore, calculateOpponentScore } from '../utils/basketballAnalytics';

export default function ScoreboardHeader({
  selectedPlayer,
  events,
  currentQuarter,
  setCurrentQuarter,
  onUndo,
  onRecordOpponentScore,
  plusMinusMap = {},
  isAdmin = true
}) {
  const getAz = (e) => String(e?.Action || e?.action || e?.Azione || e?.azione || '');
  const getNum = (e) => String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '');

  const teamPts = calculateTeamScore(events);
  const oppPts = calculateOpponentScore(events);
  const diff = teamPts - oppPts;

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
    <div className="glass-card p-2 px-3 mb-2 flex-none border-slate-800 flex flex-col gap-1.5 shadow-md">
      {/* Top Row: Quarter Selector + Tactical Counters + Dual Scoreboard + Quick Opp Scoring + Undo */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap xs:flex-nowrap">
        {/* Touch-Optimized Quarter Selector */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700 shadow-sm flex-none">
          <Clock className="w-3.5 h-3.5 text-sky-400 ml-1 mr-0.5 flex-none hidden sm:inline" />
          {['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2'].map((q) => {
            const isCurrent = currentQuarter === q;
            return (
              <button
                key={q}
                onClick={() => setCurrentQuarter(q)}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs sm:text-sm font-black transition-all ${
                  isCurrent
                    ? 'bg-sky-500 text-slate-950 shadow-md scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>

        {/* Right Group: Tactical Counters + Dual Scoreboard + Quick Opp Buttons + Undo */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-none flex-wrap sm:flex-nowrap justify-end">
          {/* Tactical Counters */}
          <div className="hidden md:flex flex-col justify-center gap-0.5 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 flex-none">
            <div className="flex items-center gap-1 text-[10px] font-bold text-violet-300" title="Team Stagger Screens">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-none"></span>
              <span>STAG:</span>
              <span className="font-mono font-black text-violet-100">{teamStagger}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300" title="Team Ghost Screens">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-none"></span>
              <span>GHOST:</span>
              <span className="font-mono font-black text-cyan-100">{teamGhost}</span>
            </div>
          </div>

          {/* DUAL SCOREBOARD: BBA [Score] - [Opp Score] OPPONENT + Live Differential */}
          <div className="flex items-center bg-slate-950 px-2 sm:px-3 py-1 rounded-lg border border-slate-750 shadow-md flex-none gap-2 sm:gap-2.5">
            {/* BBA Team */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider leading-none mb-0.5">
                BBA
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 leading-none tabular-nums">
                {teamPts}
              </span>
            </div>

            {/* Live Differential Pill */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-slate-600 font-bold text-xs">-</span>
              <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded border leading-none ${
                diff > 0 
                  ? 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40' 
                  : diff < 0 
                  ? 'text-rose-400 bg-rose-950/70 border-rose-500/40' 
                  : 'text-slate-400 bg-slate-900 border-slate-700'
              }`}>
                {diff > 0 ? `+${diff}` : diff}
              </span>
            </div>

            {/* OPPONENT Team */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                OPP
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-100 leading-none tabular-nums">
                {oppPts}
              </span>
            </div>
          </div>

          {/* Quick Opponent Score Buttons (Admin only) */}
          {isAdmin && onRecordOpponentScore && (
            <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex-none">
              <button
                onClick={() => onRecordOpponentScore(1)}
                className="btn-opp-score"
                title="Add 1 point for Opponent"
              >
                +1 OPP
              </button>
              <button
                onClick={() => onRecordOpponentScore(2)}
                className="btn-opp-score"
                title="Add 2 points for Opponent"
              >
                +2 OPP
              </button>
              <button
                onClick={() => onRecordOpponentScore(3)}
                className="btn-opp-score"
                title="Add 3 points for Opponent"
              >
                +3 OPP
              </button>
              <button
                onClick={() => onRecordOpponentScore(-1)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 p-1 rounded h-[28px] w-[26px] flex items-center justify-center transition-colors"
                title="Correct / Subtract 1 point from Opponent"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Undo Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={onUndo}
              className="action-btn-dense btn-undo-bg text-xs px-2.5 sm:px-3 py-1 min-h-[30px] border-slate-700 hover:border-slate-500 font-bold flex items-center gap-1 sm:gap-1.5 rounded-lg shadow-sm"
              title="Undo last recorded play event"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden xs:inline">UNDO</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Active Player Live Stat Summary Banner / Ticker */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/80">
        {selectedPlayer && pStats ? (
          <>
            <span className="stat-pill-gold-dense flex-none">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              #{selectedPlayer.number} {selectedPlayer.name} ({selectedPlayer.pos})
            </span>
            <span className="stat-pill-dense text-amber-300 border-amber-600/40 flex-none">
              {pStats.pts} PTS
            </span>
            <span className={`stat-pill-dense font-mono font-bold flex-none ${
              (pStats?.plusMinus || 0) > 0 ? 'text-emerald-400 border-emerald-500/40' :
              (pStats?.plusMinus || 0) < 0 ? 'text-rose-400 border-rose-500/40' :
              'text-slate-400 border-slate-700'
            }`}>
              +/-: {(pStats?.plusMinus || 0) > 0 ? `+${pStats.plusMinus}` : (pStats?.plusMinus || 0)}
            </span>
            <span className="stat-pill-dense text-slate-300 flex-none">
              2P: {pStats.fg2}
            </span>
            <span className="stat-pill-dense text-slate-300 flex-none">
              3P: {pStats.fg3}
            </span>
            <span className="stat-pill-dense text-slate-300 flex-none">
              FT: {pStats.ft}
            </span>
            <span className="stat-pill-dense text-slate-300 flex-none">
              REB: {pStats.reb}
            </span>
            <span className="stat-pill-dense text-slate-300 flex-none">
              AST: {pStats.ast}
            </span>
            <span className="stat-pill-dense text-sky-400 border-sky-600/40 flex-none">
              STL: {pStats.stl}
            </span>
            <span className="stat-pill-dense text-rose-400 border-rose-600/40 flex-none">
              TOV: {pStats.tov}
            </span>
            <span className="stat-pill-dense text-emerald-400 border-emerald-600/40 flex-none">
              PIR: {pStats.pir}
            </span>
          </>
        ) : (
          <span className="text-slate-400 text-[11px] sm:text-xs font-semibold tracking-wide py-0.5 px-1 truncate">
            Select an active on-court player to review real-time match metrics
          </span>
        )}
      </div>
    </div>
  );
}
