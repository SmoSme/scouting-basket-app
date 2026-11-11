import React, { useState, useMemo } from 'react';
import { 
  X, ArrowLeft, ShieldCheck, Activity, BarChart2, Shield, 
  Zap, Scale, Trophy, Target, TrendingUp, Award, Layers, Clock, Flame
} from 'lucide-react';
import { TacticalTagIcon, getTacticalTags, formatMinutes } from '../pages/LeagueHub';
import CourtPitchMap from './CourtPitchMap';
import { computeZoneStats } from '../utils/basketballAnalytics';

export default function PlayerProfileModal({
  player,
  onClose,
  teamName = 'BBA Basket Baronissi',
  language = 'it',
  t = {},
  events = []
}) {
  const [selectedZoneKey, setSelectedZoneKey] = useState(null);

  if (!player) return null;

  // Strictly Season 2026/2027 Team Scope
  const profileStats = player;
  const profileGames = player.games || 0;
  const profileAnalysis = getTacticalTags(profileStats, profileGames);
  const profileTags = profileAnalysis.tags;
  const profileMetrics = profileAnalysis.metrics;

  // Filter player shot events across the season for the court heatmap
  const playerShotEvents = useMemo(() => {
    const pNum = String(player?.number || '').trim();
    const pName = String(player?.name || '').toLowerCase();
    const allEvents = (Array.isArray(events) && events.length > 0)
      ? events
      : (Array.isArray(player?.shotEvents) ? player.shotEvents : (Array.isArray(player?.events) ? player.events : []));

    return allEvents.filter(e => {
      const eNum = String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '').trim();
      const ePlayer = String(e?.Player ?? e?.player ?? '').toLowerCase();
      const isThisPlayer = (pNum && eNum === pNum) || (pName && ePlayer.includes(pName));
      if (!isThisPlayer) return false;
      const act = String(e?.Action ?? e?.action ?? '');
      return act.includes('2PT') || act.includes('3PT') || act.includes('Tiro') || act.includes('Shot');
    });
  }, [events, player]);

  const activeZoneStats = useMemo(() => {
    return computeZoneStats(playerShotEvents);
  }, [playerShotEvents]);

  // Exact Season 2026/2027 Point Distribution (Scouting + FIP Hybrid Totals across all profileGames)
  const season2m = Math.round(
    player.hybridFg2m != null 
      ? player.hybridFg2m 
      : (player.fg2m != null ? player.fg2m : (player.twoMadeAVG != null ? player.twoMadeAVG * profileGames : 0))
  );
  const season3m = Math.round(
    player.hybridFg3m != null 
      ? player.hybridFg3m 
      : (player.fg3m != null ? player.fg3m : (player.threeMadeAVG != null ? player.threeMadeAVG * profileGames : 0))
  );
  const rawPtsTotal = Math.round(
    player.totalPts != null 
      ? player.totalPts 
      : (player.ptsTotal != null ? player.ptsTotal : (typeof player.pointsAVG === 'number' ? player.pointsAVG * profileGames : 0))
  );
  const seasonFtm = Math.round(
    player.hybridFtm != null 
      ? player.hybridFtm 
      : (player.ftm != null ? player.ftm : Math.max(0, rawPtsTotal - (season2m * 2 + season3m * 3)))
  );

  const seasonPts2 = season2m * 2;
  const seasonPts3 = season3m * 3;
  const seasonPtsFT = seasonFtm;
  const totalSeasonCalcPts = (seasonPts2 + seasonPts3 + seasonPtsFT) > 0 
    ? (seasonPts2 + seasonPts3 + seasonPtsFT) 
    : (rawPtsTotal || 0);

  const seasonPct2 = totalSeasonCalcPts > 0 ? (seasonPts2 / totalSeasonCalcPts) * 100 : 0;
  const seasonPct3 = totalSeasonCalcPts > 0 ? (seasonPts3 / totalSeasonCalcPts) * 100 : 0;
  const seasonPctFT = totalSeasonCalcPts > 0 ? (seasonPtsFT / totalSeasonCalcPts) * 100 : 0;

  // Metric Displays: Dual Display (Media & Totali) for EVERY Roster Table metric
  // 1. Points (100% coordinated between Top Card and Shot Profile Bar)
  const ptsTotalDisplay = totalSeasonCalcPts;
  const ppgDisplay = profileGames > 0 
    ? (totalSeasonCalcPts / profileGames).toFixed(1) 
    : '0.0';

  // 2. Minutes (FIP exclusive)
  const minAvgVal = (player.timePlayedAVG != null && !isNaN(Number(player.timePlayedAVG)) && Number(player.timePlayedAVG) > 0) ? Number(player.timePlayedAVG) : null;
  const minAvgDisplay = minAvgVal != null ? formatMinutes(minAvgVal) : '—';
  const fipG = player.fipGamesCount || profileGames || 0;
  const minTotalDisplay = (minAvgVal != null && fipG > 0) ? `${Math.round((minAvgVal / 60) * fipG)}' TOT` : '—';

  // Helper to format Shooting Totals without mixing 3-game makes with 2-game attempts
  const formatShotTotal = (totalMade, scoutMade, scoutAtt) => {
    if (scoutAtt > 0) {
      if (player.hasFewerScoutingGames && scoutMade != null && totalMade !== scoutMade) {
        return `${totalMade} TOT (${scoutMade}/${scoutAtt}*)`;
      }
      return `${scoutMade ?? totalMade}/${scoutAtt} TOT`;
    }
    return totalMade > 0 ? `${totalMade} TOT` : '0 TOT';
  };

  // 3. 2-Pointers
  const twoAvgVal = player.hybrid2MadeAvg != null ? player.hybrid2MadeAvg : player.twoMadeAVG;
  const twoAvgDisplay = (typeof twoAvgVal === 'number' && !isNaN(twoAvgVal)) 
    ? twoAvgVal.toFixed(1) 
    : (profileGames > 0 ? (season2m / profileGames).toFixed(1) : '0.0');
  const twoPctDisplay = player.twoPct != null ? `${player.twoPct}%` : '—';
  const twoTotalDisplay = formatShotTotal(season2m, player.scoutedFg2m, player.fg2a);

  // 4. 3-Pointers
  const threeAvgVal = player.hybrid3MadeAvg != null ? player.hybrid3MadeAvg : player.threeMadeAVG;
  const threeAvgDisplay = (typeof threeAvgVal === 'number' && !isNaN(threeAvgVal)) 
    ? threeAvgVal.toFixed(1) 
    : (profileGames > 0 ? (season3m / profileGames).toFixed(1) : '0.0');
  const threePctDisplay = player.threePct != null ? `${player.threePct}%` : '—';
  const threeTotalDisplay = formatShotTotal(season3m, player.scoutedFg3m, player.fg3a);

  // 5. Free Throws
  const ftAvgVal = player.hybridFtMadeAvg != null ? player.hybridFtMadeAvg : player.ftMadeAvg;
  const ftAvgDisplay = (typeof ftAvgVal === 'number' && !isNaN(ftAvgVal)) 
    ? ftAvgVal.toFixed(1) 
    : (profileGames > 0 ? (seasonFtm / profileGames).toFixed(1) : '0.0');
  const ftPctDisplay = player.ftPct != null ? `${player.ftPct}%` : '—';
  const ftTotalDisplay = formatShotTotal(seasonFtm, player.scoutedFtm, player.fta);
  
  // 6. Rebounds
  const rebAvgDisplay = (typeof player.rebAvg === 'number' && !isNaN(player.rebAvg)) ? player.rebAvg.toFixed(1) : '—';
  const rebTotalDisplay = player.rebTotal != null ? player.rebTotal : (player.reb != null ? player.reb : '—');

  // 7. Assists
  const astAvgDisplay = (typeof player.astAvg === 'number' && !isNaN(player.astAvg)) ? player.astAvg.toFixed(1) : '—';
  const astTotalDisplay = player.astTotal != null ? player.astTotal : (player.ast != null ? player.ast : '—');

  // 8. Turnovers
  const tovAvgDisplay = (typeof player.tovAvg === 'number' && !isNaN(player.tovAvg)) ? player.tovAvg.toFixed(1) : '—';
  const tovTotalDisplay = player.tovTotal != null ? player.tovTotal : (player.tov != null ? player.tov : '—');

  // 9. Steals
  const stlAvgDisplay = (typeof player.stlAvg === 'number' && !isNaN(player.stlAvg)) ? player.stlAvg.toFixed(1) : '—';
  const stlTotalDisplay = player.stlTotal != null ? player.stlTotal : (player.stl != null ? player.stl : '—');

  // 10. Blocks
  const blkAvgDisplay = (typeof player.blkAvg === 'number' && !isNaN(player.blkAvg)) ? player.blkAvg.toFixed(1) : '—';
  const blkTotalDisplay = player.blkTotal != null ? player.blkTotal : (player.blk != null ? player.blk : '—');

  // 11. Fouls
  const foulsDisplay = (typeof player.foulsAVG === 'number' && !isNaN(player.foulsAVG))
    ? player.foulsAVG.toFixed(1) 
    : (player.foulsAVG || '0.0');
  const foulsTotalDisplay = player.foulsTotal != null 
    ? player.foulsTotal 
    : (player.fouls != null ? player.fouls : (typeof player.stats?.fouls === 'number' ? player.stats.fouls : '—'));

  // 12. Plus/Minus
  const pmDisplay = (typeof player.plusMinusAVG === 'number' && !isNaN(player.plusMinusAVG))
    ? (player.plusMinusAVG > 0 ? `+${player.plusMinusAVG.toFixed(1)}` : player.plusMinusAVG.toFixed(1))
    : (player.plusMinusAVG || '0.0');
  const pmTotalDisplay = player.plusMinusTotal != null 
    ? (player.plusMinusTotal > 0 ? `+${player.plusMinusTotal}` : String(player.plusMinusTotal)) 
    : (player.plusMinus != null ? String(player.plusMinus) : '—');

  // Shoot Zones Data Preparation from activeZoneStats or player
  const sz = player.shootZones || {};
  const defaultZones = [
    { key: 'PAINT', id: 'paint', name: language === 'it' ? 'Paint / Sotto Canestro' : 'Paint / Key', type: '2PT', made: sz.paint?.made ?? player.scoutedFg2m ?? 0, att: sz.paint?.att ?? player.fg2a ?? 0, pct: sz.paint?.pct ?? player.twoPct, share: sz.paint?.share || 0 },
    { key: 'MID-RANGE', id: 'mid', name: language === 'it' ? 'Mid-Range / Media Distanza' : 'Mid-Range', type: '2PT', made: sz.mid?.made ?? 0, att: sz.mid?.att ?? 0, pct: sz.mid?.pct ?? null, share: sz.mid?.share || 0 },
    { key: 'TOP 3PT', id: 'top3', name: language === 'it' ? 'Top 3 / Arco Frontale' : 'Top 3 Arc', type: '3PT', made: sz.top3?.made ?? 0, att: sz.top3?.att ?? 0, pct: sz.top3?.pct ?? null, share: sz.top3?.share || 0 },
    { key: 'WING 3PT', id: 'wing3', name: language === 'it' ? 'Wing 3 / Ali da 3' : 'Wing 3', type: '3PT', made: sz.wing3?.made ?? player.scoutedFg3m ?? 0, att: sz.wing3?.att ?? player.fg3a ?? 0, pct: sz.wing3?.pct ?? player.threePct, share: sz.wing3?.share || 0 },
    { key: 'CORNER 3PT', id: 'corner3', name: language === 'it' ? 'Corner 3 / Angoli da 3' : 'Corner 3', type: '3PT', made: sz.corner3?.made ?? 0, att: sz.corner3?.att ?? 0, pct: sz.corner3?.pct ?? null, share: sz.corner3?.share || 0 }
  ];

  const shootZonesList = useMemo(() => {
    if (activeZoneStats && activeZoneStats.byName && Object.keys(activeZoneStats.byName).length > 0) {
      const p = activeZoneStats.byName.PAINT || {};
      const mr = activeZoneStats.byName['MID-RANGE'] || {};
      const t3 = activeZoneStats.byName['TOP 3PT'] || {};
      const w3 = activeZoneStats.byName['WING 3PT'] || {};
      const c3 = activeZoneStats.byName['CORNER 3PT'] || {};

      const totalAtt = (p.attempts || 0) + (mr.attempts || 0) + (t3.attempts || 0) + (w3.attempts || 0) + (c3.attempts || 0);

      if (totalAtt > 0) {
        return [
          { key: 'PAINT', name: language === 'it' ? 'Paint / Sotto Canestro' : 'Paint / Key', type: '2PT', made: p.made || 0, att: p.attempts || 0, pct: p.pct, share: totalAtt > 0 ? Math.round((p.attempts / totalAtt) * 100) : 0 },
          { key: 'MID-RANGE', name: language === 'it' ? 'Mid-Range / Media Distanza' : 'Mid-Range', type: '2PT', made: mr.made || 0, att: mr.attempts || 0, pct: mr.pct, share: totalAtt > 0 ? Math.round((mr.attempts / totalAtt) * 100) : 0 },
          { key: 'TOP 3PT', name: language === 'it' ? 'Top 3 / Arco Frontale' : 'Top 3 Arc', type: '3PT', made: t3.made || 0, att: t3.attempts || 0, pct: t3.pct, share: totalAtt > 0 ? Math.round((t3.attempts / totalAtt) * 100) : 0 },
          { key: 'WING 3PT', name: language === 'it' ? 'Wing 3 / Ali da 3' : 'Wing 3', type: '3PT', made: w3.made || 0, att: w3.attempts || 0, pct: w3.pct, share: totalAtt > 0 ? Math.round((w3.attempts / totalAtt) * 100) : 0 },
          { key: 'CORNER 3PT', name: language === 'it' ? 'Corner 3 / Angoli da 3' : 'Corner 3', type: '3PT', made: c3.made || 0, att: c3.attempts || 0, pct: c3.pct, share: totalAtt > 0 ? Math.round((c3.attempts / totalAtt) * 100) : 0 }
        ];
      }
    }
    return (Array.isArray(player.shootZones) && player.shootZones.length > 0) ? player.shootZones : defaultZones;
  }, [activeZoneStats, player, language]);

  const totalZoneAtt = shootZonesList.reduce((acc, z) => acc + (z.att || 0), 0);
  const totalZoneMade = shootZonesList.reduce((acc, z) => acc + (z.made || 0), 0);
  const overallZonePct = totalZoneAtt > 0 ? Math.round((totalZoneMade / totalZoneAtt) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#F8F9FA] text-[#022D32] overflow-y-auto animate-fade-in flex flex-col">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DDF3E9] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between flex-none shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F9FA] border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            aria-label={t.backToRoster || 'Torna al Roster'}
          >
            <ArrowLeft className="w-4 h-4 text-[#0CA17A]" />
            <span>{t.backToRoster || (language === 'it' ? 'Torna al Roster' : 'Back to Roster')}</span>
          </button>
          <div className="h-5 w-px bg-[#DDF3E9] hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#022D32]/70 font-medium">
            <span className="text-[#022D32] font-bold">{teamName}</span>
            <span>/</span>
            <span className="text-[#022D32] font-black uppercase">{player.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#022D32] bg-[#DDF3E9] px-3 py-1.5 rounded-lg border border-[#0CA17A]/30">
            #{player.number}{player.position && player.position.trim().toLowerCase() !== 'player' ? ` • ${player.position}` : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#022D32] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Body Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Player Hero Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {player.photo ? (
              <img
                src={player.photo}
                alt={player.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#0CA17A]/40 bg-[#F8F9FA] flex-none shadow-xs"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-black text-[#022D32] text-2xl flex-none shadow-xs">
                #{player.number}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-3xl font-black text-[#022D32] uppercase tracking-wide">
                  {player.name}
                </h2>
                {player.captain && (
                  <span className="text-[10px] font-black uppercase bg-slate-100 text-[#022D32] border border-slate-200 px-2 py-0.5 rounded">
                    CAPITANO
                  </span>
                )}
                {player.fipVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {t.fipVerifiedPill || 'FIP VERIFIED'}
                  </span>
                )}
                {player.hasSupabaseStats && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#DDF3E9] text-[#022D32] border border-[#0CA17A]/30">
                    <Activity className="w-3.5 h-3.5 text-[#0CA17A]" />
                    SCOUTING SYNCED
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-semibold flex items-center gap-2 mt-1">
                {player.position && player.position.trim().toLowerCase() !== 'player' && (
                  <>
                    <span className="text-[#022D32] font-bold">{player.position}</span>
                    <span>•</span>
                  </>
                )}
                <span className="text-[#022D32] font-black">{teamName}</span>
                <span>•</span>
                <span className="text-emerald-700 font-mono font-bold">{player.games} GP</span>
                <span>•</span>
                <span className="text-[#0CA17A] font-mono font-bold">{player.startPercentage || '0%'} START</span>
              </p>
            </div>
          </div>

          {/* Active Tactical Badges on Hero */}
          <div className="flex items-center gap-2 flex-wrap">
            {profileTags.length > 0 ? (
              profileTags.map(tag => (
                <span 
                  key={tag.id}
                  className={`text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs border ${tag.badgeClass}`}
                  title={language === 'it' ? tag.labelIt : tag.label}
                >
                  <TacticalTagIcon id={tag.id} className="w-4 h-4 flex-none" />
                  <span>{language === 'it' ? tag.labelIt : tag.label}</span>
                </span>
              ))
            ) : (
              <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                Profilo Bilanciato
              </span>
            )}
          </div>
        </div>

        {/* Section Header: Dual Display (Media & Totali) */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0CA17A]" />
            <span className="text-xs font-black uppercase text-[#022D32] tracking-wider">
              {language === 'it' ? 'STATISTICHE STAGIONE: MEDIE & TOTALI' : 'SEASON PERFORMANCE: AVERAGES & TOTALS'}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">
            {player.games} {language === 'it' ? 'Partite Giocate' : 'Games Played'} • {player.startPercentage || '0%'} {language === 'it' ? 'Quintetto' : 'Starters'}
          </span>
        </div>

        {/* Missing Scouting Alert Banner */}
        {player.hasFewerScoutingGames && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200/90 rounded-xl px-4 py-2.5 font-medium flex items-center gap-2 shadow-2xs">
            <span className="font-mono font-black text-amber-600 text-sm">*</span>
            <span>
              {language === 'it' 
                ? `Le statistiche di playmaking, rimbalzi, palle perse e le percentuali di tiro sono calcolate su ${player.gpSupabase} partite con scouting disponibile su ${player.games} presenze totali${Array.isArray(player.missingScoutingMatchNames) && player.missingScoutingMatchNames.length > 0 ? ` (Manca lo scouting per: ${player.missingScoutingMatchNames.join(', ')})` : ''}.`
                : `Playmaking, rebounding, turnover, and shooting percentages are calculated on ${player.gpSupabase} matches with scouting available out of ${player.games} total appearances.`}
            </span>
          </div>
        )}

        {/* Core Stats Grid (Media & Totali) - 12 Complete Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {/* 1. PUNTI */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#0CA17A]" />
                {language === 'it' ? 'PUNTI' : 'POINTS'}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {ppgDisplay}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                /G
              </span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {ptsTotalDisplay !== '—' ? `${ptsTotalDisplay} TOT` : '—'}
              </span>
            </div>
          </div>

          {/* 2. MINUTI (FIP Official) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                {language === 'it' ? 'MINUTI' : 'MINUTES'}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {minAvgDisplay}
              </span>
              {minAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {minTotalDisplay}
              </span>
            </div>
          </div>

          {/* 3. TIRI DA 2 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0CA17A]" />
                {language === 'it' ? 'TIRI DA 2' : '2-POINTERS'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {twoPctDisplay}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {twoAvgDisplay}
              </span>
              {twoAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {twoTotalDisplay}
              </span>
            </div>
          </div>

          {/* 4. TIRI DA 3 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                {language === 'it' ? 'TIRI DA 3' : '3-POINTERS'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                {threePctDisplay}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {threeAvgDisplay}
              </span>
              {threeAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {threeTotalDisplay}
              </span>
            </div>
          </div>

          {/* 5. TIRI LIBERI */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                {language === 'it' ? 'TIRI LIBERI' : 'FREE THROWS'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                {ftPctDisplay}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {ftAvgDisplay}
              </span>
              {ftAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {ftTotalDisplay}
              </span>
            </div>
          </div>

          {/* 6. RIMBALZI */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-[#0CA17A]" />
                {language === 'it' ? 'RIMBALZI' : 'REBOUNDS'}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {rebAvgDisplay}
              </span>
              {rebAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {player.orebTotal != null ? `O:${player.orebTotal} D:${player.drebTotal}` : (language === 'it' ? 'Totale' : 'Total')}
              </span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {rebTotalDisplay !== '—' ? `${rebTotalDisplay} TOT` : '—'}
              </span>
            </div>
          </div>

          {/* 7. ASSIST */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#0CA17A]" />
                {language === 'it' ? 'ASSIST' : 'ASSISTS'}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {astAvgDisplay}
              </span>
              {astAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {astTotalDisplay !== '—' ? `${astTotalDisplay} TOT` : '—'}
              </span>
            </div>
          </div>

          {/* 8. PALLE PERSE */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-rose-500" />
                {language === 'it' ? 'PALLE PERSE' : 'TURNOVERS'}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-rose-600 tracking-tight">
                {tovAvgDisplay}
              </span>
              {tovAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                {tovTotalDisplay !== '—' ? `${tovTotalDisplay} TOT` : '—'}
              </span>
            </div>
          </div>

          {/* 9. RECUPERI */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {language === 'it' ? 'RECUPERI' : 'STEALS'}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {stlAvgDisplay}
              </span>
              {stlAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {stlTotalDisplay !== '—' ? `${stlTotalDisplay} TOT` : '—'}
              </span>
            </div>
          </div>

          {/* 10. STOPPATE */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-600" />
                {language === 'it' ? 'STOPPATE' : 'BLOCKS'}
              </span>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] tracking-tight">
                {blkAvgDisplay}
              </span>
              {blkAvgDisplay !== '—' && (
                <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                  /G
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {blkTotalDisplay !== '—' ? `${blkTotalDisplay} TOT` : '—'}
              </span>
            </div>
          </div>

          {/* 11. FALLI COMMESSI */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                {language === 'it' ? 'FALLI' : 'FOULS'}
              </span>
            </div>
            <div className="my-1.5">
              <span className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight ${Number(foulsDisplay) > 3.0 ? 'text-rose-600' : 'text-[#022D32]'}`}>
                {foulsDisplay}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                /G
              </span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className="font-black text-[#022D32] bg-[#DDF3E9] px-2.5 py-0.5 rounded-md border border-[#0CA17A]/20">
                {foulsTotalDisplay !== '—' ? `${foulsTotalDisplay} TOT` : '—'}
              </span>
            </div>
          </div>

          {/* 12. PLUS / MINUS */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-[#0CA17A]/30 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0CA17A]" />
                +/-
              </span>
            </div>
            <div className="my-1.5">
              <span className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight ${
                player.plusMinusAVG > 0 ? 'text-[#0CA17A]' : player.plusMinusAVG < 0 ? 'text-rose-600' : 'text-[#022D32]'
              }`}>
                {pmDisplay}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono ml-1">
                /G
              </span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'it' ? 'Totale' : 'Total'}</span>
              <span className={`font-black font-mono text-xs px-2.5 py-0.5 rounded-md border ${
                Number(pmTotalDisplay) > 0 ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : Number(pmTotalDisplay) < 0 ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-[#022D32] bg-[#DDF3E9] border-[#0CA17A]/20'
              }`}>
                {pmTotalDisplay !== '—' ? `${pmTotalDisplay} TOT` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 100% Width Horizontal Stacked Bar Chart for Point Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#DDF3E9] space-y-4 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#0CA17A]" />
                {t.shotDistTitle || (language === 'it' ? 'DISTRIBUZIONE PUNTI / SHOT PROFILE' : 'POINT DISTRIBUTION / SHOT PROFILE')}
              </span>
              <p className="text-[11px] text-[#022D32]/70 mt-0.5">
                {t.shotDistSubtitle || (language === 'it' ? 'Ripartizione percentuale dei punti segnati tra 2PT, 3PT e Tiri Liberi' : 'Percentage breakdown of total points between 2PT, 3PT and Free Throws')}
                {' • '}
                <span className="text-[#0CA17A] font-bold">
                  {language === 'it' ? `Stagione 2026/2027 (${profileGames} PG)` : `Season 2026/2027 (${profileGames} GP)`}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#022D32]/70 font-mono font-bold block">
                TOTALE: <strong className="text-[#022D32] font-black text-sm">{totalSeasonCalcPts} PTS</strong> ({ppgDisplay} PPG)
              </span>
            </div>
          </div>

          {totalSeasonCalcPts > 0 ? (
            <div className="space-y-3">
              <div className="w-full h-7 bg-[#F8F9FA] rounded-xl p-1 border border-[#DDF3E9] shadow-inner flex overflow-hidden gap-1">
                {seasonPct2 > 0 && (
                  <div 
                    style={{ width: `${seasonPct2}%` }}
                    className="h-full bg-sky-500 hover:bg-sky-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                    title={`Punti da 2 (2PT): ${seasonPct2.toFixed(1)}% (${seasonPts2} PTS)`}
                  >
                    {seasonPct2 >= 10 && `${Math.round(seasonPct2)}%`}
                  </div>
                )}
                {seasonPct3 > 0 && (
                  <div 
                    style={{ width: `${seasonPct3}%` }}
                    className="h-full bg-[#0CA17A] hover:bg-[#0CA17A]/90 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                    title={`Punti da 3 (3PT): ${seasonPct3.toFixed(1)}% (${seasonPts3} PTS)`}
                  >
                    {seasonPct3 >= 10 && `${Math.round(seasonPct3)}%`}
                  </div>
                )}
                {seasonPctFT > 0 && (
                  <div 
                    style={{ width: `${seasonPctFT}%` }}
                    className="h-full bg-amber-500 hover:bg-amber-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                    title={`Tiri Liberi (FT): ${seasonPctFT.toFixed(1)}% (${seasonPtsFT} PTS)`}
                  >
                    {seasonPctFT >= 10 && `${Math.round(seasonPctFT)}%`}
                  </div>
                )}
              </div>

              {/* 3 KPI breakdown cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-500 flex-none shadow-xs" />
                    <div>
                      <span className="text-[10px] font-black text-[#022D32]/60 uppercase block tracking-wider">
                        {t.ptsFrom2 || 'Punti da 2 (2PT)'}
                      </span>
                      <span className="text-[11px] text-[#022D32]/70 font-mono">
                        {seasonPts2} PTS • {twoAvgDisplay} 2PM/G
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-black text-sky-700">
                    {player.twoPct != null ? `${player.twoPct}%` : `${Number(seasonPct2 || 0).toFixed(1)}%`}
                  </span>
                </div>

                <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0CA17A] flex-none shadow-xs" />
                    <div>
                      <span className="text-[10px] font-black text-[#022D32]/60 uppercase block tracking-wider">
                        {t.ptsFrom3 || 'Punti da 3 (3PT)'}
                      </span>
                      <span className="text-[11px] text-[#022D32]/70 font-mono">
                        {seasonPts3} PTS • {threeAvgDisplay} 3PM/G
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-black text-[#0CA17A]">
                    {player.threePct != null ? `${player.threePct}%` : `${Number(seasonPct3 || 0).toFixed(1)}%`}
                  </span>
                </div>

                <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex-none shadow-xs" />
                    <div>
                      <span className="text-[10px] font-black text-[#022D32]/60 uppercase block tracking-wider">
                        {t.ptsFromFt || 'Tiri Liberi (TL)'}
                      </span>
                      <span className="text-[11px] text-[#022D32]/70 font-mono">
                        {seasonPtsFT} PTS • {ftAvgDisplay} FTM/G
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-black text-amber-700">
                    {player.ftPct != null ? `${player.ftPct}%` : `${Number(seasonPctFT || 0).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F8F9FA] p-4 rounded-xl text-center text-xs text-[#022D32]/60 italic border border-[#DDF3E9]">
              {language === 'it' ? 'Nessun punto registrato nel periodo di riferimento.' : 'No points recorded in this period.'}
            </div>
          )}
        </div>

        {/* Mappa di Tiro / Shoot Zones Section with Visual Half-Court */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#0CA17A]" />
              <span className="text-xs font-black uppercase text-[#022D32] tracking-wider">
                {language === 'it' ? 'MAPPA DI TIRO & VOLUMI' : 'SHOT ZONES EFFICIENCY & VOLUME'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDF3E9] text-[#022D32] border border-[#0CA17A]/30">
                SUPABASE TRACKING
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {totalZoneAtt > 0 
                ? `${totalZoneMade}/${totalZoneAtt} FG (${overallZonePct}%)`
                : (language === 'it' ? 'Nessun tiro con coordinate' : 'No coordinate shots')}
            </span>
          </div>

          <div className="glass-card p-3 sm:p-4 border-[#DDF3E9] bg-[#F8F9FA] rounded-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-[#DDF3E9] pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0CA17A]" />
                <span className="text-xs font-black text-[#022D32] uppercase tracking-wider">
                  {language === 'it' ? 'MAPPA TERMICA DEL TIRO (CAMPO)' : 'HALF-COURT SHOT HEATMAP'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {playerShotEvents.length} {language === 'it' ? 'Tiri Tracciati' : 'Tracked Shots'}
              </span>
            </div>
            <CourtPitchMap
              selectedPlayer={{ number: player.number, name: player.name }}
              selectedZoneKey={selectedZoneKey}
              onSelectZone={(k) => setSelectedZoneKey(k)}
              events={playerShotEvents}
              zoneStats={activeZoneStats}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#DDF3E9] mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#DDF3E9] text-[#022D32] font-black uppercase text-[10px] tracking-wider border-b border-[#DDF3E9]">
                  <th className="p-2.5 sm:p-3">{language === 'it' ? 'ZONA DI TIRO' : 'COURT ZONE'}</th>
                  <th className="p-2.5 sm:p-3 text-center">{language === 'it' ? 'TIPO' : 'TYPE'}</th>
                  <th className="p-2.5 sm:p-3 text-center">{language === 'it' ? 'REALIZZATI / TENTATI' : 'MADE / ATT'}</th>
                  <th className="p-2.5 sm:p-3 text-center">{language === 'it' ? 'PERCENTUALE (%)' : 'ACCURACY (%)'}</th>
                  <th className="p-2.5 sm:p-3 text-center">{language === 'it' ? 'VOLUME SU TOTALI' : 'SHOT SHARE'}</th>
                  <th className="p-2.5 sm:p-3 text-center">{language === 'it' ? 'VALUTAZIONE' : 'RATING'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDF3E9]">
                {shootZonesList.map((z, idx) => {
                  const hasAtt = z.att > 0;
                  const isSelected = selectedZoneKey === z.key;
                  const rating = !hasAtt ? 'NO ATTEMPTS' : z.pct >= 50 ? 'HOT' : z.pct >= 33 ? 'SOLID' : 'COLD';
                  const ratingBadge = !hasAtt
                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                    : z.pct >= 50
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : z.pct >= 33
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedZoneKey(prev => prev === z.key ? null : z.key)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-[#DDF3E9]/60 font-bold' 
                          : (idx % 2 === 0 ? 'bg-white' : 'bg-[#DDF3E9]/15')
                      } hover:bg-[#DDF3E9]/40`}
                    >
                      <td className="p-2.5 sm:p-3 font-bold text-[#022D32]">{z.name}</td>
                      <td className="p-2.5 sm:p-3 text-center font-mono font-bold">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          z.type === '3PT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {z.type}
                        </span>
                      </td>
                      <td className="p-2.5 sm:p-3 text-center font-mono font-bold text-[#022D32]">{z.made} / {z.att}</td>
                      <td className="p-2.5 sm:p-3 text-center font-mono font-black text-[#022D32]">
                        {hasAtt ? `${z.pct}%` : '—'}
                      </td>
                      <td className="p-2.5 sm:p-3 text-center font-mono text-slate-500">
                        {z.share || 0}%
                      </td>
                      <td className="p-2.5 sm:p-3 text-center font-mono font-bold">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ratingBadge}`}>
                          {rating}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARRIERA / HISTORY Data Table (Pure FIP History) */}
        {(() => {
          const up = player.uniquePlayer || {};
          let rawList = [];

          if (Array.isArray(player.history) && player.history.length > 0) {
            rawList = player.history;
          } else if (Array.isArray(up.history) && up.history.length > 0) {
            rawList = up.history;
          } else if (Array.isArray(up.seasonStats) && up.seasonStats.length > 0) {
            const playersList = Array.isArray(up.players) ? up.players : [];
            rawList = up.seasonStats.map(stat => {
              const rawId = stat.seasonId != null ? String(stat.seasonId) : '';
              const seasonTeams = playersList.filter(pl => pl && pl.season && String(pl.season.id) === rawId);
              const matchedPlayer = seasonTeams[0];
              const seasonName = matchedPlayer?.season?.name || stat.seasonName || rawId || '—';
              const sTeamName = (matchedPlayer?.team?.name || stat.teamName || player.teamName || teamName || '—').trim();
              const games = Number(stat.games || 0);
              const pointsPerGame = stat.pointsPerGame != null 
                ? Number(stat.pointsPerGame) 
                : (games > 0 && stat.points != null ? Number((stat.points / games).toFixed(1)) : 0);
              const twoMadePerGame = stat.twoMadePerGame != null 
                ? Number(stat.twoMadePerGame) 
                : (stat.inArcThrowsMadePerGame != null ? Number(stat.inArcThrowsMadePerGame) : (games > 0 && stat.inArcThrowsMade != null ? Number((stat.inArcThrowsMade / games).toFixed(1)) : 0));
              const threeMadePerGame = stat.threeMadePerGame != null 
                ? Number(stat.threeMadePerGame) 
                : (stat.outArcThrowsMadePerGame != null ? Number(stat.outArcThrowsMadePerGame) : (games > 0 && stat.outArcThrowsMade != null ? Number((stat.outArcThrowsMade / games).toFixed(1)) : 0));
              const freeThrowsPercentage = stat.freeThrowsPercentage != null ? Number(stat.freeThrowsPercentage) : null;

              return {
                seasonId: rawId,
                seasonName,
                teamName: sTeamName,
                isAggregate: true,
                games,
                pointsPerGame,
                twoMadePerGame,
                threeMadePerGame,
                freeThrowsPercentage,
                foulsPerGame: stat.foulsPerGame != null ? Number(stat.foulsPerGame) : 0,
                plusMinusPerGame: stat.plusMinusPerGame != null ? Number(stat.plusMinusPerGame) : 0,
                reboundsPerGame: stat.reboundsPerGame != null ? Number(stat.reboundsPerGame) : 0,
                assistsPerGame: stat.assistsPerGame != null ? Number(stat.assistsPerGame) : 0,
                teams: []
              };
            });
          }

          if (rawList.length === 0) return null;

          return (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DDF3E9] space-y-3 shadow-xs">
              <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#0CA17A]" />
                {t.historyTableTitle || (language === 'it' ? 'STORICO FIP / CARRIERA' : 'FIP CAREER HISTORY')}
              </span>
              <div className="overflow-x-auto rounded-xl border border-[#DDF3E9]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#DDF3E9] text-[#022D32] font-black uppercase text-[10px] tracking-wider border-b border-[#DDF3E9]">
                      <th className="p-3">{t.colSeason || 'STAGIONE'}</th>
                      <th className="p-3">{t.colTeam || 'SQUADRA'}</th>
                      <th className="p-3 text-center">{t.colGp || 'PG'}</th>
                      <th className="p-3 text-center">{t.colPpg || 'PTS/G'}</th>
                      <th className="p-3 text-center">{t.col2pm || '2PM/G'}</th>
                      <th className="p-3 text-center">{t.col3pm || '3PM/G'}</th>
                      <th className="p-3 text-center">{t.colFt || 'TL%'}</th>
                      <th className="p-3 text-center">{t.colFouls || 'FF/G'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDF3E9]">
                    {rawList.map((hist, hIdx) => (
                      <tr key={hIdx} className={`${hIdx % 2 === 0 ? 'bg-white' : 'bg-[#DDF3E9]/15'} hover:bg-[#DDF3E9]/50 transition-colors`}>
                        <td className="p-3 font-mono font-bold text-[#022D32]">{hist.seasonName || hist.seasonId}</td>
                        <td className="p-3 font-bold text-[#022D32]">{hist.teamName || '—'}</td>
                        <td className="p-3 text-center font-mono font-bold">{hist.games}</td>
                        <td className="p-3 text-center font-mono font-black text-[#022D32]">{Number(hist.pointsPerGame || 0).toFixed(1)}</td>
                        <td className="p-3 text-center font-mono">{Number(hist.twoMadePerGame || 0).toFixed(1)}</td>
                        <td className="p-3 text-center font-mono">{Number(hist.threeMadePerGame || 0).toFixed(1)}</td>
                        <td className="p-3 text-center font-mono">{hist.freeThrowsPercentage != null ? `${Math.round(hist.freeThrowsPercentage)}%` : '—'}</td>
                        <td className="p-3 text-center font-mono">{Number(hist.foulsPerGame || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}