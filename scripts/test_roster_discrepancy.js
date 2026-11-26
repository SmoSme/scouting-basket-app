import assert from 'assert';
import fs from 'fs';
import {
  aggregateSupabasePlayerStats,
  buildSuperchargedBbaRoster,
  buildUnifiedMatchList,
  buildHybridGameLog
} from '../src/utils/hybridDataService.js';

console.log('--- STARTING TARGETED DIAGNOSTIC REGRESSION TESTS (ROSTER VS MATCH SCOUTING) ---');

// ---------------------------------------------------------------------------
// TEST 1: #7 Valerio Villani across Official matches including Cittadella 3PT Made
// ---------------------------------------------------------------------------
console.log('\n[TEST 1] Verifying #7 Valerio Villani stats across Cittadella + Minori...');

const fipRoster = [
  {
    fid: '771227',
    number: '7',
    name: 'Valerio',
    lastName: 'Villani',
    stats: { games: 1, points: 4, inArcThrowsMade: 1, outArcThrowsMade: 0, freeThrowsMade: 2, freeThrowsFailed: 1, fouls: 0, plusMinus: -11 }
  },
  {
    fid: '1293365',
    number: '34',
    name: 'Emanuele',
    lastName: 'Cuomo',
    stats: { games: 1, points: 0, inArcThrowsMade: 0, outArcThrowsMade: 0, freeThrowsMade: 0, freeThrowsFailed: 0, fouls: 2, plusMinus: -1 }
  },
  {
    fid: '722163',
    number: '34',
    name: 'Gerardo',
    lastName: 'Spisso',
    stats: { games: 1, points: 2, inArcThrowsMade: 1, outArcThrowsMade: 0, freeThrowsMade: 0, freeThrowsFailed: 0, fouls: 3, plusMinus: -3 }
  },
  {
    fid: '1454076',
    number: '31',
    name: 'Marco',
    lastName: 'Girardi',
    stats: { games: 2, points: 3, inArcThrowsMade: 0, outArcThrowsMade: 1, freeThrowsMade: 0, freeThrowsFailed: 0, fouls: 2, plusMinus: -20 }
  }
];

const mockFipTrends = [
  {
    matchFid: '1786129',
    date: '2026-11-14T19:00:00.000Z',
    round: '4',
    homeTeam: 'INDOMITA PAGANI',
    awayTeam: 'BARONISSI BASKETBALL ACADEMY',
    isHomeGame: false,
    homeScore: 78,
    awayScore: 38,
    players: [
      { fid: '1293365', name: 'Emanuele', lastName: 'Cuomo', number: '34', pts: 0, fg2m: 0, fg3m: 0, ftm: 0, fta: 0, fouls: 2, plusMinus: -1 },
      { fid: '1454076', name: 'Marco', lastName: 'Girardi', number: '31', pts: 0, fg2m: 0, fg3m: 0, ftm: 0, fta: 0, fouls: 0, plusMinus: -19 }
    ]
  },
  {
    matchFid: '1786120',
    date: '2026-11-03T20:00:00.000Z',
    round: '2',
    homeTeam: 'G.S. MINORI PALLACANESTRO',
    awayTeam: 'BARONISSI BASKETBALL ACADEMY',
    isHomeGame: false,
    homeScore: 59,
    awayScore: 66,
    players: [
      { fid: '771227', name: 'Valerio', lastName: 'Villani', number: '7', pts: 4, fg2m: 1, fg3m: 0, ftm: 2, ftFailed: 1, fta: 3, fouls: 0, plusMinus: -11 }
    ]
  },
  {
    matchFid: '1786116',
    date: '2026-10-24T15:00:00.000Z',
    round: '1',
    homeTeam: 'BARONISSI BASKETBALL ACADEMY',
    awayTeam: 'ADEMI PELLE SOLOFRA',
    isHomeGame: true,
    homeScore: 51,
    awayScore: 57,
    players: [
      { fid: '722163', name: 'Gerardo', lastName: 'Spisso', number: '34', pts: 2, fg2m: 1, fg3m: 0, ftm: 0, fta: 0, fouls: 3, plusMinus: -3 },
      { fid: '1454076', name: 'Marco', lastName: 'Girardi', number: '31', pts: 3, fg2m: 0, fg3m: 1, ftm: 0, fta: 0, fouls: 2, plusMinus: -1 }
    ]
  }
];

const mockLogs = [
  // Cittadella (Official, Scouting Only, 2026-11-06) - #7 Valerio Villani: 1/5 2PT, 1/3 3PT, 2 REB, 5 PTS
  { id: '0ec7fa4e', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: '2PT Made', Category: 'Shot', Zone: 'Mid-Range Center', on_court: ['7', '31'] },
  { id: 'a6cbada2', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: '2PT Missed', Category: 'Shot', Zone: 'Paint / Key', on_court: ['7', '31'] },
  { id: 'f6e84eeb', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: '2PT Missed', Category: 'Shot', Zone: 'Mid-Range Right', on_court: ['7', '31'] },
  { id: '1c501b5e', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: '2PT Missed', Category: 'Shot', Zone: 'Paint / Key', on_court: ['7', '31'] },
  { id: 'fe354df3', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: '2PT Missed', Category: 'Shot', Zone: 'Paint / Key', on_court: ['7', '31'] },
  { id: '2c17ca9b', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: '3PT Made', Category: 'Shot', Zone: 'Wing 3 Left', on_court: ['7', '31'] },
  { id: '70a652e6', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: '3PT Missed', Category: 'Shot', Zone: 'Wing 3 Left', on_court: ['7', '31'] },
  { id: 'fbfe1732', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: '3PT Missed', Category: 'Shot', Zone: 'Wing 3 Right', on_court: ['7', '31'] },
  { id: 'a41ba601', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: 'Def Rebound', Category: 'Rebound', Zone: 'MAN', on_court: ['7', '31'] },
  { id: '480071bf', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '7', Player: 'Valerio Villani', Action: 'Off Rebound', Category: 'Rebound', Zone: 'MAN', on_court: ['7', '31'] },

  // G.S. Minori (Official, Scouting + FIP, 2026-11-03) - #7 Valerio Villani: 1/1 2PT, 0/2 3PT, 2/3 FT, 4 REB, 4 PTS
  { id: 'c4d0b623', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: '2PT Made', Category: 'Shot', Zone: 'Paint / Key', on_court: ['7'] },
  { id: '6520b3c3', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: '3PT Missed', Category: 'Shot', Zone: 'Top 3 Arc', on_court: ['7'] },
  { id: '276d57be', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: '3PT Missed', Category: 'Shot', Zone: 'Top 3 Arc', on_court: ['7'] },
  { id: '06b34dea', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: 'FT Made', Category: 'Shot', Zone: 'MAN', on_court: ['7'] },
  { id: 'a1aebc94', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: 'FT Made', Category: 'Shot', Zone: 'MAN', on_court: ['7'] },
  { id: 'ba5090c3', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: 'FT Missed', Category: 'Shot', Zone: 'MAN', on_court: ['7'] },
  { id: 'f98f35f9', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: 'Def Rebound', Category: 'Rebound', Zone: 'MAN', on_court: ['7'] },
  { id: 'dec1e7e0', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: 'Def Rebound', Category: 'Rebound', Zone: 'MAN', on_court: ['7'] },
  { id: '6097b3b9', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: 'Def Rebound', Category: 'Rebound', Zone: 'MAN', on_court: ['7'] },
  { id: '46c02ced', match_id: 'min-1', Match_Name: 'G.S. Minori vs BBA', Number: '7', Player: 'Valerio Villani', Action: 'Def Rebound', Category: 'Rebound', Zone: 'MAN', on_court: ['7'] },

  // Shared/swapped jerseys in Scouting:
  // Emanuele Cuomo wears #31 in Cittadella & Pagani (scouting), while Marco Girardi wears #23 in Eboli (friendly)
  { id: 'e1', match_id: 'cit-1', Match_Name: 'BBA vs Cittadella Dello Sport', Number: '31', Player: 'Emanuele Cuomo', Action: '2PT Made', Category: 'Shot', Zone: 'Paint / Key', on_court: ['7', '31'] },
  { id: 'e2', match_id: 'pag-1', Match_Name: 'Indomita Pagani vs BBA', Number: '31', Player: 'Emanuele Cuomo', Action: 'Personal Foul', Category: 'Foul', Zone: 'MAN', on_court: ['31'] },
  { id: 'e3', match_id: 'pag-1', Match_Name: 'Indomita Pagani vs BBA', Number: '31', Player: 'Emanuele Cuomo', Action: 'Personal Foul', Category: 'Foul', Zone: 'MAN', on_court: ['31'] },
  // Gerardo Spisso wears #34 in Eboli (friendly) - 2 x 3PT Made, 1 x 2PT Made
  { id: 'g1', match_id: 'eb-1', Match_Name: 'BBA vs Eboli Basket', Number: '34', Player: 'Gerardo Spisso', Action: '3PT Made', Category: 'Shot', Zone: 'Top 3 Arc', on_court: ['34', '23'] },
  { id: 'g2', match_id: 'eb-1', Match_Name: 'BBA vs Eboli Basket', Number: '34', Player: 'Gerardo Spisso', Action: '3PT Made', Category: 'Shot', Zone: 'Wing 3 Left', on_court: ['34', '23'] },
  { id: 'g3', match_id: 'eb-1', Match_Name: 'BBA vs Eboli Basket', Number: '34', Player: 'Gerardo Spisso', Action: '2PT Made', Category: 'Shot', Zone: 'Paint / Key', on_court: ['34', '23'] },
  // Marco Girardi wears #23 in Eboli (friendly)
  { id: 'm1', match_id: 'eb-1', Match_Name: 'BBA vs Eboli Basket', Number: '23', Player: 'Marco Girardi', Action: '2PT Made', Category: 'Shot', Zone: 'Paint / Key', on_court: ['34', '23'] }
];

const supaMatches = [
  { id: 'pag-1', name: 'Indomita Pagani vs BBA', match_date: '2026-11-14', match_type: 'Official', home_score: 38, away_score: 78, is_home: false, events: mockLogs.filter(e => e.match_id === 'pag-1') },
  { id: 'cit-1', name: 'BBA vs Cittadella Dello Sport', match_date: '2026-11-06', match_type: 'Official', home_score: 69, away_score: 55, is_home: true, events: mockLogs.filter(e => e.match_id === 'cit-1') },
  { id: 'min-1', name: 'G.S. Minori vs BBA', match_date: '2026-11-03', match_type: 'Official', home_score: 66, away_score: 59, is_home: false, events: mockLogs.filter(e => e.match_id === 'min-1') },
  { id: 'eb-1', name: 'BBA vs Eboli Basket', match_date: '2026-10-03', match_type: 'Friendly', home_score: 69, away_score: 45, is_home: true, events: mockLogs.filter(e => e.match_id === 'eb-1') }
];

const unified = buildUnifiedMatchList(mockFipTrends, supaMatches, {});
const officialHybridLogs = buildHybridGameLog(mockFipTrends, unified, 'OFFICIAL', {});
const allHybridLogs = buildHybridGameLog(mockFipTrends, unified, 'ALL', {});

const officialRoster = buildSuperchargedBbaRoster(fipRoster, mockLogs, null, 'OFFICIAL', {}, officialHybridLogs);
const allRoster = buildSuperchargedBbaRoster(fipRoster, mockLogs, null, 'ALL', {}, allHybridLogs);

const villaniOfficial = officialRoster.find(p => p.fid === '771227');
assert.strictEqual(villaniOfficial.games, 2, 'Villani Official PG must be 2');
assert.strictEqual(villaniOfficial.fg3m, 1, 'Villani Official 3PT Made must include Cittadella 3PT (1 tot)');
assert.strictEqual(villaniOfficial.fg3a, 5, 'Villani Official 3PT Att must be 5');
assert.strictEqual(villaniOfficial.threeMadeAVG, 0.5, 'Villani Official 3PT/G must be 0.5');
assert.strictEqual(villaniOfficial.threePct, 20, 'Villani Official 3PT% must be 20%');
assert.strictEqual(villaniOfficial.fg2m, 2, 'Villani Official 2PT Made must be 2 (1 Cittadella + 1 Minori)');
assert.strictEqual(villaniOfficial.twoMadeAVG, 1.0, 'Villani Official 2PT/G must be 1.0');
assert.strictEqual(villaniOfficial.ftm, 2, 'Villani Official FT Made must be 2');
assert.strictEqual(villaniOfficial.fta, 3, 'Villani Official FT Att must be 3');
assert.strictEqual(villaniOfficial.reb, 6, 'Villani Official REB total must be 6 (2 Cittadella + 4 Minori)');
assert.strictEqual(villaniOfficial.rebAvg, 3.0, 'Villani Official REB/G must be 3.0');
assert.strictEqual(villaniOfficial.totalPts, 9, 'Villani Official PTS total must be 9 (5 Cittadella + 4 Minori)');
console.log('  -> #7 Valerio Villani Official stats match single-match totals + Minori accurately.');

// ---------------------------------------------------------------------------
// TEST 2: #34 Shared Jersey & #31/#23 Disambiguation (Emanuele Cuomo vs Gerardo Spisso vs Marco Girardi)
// ---------------------------------------------------------------------------
console.log('\n[TEST 2] Verifying #34 shared jersey and cross-source number swap disambiguation...');

const cuomoAll = allRoster.find(p => p.fid === '1293365');
const spissoAll = allRoster.find(p => p.fid === '722163');
const girardiAll = allRoster.find(p => p.fid === '1454076');

// Emanuele Cuomo (FIP #34, Supabase #31): Cittadella (2pts, 1 2PM) + Pagani (2 fouls) = 2 GP, 2 PTS, 0 3PM, 2 fouls
assert.strictEqual(cuomoAll.games, 2, 'Cuomo ALL GP must be 2 (Cittadella + Pagani)');
assert.strictEqual(cuomoAll.totalPts, 2, 'Cuomo must NOT inherit Spisso points from #34');
assert.strictEqual(cuomoAll.fg3m, 0, 'Cuomo must have 0 3PT (not Spisso 2 3PT)');
assert.strictEqual(cuomoAll.fg2m, 1, 'Cuomo must have 1 2PT from Cittadella');
assert.strictEqual(cuomoAll.shotEvents.length, 1, 'Cuomo shotEvents must only include Cuomo shots');

// Gerardo Spisso (FIP #34, Supabase #34): Solofra FIP-only (1 2PM, 3 PF, -3 +/-) + Eboli Scouting (2 3PM, 1 2PM) = 2 GP, 10 PTS
assert.strictEqual(spissoAll.games, 2, 'Spisso ALL GP must be 2 (Solofra FIP + Eboli)');
assert.strictEqual(spissoAll.fg2m, 2, 'Spisso 2PM must be 2 (1 Solofra + 1 Eboli)');
assert.strictEqual(spissoAll.fg3m, 2, 'Spisso 3PM must be 2 (from Eboli)');
assert.strictEqual(spissoAll.totalPts, 10, 'Spisso totalPts must be 10');
assert.strictEqual(spissoAll.shotEvents.length, 3, 'Spisso shotEvents must include Spisso 3 shots only');

// In OFFICIAL filter, Cuomo must NOT steal Spisso's Solofra FIP-only boxscore (#34 fid 722163)!
const cuomoOfficial = officialRoster.find(p => p.fid === '1293365');
const spissoOfficial = officialRoster.find(p => p.fid === '722163');
assert.strictEqual(cuomoOfficial.games, 2, 'Cuomo Official GP must be 2 (Cittadella + Pagani), not 3');
assert.strictEqual(cuomoOfficial.fouls, 2, 'Cuomo Official fouls must be 2 (Pagani), must NOT include Spisso 3 fouls from Solofra');
assert.strictEqual(spissoOfficial.games, 1, 'Spisso Official GP must be 1 (Solofra FIP-only)');
assert.strictEqual(spissoOfficial.totalPts, 2, 'Spisso Official PTS must be 2 (Solofra)');

// Marco Girardi (FIP #31, Supabase #23): Solofra FIP-only (1 3PM) + Pagani (0) + Eboli Scouting (1 2PM) -> must NOT steal Cuomo's #31 Cittadella shots!
assert.strictEqual(girardiAll.fg2m, 1, 'Girardi ALL 2PM must be 1 (Eboli #23), NOT Cuomo #31');
assert.strictEqual(girardiAll.fg3m, 1, 'Girardi ALL 3PM must be 1 (Solofra FIP)');
assert.strictEqual(girardiAll.shotEvents.length, 1, 'Girardi shotEvents must only include Girardi shots');

// aggregateSupabasePlayerStats must store unique-name buckets even with overlapping numbers
const supaAgg = aggregateSupabasePlayerStats(mockLogs);
assert.strictEqual(supaAgg['name_emanuele cuomo'].fg2m, 1);
assert.strictEqual(supaAgg['name_gerardo spisso'].fg3m, 2);
assert.strictEqual(supaAgg['name_marco girardi'].fg2m, 1);
console.log('  -> #34 shared jersey & #31/#23 cross-source swaps disambiguated cleanly.');

// ---------------------------------------------------------------------------
// TEST 3: Verify SeasonTrends, LeagueHub, Archive, and supabase.js use pagination
// ---------------------------------------------------------------------------
console.log('\n[TEST 3] Verifying Supabase pagination across SeasonTrends, LeagueHub, Archive & services...');
const supaService = fs.readFileSync('src/services/supabase.js', 'utf8');
assert(supaService.includes('export async function fetchAllScoutingLogs'), 'supabase.js exports fetchAllScoutingLogs');
assert(supaService.includes('.range(offset, offset + pageSize - 1)'), 'fetchAllScoutingLogs uses PostgREST range pagination');

const st = fs.readFileSync('src/pages/SeasonTrends.jsx', 'utf8');
assert(st.includes("fetchAllScoutingLogs('*', 'id', false)"), 'SeasonTrends uses paginated fetchAllScoutingLogs');
assert(!st.includes(".from('scouting_log')"), 'SeasonTrends no longer has unpaginated scouting_log query');

const lh = fs.readFileSync('src/pages/LeagueHub.jsx', 'utf8');
assert(lh.includes("fetchAllScoutingLogs('*', 'id', true)"), 'LeagueHub uses paginated fetchAllScoutingLogs');
assert(!lh.includes(".from('scouting_log')"), 'LeagueHub no longer has unpaginated scouting_log query');

const arch = fs.readFileSync('src/pages/Archive.jsx', 'utf8');
assert(arch.includes("fetchAllScoutingLogs('match_id', 'id', true)"), 'Archive uses paginated fetchAllScoutingLogs for match counts');
console.log('  -> Pagination verified across all consumers.');

console.log('\nALL TARGETED DIAGNOSTIC REGRESSION TESTS PASSED!');
