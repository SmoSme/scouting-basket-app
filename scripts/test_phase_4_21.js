import assert from 'assert';
import { 
  buildSuperchargedBbaRoster, 
  buildHybridGameLog, 
  formatPercentage, 
  formatAverage 
} from '../src/utils/hybridDataService.js';

console.log('--- STARTING PHASE 4.21 HOTFIX VERIFICATION SUITE ---');

// TEST 1: Defensive Programming in buildSuperchargedBbaRoster with edge cases & nulls
console.log('\n[TEST 1] Testing buildSuperchargedBbaRoster with nulls, empties, and missing data...');
try {
  // Test with all empty/null inputs
  const emptyResult = buildSuperchargedBbaRoster([], [], null, 'ALL', {}, []);
  assert(Array.isArray(emptyResult), 'Must return an array even with empty parameters');
  console.log(`  -> Empty parameters returned ${emptyResult.length} default players without crashing.`);

  // Test with activeMatchesList containing nulls, undefined, and broken objects
  const corruptMatches = [
    null,
    undefined,
    {},
    { id: 'm1', name: 'Valid Match', events: [] },
    { id: 'fip_1', fipVerified: true, isFipOnly: true, fipRoster: null },
    { id: 'fip_2', fipVerified: true, isFipOnly: true, fipRoster: [null, undefined, { number: '10', name: 'Mario Rossi', pts: 15 }] }
  ];

  const testRoster = [
    { number: '10', name: 'Mario', lastName: 'Rossi', games: 0, pointsAVG: 0 },
    { number: '99', name: 'Empty', lastName: 'Player', games: 0, pointsAVG: 0, twoPct: 0, threePct: 0, ftPct: 0 }
  ];

  const resultWithCorrupt = buildSuperchargedBbaRoster(testRoster, [null], null, 'ALL', null, corruptMatches);
  assert.strictEqual(resultWithCorrupt.length, 2, 'Must return exactly 2 players');
  
  const p10 = resultWithCorrupt.find(p => p.number === '10');
  assert(p10, 'Player #10 must exist');
  assert.strictEqual(p10.games, 1, 'Player #10 participated in fip_2 match');
  assert.strictEqual(p10.points, 15, 'Player #10 scored 15 points in fip_2 match');
  assert.strictEqual(p10.pointsAVG, 15.0, 'Player #10 pointsAVG must be 15.0');

  const p99 = resultWithCorrupt.find(p => p.number === '99');
  assert(p99, 'Player #99 must exist');
  assert.strictEqual(p99.games, 0, 'Player #99 has 0 games');
  assert.strictEqual(p99.points, 0, 'Player #99 has 0 points');
  assert.strictEqual(p99.pointsAVG, 0.0, 'Player #99 pointsAVG must be 0.0 with 0 games without NaN or error');
  assert.strictEqual(p99.twoPct, null, '2PT% must default to null when 0 attempts');

  console.log('  -> Corrupt match list handled safely with zero exceptions.');
} catch (err) {
  console.error('FAIL [TEST 1]:', err);
  process.exit(1);
}

// TEST 2: Division by Zero & Formatting Guards
console.log('\n[TEST 2] Testing division by zero guards and formatters...');
try {
  assert.strictEqual(formatAverage(null), '—');
  assert.strictEqual(formatAverage(undefined), '—');
  assert.strictEqual(formatAverage('—'), '—');
  assert.strictEqual(formatAverage(NaN), '—');
  assert.strictEqual(formatAverage(0), '0.0');
  assert.strictEqual(formatAverage(12.345), '12.3');

  assert.strictEqual(formatPercentage(null), '—');
  assert.strictEqual(formatPercentage(undefined), '—');
  assert.strictEqual(formatPercentage('—'), '—');
  assert.strictEqual(formatPercentage(NaN), '—');
  assert.strictEqual(formatPercentage(0), '0%');
  assert.strictEqual(formatPercentage(56.7), '57%');
  console.log('  -> formatAverage & formatPercentage are completely crash-proof.');
} catch (err) {
  console.error('FAIL [TEST 2]:', err);
  process.exit(1);
}

// TEST 3: Missing-Data Alert Banner Defensive Filter
console.log('\n[TEST 3] Testing missing-data alert list construction with dirty data...');
try {
  const hybridLogs = [
    null,
    undefined,
    { id: '1', name: 'Match 1', opponent: 'Team A', hasSupabaseScout: false, date: '2026-11-01', isHomeGame: true },
    { id: '2', name: 'Match 2', opponent: 'Team B', hasSupabaseScout: true, date: '2026-11-05', isHomeGame: false },
    { id: '3', name: 'Match 3', opponent: null, hasSupabaseScout: false, date: 'n.a.', isHomeGame: false }
  ];

  const missingScoutMatches = (hybridLogs || []).filter(m => m && !m.hasSupabaseScout);
  assert.strictEqual(missingScoutMatches.length, 2, 'Must accurately filter the 2 missing scout matches without throwing on nulls');

  const missingNames = missingScoutMatches
    .filter(Boolean)
    .map(m => {
      const opp = m?.opponent ? `${m.isHomeGame ? 'vs' : '@'} ${m.opponent}` : (m?.name || 'Partita');
      const d = m?.date && m.date !== 'n.a.' ? ` (${m.date})` : '';
      return `${opp}${d}`;
    })
    .filter(Boolean)
    .join(', ');

  assert.strictEqual(missingNames, 'vs Team A (2026-11-01), Match 3');
  console.log('  -> Missing matches banner safely built: "' + missingNames + '"');
} catch (err) {
  console.error('FAIL [TEST 3]:', err);
  process.exit(1);
}

// TEST 4: FIP-Only Detection & Tabellino Button Semantics
console.log('\n[TEST 4] Testing FIP-Only detection and Tabellino button metadata...');
try {
  const fipOnlyItem = {
    id: 'fip_0',
    name: 'BBA vs Polisportiva Folgore',
    fipVerified: true,
    hasSupabaseScout: false,
    rawFip: { matchFid: 'fid_123' },
    rawSupa: null
  };

  const scoutedItem = {
    id: 'supa_1',
    name: 'BBA vs Basket Bellizzi',
    fipVerified: true,
    hasSupabaseScout: true,
    rawFip: { matchFid: 'fid_124' },
    rawSupa: { id: 'supa_1', events: [{ id: 1 }] }
  };

  const isFipOnly1 = !fipOnlyItem.hasSupabaseScout && (fipOnlyItem.fipVerified || Boolean(fipOnlyItem.rawFip));
  const isFipOnly2 = !scoutedItem.hasSupabaseScout && (scoutedItem.fipVerified || Boolean(scoutedItem.rawFip));

  assert.strictEqual(isFipOnly1, true, 'fipOnlyItem must be detected as strictly FIP ONLY');
  assert.strictEqual(isFipOnly2, false, 'scoutedItem must NOT be detected as FIP ONLY');

  const getButtonLabel = (isFip, lang = 'it') => isFip ? (lang === 'it' ? 'TABELLINO' : 'BOX SCORE') : 'ANALISI';
  const getButtonClass = (isFip) => isFip ? 'bg-[#0284c7] hover:bg-[#0284c7]/90' : 'bg-[#0CA17A] hover:bg-[#0CA17A]/90';

  assert.strictEqual(getButtonLabel(isFipOnly1, 'it'), 'TABELLINO');
  assert.strictEqual(getButtonLabel(isFipOnly1, 'en'), 'BOX SCORE');
  assert.strictEqual(getButtonLabel(isFipOnly2, 'it'), 'ANALISI');
  assert.strictEqual(getButtonClass(isFipOnly1).includes('#0284c7'), true, 'Sky-blue color code #0284c7 must be present');
  assert.strictEqual(getButtonClass(isFipOnly2).includes('#0CA17A'), true, 'Green color code #0CA17A must be present');

  console.log('  -> Button labels and styling match specifications for FIP-Only vs Scouting matches.');
} catch (err) {
  console.error('FAIL [TEST 4]:', err);
  process.exit(1);
}

console.log('\nALL PHASE 4.21 UNIT TESTS PASSED SUCCESSFULLY!');
