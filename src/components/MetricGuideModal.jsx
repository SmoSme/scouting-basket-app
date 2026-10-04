import React, { useState } from 'react';
import { 
  X, Info, AlertTriangle, TrendingUp, BookOpen 
} from 'lucide-react';

export const METRIC_GUIDES = {
  ortg: {
    key: 'ortg',
    title: 'ORTG — Offensive Rating (Offensive Efficiency)',
    formula: '(Total Points / Estimated Possessions) × 100',
    description: 'Measures true offensive efficiency scaled to 100 possessions. It is the cornerstone of modern basketball analytics because it eliminates the distorting effect of game speed (Pace): a team can score 95 points playing at a frantic pace with poor efficiency, or score 75 points in half-court sets with surgical precision.',
    benchmarks: [
      { level: 'Elite', range: '> 112', color: 'emerald', desc: 'Dominant offense, superior execution, and high shot quality' },
      { level: 'Good / Average', range: '100 – 111', color: 'amber', desc: 'Solid, balanced offensive production' },
      { level: 'Critical / Low', range: '< 98', color: 'rose', desc: 'Struggling offense, excessive contested shots, or wasted possessions' }
    ],
    warning: 'POSSESSION TRACKING: Free Throws (Made/Missed) are actively tracked. Personal fouls are not currently recorded, but Pace and ORTG remain accurate within a 3-5% margin.'
  },
  possessions: {
    key: 'possessions',
    title: 'Est. Possessions — Pace (Game Tempo)',
    formula: 'FGA + 0.44 × FTA - OREB + TOV',
    description: 'Estimated total offensive possessions in the game (Dean Oliver official formula). Every possession concludes with a field goal attempt (FGA), trips to the free throw line (0.44 × FTA), or a turnover (TOV). Offensive rebounds (OREB) extend possessions without consuming a new one.',
    benchmarks: [
      { level: 'High Pace (Uptempo)', range: '> 78 poss', color: 'emerald', desc: 'Fast-paced game, heavy transition and early-clock offense' },
      { level: 'Medium / Standard Pace', range: '68 – 77 poss', color: 'amber', desc: 'Controlled tempo typical of European / FIBA half-court play' },
      { level: 'Slow / Grinding Pace', range: '< 67 poss', color: 'slate', desc: 'Physical, defensive game with long, deliberate half-court sets' }
    ],
    warning: 'Free Throws (FT Made/Missed) and Offensive Rebounds are accurately factored into the calculation.'
  },
  efg: {
    key: 'efg',
    title: 'eFG% — Effective Field Goal %',
    formula: '((FGM + 0.5 × 3PM) / FGA) × 100',
    description: 'Adjusts field goal percentage by awarding 50% extra value to 3-point field goals over 2-pointers. It resolves the limitation of standard FG%: shooting 4-of-10 from three yields 12 points, exactly like shooting 6-of-10 from two! eFG% evaluates that 4-of-10 from beyond the arc as a stellar 60% effective shooting.',
    benchmarks: [
      { level: 'Elite', range: '> 54%', color: 'emerald', desc: 'Outstanding shot selection and lethal perimeter accuracy' },
      { level: 'Solid / Average', range: '48% – 53%', color: 'amber', desc: 'Consistent, balanced shooting efficiency' },
      { level: 'Low / Inefficient', range: '< 46%', color: 'rose', desc: 'Subpar perimeter shooting or forced, contested attempts' }
    ],
    warning: '100% RELIABLE METRIC: Calculated strictly from field goals made (2P/3P) and field goals attempted. Completely independent of fouls and assists!'
  },
  ts: {
    key: 'ts',
    title: 'TS% — True Shooting % (True Overall Efficiency)',
    formula: 'Total Points / [2 × (FGA + 0.44 × FTA)] × 100',
    description: 'The definitive metric for overall scoring efficiency. It measures how many points a player or team generates per scoring attempt, synthesizing 2-pointers, 3-pointers, and free throws into a single unified figure.',
    benchmarks: [
      { level: 'Elite', range: '> 58%', color: 'emerald', desc: 'Lethal multi-level scoring and high free-throw capitalization' },
      { level: 'Solid', range: '50% – 57%', color: 'amber', desc: 'Good offensive efficiency across shot types' },
      { level: 'Low', range: '< 48%', color: 'rose', desc: 'Poor conversion rate per scoring opportunity' }
    ],
    warning: 'Free throws are included in this metric. If no free throws were attempted in a period, TS% mathematically equals eFG%.'
  },
  asttov: {
    key: 'asttov',
    title: 'AST / TOV Ratio (Assist-to-Turnover Ratio)',
    formula: 'Total Assists / Total Turnovers',
    description: 'The benchmark of tactical discipline, ball circulation, and decision-making under pressure. It measures the number of created, assisted baskets produced for every lost possession.',
    benchmarks: [
      { level: 'Elite', range: '> 2.0', color: 'emerald', desc: 'Superb ball movement, unselfish play, and ball security' },
      { level: 'Standard', range: '1.2 – 1.9', color: 'amber', desc: 'Average balance between playmaking and mistakes' },
      { level: 'Critical / Alarm', range: '< 1.0', color: 'rose', desc: 'More turnovers than assists: stagnant offense, isolation heavy, or live-ball mistakes' }
    ],
    warning: 'DATA TRACKING NOTICE: If assists are not logged by the statistician during the game, this ratio will display as 0 or be compromised. Turnovers (TOV) are logged and accurate.'
  },
  pir: {
    key: 'pir',
    title: 'FIBA PIR (Performance Index Rating)',
    formula: '(PTS + REB + AST + STL + BLK + FD) - (FG_Miss + FT_Miss + TOV + PF + BLKA)',
    description: 'The official all-in-one performance rating used by FIBA and EuroLeague. Awards +1 for every positive box-score action and subtracts -1 for missed shots, turnovers, and fouls.',
    benchmarks: [
      { level: 'Team Dominance', range: '> 90 PIR', color: 'emerald', desc: 'High-quality technical execution with minimal errors' },
      { level: 'Competitive / Solid', range: '65 – 89 PIR', color: 'amber', desc: 'Good team production across key stat categories' },
      { level: 'Subpar Performance', range: '< 60 PIR', color: 'rose', desc: 'High volume of missed shots or unforced turnovers' }
    ],
    warning: 'DATA TRACKING NOTICE: Personal Fouls committed (PF) and drawn (FD) are not currently tracked, and assists may be untracked. PIR accurately reflects points, rebounds, misses, and turnovers, but will be slightly lower than standard box scores due to missing foul data.'
  },
  gamescore: {
    key: 'gamescore',
    title: 'Hollinger GameScore (GS)',
    formula: 'PTS + 0.4×FGM - 0.7×FGA - 0.4×(FTA-FTM) + 0.7×OREB + 0.3×DREB + STL + 0.7×AST + 0.7×BLK - 0.4×PF - TOV',
    description: 'A single-game composite rating formulated by John Hollinger (NBA/ESPN). Unlike basic PIR, GameScore weights each box-score category with statistical regression coefficients reflecting real win-probability impact.',
    benchmarks: [
      { level: 'MVP Performance', range: '> 18', color: 'emerald', desc: 'Dominant two-way impact controlling both ends of the floor' },
      { level: 'Strong Game', range: '12 – 17', color: 'amber', desc: 'High-efficiency, decisive individual contribution' },
      { level: 'Quiet / Inefficient', range: '< 8', color: 'rose', desc: 'Limited positive impact or poor shooting volume' }
    ],
    warning: 'DATA TRACKING NOTICE: Calculated without personal fouls (PF) and optional assists. Fully valid for evaluating shooting volume, rebounds, and ball security.'
  },
  fourfactors: {
    key: 'fourfactors',
    title: 'Dean Oliver\'s Four Factors of Basketball Success',
    formula: 'Shooting (40%) + Turnovers (25%) + Rebounding (20%) + Free Throws (15%)',
    description: 'Dean Oliver\'s analytical framework demonstrates that basketball outcomes are governed by four fundamental pillars: 1) Shooting Efficiency (eFG%), 2) Possession Care (TOV%), 3) Offensive Rebound Share (OREB%), 4) Getting to the Free Throw Line (FTR).',
    benchmarks: [
      { level: 'Shooting eFG%', range: '> 52%', color: 'emerald', desc: 'Factor 1 (40% weight): Shot selection and finishing' },
      { level: 'Turnover Rate', range: '< 14%', color: 'emerald', desc: 'Factor 2 (25% weight): Ball security and protecting possessions' },
      { level: 'OREB Share', range: '> 30%', color: 'emerald', desc: 'Factor 3 (20% weight): Second-chance opportunities' },
      { level: 'Free Throw Rate', range: '> 0.25', color: 'emerald', desc: 'Factor 4 (15% weight): Rim pressure and drawing contact' }
    ],
    warning: 'Free Throw Rate measures FTA/FGA. Free throws attempted are recorded when shot. Fouls are not currently tracked.'
  },
  pps: {
    key: 'pps',
    title: 'PPS — Points Per Shot (Expected Value per Zone)',
    formula: '(FGM × Value 2 or 3) / FGA',
    description: 'The fundamental expected value metric for court zones. It measures average points produced per field goal attempt in that specific area, distinguishing high-value shots (at the rim, open corner 3s) from low-value shots (long contested mid-range jumpers).',
    benchmarks: [
      { level: 'High Value (HOT)', range: '≥ 1.15 PPS', color: 'emerald', desc: 'Golden zone: paint area or spot-up open 3-pointers' },
      { level: 'Average / Solid', range: '0.95 – 1.14 PPS', color: 'amber', desc: 'Standard league-average shot efficiency' },
      { level: 'Low Value (COLD)', range: '< 0.85 PPS', color: 'rose', desc: 'Statistically inefficient shot (typically contested mid-range)' }
    ],
    warning: '100% RELIABLE METRIC: Calculated mathematically directly from logged makes and misses across the 9 designated half-court zones.'
  }
};

export default function MetricGuideModal({ activeKey = 'ortg', onClose, onSelectMetric }) {
  const [currentKey, setCurrentKey] = useState(activeKey || 'ortg');

  const guide = METRIC_GUIDES[currentKey] || METRIC_GUIDES.ortg;

  const handleSelect = (k) => {
    setCurrentKey(k);
    if (onSelectMetric) onSelectMetric(k);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between flex-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center flex-none">
              <BookOpen className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                METRIC GUIDE & DECISION BENCHMARKS
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Formulas, definitions, reference values, and tracking reliability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
            title="Close Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metric Quick Switcher Horizontal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 overflow-x-auto no-scrollbar flex-none">
          {Object.values(METRIC_GUIDES).map(m => {
            const isSelected = m.key === currentKey;
            return (
              <button
                key={m.key}
                onClick={() => handleSelect(m.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 flex-none border ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black scale-105'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {m.key === 'ortg' && <span>ORTG</span>}
                {m.key === 'possessions' && <span>Pace</span>}
                {m.key === 'efg' && <span>eFG%</span>}
                {m.key === 'ts' && <span>TS%</span>}
                {m.key === 'asttov' && <span>AST/TOV</span>}
                {m.key === 'pir' && <span>PIR</span>}
                {m.key === 'gamescore' && <span>GameScore</span>}
                {m.key === 'fourfactors' && <span>Four Factors</span>}
                {m.key === 'pps' && <span>PPS</span>}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Title & Formula Badge */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <h4 className="text-base font-black text-sky-400">
                {guide.title}
              </h4>
            </div>
            <div className="inline-block bg-slate-900 border border-slate-700/80 text-amber-400 font-mono font-bold text-xs px-2.5 py-1 rounded-md">
              Formula: {guide.formula}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-2.5 font-medium">
              {guide.description}
            </p>
          </div>

          {/* Decision Benchmarks */}
          <div className="space-y-2">
            <div className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>DECISION BENCHMARKS & REFERENCE VALUES:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {guide.benchmarks.map((b, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        b.color === 'emerald' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        b.color === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        b.color === 'rose' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {b.level}
                      </span>
                    </div>
                    <div className="font-mono text-lg font-black text-slate-100 my-1">
                      {b.range}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium border-t border-slate-850 pt-1.5 mt-1">
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Tracking Reliability Notice */}
          <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>DATA TRACKING & RELIABILITY NOTICE:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {guide.warning}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-none">
          <span className="text-[11px] text-slate-500 font-medium">
            BBA Courtside Scouting Intelligence Engine
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors border border-slate-700"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
