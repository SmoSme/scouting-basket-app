import React from 'react';
import { Clock, RotateCcw, UserCheck } from 'lucide-react';

export default function ScoreboardHeader({
  selectedPlayer,
  events,
  currentQuarter,
  setCurrentQuarter,
  onUndo
}) {
  const getAz = (e) => e?.Azione || e?.azione || '';
  const getNum = (e) => String(e?.Numero ?? e?.numero ?? '');

  const teamPts = events.reduce((acc, ev) => {
    const az = getAz(ev);
    if (az === '2PT Fatto') return acc + 2;
    if (az === '3PT Fatto') return acc + 3;
    if (az === 'TL Fatto') return acc + 1;
    return acc;
  }, 0);

  const getPlayerStats = () => {
    if (!selectedPlayer) return null;
    const pEvents = events.filter(e => getNum(e) === String(selectedPlayer.number));
    
    const fg2_m = pEvents.filter(e => getAz(e) === '2PT Fatto').length;
    const fg2_miss = pEvents.filter(e => getAz(e) === '2PT Sbagliato').length;
    const fg2_a = fg2_m + fg2_miss;
    
    const fg3_m = pEvents.filter(e => getAz(e) === '3PT Fatto').length;
    const fg3_miss = pEvents.filter(e => getAz(e) === '3PT Sbagliato').length;
    const fg3_a = fg3_m + fg3_miss;
    
    const ft_m = pEvents.filter(e => getAz(e) === 'TL Fatto').length;
    const ft_miss = pEvents.filter(e => getAz(e) === 'TL Sbagliato').length;
    const ft_a = ft_m + ft_miss;
    
    const pts = (fg2_m * 2) + (fg3_m * 3) + (ft_m * 1);
    const oreb = pEvents.filter(e => getAz(e) === 'Rimb Offensivo').length;
    const dreb = pEvents.filter(e => getAz(e) === 'Rimb Difensivo').length;
    const treb = oreb + dreb;
    const ast = pEvents.filter(e => getAz(e) === 'Assist').length;
    const stl = pEvents.filter(e => getAz(e) === 'Palla Recuperata').length;
    const tov = pEvents.filter(e => getAz(e) === 'Palla Persa').length;
    const pf = pEvents.filter(e => getAz(e) === 'Fallo Fatto').length;
    const fd = pEvents.filter(e => getAz(e) === 'Fallo Subito').length;
    const blk = pEvents.filter(e => getAz(e) === 'Stoppata Data').length;
    const blka = pEvents.filter(e => getAz(e) === 'Stoppata Subita').length;
    
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
    <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 px-3 mb-2 flex-none">
      {/* Quarter Selector */}
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <select
          value={currentQuarter}
          onChange={(e) => setCurrentQuarter(e.target.value)}
          className="bg-slate-950 text-slate-100 font-bold py-0.5 px-2 rounded border border-slate-700 text-xs cursor-pointer focus:outline-none"
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
              <UserCheck className="w-3.5 h-3.5" />
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

      {/* Team Points & Undo */}
      <div className="flex items-center gap-3">
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
