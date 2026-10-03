import React from 'react';
import { Clock, RotateCcw, UserCheck } from 'lucide-react';

export default function ScoreboardHeader({
  selectedPlayer,
  events,
  currentQuarter,
  setCurrentQuarter,
  onUndo
}) {
  const getAz = (e) => String(e?.Action || e?.action || e?.Azione || e?.azione || '');
  const getNum = (e) => String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '');

  const teamPts = events.reduce((acc, ev) => {
    const az = getAz(ev);
    if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
    if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
    if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
    return acc;
  }, 0);

  const teamStagger = events.filter(e => getAz(e) === 'Stagger').length;
  const teamGhost = events.filter(e => getAz(e) === 'Ghost').length;

  const getPlayerStats = () => {
    if (!selectedPlayer) return null;
    const pEvents = events.filter(e => getNum(e) === String(selectedPlayer.number));
    
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

    return {
      pts,
      fg2: `${fg2_m}/${fg2_a} (${pct2p}%)`,
      fg3: `${fg3_m}/${fg3_a} (${pct3p}%)`,
      ft: `${ft_m}/${ft_a}`,
      reb: treb, ast, stl, tov, pf, pir
    };
  };

  const pStats = getPlayerStats();

  return (
    <div className="glass-card p-2 px-3 mb-2 flex-none flex items-center justify-between gap-3 border-slate-800">
      {/* Big Touch-Optimized Quarter Selector */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700 shadow-sm flex-none">
        <Clock className="w-4 h-4 text-sky-400 ml-1 mr-0.5 flex-none" />
        {['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2'].map((q) => {
          const isCurrent = currentQuarter === q;
          return (
            <button
              key={q}
              onClick={() => setCurrentQuarter(q)}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-black transition-all ${
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

      {/* Active Player Live Stat Summary Banner */}
      <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap overflow-hidden">
        {selectedPlayer && pStats ? (
          <>
            <span className="stat-pill-gold-dense">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              #{selectedPlayer.number} {selectedPlayer.name} ({selectedPlayer.pos})
            </span>
            <span className="stat-pill-dense text-amber-300 border-amber-600/40">
              {pStats.pts} PTS
            </span>
            <span className="stat-pill-dense text-slate-300">
              2P: {pStats.fg2}
            </span>
            <span className="stat-pill-dense text-slate-300">
              3P: {pStats.fg3}
            </span>
            <span className="stat-pill-dense text-slate-300">
              FT: {pStats.ft}
            </span>
            <span className="stat-pill-dense text-slate-300">
              REB: {pStats.reb}
            </span>
            <span className="stat-pill-dense text-slate-300">
              AST: {pStats.ast}
            </span>
            <span className="stat-pill-dense text-sky-400 border-sky-600/40">
              STL: {pStats.stl}
            </span>
            <span className="stat-pill-dense text-rose-400 border-rose-600/40">
              TOV: {pStats.tov}
            </span>
            <span className="stat-pill-dense text-emerald-400 border-emerald-600/40">
              PIR: {pStats.pir}
            </span>
          </>
        ) : (
          <span className="text-slate-400 text-xs font-semibold tracking-wide">
            Select an active on-court player to review real-time match metrics
          </span>
        )}
      </div>

      {/* Team Tactical Counters, Evident Score Display & Undo */}
      <div className="flex items-center gap-2.5 flex-none">
        {/* Tactical Counters */}
        <div className="flex flex-col justify-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex-none">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300" title="Team Stagger Screens">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            <span>STAG:</span>
            <span className="font-mono font-black text-violet-100">{teamStagger}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300" title="Team Ghost Screens">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>GHOST:</span>
            <span className="font-mono font-black text-cyan-100">{teamGhost}</span>
          </div>
        </div>

        {/* Clear & Evident Team Score Display */}
        <div className="flex items-center bg-slate-950 px-4 py-1.5 rounded-lg border-2 border-amber-500/40 shadow-md flex-none">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
              TEAM SCORE
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400 leading-none tabular-nums">
                {teamPts}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase">PTS</span>
            </div>
          </div>
        </div>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          className="action-btn-dense btn-undo-bg text-xs px-3 py-1.5 min-h-[38px] border-slate-700 hover:border-slate-500 font-bold flex items-center gap-1.5 rounded-lg shadow-sm"
        >
          <RotateCcw className="w-4 h-4 text-slate-300" />
          UNDO
        </button>
      </div>
    </div>
  );
}
