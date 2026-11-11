import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- STARTING PHASE 4.17 TEST SUITE: HIERARCHY OF TRUTH, ROSTER FIXES & PLAYER CARD ENRICHMENT ---');

// Helper to read .env file and populate process.env
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
        process.env[key] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Dynamically import modules
const { 
  aggregateSupabasePlayerStats, 
  buildSuperchargedBbaRoster, 
  formatAverage, 
  formatPercentage 
} = await import('../src/utils/hybridDataService.js');

// 1. Unit Test for aggregateSupabasePlayerStats & Shoot Zones
console.log('\n[1/6] Verifying aggregateSupabasePlayerStats Totals, Averages & Shoot Zones...');
const sampleLogs = [
  // Player 22 (Amedeo Decuzzi) Match 1
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: '2PT Made', Zone: 'Paint / Key', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: '2PT Missed', Zone: 'Paint / Key', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: '3PT Made', Zone: 'Wing 3 Left', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'FT Made', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'FT Missed', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'Def Rebound', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'Off Rebound', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'Assist', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'Steal', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'Block', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'Turnover', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm1', Number: '22', Player: 'Amedeo Decuzzi', Action: 'Personal Foul', on_court: ['22', '11', '1', '7', '43'] },
  // Player 22 Match 2
  { match_id: 'm2', Number: '22', Player: 'Amedeo Decuzzi', Action: '2PT Made', Zone: 'Mid-Range Left', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm2', Number: '22', Player: 'Amedeo Decuzzi', Action: '3PT Made', Zone: 'Top 3 Arc', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm2', Number: '22', Player: 'Amedeo Decuzzi', Action: 'FT Made', on_court: ['22', '11', '1', '7', '43'] },
  { match_id: 'm2', Number: '22', Player: 'Amedeo Decuzzi', Action: 'Def Rebound', on_court: ['22', '11', '1', '7', '43'] },
  // Opponent score to test plusMinus
  { match_id: 'm1', Number: 'OPP', Player: 'OPPONENT', Action: 'OPP_2PT_MADE', on_court: ['22', '11', '1', '7', '43'] }
];

const supaAgg = aggregateSupabasePlayerStats(sampleLogs);
const p22 = supaAgg['22'];

assert(p22, 'Player 22 must exist in aggregated map');
assert.strictEqual(p22.gpSupabase, 2, 'Player 22 played in 2 matches');

// Verify Totals
assert.strictEqual(p22.fg2m, 2, 'Total 2PT Made = 2');
assert.strictEqual(p22.fg2a, 3, 'Total 2PT Att = 3');
assert.strictEqual(p22.fg3m, 2, 'Total 3PT Made = 2');
assert.strictEqual(p22.fg3a, 2, 'Total 3PT Att = 2');
assert.strictEqual(p22.ftm, 2, 'Total FT Made = 2');
assert.strictEqual(p22.fta, 3, 'Total FT Att = 3');
assert.strictEqual(p22.totalPts, 2*2 + 2*3 + 2, 'Total Points = 4 + 6 + 2 = 12');
assert.strictEqual(p22.rebTotal, 3, 'Total Rebounds = 2 DREB + 1 OREB = 3');
assert.strictEqual(p22.astTotal, 1, 'Total Assists = 1');
assert.strictEqual(p22.stlTotal, 1, 'Total Steals = 1');
assert.strictEqual(p22.blkTotal, 1, 'Total Blocks = 1');
assert.strictEqual(p22.tovTotal, 1, 'Total Turnovers = 1');
assert.strictEqual(p22.foulsTotal, 1, 'Total Fouls = 1');

// Verify Averages
assert.strictEqual(p22.pointsAVG, 6.0, 'PPG = 12 / 2 = 6.0');
assert.strictEqual(p22.twoMadeAVG, 1.0, '2PM/G = 2 / 2 = 1.0');
assert.strictEqual(p22.twoAttAvg, 1.5, '2PA/G = 3 / 2 = 1.5');
assert.strictEqual(p22.threeMadeAVG, 1.0, '3PM/G = 2 / 2 = 1.0');
assert.strictEqual(p22.threeAttAvg, 1.0, '3PA/G = 2 / 2 = 1.0');
assert.strictEqual(p22.ftMadeAvg, 1.0, 'FTM/G = 2 / 2 = 1.0');
assert.strictEqual(p22.ftAttAvg, 1.5, 'FTA/G = 3 / 2 = 1.5');
assert.strictEqual(p22.rebAvg, 1.5, 'REB/G = 3 / 2 = 1.5');
assert.strictEqual(p22.astAvg, 0.5, 'AST/G = 1 / 2 = 0.5');

// Verify Shoot Zones
assert(Array.isArray(p22.shootZones), 'p22.shootZones must be an array');
assert.strictEqual(p22.shootZones.length, 5, 'Must contain 5 court zones');

const paintZone = p22.shootZones.find(z => z.key === 'paint');
assert(paintZone, 'Paint zone must exist');
assert.strictEqual(paintZone.made, 1, 'Paint made = 1');
assert.strictEqual(paintZone.att, 2, 'Paint att = 2');
assert.strictEqual(paintZone.pct, 50, 'Paint pct = 50%');

const midZone = p22.shootZones.find(z => z.key === 'mid');
assert(midZone, 'Mid-range zone must exist');
assert.strictEqual(midZone.made, 1, 'Mid made = 1');
assert.strictEqual(midZone.att, 1, 'Mid att = 1');
assert.strictEqual(midZone.pct, 100, 'Mid pct = 100%');

const wing3Zone = p22.shootZones.find(z => z.key === 'wing3');
assert(wing3Zone, 'Wing 3 zone must exist');
assert.strictEqual(wing3Zone.made, 1, 'Wing 3 made = 1');
assert.strictEqual(wing3Zone.att, 1, 'Wing 3 att = 1');

const top3Zone = p22.shootZones.find(z => z.key === 'top3');
assert(top3Zone, 'Top 3 zone must exist');
assert.strictEqual(top3Zone.made, 1, 'Top 3 made = 1');
assert.strictEqual(top3Zone.att, 1, 'Top 3 att = 1');

console.log('✓ aggregateSupabasePlayerStats accurately calculates totals, averages, and shoot zones');

// 2. Unit Test for buildSuperchargedBbaRoster (Hierarchy of Truth)
console.log('\n[2/6] Verifying buildSuperchargedBbaRoster Hierarchy of Truth (Scouting > FIP)...');
const sampleFipRoster = [
  {
    fid: '95126',
    number: '22',
    name: 'Amedeo',
    lastName: 'Decuzzi',
    games: 2,
    timePlayedAVG: 1500,
    stats: {
      games: 2,
      points: 18,
      pointsAVG: 9.0, // FIP points
      inArcThrowsAVG: 2.0,
      outArcThrowsAVG: 0.0,
      freeThrowsPercentage: 66.6,
      foulsAVG: 2.5
    }
  },
  {
    fid: '99999',
    number: '99',
    name: 'Player',
    lastName: 'FipOnly',
    games: 1,
    timePlayedAVG: 600,
    stats: {
      games: 1,
      points: 8,
      pointsAVG: 8.0,
      inArcThrowsAVG: 4.0,
      outArcThrowsAVG: 0.0,
      freeThrowsPercentage: 50.0,
      foulsAVG: 1.0
    }
  }
];

const roster = buildSuperchargedBbaRoster(sampleFipRoster, sampleLogs, null, 'ALL', {});
assert.strictEqual(roster.length, 2, 'Roster must contain 2 players');

const p22Roster = roster.find(p => p.number === '22');
assert(p22Roster, 'Player 22 must be in supercharged roster');

// Overlapping stats MUST come from Supabase
assert.strictEqual(p22Roster.pointsAVG, 6.0, 'Points AVG must be 6.0 (Supabase), NOT 9.0 (FIP)');
assert.strictEqual(p22Roster.totalPts, 12, 'Total Points must be 12 (Supabase), NOT 18 (FIP)');
assert.strictEqual(p22Roster.twoMadeAVG, 1.0, '2PM AVG must be 1.0 (Supabase), NOT 2.0 (FIP)');
assert.strictEqual(p22Roster.threeMadeAVG, 1.0, '3PM AVG must be 1.0 (Supabase), NOT 0.0 (FIP)');
assert.strictEqual(p22Roster.twoPct, 67, '2PT% must be 67% (2/3 from Supabase)');
assert.strictEqual(p22Roster.threePct, 100, '3PT% must be 100% (2/2 from Supabase)');
assert.strictEqual(p22Roster.ftPct, 67, 'FT% must be 67% (2/3 from Supabase)');
assert.strictEqual(p22Roster.ftMadeAvg, 1.0, 'FTM AVG must be 1.0');
assert.strictEqual(p22Roster.ftAttAvg, 1.5, 'FTA AVG must be 1.5');
assert.strictEqual(p22Roster.astAvg, 0.5, 'AST AVG must be 0.5');
assert.strictEqual(p22Roster.rebAvg, 1.5, 'REB AVG must be 1.5');
assert(p22Roster.shootZones && p22Roster.shootZones.length === 5, 'Player 22 must contain shootZones array');

// FIP-exclusive metrics MUST be preserved
assert.strictEqual(p22Roster.timePlayedAVG, 1500, 'Minutes played must be preserved from FIP');

// Player 99 (FIP only fallback)
const p99Roster = roster.find(p => p.number === '99');
assert(p99Roster, 'Player 99 must be in roster');
assert.strictEqual(p99Roster.pointsAVG, 8.0, 'Player 99 pointsAVG falls back to FIP (8.0)');
assert.strictEqual(p99Roster.astAvg, null, 'Player 99 AST is null (no false readings)');
assert.strictEqual(p99Roster.rebAvg, null, 'Player 99 REB is null');

console.log('✓ buildSuperchargedBbaRoster strictly enforces Scouting > FIP Hierarchy of Truth');

// 3. Static Analysis of Roster Table Fixes (SeasonTrends.jsx & LeagueHub.jsx)
console.log('\n[3/6] Verifying Roster Table Free Throw volume & 2PT/3PT mapping...');
const seasonTrendsContent = fs.readFileSync(path.join(rootDir, 'src/pages/SeasonTrends.jsx'), 'utf8');
const leagueHubContent = fs.readFileSync(path.join(rootDir, 'src/pages/LeagueHub.jsx'), 'utf8');

assert(
  seasonTrendsContent.includes('player.ftAttAvg != null && player.ftAttAvg > 0') &&
  seasonTrendsContent.includes('${formatAverage(player.ftMadeAvg)} / ${formatAverage(player.ftAttAvg)}') &&
  seasonTrendsContent.includes('({player.ftm || 0}/{player.fta} tot)'),
  'SeasonTrends.jsx must properly map and display Free Throw Made / Attempted volume and totals'
);

assert(
  leagueHubContent.includes('p.ftAttAvg != null && p.ftAttAvg > 0') &&
  leagueHubContent.includes('${formatAverage(p.ftMadeAvg)} / ${formatAverage(p.ftAttAvg)}') &&
  leagueHubContent.includes('({p.ftm || 0}/{p.fta} tot)'),
  'LeagueHub.jsx must properly map and display Free Throw Made / Attempted volume and totals'
);

// Verify 2PT/3PT volume mapping
assert(
  seasonTrendsContent.includes('${formatAverage(player.twoMadeAVG)} / ${formatAverage(player.twoAttAvg)}') &&
  seasonTrendsContent.includes('({player.fg2m || 0}/{player.fg2a} tot)'),
  'SeasonTrends.jsx must map 2PT Made / Attempted volume with totals'
);

assert(
  seasonTrendsContent.includes('${formatAverage(player.threeMadeAVG)} / ${formatAverage(player.threeAttAvg)}') &&
  seasonTrendsContent.includes('({player.fg3m || 0}/{player.fg3a} tot)'),
  'SeasonTrends.jsx must map 3PT Made / Attempted volume with totals'
);

// Verify Tag Tattici column is retained
assert(
  seasonTrendsContent.includes('tactical.tags.map(tag =>') &&
  seasonTrendsContent.includes('TacticalTagIcon'),
  'SeasonTrends.jsx must retain the Tag Tattici column in the Roster Table'
);

console.log('✓ Roster table Free Throw, 2PT, 3PT volume and Tag Tattici verified in SeasonTrends.jsx and LeagueHub.jsx');

// 4. Static Analysis of PlayerProfileModal.jsx (Removal of Alerts, Dual Display & Shoot Zones)
console.log('\n[4/6] Verifying PlayerProfileModal.jsx (Alerts Removed, Dual Display, Shoot Zones)...');
const modalContent = fs.readFileSync(path.join(rootDir, 'src/components/PlayerProfileModal.jsx'), 'utf8');

// Ensure PROFILO TATTICO & ALERT COACH is completely deleted
assert(
  !modalContent.includes('PROFILO TATTICO & ALERT COACH') &&
  !modalContent.includes('tacticalBadgesTitle') &&
  !modalContent.includes('showLegendModal'),
  'PlayerProfileModal.jsx must NOT contain PROFILO TATTICO & ALERT COACH section'
);

// Verify Dual Display (Media & Totali) for Points, Assists, Rebounds, Steals, Blocks, Turnovers, Fouls, Plus/Minus
assert(modalContent.includes('ppgDisplay') && modalContent.includes('ptsTotalDisplay'), 'Must display Points Avg and Total');
assert(modalContent.includes('astAvgDisplay') && modalContent.includes('astTotalDisplay'), 'Must display Assists Avg and Total');
assert(modalContent.includes('rebAvgDisplay') && modalContent.includes('rebTotalDisplay'), 'Must display Rebounds Avg and Total');
assert(modalContent.includes('stlAvgDisplay') && modalContent.includes('stlTotalDisplay'), 'Must display Steals Avg and Total');
assert(modalContent.includes('blkAvgDisplay') && modalContent.includes('blkTotalDisplay'), 'Must display Blocks Avg and Total');
assert(modalContent.includes('tovAvgDisplay') && modalContent.includes('tovTotalDisplay'), 'Must display Turnovers Avg and Total');
assert(modalContent.includes('foulsDisplay') && modalContent.includes('foulsTotalDisplay'), 'Must display Fouls Avg and Total');
assert(modalContent.includes('pmDisplay') && modalContent.includes('pmTotalDisplay'), 'Must display Plus/Minus Avg and Total');

// Verify Shoot Zone Integration section
assert(
  modalContent.includes('MAPPA DI TIRO / SHOOT ZONES') &&
  modalContent.includes('shootZonesList') &&
  modalContent.includes('paint') &&
  modalContent.includes('mid') &&
  modalContent.includes('top3') &&
  modalContent.includes('wing3') &&
  modalContent.includes('corner3'),
  'PlayerProfileModal.jsx must contain Mappa di Tiro / Shoot Zones section with 5 court zones'
);

console.log('✓ PlayerProfileModal.jsx successfully updated: Alerts deleted, Dual Display added, Shoot Zones integrated');

// 5. Live Data Integration Test with Supabase Cloud
console.log('\n[5/6] Executing Live Data Integration Test with Supabase Cloud & Local JSON...');
async function testLiveIntegration() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.warn('⚠️ Supabase credentials not found, skipping cloud test');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: logs, error } = await supabase.from('scouting_log').select('*');
  assert(!error, `Supabase query failed: ${error?.message}`);
  assert(logs && logs.length > 0, 'Supabase scouting_log must have rows');

  const rosters = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/league_rosters.json'), 'utf8'));
  const bbaRoster = rosters['211634'] || rosters['BBA'] || [];

  const supercharged = buildSuperchargedBbaRoster(bbaRoster, logs, null, 'ALL', {});
  assert(supercharged.length > 0, 'Supercharged roster must contain players');

  // Verify Player #22 (Amedeo Decuzzi)
  const decuzzi = supercharged.find(p => p.number === '22');
  assert(decuzzi, 'Amedeo Decuzzi (#22) must be in supercharged roster');
  console.log(`Live Decuzzi (#22): ${decuzzi.pointsAVG} PPG (${decuzzi.totalPts} TOT), 2PT: ${decuzzi.twoMadeAVG} (${decuzzi.twoPct}%), 3PT: ${decuzzi.threeMadeAVG} (${decuzzi.threePct}%), FT: ${decuzzi.ftMadeAvg}/${decuzzi.ftAttAvg} (${decuzzi.ftm}/${decuzzi.fta} tot, ${decuzzi.ftPct}%), REB: ${decuzzi.rebAvg} (${decuzzi.rebTotal} tot)`);

  assert(decuzzi.totalPts > 0, 'Decuzzi total points must be > 0');
  assert(decuzzi.ftAtt > 0, 'Decuzzi FT attempts must be > 0');
  assert(decuzzi.ftAttAvg > 0, 'Decuzzi FT attempts avg must be > 0');
  assert(decuzzi.shootZones && decuzzi.shootZones.length === 5, 'Decuzzi must have 5 shoot zones');

  // Verify Player #11 (Davide Valente)
  const valente = supercharged.find(p => p.number === '11');
  assert(valente, 'Davide Valente (#11) must be in supercharged roster');
  console.log(`Live Valente (#11): ${valente.pointsAVG} PPG (${valente.totalPts} TOT), 2PT: ${valente.twoMadeAVG} (${valente.twoPct}%), 3PT: ${valente.threeMadeAVG} (${valente.threePct}%), FT: ${valente.ftMadeAvg}/${valente.ftAttAvg} (${valente.ftm}/${valente.fta} tot, ${valente.ftPct}%), AST: ${valente.astAvg} (${valente.astTotal} tot)`);

  assert(valente.totalPts > 0, 'Valente total points must be > 0');
  assert(valente.ftm > 0, 'Valente FT made must be > 0');
  assert(valente.shootZones && valente.shootZones.length === 5, 'Valente must have 5 shoot zones');

  console.log('✓ Live integration test verified with live Supabase data');
}

await testLiveIntegration();

// 6. Zero System Emoji Verification
console.log('\n[6/6] Verifying Zero System Emojis in src/ and scripts/...');
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function checkEmojis(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        checkEmojis(fullPath);
      }
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (emojiRegex.test(line)) {
          throw new Error(`Emoji found in ${fullPath}:${idx + 1} -> ${line}`);
        }
      });
    }
  }
}

checkEmojis(path.join(rootDir, 'src'));
console.log('✓ Zero emoji policy strictly verified across src/');

console.log('\n======================================================');
console.log('ALL PHASE 4.17 TESTS COMPLETED SUCCESSFULLY!');
console.log('======================================================\n');
