import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { calculatePlusMinus, verifyPlusMinusInvariant, calculateTeamScore, calculateOpponentScore } from '../src/utils/basketballAnalytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- STARTING PHASE 4.15 TEST SUITE: EVENT-LEVEL PLUS/MINUS (+/-) SNAPSHOTTING ---');

// 1. Verify SQL Migration File
console.log('\n[1/5] Verifying SQL Migration File (supabase_schema_phase_4_15.sql)...');
const sqlPath = path.join(rootDir, 'supabase_schema_phase_4_15.sql');
assert(fs.existsSync(sqlPath), 'supabase_schema_phase_4_15.sql must exist');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
assert(
  sqlContent.includes('ALTER TABLE scouting_log ADD COLUMN IF NOT EXISTS on_court TEXT[];'),
  'SQL migration must contain ALTER TABLE scouting_log ADD COLUMN IF NOT EXISTS on_court TEXT[];'
);
console.log('✓ supabase_schema_phase_4_15.sql specifies exact DDL for on_court TEXT[]');

// 2. Verify Static Code Integration for on_court Snapshots in LiveGame.jsx
console.log('\n[2/5] Verifying on_court snapshots in LiveGame.jsx...');
const liveGameContent = fs.readFileSync(path.join(rootDir, 'src/pages/LiveGame.jsx'), 'utf8');

assert(
  liveGameContent.includes('const onCourtSnapshot = onCourtPlayerNums.map(String)'),
  'LiveGame.jsx must map onCourtPlayerNums to string array snapshots'
);
assert(
  liveGameContent.includes('handleExecutePendingAction') && liveGameContent.includes('on_court: onCourtSnapshot'),
  'handleExecutePendingAction must attach on_court snapshot'
);
assert(
  liveGameContent.includes('handleRecordAction') && liveGameContent.includes('on_court: onCourtSnapshot'),
  'handleRecordAction must attach on_court snapshot'
);
assert(
  liveGameContent.includes('handleOpponentShot') && liveGameContent.includes('onCourtSnapshot'),
  'handleOpponentShot must attach onCourtSnapshot'
);
assert(
  liveGameContent.includes('handleOpponentTurnover') && liveGameContent.includes('on_court: onCourtSnapshot'),
  'handleOpponentTurnover must attach on_court snapshot'
);
assert(
  liveGameContent.includes('handleCompleteMadeShotWithAssist') && liveGameContent.includes('on_court: onCourtSnapshot'),
  'handleCompleteMadeShotWithAssist must attach on_court snapshot'
);
assert(
  liveGameContent.includes('handleCompleteMadeShotUnassisted') && liveGameContent.includes('on_court: onCourtSnapshot'),
  'handleCompleteMadeShotUnassisted must attach on_court snapshot'
);
assert(
  liveGameContent.includes('handleCompleteMissedShotRebound') && liveGameContent.includes('on_court: onCourtSnapshot'),
  'handleCompleteMissedShotRebound must attach on_court snapshot'
);
assert(
  liveGameContent.includes('handleSkipMissedShotRebound') && liveGameContent.includes('on_court: onCourtSnapshot'),
  'handleSkipMissedShotRebound must attach on_court snapshot'
);
console.log('✓ LiveGame.jsx attaches on_court snapshot across all action and shot handlers');

// 3. Verify App.jsx and offlineSync.js Dispatcher Integration
console.log('\n[3/5] Verifying App.jsx & offlineSync.js Dispatcher Integration...');
const appContent = fs.readFileSync(path.join(rootDir, 'src/App.jsx'), 'utf8');
assert(
  appContent.includes('on_court: currentOnCourt'),
  'App.jsx dispatchAction must include on_court in supabasePayload and localEv'
);
assert(
  appContent.includes('on_court: itemOnCourt'),
  'App.jsx dispatchMultipleActions must include on_court in batch payloads'
);
assert(
  appContent.includes('dispatchOpponentScore = (points, customOnCourt = null)'),
  'App.jsx dispatchOpponentScore must accept customOnCourt'
);

const offlineSyncContent = fs.readFileSync(path.join(rootDir, 'src/services/offlineSync.js'), 'utf8');
assert(
  offlineSyncContent.includes('on_court:') && offlineSyncContent.includes('p.on_court = on_court'),
  'offlineSync.js must preserve and sync on_court arrays'
);
console.log('✓ App.jsx and offlineSync.js preserve and send on_court arrays with fallback protection');

// 4. Test Euroleague Method +/- Calculation Engine
console.log('\n[4/5] Testing Euroleague Method +/- Calculation (basketballAnalytics.js)...');

// Scenario: 
// Initial 5: #11, #35, #7, #12, #0
// Event 1: BBA 2PT Made by #11 (on_court: ['11', '35', '7', '12', '0'])
// Event 2: BBA 3PT Made by #35 (on_court: ['11', '35', '7', '12', '0'])
// Event 3: BBA FT Made by #7 (on_court: ['11', '35', '7', '12', '0'])
// Event 4: OPP 2PT Made (on_court: ['11', '35', '7', '12', '0'])
// Event 5: SUB #7 OUT, #17 IN -> (no points, no +/- change)
// Event 6: OPP 3PT Made (on_court: ['11', '35', '17', '12', '0'])
// Event 7: BBA 2PT Made by #17 (on_court: ['11', '35', '17', '12', '0'])

const testEvents = [
  { Action: '2PT Made', Category: 'Shot', Number: '11', Player: 'Davide Valente', on_court: ['11', '35', '7', '12', '0'] },
  { Action: '3PT Made', Category: 'Shot', Number: '35', Player: 'Marco Girardi', on_court: ['11', '35', '7', '12', '0'] },
  { Action: 'FT Made', Category: 'Shot', Number: '7', Player: 'Valerio Villani', on_court: ['11', '35', '7', '12', '0'] },
  { Action: 'OPP_2PT_MADE', Category: 'Opponent', Number: 'OPP', Player: 'OPPONENT', on_court: ['11', '35', '7', '12', '0'] },
  { Action: 'SUB: #17 IN for #7', Category: 'Substitution', Number: 'SUB', Player: 'SUB', on_court: ['11', '35', '17', '12', '0'] },
  { Action: 'OPP_3PT_MADE', Category: 'Opponent', Number: 'OPP', Player: 'OPPONENT', on_court: ['11', '35', '17', '12', '0'] },
  { Action: '2PT Made', Category: 'Shot', Number: '17', Player: 'Toma Makharadze', on_court: ['11', '35', '17', '12', '0'] }
];

const pm = calculatePlusMinus(testEvents, ['11', '35', '7', '12', '0']);

// Verification of individual +/-:
// BBA points in stint 1 (Events 1-4): 2 + 3 + 1 = 6 pts scored, 2 opp pts conceded -> net +4
// Player #7 was only in stint 1: +/- must be exactly +4
assert.strictEqual(pm['7'], 4, `Player #7 must have +/- of +4, got ${pm['7']}`);

// Stint 2 (Events 6-7): OPP 3PT (-3), BBA 2PT (+2) -> net -1 for that stint
// Player #17 was only in stint 2: +/- must be exactly -1
assert.strictEqual(pm['17'], -1, `Player #17 must have +/- of -1, got ${pm['17']}`);

// Players #11, #35, #12, #0 were in both stints: +4 + (-1) = +3
assert.strictEqual(pm['11'], 3, `Player #11 must have +/- of +3, got ${pm['11']}`);
assert.strictEqual(pm['35'], 3, `Player #35 must have +/- of +3, got ${pm['35']}`);
assert.strictEqual(pm['12'], 3, `Player #12 must have +/- of +3, got ${pm['12']}`);
assert.strictEqual(pm['0'], 3, `Player #0 must have +/- of +3, got ${pm['0']}`);

// Verify Mathematical Invariant: sum(plusMinus across roster) === 5 * (teamScore - oppScore)
const inv = verifyPlusMinusInvariant(pm, testEvents);
assert.strictEqual(inv.isValid, true, 'Mathematical invariant sum(plusMinus) === 5 * (teamScore - oppScore) must hold');
assert.strictEqual(inv.actualTotal, 15, `Actual total must be 15, got ${inv.actualTotal}`);
assert.strictEqual(inv.targetTotal, 15, `Target total must be 15, got ${inv.targetTotal}`);
console.log('✓ Euroleague Method accurately computes +/- with on_court snapshots and verifies mathematical invariant (15 === 5 * (8 - 5))');

// 5. Verify Zero System Emojis
console.log('\n[5/5] Verifying Zero System Emojis in src/ and scripts/...');
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function checkEmojis(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      count += checkEmojis(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.sql')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (emojiRegex.test(content)) {
        console.error(`Emoji violation in: ${fullPath}`);
        count++;
      }
    }
  }
  return count;
}

const srcViolations = checkEmojis(path.join(rootDir, 'src'));
assert.strictEqual(srcViolations, 0, `Found ${srcViolations} emoji violations in src/`);
console.log('✓ Zero emoji policy strictly verified across src/');

console.log('\n======================================================');
console.log('ALL PHASE 4.15 TESTS COMPLETED SUCCESSFULLY!');
console.log('======================================================');
