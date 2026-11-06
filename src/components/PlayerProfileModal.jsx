import React, { useState } from 'react';
import { 
  X, ArrowLeft, ShieldCheck, Activity, BarChart2, Shield, 
  HelpCircle, Zap, Scale, ChevronDown, ChevronUp, Trophy 
} from 'lucide-react';
import { TacticalTagIcon, getTacticalTags, TACTICAL_TAGS_CONFIG, formatMinutes } from '../pages/LeagueHub';

export default function PlayerProfileModal({
  player,
  onClose,
  teamName = 'BBA Basket Baronissi',
  language = 'it',
  t = {}
}) {
  const [collapsedSeasons, setCollapsedSeasons] = useState({});
  const [showLegendModal, setShowLegendModal] = useState(false);

  if (!player) return null;

  const toggleSeasonCollapse = (seasonKey) => {
    setCollapsedSeasons(prev => ({
      ...prev,
      [seasonKey]: !prev[seasonKey]
    }));
  };

  const useCareerProfile = (player.games || 0) < 3 && player.uniquePlayer?.stats && (player.uniquePlayer.stats.games || 0) >= 3;
  const profileStats = useCareerProfile ? player.uniquePlayer.stats : player;
  const profileGames = useCareerProfile ? player.uniquePlayer.stats.games : player.games;
  const profileAnalysis = getTacticalTags(profileStats, profileGames);
  const profileTags = profileAnalysis.tags;
  const profileMetrics = profileAnalysis.metrics;

  const ppgDisplay = typeof player.pointsAVG === 'number' 
    ? player.pointsAVG.toFixed(1) 
    : (typeof player.pointsPerGame === 'number' ? player.pointsPerGame.toFixed(1) : (player.pointsAVG || '0.0'));

  const foulsDisplay = typeof player.foulsAVG === 'number' 
    ? player.foulsAVG.toFixed(1) 
    : (player.foulsAVG || '0.0');

  const pmDisplay = typeof player.plusMinusAVG === 'number'
    ? (player.plusMinusAVG > 0 ? `+${player.plusMinusAVG.toFixed(1)}` : player.plusMinusAVG.toFixed(1))
    : (player.plusMinusAVG || '0.0');

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

        {/* Core Stats Grid (Current Season) - 5 SaaS Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] block">{ppgDisplay}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalPpg || (language === 'it' ? 'PUNTI/P' : 'POINTS/G')}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0CA17A] block">
              {player.threePct != null ? `${player.threePct}%` : '—'}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalThree || '3PT%'}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
            <span className={`font-mono text-3xl sm:text-4xl font-extrabold block ${Number(foulsDisplay) > 3.0 ? 'text-rose-600' : 'text-[#022D32]'}`}>
              {foulsDisplay}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalFouls || (language === 'it' ? 'FALLI/P' : 'FOULS/G')}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
            <span className={`font-mono text-3xl sm:text-4xl font-extrabold block ${player.plusMinusAVG > 0 ? 'text-[#0CA17A]' : player.plusMinusAVG < 0 ? 'text-rose-600' : 'text-[#022D32]'}`}>
              {pmDisplay}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalPlusMinus || '+/-'}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center col-span-2 sm:col-span-1">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#022D32] block">{player.games}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">{t.modalGames || (language === 'it' ? 'PARTITE GIOCATE' : 'GAMES PLAYED')}</span>
          </div>
        </div>

        {/* Supabase Proprietary Hustle & Playmaking Grid */}
        {player.hasSupabaseStats && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0CA17A]" />
                  {language === 'it' ? 'PLAYMAKING & HUSTLE PROPRIETARI (SUPABASE)' : 'PROPRIETARY PLAYMAKING & HUSTLE (SUPABASE)'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  INTERNAL TRACKING
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {player.gpSupabase || player.games} {language === 'it' ? 'partite tracciate' : 'matches tracked'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                <span className="font-mono text-2xl font-black text-[#022D32] block">
                  {player.astAvg != null ? player.astAvg.toFixed(1) : '—'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                  {t.colAst || 'AST/G'}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                <span className="font-mono text-2xl font-black text-[#022D32] block">
                  {player.rebAvg != null ? player.rebAvg.toFixed(1) : '—'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                  {t.colReb || 'REB/G'}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                <span className="font-mono text-2xl font-black text-[#022D32] block">
                  {player.tovAvg != null ? player.tovAvg.toFixed(1) : '—'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                  {t.colTov || 'TOV/G'}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                <span className={`font-mono text-2xl font-black block ${
                  player.astTovRatio >= 1.5 
                    ? 'text-emerald-700' 
                    : player.astTovRatio >= 1.0 
                      ? 'text-[#022D32]' 
                      : 'text-amber-700'
                }`}>
                  {player.astTovRatio != null ? player.astTovRatio.toFixed(2) : '—'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                  {t.colRatio || 'AST/TOV'}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100 col-span-2 sm:col-span-1">
                <span className="font-mono text-2xl font-black text-[#0CA17A] block">
                  {player.efgPct != null ? `${player.efgPct}%` : '—'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                  eFG%
                </span>
              </div>
            </div>
          </div>
        )}

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
                  {useCareerProfile 
                    ? (language === 'it' ? `Carriera (${profileGames} PG)` : `Career (${profileGames} GP)`)
                    : (language === 'it' ? `Stagione 2025/2026 (${profileGames} PG)` : `Season 2025/2026 (${profileGames} GP)`)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#022D32]/70 font-mono font-bold block">
                TOTALE: <strong className="text-[#022D32] font-black text-sm">{profileMetrics.totalPts} PTS</strong> ({profileMetrics.ptsPerGame.toFixed(1)} PPG)
              </span>
            </div>
          </div>

          {profileMetrics.totalPts > 0 ? (
            <div className="space-y-3">
              <div className="w-full h-7 bg-[#F8F9FA] rounded-xl p-1 border border-[#DDF3E9] shadow-inner flex overflow-hidden gap-1">
                {profileMetrics.pct2 > 0 && (
                  <div 
                    style={{ width: `${profileMetrics.pct2}%` }}
                    className="h-full bg-sky-500 hover:bg-sky-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                    title={`Punti da 2 (2PT): ${profileMetrics.pct2.toFixed(1)}% (${profileMetrics.twoMade * 2} PTS)`}
                  >
                    {profileMetrics.pct2 >= 10 && `${Math.round(profileMetrics.pct2)}%`}
                  </div>
                )}
                {profileMetrics.pct3 > 0 && (
                  <div 
                    style={{ width: `${profileMetrics.pct3}%` }}
                    className="h-full bg-[#0CA17A] hover:bg-[#0CA17A]/90 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                    title={`Punti da 3 (3PT): ${profileMetrics.pct3.toFixed(1)}% (${profileMetrics.threeMade * 3} PTS)`}
                  >
                    {profileMetrics.pct3 >= 10 && `${Math.round(profileMetrics.pct3)}%`}
                  </div>
                )}
                {profileMetrics.pctFT > 0 && (
                  <div 
                    style={{ width: `${profileMetrics.pctFT}%` }}
                    className="h-full bg-amber-500 hover:bg-amber-400 transition-all rounded-lg flex items-center justify-center text-[11px] font-black font-mono text-white px-1 overflow-hidden"
                    title={`Tiri Liberi (FT): ${profileMetrics.pctFT.toFixed(1)}% (${profileMetrics.ftMade} PTS)`}
                  >
                    {profileMetrics.pctFT >= 10 && `${Math.round(profileMetrics.pctFT)}%`}
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
                        {profileMetrics.twoMade * 2} PTS • {profileMetrics.twoPerGame.toFixed(1)} 2PM/G
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-black text-sky-700">
                    {profileMetrics.pct2.toFixed(1)}%
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
                        {profileMetrics.threeMade * 3} PTS • {profileMetrics.threePerGame.toFixed(1)} 3PM/G
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-black text-[#0CA17A]">
                    {profileMetrics.pct3.toFixed(1)}%
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
                        {profileMetrics.ftMade} PTS • {profileMetrics.ftAttPerGame.toFixed(1)} FTA/G ({profileMetrics.ftPct != null ? Math.round(profileMetrics.ftPct) + '%' : '—'})
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-black text-amber-700">
                    {profileMetrics.pctFT.toFixed(1)}%
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

        {/* Tactical Badges with Coach Strategy Cards */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DDF3E9] space-y-3 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0CA17A]" />
              {t.tacticalBadgesTitle || (language === 'it' ? 'PROFILO TATTICO & ALERT COACH' : 'TACTICAL PROFILE & COACH ALERTS')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLegendModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0CA17A] hover:text-[#0CA17A]/80 hover:underline cursor-pointer"
              >
                <HelpCircle className="w-3 h-3 text-[#0CA17A]" />
                <span>{t.legendBtn || (language === 'it' ? 'Legenda Tag' : 'Tag Legend')}</span>
              </button>
              <span className="text-[11px] font-bold text-[#022D32]/70">
                • {profileTags.length} {profileTags.length === 1 ? (language === 'it' ? 'Tag Attivo' : 'Active Tag') : (language === 'it' ? 'Tag Attivi' : 'Active Tags')}
              </span>
            </div>
          </div>

          {profileTags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profileTags.map(tag => (
                <div 
                  key={tag.id}
                  className={`p-3.5 sm:p-4 rounded-xl border ${tag.badgeClass} shadow-xs`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <TacticalTagIcon id={tag.id} className="w-6 h-6 flex-none text-[#022D32]" />
                      <div>
                        <span className="font-black text-sm uppercase tracking-wide text-[#022D32] block">
                          {language === 'it' ? tag.labelIt : tag.label}
                        </span>
                        <span className="text-[10px] text-[#022D32]/70 font-mono">
                          {language === 'it' ? tag.criteriaDesc : tag.criteriaDescEn}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white border border-[#DDF3E9] px-2 py-0.5 rounded text-[#022D32]">
                      {tag.criteria}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-slate-100 text-xs text-[#022D32]/70 flex items-center gap-3">
              <Scale className="w-5 h-5 flex-none text-slate-400" />
              <div>
                <strong className="block text-[#022D32] font-bold mb-0.5">{language === 'it' ? 'Profilo Bilanciato / Nessun Alert Estremo' : 'Balanced Profile / No Extreme Alerts'}</strong>
                <span>{t.noActiveTags || (language === 'it' ? 'Nessun tag tattico specifico attivato per i criteri di volume e precisione.' : 'No specific tactical tags triggered under current volume thresholds.')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Shooting Accuracy Splits */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DDF3E9] space-y-3 shadow-xs">
          <span className="text-xs font-black uppercase text-[#022D32] tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#0CA17A]" />
            {t.modalSplitsTitle || (language === 'it' ? 'PERCENTUALI DI TIRO' : 'SHOOTING ACCURACY SPLITS')} (2025/2026)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] shadow-xs">
              <span className="text-[10px] text-[#022D32]/60 font-bold block uppercase">{t.modal3pt || '3PT'}</span>
              <span className="font-mono text-xl font-black text-[#0CA17A] my-1 block">
                {player.threePct != null ? `${player.threePct}%` : '—'}
              </span>
              <span className="text-[11px] text-[#022D32]/70 block font-mono">
                {typeof player.threeMadeAVG === 'number' ? player.threeMadeAVG.toFixed(1) : (player.threeMadeAVG || '0.0')} {t.modalMadePerGame || 'made/G'}
              </span>
            </div>
            <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] shadow-xs">
              <span className="text-[10px] text-[#022D32]/60 font-bold block uppercase">{t.modal2pt || '2PT'}</span>
              <span className="font-mono text-xl font-black text-sky-700 my-1 block">
                {player.twoPct != null ? `${player.twoPct}%` : '—'}
              </span>
              <span className="text-[11px] text-[#022D32]/70 block font-mono">
                {typeof player.twoMadeAVG === 'number' ? player.twoMadeAVG.toFixed(1) : (player.twoMadeAVG || '0.0')} {t.modalMadePerGame || 'made/G'}
              </span>
            </div>
            <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DDF3E9] shadow-xs">
              <span className="text-[10px] text-[#022D32]/60 font-bold block uppercase">{t.modalFt || 'FT%'}</span>
              <span className="font-mono text-xl font-black text-[#022D32] my-1 block">
                {player.ftPct != null ? `${player.ftPct}%` : '—'}
              </span>
              <span className="text-[11px] text-[#022D32]/70 block font-mono">{language === 'it' ? 'Tiri Liberi' : 'Free Throws'}</span>
            </div>
          </div>
        </div>

        {/* CARRIERA / HISTORY Data Table (if available) */}
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

      {/* Tag Legend Modal */}
      {showLegendModal && (
        <div className="fixed inset-0 z-[100] bg-[#022D32]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#DDF3E9] rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DDF3E9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#0CA17A]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#022D32] uppercase tracking-wider">
                    {t.legendTitle || (language === 'it' ? 'LEGENDA TAG TATTICI' : 'TACTICAL TAGS LEGEND')}
                  </h3>
                  <p className="text-[11px] text-[#022D32]/70">
                    {t.legendSubtitle || (language === 'it' ? 'Criteri di classificazione e volumi minimi' : 'Classification rules and minimum volume thresholds')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="text-[#022D32]/60 hover:text-[#022D32] p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {TACTICAL_TAGS_CONFIG.map(tag => (
                <div key={tag.id} className="p-3 bg-[#F8F9FA] rounded-xl border border-[#DDF3E9] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <TacticalTagIcon id={tag.id} className="w-5 h-5 flex-none text-[#022D32]" />
                    <div>
                      <span className="font-bold text-xs uppercase text-[#022D32] block">
                        {language === 'it' ? tag.labelIt : tag.label}
                      </span>
                      <span className="text-[11px] text-[#022D32]/70 font-mono">
                        {language === 'it' ? tag.criteriaDesc : tag.criteriaDescEn}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white border border-[#DDF3E9] px-2.5 py-1 rounded-lg text-[#022D32]">
                    {tag.criteria}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#DDF3E9]">
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="px-4 py-2 rounded-xl bg-[#022D32] hover:bg-[#022D32]/90 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {language === 'it' ? 'Chiudi Legenda' : 'Close Legend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
