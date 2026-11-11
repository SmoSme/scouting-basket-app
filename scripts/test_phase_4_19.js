/**
 * Verification Test for Phase 4.19:
 * Dashboard Cleanup, Hybrid Averages (The Rule of N) & Player Card Refine
 */

import assert from 'assert';
import {
  aggregateSupabasePlayerStats,
  buildSuperchargedBbaRoster,
  buildHybridGameLog,
  buildUnifiedMatchList
} from '../src/utils/hybridDataService.js';

console.log('=== RUNNING PHASE 4.19 VERIFICATION TESTS ===\n');

// -------------------------------------------------------------
// Test 1: The Rule of N (Strict Hybrid Averages Calculation)
// -------------------------------------------------------------
console.log('Test 1: The Rule of N (Scouting Averages divided by N scouting games, not FIP games)...');

// Player #7 played in 3 Supabase scouting games
const mockScoutingLogs = [
  // Game 1
  { match_id: 'match_uuid_1', Match_Name: 'BBA vs Solofra', Number: '7', Player: 'Mario Rossi', Action: '2PT Made', Category: 'Shot', ZoneName: 'paint' },
  { match_id: 'match_uuid_1', Match_Name: 'BBA vs Solofra', Number: '7', Player: 'Mario Rossi', Action: 'Assist', Category: 'Passing' },
  { match_id: 'match_uuid_1', Match_Name: 'BBA vs Solofra', Number: '7', Player: 'Mario Rossi', Action: 'Def Rebound', Category: 'Rebound' },
  { match_id: 'match_uuid_1', Match_Name: 'BBA vs Solofra', Number: '7', Player: 'Mario Rossi', Action: 'Turnover', Category: 'Turnover' },
  { match_id: 'match_uuid_1', Match_Name: 'BBA vs Solofra', Number: '7', Player: 'Mario Rossi', Action: 'Steal', Category: 'Defense' },
  { match_id: 'match_uuid_1', Match_Name: 'BBA vs Solofra', Number: '7', Player: 'Mario Rossi', Action: 'Block', Category: 'Defense' },
  // Game 2
  { match_id: 'match_uuid_2', Match_Name: 'BBA vs Minori', Number: '7', Player: 'Mario Rossi', Action: '3PT Made', Category: 'Shot', ZoneName: 'wing3' },
  { match_id: 'match_uuid_2', Match_Name: 'BBA vs Minori', Number: '7', Player: 'Mario Rossi', Action: 'Assist', Category: 'Passing' },
  { match_id: 'match_uuid_2', Match_Name: 'BBA vs Minori', Number: '7', Player: 'Mario Rossi', Action: 'Off Rebound', Category: 'Rebound' },
  // Game 3
  { match_id: 'match_uuid_3', Match_Name: 'BBA vs Montoro', Number: '7', Player: 'Mario Rossi', Action: 'FT Made', Category: 'Shot' },
  { match_id: 'match_uuid_3', Match_Name: 'BBA vs Montoro', Number: '7', Player: 'Mario Rossi', Action: 'Assist', Category: 'Passing' },
  { match_id: 'match_uuid_3', Match_Name: 'BBA vs Montoro', Number: '7', Player: 'Mario Rossi', Action: 'Foul Committed', Category: 'Foul' }
];

// FIP Roster says player #7 played in 5 official games (fipPg = 5)
const mockFipRoster = [
  {
    fid: 'p_7',
    number: '7',
    name: 'Mario Rossi',
    games: 5,
    timePlayedAVG: 1200, // 20:00 per game (FIP exclusive)
    stats: {
      games: 5,
      timePlayedAVG: 1200,
      pointsAVG: 4.0,
      inArcThrowsAVG: 1.0,
      outArcThrowsAVG: 0.5,
      foulsAVG: 1.5
    }
  }
];

const roster = buildSuperchargedBbaRoster(mockFipRoster, mockScoutingLogs, null, 'ALL', {});
assert.strictEqual(roster.length, 1);
const p7 = roster[0];

// Scouting games count must be 3
assert.strictEqual(p7.scoutingGamesCount, 3, 'Player should have 3 scouting games');
assert.strictEqual(p7.fipGamesCount, 5, 'Player should have 5 FIP games');
assert.strictEqual(p7.hasFewerScoutingGames, true, 'hasFewerScoutingGames must be true');
assert.ok(p7.scoutingTooltip && p7.scoutingTooltip.includes('3'), 'scoutingTooltip must mention 3 matches');

// Total points from scouting: 2 (2PT) + 3 (3PT) + 1 (FT) = 6 points
// Divided by 3 scouting games = 2.0 PPG (NOT 6 / 5 = 1.2!)
assert.strictEqual(p7.pointsAVG, 2.0, `Points average must be 2.0 (divided by 3), got ${p7.pointsAVG}`);

// Total assists: 3
// Divided by 3 scouting games = 1.0 AST/G (NOT 3 / 5 = 0.6!)
assert.strictEqual(p7.astAvg, 1.0, `Assists average must be 1.0 (divided by 3), got ${p7.astAvg}`);

// Total rebounds: 2 (1 def, 1 off)
// Divided by 3 scouting games = 0.7 REB/G (NOT 2 / 5 = 0.4!)
assert.strictEqual(p7.rebAvg, 0.7, `Rebounds average must be 0.7 (divided by 3), got ${p7.rebAvg}`);

// Total steals: 1
// Divided by 3 scouting games = 0.3 STL/G
assert.strictEqual(p7.stlAvg, 0.3, `Steals average must be 0.3 (divided by 3), got ${p7.stlAvg}`);

// Total blocks: 1
// Divided by 3 scouting games = 0.3 BLK/G
assert.strictEqual(p7.blkAvg, 0.3, `Blocks average must be 0.3 (divided by 3), got ${p7.blkAvg}`);

// Total fouls: 1
// Divided by 3 scouting games = 0.3 PF/G
assert.strictEqual(p7.foulsAVG, 0.3, `Fouls average must be 0.3 (divided by 3), got ${p7.foulsAVG}`);

// FIP-exclusive metric (MIN) must remain based on FIP games (5)
assert.strictEqual(p7.timePlayedAVG, 1200, 'MIN must be retained from FIP');

console.log('  PASS: The Rule of N divides scouting metrics strictly by N scouting games (3), retaining FIP minutes.\n');

// -------------------------------------------------------------
// Test 2: BBA Hub Match List Verification Badge & Official Logic
// -------------------------------------------------------------
console.log('Test 2: Match List Verification Badge & Official Type Logic...');

const mockFipLogs = [
  {
    matchFid: 'fip_1',
    date: '2026-10-15',
    round: 'G1',
    homeTeam: 'BBA Basket Baronissi',
    awayTeam: 'Pallacanestro Solofra',
    isHomeGame: true,
    homeScore: 68,
    awayScore: 62
  },
  {
    matchFid: 'fip_2',
    date: '2026-10-22',
    round: 'G2',
    homeTeam: 'Basket Minori',
    awayTeam: 'BBA Basket Baronissi',
    isHomeGame: false,
    homeScore: 55,
    awayScore: 60
  }
];

const mockSupabaseMatches = [
  // Matches Solofra (FIP match 1) with scouting events
  {
    id: 'supa_1',
    name: 'BBA vs Solofra',
    match_date: '2026-10-15',
    opponentName: 'Pallacanestro Solofra',
    hasSupabaseScout: true,
    events: [{ id: 'ev_1', Action: '2PT Made' }]
  },
  // Supabase only match 1: Friendly
  {
    id: 'supa_friendly_1',
    name: 'BBA vs Scafati Friendly',
    match_date: '2026-10-01',
    match_type: 'Friendly',
    opponentName: 'Scafati Basket',
    hasSupabaseScout: true,
    events: [{ id: 'ev_2', Action: '3PT Made' }]
  },
  // Supabase only match 2: Official match not present in FIP
  {
    id: 'supa_official_2',
    name: 'BBA vs Battipaglia Ufficiale',
    match_date: '2026-11-05',
    match_type: 'Official',
    opponentName: 'Battipaglia',
    hasSupabaseScout: true,
    events: [{ id: 'ev_3', Action: 'FT Made' }]
  }
];

const hybridGameLog = buildHybridGameLog(mockFipLogs, mockSupabaseMatches, 'ALL', {});

// 1. Solofra: Both FIP and Supabase
const solofraLog = hybridGameLog.find(m => m.opponent.includes('Solofra'));
assert.ok(solofraLog, 'Solofra match must exist');
assert.strictEqual(solofraLog.fipVerified, true, 'Solofra must be fipVerified');
assert.strictEqual(solofraLog.hasSupabaseScout, true, 'Solofra must have Supabase scout');
assert.strictEqual(solofraLog.matchType, 'Official', 'FIP match must be Official');
// Badge check expectation: hasSupabaseScout && fipVerified => 'SCOUTING + FIP'

// 2. Minori: FIP only (no matching Supabase match)
const minoriLog = hybridGameLog.find(m => m.opponent.includes('Minori'));
assert.ok(minoriLog, 'Minori match must exist');
assert.strictEqual(minoriLog.fipVerified, true, 'Minori must be fipVerified');
assert.strictEqual(minoriLog.hasSupabaseScout, false, 'Minori must NOT have Supabase scout');
assert.strictEqual(minoriLog.matchType, 'Official', 'FIP match must be Official');
// Badge check expectation: !hasSupabaseScout && fipVerified => 'FIP ONLY'

// 3. Scafati: Supabase only Friendly
const scafatiLog = hybridGameLog.find(m => m.opponent.includes('Scafati'));
assert.ok(scafatiLog, 'Scafati match must exist');
assert.strictEqual(scafatiLog.fipVerified, false, 'Scafati must NOT be fipVerified');
assert.strictEqual(scafatiLog.hasSupabaseScout, true, 'Scafati must have Supabase scout');
assert.strictEqual(scafatiLog.matchType, 'Friendly', 'Scafati match must be Friendly');
// Badge check expectation: hasSupabaseScout && !fipVerified => 'SCOUTING ONLY' (NOT 'AMICHEVOLE' in badge!)

// 4. Battipaglia: Supabase only Official
const battipagliaLog = hybridGameLog.find(m => m.opponent.includes('Battipaglia'));
assert.ok(battipagliaLog, 'Battipaglia match must exist');
assert.strictEqual(battipagliaLog.fipVerified, false, 'Battipaglia must NOT be fipVerified');
assert.strictEqual(battipagliaLog.hasSupabaseScout, true, 'Battipaglia must have Supabase scout');
assert.strictEqual(battipagliaLog.matchType, 'Official', 'Battipaglia marked Official must be Official');

console.log('  PASS: All match verification and official statuses correctly assigned.\n');

// -------------------------------------------------------------
// Test 3: Shoot Zones and Season Point Distribution
// -------------------------------------------------------------
console.log('Test 3: Shoot Zones fractional volume and accuracy...');

// In aggregateSupabasePlayerStats, verify shootZones volume string and percentage
const supaStats = aggregateSupabasePlayerStats(mockScoutingLogs);
const p7Stats = supaStats['7'];
assert.ok(p7Stats, 'Player 7 stats must exist in Supabase map');
assert.ok(Array.isArray(p7Stats.shootZones), 'shootZones must be an array');

const paintZone = p7Stats.shootZones.find(z => z.key === 'paint');
assert.ok(paintZone, 'Paint zone must exist');
assert.strictEqual(paintZone.made, 1);
assert.strictEqual(paintZone.att, 1);
assert.strictEqual(paintZone.pct, 100);
assert.strictEqual(paintZone.volume, '1/1');

const wing3Zone = p7Stats.shootZones.find(z => z.key === 'wing3');
assert.ok(wing3Zone, 'Wing 3 zone must exist');
assert.strictEqual(wing3Zone.made, 1);
assert.strictEqual(wing3Zone.att, 1);
assert.strictEqual(wing3Zone.pct, 100);
assert.strictEqual(wing3Zone.volume, '1/1');

console.log('  PASS: Shoot zones correctly compute made, att, volume ("1/1") and accuracy percentage.\n');

console.log('=== ALL PHASE 4.19 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
