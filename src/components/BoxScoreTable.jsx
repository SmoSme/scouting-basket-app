import React from 'react';
import { Trophy, BarChart2, Sparkles, Layers, Ghost } from 'lucide-react';
import { COURT_ZONES } from '../data/roster.js';
import { calculatePlusMinus, computeZoneStats } from '../utils/basketballAnalytics.js';
import { useLanguage } from '../context/LanguageContext';

export default function BoxScoreTable({ roster, events, plusMinusMap = null }) {
  const { language } = useLanguage();
  const isIt = language === 'it';

  if (!events || events.length === 0) {
    return (
      <div className="bg-white p-8 text-center border border-slate-200/80 rounded-2xl shadow-xs text-slate-900">
        <p className="text-slate-500 font-medium text-sm">
          {isIt
            ? 'Nessun evento di gioco registrato nella partita. Usa il Live Tracking per registrare le azioni.'
            : 'No play events logged in the match yet. Use the Live Tracking Dashboard to record match plays.'}
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

  // Filter out non-player numbers so team/opponent/sub actions don't create dummy rows
  const logNums = Array.from(new Set(events.map(e => getNum(e))))
    .filter(n => Boolean(n) && n !== '-' && n !== 'TEAM' && n !== 'SUB' && n !== 'OPP');
  const allNums = Array.from(new Set([...Object.keys(rosterMap), ...logNums]));

  const activePmMap = plusMinusMap || calculatePlusMinus(events, [], roster);

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
    const plusMinus = activePmMap[String(num)] || 0;

    return {
      number: num,
      name: pInfo.name,
      pos: pInfo.pos,
      pts,
      fg2: `${fg2_m}/${fg2_a}`, pct2p: `${pct2p}%`,
      fg3: `${fg3_m}/${fg3_a}`, pct3p: `${pct3p}%`,
      ft: `${ft_m}/${ft_a}`, pctFt: `${pctFt}%`,
      reb: treb, ast, stl, tov, pf, fd, blk, pir, plusMinus,
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

  // Shot zone stats using shared computeZoneStats engine
  const zoneSummary = computeZoneStats(events).zones;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Box Score Table */}
      <div className="col-span-12 lg:col-span-8 bg-white p-4 sm:p-5 overflow-x-auto border border-slate-200/80 rounded-2xl shadow-xs text-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
          <Trophy className="w-4 h-4 text-[#0CA17A]" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {isIt ? 'TABELLINO UFFICIALE FIBA' : 'OFFICIAL FIBA BOX SCORE'}
          </h2>
        </div>
        
        <table className="w-full text-left text-xs font-medium">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="py-2.5 px-2">N°</th>
              <th className="py-2.5 px-2">{isIt ? 'GIOCATORE' : 'PLAYER'}</th>
              <th className="py-2.5 px-2 text-slate-900 font-bold">PTS</th>
              <th className="py-2.5 px-2">{isIt ? '2P R/T' : '2PM/A'}</th>
              <th className="py-2.5 px-2">2P%</th>
              <th className="py-2.5 px-2">{isIt ? '3P R/T' : '3PM/A'}</th>
              <th className="py-2.5 px-2">3P%</th>
              <th className="py-2.5 px-2">{isIt ? 'TL R/T' : 'FTM/A'}</th>
              <th className="py-2.5 px-2">{isIt ? 'TL%' : 'FT%'}</th>
              <th className="py-2.5 px-2">REB</th>
              <th className="py-2.5 px-2">AST</th>
              <th className="py-2.5 px-2 text-slate-900 font-bold">STL</th>
              <th className="py-2.5 px-2 text-rose-700 font-bold">TOV</th>
              <th className="py-2.5 px-2">{isIt ? 'FF' : 'PF'}</th>
              <th className="py-2.5 px-2 text-emerald-800 font-bold">PIR</th>
              <th className="py-2.5 px-2 text-slate-900 font-bold">+/-</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr key={r.number} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-2 font-semibold text-slate-400 tabular-nums">#{r.number}</td>
                <td className="py-2.5 px-2 text-slate-900 font-semibold">{r.name} ({r.pos})</td>
                <td className="py-2.5 px-2 text-slate-900 font-bold text-sm tabular-nums">{r.pts}</td>
                <td className="py-2.5 px-2 text-slate-700 tabular-nums">{r.fg2}</td>
                <td className="py-2.5 px-2 text-slate-600 tabular-nums font-semibold">{r.pct2p}</td>
                <td className="py-2.5 px-2 text-slate-700 tabular-nums">{r.fg3}</td>
                <td className="py-2.5 px-2 text-slate-600 tabular-nums font-semibold">{r.pct3p}</td>
                <td className="py-2.5 px-2 text-slate-700 tabular-nums">{r.ft}</td>
                <td className="py-2.5 px-2 text-slate-600 tabular-nums font-semibold">{r.pctFt}</td>
                <td className="py-2.5 px-2 text-slate-700 tabular-nums">{r.reb}</td>
                <td className="py-2.5 px-2 text-slate-700 tabular-nums">{r.ast}</td>
                <td className="py-2.5 px-2 text-slate-700 font-semibold tabular-nums">{r.stl}</td>
                <td className="py-2.5 px-2 text-rose-700 font-semibold tabular-nums">{r.tov}</td>
                <td className="py-2.5 px-2 text-slate-700 tabular-nums">{r.pf}</td>
                <td className="py-2.5 px-2 text-emerald-800 font-bold tabular-nums">{r.pir}</td>
                <td className={`py-2.5 px-2 tabular-nums font-bold ${
                  (r.plusMinus || 0) > 0 ? 'text-emerald-700' :
                  (r.plusMinus || 0) < 0 ? 'text-rose-700' :
                  'text-slate-700'
                }`}>
                  {(r.plusMinus || 0) > 0 ? `+${r.plusMinus}` : (r.plusMinus || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right Column: Team Tactical Metrics & Shot Zone Efficiency */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        {/* Team Tactical Metrics Card */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs text-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0CA17A]" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isIt ? 'METRICHE TATTICHE SQUADRA' : 'TEAM TACTICAL METRICS'}
              </h2>
            </div>
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
              {isIt ? 'TOTALE' : 'TOTAL'}: {totalTactics}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-semibold text-slate-800">STAGGER</span>
              </div>
              <span className="text-base font-bold text-purple-800 tabular-nums">{staggerEvents.length}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ghost className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-semibold text-slate-800">GHOST</span>
              </div>
              <span className="text-base font-bold text-teal-800 tabular-nums">{ghostEvents.length}</span>
            </div>
          </div>

          {/* Quarter Breakdown */}
          {tacticsByQuarter.length > 0 && (
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold bg-slate-50">
                  <th className="py-1.5 px-2">{isIt ? 'PERIODO' : 'PERIOD'}</th>
                  <th className="py-1.5 px-2 text-purple-800 font-semibold">STAGGER</th>
                  <th className="py-1.5 px-2 text-teal-800 font-semibold">GHOST</th>
                  <th className="py-1.5 px-2 text-right text-slate-900 font-semibold">{isIt ? 'TOTALE' : 'TOTAL'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tacticsByQuarter.map(t => (
                  <tr key={t.quarter} className="hover:bg-slate-50/80">
                    <td className="py-1.5 px-2 text-slate-800 font-semibold tabular-nums">{t.quarter}</td>
                    <td className="py-1.5 px-2 text-purple-800 font-semibold tabular-nums">{t.stagger}</td>
                    <td className="py-1.5 px-2 text-teal-800 font-semibold tabular-nums">{t.ghost}</td>
                    <td className="py-1.5 px-2 text-right text-slate-900 font-bold tabular-nums">{t.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Shot Zone Efficiency Table */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs text-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <BarChart2 className="w-4 h-4 text-[#0CA17A]" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {isIt ? 'EFFICIENZA PER ZONA DI TIRO' : 'SHOT ZONE EFFICIENCY CHART'}
            </h2>
          </div>
          
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-2.5 px-2">{isIt ? 'ZONA CAMPO' : 'COURT ZONE'}</th>
                <th className="py-2.5 px-2">{isIt ? 'REAL. / TENT.' : 'MADE / ATT'}</th>
                <th className="py-2.5 px-2 text-slate-900 font-bold">FG %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zoneSummary.map(z => (
                <tr key={z.name} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-2 text-slate-900 font-medium">{z.name} ({z.type})</td>
                  <td className="py-2.5 px-2 text-slate-700 tabular-nums">{z.made}/{z.attempts}</td>
                  <td className="py-2.5 px-2 text-emerald-700 font-bold tabular-nums">{z.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
