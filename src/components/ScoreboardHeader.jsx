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
    <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-700/60 rounded-xl p-1.5 px-3 mb-2 flex-none shadow-md">
      {/* Quarter Selector */}
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-sky-400" />
        <select
          value={currentQuarter}
          onChange={(e) => setCurrentQuarter(e.target.value)}
          className="bg-slate-950 text-slate-100 font-bold py-0.5 px-2 rounded border border-slate-700 text-xs cursor-pointer focus:outline-none focus:border-sky-400"
        >
          {['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2'].map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>

      {/* Active Player Live Stat Summary Banner */}
      <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap overflow-hidden">
        {selectedPlayer && pStats ? (
          <>
            <span className="stat-pill-gold-dense">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              #{selectedPlayer.number} {selectedPlayer.name} ({selectedPlayer.pos})
            </span>
            <span className="stat-pill-dense text-amber-400 border-amber-500/40">
              {pStats.pts} PTS
            </span>
            <span className="stat-pill-dense text-slate-200">
              2P: {pStats.fg2}
            </span>
            <span className="stat-pill-dense text-slate-200">
              3P: {pStats.fg3}
            </span>
            <span className="stat-pill-dense text-slate-200">
              FT: {pStats.ft}
            </span>
            <span className="stat-pill-dense text-slate-200">
              REB: {pStats.reb}
            </span>
            <span className="stat-pill-dense text-slate-200">
              AST: {pStats.ast}
            </span>
            <span className="stat-pill-dense text-sky-400 border-sky-500/30">
              STL: {pStats.stl}
            </span>
            <span className="stat-pill-dense text-rose-400 border-rose-500/30">
              TOV: {pStats.tov}
            </span>
            <span className="stat-pill-dense text-emerald-400 border-emerald-500/30">
              PIR: {pStats.pir}
            </span>
          </>
        ) : (
          <span className="text-slate-400 font-semibold text-xs truncate">
            👈 SELECT A PLAYER CARD TO DISPLAY INDIVIDUAL MATCH STATS
          </span>
        )}
      </div>

      {/* Team Points, Tactical Screens (Stagger/Ghost) & Undo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-950/90 px-2 py-1 rounded-lg border border-slate-800 shadow-inner">
          <div className="flex items-center gap-1 text-[11px] font-black text-purple-400" title="Team Stagger Screens">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            STAG: <span className="font-mono text-purple-200">{teamStagger}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-[11px] font-black text-cyan-400" title="Team Ghost Screens">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            GHOST: <span className="font-mono text-cyan-200">{teamGhost}</span>
          </div>
        </div>

        <div className="digital-score-dense">
          {teamPts} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PTS</span>
        </div>

        <button
          onClick={onUndo}
          className="action-btn-dense btn-undo-bg text-xs px-2.5 py-1 min-h-[30px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          UNDO
        </button>
      </div>
    </div>
  );
}
