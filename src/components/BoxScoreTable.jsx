import React from 'react';
import { Trophy, BarChart2, Sparkles, Layers, Ghost } from 'lucide-react';
import { COURT_ZONES } from '../data/roster.js';

export default function BoxScoreTable({ roster, events }) {
  if (!events || events.length === 0) {
    return (
      <div className="glass-card p-8 text-center border-slate-700/60">
        <p className="text-slate-400 font-bold text-sm">
          No play events logged in the match yet. Use the Live Tracking Dashboard to record match plays.
        </p>
      </div>
    );
  }

  const rosterMap = {};
  roster.forEach(p => {
    rosterMap[String(p.number)] = p;
  });

  const getAz = (e) => String(e?.Action || e?.action || e?.Azione || e?.azione || '');
  const getNum = (e) => String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '');
  const getZona = (e) => String(e?.Zone || e?.zone || e?.Zona || e?.zona || '');
  const getGiocatore = (e) => String(e?.Player || e?.player || e?.Giocatore || e?.giocatore || '');
  const getQtr = (e) => String(e?.Quarter || e?.quarter || e?.Quarto || e?.quarto || 'Q1');

  // Filter out '-' and 'TEAM' so team actions don't create dummy player rows
  const logNums = Array.from(new Set(events.map(e => getNum(e))))
    .filter(n => Boolean(n) && n !== '-' && n !== 'TEAM');
  const allNums = Array.from(new Set([...Object.keys(rosterMap), ...logNums]));

  const rows = allNums.map(num => {
    const pEvents = events.filter(e => getNum(e) === num);
    const eventPlayer = pEvents.find(e => getGiocatore(e)?.trim());
    const eventName = eventPlayer ? getGiocatore(eventPlayer).trim() : '';
    const pInfo = {
      name: eventName || rosterMap[num]?.name || `Player #${num}`,
      pos: rosterMap[num]?.pos || '-'
    };

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
    const fd = pEvents.filter(e => { const az = getAz(e); return az === 'Foul Drawn' || az === 'Fallo Subito'; }).length;
    const blk = pEvents.filter(e => { const az = getAz(e); return az === 'Block' || az === 'Stoppata Data'; }).length;
    const blka = pEvents.filter(e => { const az = getAz(e); return az === 'Block Allowed' || az === 'Stoppata Subita'; }).length;

    const pct2p = fg2_a > 0 ? ((fg2_m / fg2_a) * 100).toFixed(0) : '0';
    const pct3p = fg3_a > 0 ? ((fg3_m / fg3_a) * 100).toFixed(0) : '0';
    const pctFt = ft_a > 0 ? ((ft_m / ft_a) * 100).toFixed(0) : '0';

    const pir = (pts + treb + ast + stl + blk + fd) - ((fg2_miss + fg3_miss) + ft_miss + tov + pf + blka);

    return {
      number: num,
      name: pInfo.name,
      pos: pInfo.pos,
      pts,
      fg2: `${fg2_m}/${fg2_a}`, pct2p: `${pct2p}%`,
      fg3: `${fg3_m}/${fg3_a}`, pct3p: `${pct3p}%`,
      ft: `${ft_m}/${ft_a}`, pctFt: `${pctFt}%`,
      reb: treb, ast, stl, tov, pf, fd, blk, pir,
      actionsCount: pEvents.length
    };
  }).sort((a, b) => b.actionsCount - a.actionsCount || b.pts - a.pts);

  // Tactical Screens (Team-level metrics)
  const staggerEvents = events.filter(e => getAz(e) === 'Stagger');
  const ghostEvents = events.filter(e => getAz(e) === 'Ghost');
  const totalTactics = staggerEvents.length + ghostEvents.length;

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'];
  const tacticsByQuarter = quarters.map(q => {
    const stagQ = staggerEvents.filter(e => getQtr(e).startsWith(q)).length;
    const ghostQ = ghostEvents.filter(e => getQtr(e).startsWith(q)).length;
    return { quarter: q, stagger: stagQ, ghost: ghostQ, total: stagQ + ghostQ };
  }).filter(t => t.total > 0 || ['Q1', 'Q2', 'Q3', 'Q4'].includes(t.quarter));

  // Shot zone stats
  const shotEvents = events.filter(e => {
    const az = getAz(e);
    return ['2PT Made', '2PT Missed', '3PT Made', '3PT Missed', '2PT Fatto', '2PT Sbagliato', '3PT Fatto', '3PT Sbagliato'].includes(az);
  });

  const zoneSummary = Object.values(COURT_ZONES).map(zoneInfo => {
    const zEvents = shotEvents.filter(e => getZona(e) === zoneInfo.name);
    const made = zEvents.filter(e => {
      const az = getAz(e);
      return az.includes('Made') || az.includes('Fatto');
    }).length;
    const attempts = zEvents.length;
    const pct = attempts > 0 ? ((made / attempts) * 100).toFixed(1) : '0.0';
    return {
      name: zoneInfo.name,
      type: zoneInfo.type,
      made, attempts, pct: `${pct}%`
    };
  });

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Box Score Table */}
      <div className="col-span-12 lg:col-span-8 glass-card p-4 overflow-x-auto border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
          <Trophy className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            OFFICIAL FIBA BOX SCORE
          </h2>
        </div>
        
        <table className="w-full text-left text-xs font-semibold">
          <thead>
            <tr className="border-b border-slate-700/80 text-slate-400">
              <th className="py-2.5 px-2">N°</th>
              <th className="py-2.5 px-2">PLAYER</th>
              <th className="py-2.5 px-2 text-amber-400 font-bold">PTS</th>
              <th className="py-2.5 px-2">2PM/A</th>
              <th className="py-2.5 px-2">2P%</th>
              <th className="py-2.5 px-2">3PM/A</th>
              <th className="py-2.5 px-2">3P%</th>
              <th className="py-2.5 px-2">FTM/A</th>
              <th className="py-2.5 px-2">FT%</th>
              <th className="py-2.5 px-2">REB</th>
              <th className="py-2.5 px-2">AST</th>
              <th className="py-2.5 px-2 text-sky-400">STL</th>
              <th className="py-2.5 px-2 text-rose-400">TOV</th>
              <th className="py-2.5 px-2">PF</th>
              <th className="py-2.5 px-2 text-emerald-400 font-bold">PIR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.number} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-2 font-bold text-sky-400 font-mono">#{r.number}</td>
                <td className="py-2.5 px-2 text-slate-100 font-bold">{r.name} ({r.pos})</td>
                <td className="py-2.5 px-2 text-amber-400 font-black text-sm">{r.pts}</td>
                <td className="py-2.5 px-2 text-slate-200">{r.fg2}</td>
                <td className="py-2.5 px-2 text-slate-300">{r.pct2p}</td>
                <td className="py-2.5 px-2 text-slate-200">{r.fg3}</td>
                <td className="py-2.5 px-2 text-slate-300">{r.pct3p}</td>
                <td className="py-2.5 px-2 text-slate-200">{r.ft}</td>
                <td className="py-2.5 px-2 text-slate-300">{r.pctFt}</td>
                <td className="py-2.5 px-2 text-slate-200">{r.reb}</td>
                <td className="py-2.5 px-2 text-slate-200">{r.ast}</td>
                <td className="py-2.5 px-2 text-sky-400 font-bold">{r.stl}</td>
                <td className="py-2.5 px-2 text-rose-400 font-bold">{r.tov}</td>
                <td className="py-2.5 px-2 text-slate-200">{r.pf}</td>
                <td className="py-2.5 px-2 text-emerald-400 font-black">{r.pir}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right Column: Team Tactical Metrics & Shot Zone Efficiency */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        {/* Team Tactical Metrics Card */}
        <div className="glass-card p-4 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                TEAM TACTICAL METRICS
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded">
              TOTAL: {totalTactics}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-900 border border-slate-800 rounded p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-slate-200">STAGGER</span>
              </div>
              <span className="text-base font-bold text-violet-300 font-mono">{staggerEvents.length}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ghost className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">GHOST</span>
              </div>
              <span className="text-base font-bold text-cyan-300 font-mono">{ghostEvents.length}</span>
            </div>
          </div>

          {/* Quarter Breakdown */}
          {tacticsByQuarter.length > 0 && (
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-700/80 text-slate-400 text-[11px]">
                  <th className="py-1.5 px-2">PERIOD</th>
                  <th className="py-1.5 px-2 text-violet-400">STAGGER</th>
                  <th className="py-1.5 px-2 text-cyan-400">GHOST</th>
                  <th className="py-1.5 px-2 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {tacticsByQuarter.map(t => (
                  <tr key={t.quarter} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                    <td className="py-1.5 px-2 text-slate-300 font-mono font-bold">{t.quarter}</td>
                    <td className="py-1.5 px-2 text-violet-300 font-mono">{t.stagger}</td>
                    <td className="py-1.5 px-2 text-cyan-300 font-mono">{t.ghost}</td>
                    <td className="py-1.5 px-2 text-right text-slate-200 font-bold font-mono">{t.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Shot Zone Efficiency Table */}
        <div className="glass-card p-4 border-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              SHOT ZONE EFFICIENCY CHART
            </h2>
          </div>
          
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400">
                <th className="py-2.5 px-2">COURT ZONE</th>
                <th className="py-2.5 px-2">MADE / ATT</th>
                <th className="py-2.5 px-2 text-emerald-400 font-bold">FG %</th>
              </tr>
            </thead>
            <tbody>
              {zoneSummary.map(z => (
                <tr key={z.name} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-2.5 px-2 text-slate-200 font-bold">{z.name} ({z.type})</td>
                  <td className="py-2.5 px-2 text-slate-300">{z.made}/{z.attempts}</td>
                  <td className="py-2.5 px-2 text-emerald-400 font-black">{z.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
