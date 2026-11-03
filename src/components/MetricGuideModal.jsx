import React, { useState, useEffect } from 'react';
import { 
  X, Info, AlertTriangle, TrendingUp, BookOpen 
} from 'lucide-react';

export const METRIC_GUIDES = {
  pillars: {
    key: 'pillars',
    shortLabel: '4 Pillars',
    title: 'Game Control & Efficiency Pillars',
    formula: '1. Shooting (eFG%) + 2. Shot Profile + 3. Rebounding & Extra Possessions + 4. Ball Movement & Security',
    description: 'The 4 practical pillars of game control designed specifically for senior regional basketball: 1) Shooting Efficiency (eFG% and 2P/3P splits), 2) Shot Profile Balance (paint attacks vs perimeter spacing & FT conversion), 3) Rebounding & Extra Possessions (concrete offensive vs defensive rebound splits), and 4) Ball Movement & Security (assists, turnovers, and assisted FG%). Controlling 3 or more pillars consistently dictates match victories.',
    benchmarks: [
      { level: 'Pillar 1: Shooting eFG%', range: '> 48% (Target > 52%)', color: 'emerald', desc: 'Shot quality and perimeter conversion' },
      { level: 'Pillar 2: Paint & FTs', range: '> 35% Paint / > 65% FT', color: 'emerald', desc: 'Rim pressure and drawing fouls' },
      { level: 'Pillar 3: Rebounding', range: '≥ 10 OREB or ≥ 28% OREB Share', color: 'emerald', desc: 'Second-chance scoring opportunities' },
      { level: 'Pillar 4: Ball Movement & Care', range: 'AST/TOV ≥ 1.3 / Assisted FGs > 55%', color: 'emerald', desc: 'Crisp ball movement and possession protection' }
    ],
    warning: 'Computed directly from tracked field goals, court coordinates, free throws, rebounds, assists, turnovers, and steals.'
  },
  fg: {
    key: 'fg',
    shortLabel: 'FG%',
    title: 'FG% — Field Goals & Conversion Splits',
    formula: '((2PM + 3PM) / (2PA + 3PA)) × 100',
    description: 'Raw team shooting accuracy from the field combining interior (2-point) and perimeter (3-point) attempts. The breakdown displays both 2P and 3P conversion rates to isolate rim finishing versus outside shooting execution.',
    benchmarks: [
      { level: 'High Conversion', range: '> 50.0%', color: 'emerald', desc: 'Efficient scoring execution across both interior and perimeter zones' },
      { level: 'Competitive Average', range: '42.0% – 49.9%', color: 'amber', desc: 'Solid regional standard for contested senior games' },
      { level: 'Struggling / Cold', range: '< 42.0%', color: 'rose', desc: 'Forced shots, spacing issues, or rim finishing struggles' }
    ],
    warning: 'Calculated directly from all recorded 2-point and 3-point makes and attempts.'
  },
  efg: {
    key: 'efg',
    shortLabel: 'eFG%',
    title: 'eFG% — Effective Field Goal % (Pillar 1: Shooting)',
    formula: '((FGM + 0.5 × 3PM) / FGA) × 100',
    description: 'Field goal percentage adjusted for the added value of 3-point shots (each 3-pointer is weighted as 1.5 two-pointers). Reflects true scoring efficiency per field goal attempt.',
    benchmarks: [
      { level: 'Elite Regional', range: '> 52%', color: 'emerald', desc: 'High shot quality and rhythm perimeter conversion' },
      { level: 'Solid / Average', range: '47% – 51%', color: 'amber', desc: 'Competitive efficiency for regional senior basketball' },
      { level: 'Low / Inefficient', range: '< 46%', color: 'rose', desc: 'Subpar perimeter conversion or forced, contested attempts' }
    ],
    warning: 'Directly calculated from field goals made (2P/3P) and field goals attempted, weighting 3-pointers at 1.5x.'
  },
  shotProfile: {
    key: 'shotProfile',
    shortLabel: 'Shot Profile',
    title: 'Paint vs Perimeter Balance (Pillar 2: Shot Profile & FT)',
    formula: 'Paint FGA% vs Mid-Range FGA% vs 3PT FGA% + FT (FTM/FTA, FT%)',
    description: 'Distribution of team field goal attempts between high-efficiency rim attacks (Paint/Key), mid-range jumpers, and perimeter 3-pointers, combined with free throw conversion. Identifies whether the team successfully attacks the basket and converts foul line opportunities or settles for contested mid-range shots.',
    benchmarks: [
      { level: 'High Rim Pressure', range: '> 40% Paint / < 20% Mid / > 70% FT', color: 'emerald', desc: 'Aggressive paint penetration, drawing contact, and capitalizing at the stripe' },
      { level: 'Balanced Spread', range: '30% – 39% Paint / 20% – 28% Mid / 60% – 70% FT', color: 'amber', desc: 'Healthy balance between inside finishes, mid-range pull-ups, and 3PT spacing' },
      { level: 'Mid-Range Heavy', range: '> 30% Mid / < 30% Paint / < 60% FT', color: 'rose', desc: 'Settling for low-value contested 2s with low free throw generation' }
    ],
    warning: 'Calculated directly from logged shot coordinates across all 9 zones and recorded free throws.'
  },
  oreb: {
    key: 'oreb',
    shortLabel: 'Rebounding',
    title: 'Rebounding & Extra Possessions (Pillar 3)',
    formula: 'Offensive Rebounds vs Defensive Rebounds & OREB Share ((OREB / Total REB) × 100)',
    description: 'Measures backboard dominance and extra possession generation. Offensive rebounds represent second-chance scoring opportunities, while defensive rebounds secure stops to fuel transition.',
    benchmarks: [
      { level: 'Strong Glass', range: '≥ 10 OREB or OREB Share ≥ 28%', color: 'emerald', desc: 'Dominating the offensive glass; manufactures 10+ second-chance possessions' },
      { level: 'Solid Glass', range: '7 – 9 OREB (OREB Share 22% – 27%)', color: 'amber', desc: 'Competitive board presence with balanced transition defense retreat' },
      { level: 'Passive Glass', range: '< 7 OREB (OREB Share < 22%)', color: 'rose', desc: 'One-and-done possessions; limited extra possession generation' }
    ],
    warning: 'Directly calculated from tracked offensive and defensive rebounds.'
  },
  ballControl: {
    key: 'ballControl',
    shortLabel: 'Ball Movement',
    title: 'Ball Movement & Security (Pillar 4)',
    formula: 'Assists (AST) vs Turnovers (TOV), AST/TOV Ratio, Assisted FG%',
    description: 'Direct evaluation of playmaking flow and possession protection. Rewarding high ball movement (Assisted FGM%) and ball care (AST/TOV ratio >= 1.3), while keeping unforced giveaways to a minimum.',
    benchmarks: [
      { level: 'Great Flow', range: 'AST/TOV ≥ 1.3 / Assisted FGs > 60%', color: 'emerald', desc: 'Crisp passing, high unselfishness, and excellent ball security' },
      { level: 'Balanced', range: 'AST/TOV 0.9 – 1.29 / Assisted FGs 45% – 59%', color: 'amber', desc: 'Standard competitive playmaking and mistake control' },
      { level: 'High Turnovers', range: 'AST/TOV < 0.9 / Excessive unforced giveaways', color: 'rose', desc: 'Stagnant ball movement or sloppy transition giveaways' }
    ],
    warning: 'Directly computed from tracked assists, turnovers, and made field goals.'
  },
  ts: {
    key: 'ts',
    hidden: true,
    shortLabel: 'TS%',
    title: 'TS% — True Shooting % (Overall Scoring Efficiency)',
    formula: 'Total Points / [2 × (FGA + 0.44 × FTA)] × 100',
    description: 'Comprehensive scoring efficiency metric measuring points produced per scoring attempt, combining 2-point field goals, 3-point field goals, and free throws into a single unified percentage.',
    benchmarks: [
      { level: 'Elite', range: '> 58%', color: 'emerald', desc: 'High-level multi-range scoring and free-throw capitalization' },
      { level: 'Solid', range: '50% – 57%', color: 'amber', desc: 'Good offensive efficiency across shot types' },
      { level: 'Low', range: '< 48%', color: 'rose', desc: 'Low conversion rate per scoring opportunity' }
    ],
    warning: 'Combines 2-point, 3-point, and free-throw conversion into a single unified true scoring percentage.'
  },
  asttov: {
    key: 'asttov',
    hidden: true,
    shortLabel: 'AST/TOV',
    title: 'AST / TOV Ratio (Assist-to-Turnover Ratio)',
    formula: 'Total Assists / Total Turnovers',
    description: 'Ratio of assisted baskets produced relative to lost possessions. Evaluates team passing discipline, decision-making, and play creation.',
    benchmarks: [
      { level: 'Elite', range: '> 1.8', color: 'emerald', desc: 'Ball movement, unselfish play, and strong ball security' },
      { level: 'Standard', range: '1.1 – 1.7', color: 'amber', desc: 'Balanced playmaking and mistake control' },
      { level: 'Critical / Alarm', range: '< 1.0', color: 'rose', desc: 'More turnovers than assists; indicates stagnant ball movement' }
    ],
    warning: 'Evaluates ball-handling and playmaking discipline directly from recorded assists and turnovers.'
  },
  pir: {
    key: 'pir',
    shortLabel: 'PIR',
    title: 'FIBA PIR (Performance Index Rating)',
    formula: '(PTS + REB + AST + STL + BLK + FD) - (FG_Miss + FT_Miss + TOV + PF + BLKA)',
    description: 'The official all-in-one performance rating used by FIBA and EuroLeague. Awards +1 for positive contributions (points, rebounds, assists, steals, blocks, fouls drawn) and subtracts -1 for errors (missed field goals, missed free throws, turnovers, personal fouls, blocked shots).',
    benchmarks: [
      { level: 'Team Dominance', range: '> 90 PIR', color: 'emerald', desc: 'Clean execution with minimal errors across the roster' },
      { level: 'Competitive / Solid', range: '65 – 89 PIR', color: 'amber', desc: 'Solid team production across primary statistical categories' },
      { level: 'Subpar Performance', range: '< 60 PIR', color: 'rose', desc: 'High volume of missed shots, fouls, or unforced turnovers' }
    ],
    warning: 'Official FIBA Performance Index Rating computed from all individual categories: points, rebounds, assists, steals, blocks, personal fouls, fouls drawn, and turnovers.'
  },
  gamescore: {
    key: 'gamescore',
    shortLabel: 'GameScore',
    title: 'GameScore (GS)',
    formula: 'PTS + 0.4×FGM - 0.7×FGA - 0.4×(FTA-FTM) + 0.7×OREB + 0.3×DREB + STL + 0.7×AST + 0.7×BLK - 0.4×PF - TOV',
    description: 'A single-game composite rating of individual player productivity. Unlike basic PIR, GameScore weights each box-score category with statistical coefficients to reflect real contribution to the final score.',
    benchmarks: [
      { level: 'MVP Performance', range: '> 18', color: 'emerald', desc: 'Dominant two-way impact across both halves of the court' },
      { level: 'Strong Game', range: '12 – 17', color: 'amber', desc: 'High-efficiency, decisive individual contribution' },
      { level: 'Quiet / Inefficient', range: '< 8', color: 'rose', desc: 'Limited positive impact or poor shooting volume' }
    ],
    warning: 'Comprehensive player productivity rating combining all tracked scoring, rebounding, playmaking, personal fouls, and defensive stats.'
  },
  pps: {
    key: 'pps',
    shortLabel: 'PPS',
    title: 'PPS — Points Per Shot (Expected Value per Zone)',
    formula: '(FGM × Value 2 or 3) / FGA',
    description: 'Average points produced per field goal attempt from a specific court zone. Identifies high-value scoring locations (paint, open corner 3s) versus inefficient shooting areas (contested mid-range jumpers).',
    benchmarks: [
      { level: 'High Value (HOT)', range: '≥ 1.15 PPS', color: 'emerald', desc: 'High-efficiency zone: paint area or spot-up open 3-pointers' },
      { level: 'Average / Solid', range: '0.95 – 1.14 PPS', color: 'amber', desc: 'Standard league-average shot efficiency' },
      { level: 'Low Value (COLD)', range: '< 0.85 PPS', color: 'rose', desc: 'Low-efficiency scoring location (typically contested mid-range)' }
    ],
    warning: 'Calculated directly from recorded makes and misses across each of the 9 half-court zones.'
  },
  drb: {
    key: 'drb',
    shortLabel: 'DRB%',
    title: 'DRB% — Defensive Rebounding Percentage',
    formula: '(BBA Defensive Rebounds / (BBA Defensive Rebounds + Opponent Offensive Rebounds)) × 100',
    description: 'The definitive measure of defensive glass cleanup. Indicates the percentage of all available defensive rebounds secured by the team, preventing opponent second-chance scoring opportunities.',
    benchmarks: [
      { level: 'Elite Glass', range: '> 72.0%', color: 'emerald', desc: 'Total defensive board lock; zero second-chance opportunities conceded' },
      { level: 'Solid / Average', range: '65.0% – 72.0%', color: 'amber', desc: 'Competitive board security for regional senior basketball' },
      { level: 'Vulnerable Glass', range: '< 65.0%', color: 'rose', desc: 'Leaking multiple offensive rebounds; giving opponents extra possessions' }
    ],
    warning: 'Calculated directly from tracked BBA defensive rebounds and opponent offensive rebounds.'
  },
  oppEfg: {
    key: 'oppEfg',
    shortLabel: 'Opp eFG%',
    title: 'Opponent eFG% — Defensive Shot Quality Allowed',
    formula: '((Opp 2PM + Opp 3PM + 0.5 × Opp 3PM) / Opp Total FGA) × 100',
    description: 'Opponent effective field goal percentage allowed by our defense, weighting opponent 3-pointers at 1.5x. Demonstrates defensive containment and contest quality across 2P and 3P attempts.',
    benchmarks: [
      { level: 'Lockdown Defense', range: '< 46.0%', color: 'emerald', desc: 'Contested shooting; suppressing opponent rim and outside conversion' },
      { level: 'Average Containment', range: '46.0% – 52.0%', color: 'amber', desc: 'Standard regional contest rate' },
      { level: 'Porous Defense', range: '> 52.0%', color: 'rose', desc: 'Opponent getting open layups and uncontested rhythm 3s' }
    ],
    warning: 'Directly calculated from all recorded opponent makes and misses across 2-pointers and 3-pointers.'
  },
  transitionPpp: {
    key: 'transitionPpp',
    shortLabel: 'Transition PPP',
    title: 'Transition PPP — Points Per Possession (Fastbreak Efficiency)',
    formula: 'Transition Points / (Transition FGA + Transition TOV + 0.44 × Transition FTA)',
    description: 'Scoring productivity per possession when attacking in transition / fastbreak. Contrasting transition PPP against half-court set offense reveals whether pushing the tempo produces higher quality scoring.',
    benchmarks: [
      { level: 'Elite Fastbreak', range: '≥ 1.15 PPP', color: 'emerald', desc: 'Lethal open-court execution; converting numbers advantages into high-percentage points' },
      { level: 'Solid Pace', range: '0.95 – 1.14 PPP', color: 'amber', desc: 'Good decision-making and rim attacks in transition' },
      { level: 'Low Yield / Sloppy', range: '< 0.95 PPP', color: 'rose', desc: 'Turnovers or rushed low-percentage shots during fastbreak opportunities' }
    ],
    warning: 'Directly derived from plays tagged with TRANSITION toggle during live match scouting.'
  },
  // Theoretical & Possession-based metrics (hidden from primary tabs per coach directive)
  ortg: {
    key: 'ortg',
    hidden: true,
    shortLabel: 'ORTG',
    title: 'ORTG — Offensive Rating',
    formula: '(Total Points / Estimated Possessions) × 100',
    description: 'Theoretical points scored per 100 estimated offensive possessions.',
    benchmarks: [
      { level: 'Elite', range: '> 112', color: 'emerald', desc: 'High-efficiency execution' },
      { level: 'Good / Average', range: '100 – 111', color: 'amber', desc: 'Solid offensive production' },
      { level: 'Low', range: '< 98', color: 'rose', desc: 'Low conversion rate' }
    ],
    warning: 'Theoretical estimated possession metric.'
  },
  possessions: {
    key: 'possessions',
    hidden: true,
    shortLabel: 'Pace',
    title: 'Est. Possessions — Pace',
    formula: 'FGA + 0.44 × FTA - OREB + TOV',
    description: 'Estimated offensive possessions in the match.',
    benchmarks: [
      { level: 'High Pace', range: '> 78 poss', color: 'emerald', desc: 'Fast-paced game' },
      { level: 'Standard Pace', range: '68 – 77 poss', color: 'amber', desc: 'Controlled half-court play' },
      { level: 'Slow Pace', range: '< 67 poss', color: 'slate', desc: 'Deliberate grinding game' }
    ],
    warning: 'Theoretical estimated possession metric.'
  },
  // Backward-compatibility aliases
  fourfactors: {
    key: 'fourfactors',
    hidden: true,
    title: 'Game Control & Efficiency Pillars (Four Factors)',
    formula: '1. eFG% + 2. Shot Profile + 3. OREB% + 4. Ball Security',
    description: 'The 4 practical pillars of game control designed for senior regional basketball.',
    benchmarks: [
      { level: 'Shooting eFG%', range: '> 48%', color: 'emerald', desc: 'Shot quality and perimeter conversion' },
      { level: 'Paint Attack', range: '> 35% Paint', color: 'emerald', desc: 'Basket pressure and free throws' },
      { level: 'OREB Share', range: '> 30%', color: 'emerald', desc: 'Second-chance scoring opportunities' },
      { level: 'Ball Care', range: '< 14 TOV', color: 'emerald', desc: 'Turnover management and assist ratio' }
    ],
    warning: 'Refer to the 4 Pillars guide for complete regional benchmarks.'
  },
  tovpct: {
    key: 'tovpct',
    hidden: true,
    title: 'Ball Security & Turnover Control',
    formula: 'Total Turnovers (Target: < 14 per game)',
    description: 'Concrete ball security and turnover management for senior regional play.',
    benchmarks: [
      { level: 'Elite Care', range: '< 14 TOV', color: 'emerald', desc: 'High ball protection' },
      { level: 'Manageable', range: '14 – 18 TOV', color: 'amber', desc: 'Standard frequency' },
      { level: 'High Risk', range: '> 18 TOV', color: 'rose', desc: 'Excessive lost possessions' }
    ],
    warning: 'Refer to Pillar 4 (Ball Care) for full analysis.'
  },
  ftr: {
    key: 'ftr',
    hidden: true,
    title: 'Shot Profile & Free Throw Generation',
    formula: 'Paint FGA% & Free Throw Conversion',
    description: 'Measures inside rim pressure and capitalizing at the free throw line.',
    benchmarks: [
      { level: 'High Rim Pressure', range: '> 40% Paint', color: 'emerald', desc: 'Interior penetration' },
      { level: 'Moderate', range: '30% – 39% Paint', color: 'amber', desc: 'Balanced spread' },
      { level: 'Perimeter Only', range: '< 25% Paint', color: 'rose', desc: 'Jump-shot reliant' }
    ],
    warning: 'Refer to Pillar 2 (Shot Profile) for full analysis.'
  }
};

export default function MetricGuideModal({ activeKey = 'pillars', onClose, onSelectMetric }) {
  const [currentKey, setCurrentKey] = useState(activeKey || 'pillars');

  useEffect(() => {
    if (activeKey && METRIC_GUIDES[activeKey]) {
      setCurrentKey(activeKey);
    }
  }, [activeKey]);

  const guide = METRIC_GUIDES[currentKey] || METRIC_GUIDES.pillars;

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
          {Object.values(METRIC_GUIDES).filter(m => !m.hidden).map(m => {
            const isSelected = m.key === currentKey || (currentKey === 'fourfactors' && m.key === 'pillars');
            return (
              <button
                key={m.key}
                onClick={() => handleSelect(m.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 flex-none border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-105'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span>{m.shortLabel || m.key.toUpperCase()}</span>
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

          {/* Practical Coaching Interpretation */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-sky-400 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>PRACTICAL COACHING INTERPRETATION:</span>
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
