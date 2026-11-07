import fs from 'fs';
import assert from 'assert';
import { calculateMatchAnalytics } from '../src/utils/basketballAnalytics.js';

console.log('--- RUNNING PHASE 4.11 SCHEME ANALYSIS VERIFICATION TESTS ---');

// Mock events representing BBA offense vs Opponent defensive schemes
const sampleEvents = [
  // 1. VS ZONE: BBA hits two 3PT, misses one 2PT, 1 Assist, 1 Off Rebound
  { id: 1, Action: '3PT Made', Category: 'Shot', Zone: 'ZONE', Player: 'Valente', Number: '11' },
  { id: 2, Action: 'Assist', Category: 'Passing', Zone: 'Zone', Player: 'Decuzzi', Number: '22' },
  { id: 3, Action: '3PT Made', Category: 'Shot', Zone: 'ZONE', Player: 'Ghanem', Number: '2' },
  { id: 4, Action: '2PT Missed', Category: 'Shot', Zone: 'ZONE', Player: 'Valente', Number: '11' },
  { id: 5, Action: 'Off Rebound', Category: 'Rebound', Zone: 'ZONE', Player: 'Oddo Casano', Number: '32' },
  // Opponent score while in zone should NOT add to BBA PTS SCORED
  { id: 6, Action: 'OPP_2PT_MADE', Category: 'Opponent', Zone: 'ZONE', Player: 'OPPONENT', Number: 'OPP' },

  // 2. VS PRESS: BBA commits 2 Turnovers, hits one 2PT, dishes 1 Assist
  { id: 7, Action: 'Turnover', Category: 'Ball Handling', Zone: 'Press', Player: 'Valente', Number: '11' },
  { id: 8, Action: 'Turnover', Category: 'Ball Handling', Zone: 'PRESS', Player: 'Decuzzi', Number: '22' },
  { id: 9, Action: '2PT Made', Category: 'Shot', Zone: 'PRESS', Player: 'Oddo Casano', Number: '32' },
  { id: 10, Action: 'Assist', Category: 'Passing', defenseType: 'PRESS', Player: 'Ghanem', Number: '2' },

  // 3. VS MAN: BBA hits one 2PT, 1 FT Made, misses 1 3PT, 1 Assist, 1 Turnover
  { id: 11, Action: '2PT Made', Category: 'Shot', Zone: 'PAINT', defenseType: 'MAN', Player: 'Valente', Number: '11' },
  { id: 12, Action: 'FT Made', Category: 'Free Throw', Zone: 'MAN', Player: 'Valente', Number: '11' },
  { id: 13, Action: '3PT Missed', Category: 'Shot', Zone: '3PT_TOP', defenseType: 'MAN', Player: 'Decuzzi', Number: '22' },
  { id: 14, Action: 'Assist', Category: 'Passing', Zone: 'MAN', Player: 'Oddo Casano', Number: '32' },
  { id: 15, Action: 'Turnover', Category: 'Ball Handling', Zone: 'MAN', Player: 'Ghanem', Number: '2' },
];

const analytics = calculateMatchAnalytics(sampleEvents);
const { defensiveSchemes } = analytics;

// Test ZONE
const zone = defensiveSchemes.ZONE;
assert.strictEqual(zone.ptsScored, 6, `Expected 6 points scored vs ZONE (two 3PT), got ${zone.ptsScored}`);
assert.strictEqual(zone.fga, 3, `Expected 3 FGA vs ZONE, got ${zone.fga}`);
assert.strictEqual(zone.fgm, 2, `Expected 2 FGM vs ZONE, got ${zone.fgm}`);
// eFG% = (2 + 0.5 * 2) / 3 = 3 / 3 = 100%
assert.strictEqual(zone.efg, 100, `Expected 100% eFG vs ZONE, got ${zone.efg}`);
assert.strictEqual(zone.ast, 1, `Expected 1 AST vs ZONE, got ${zone.ast}`);
assert.strictEqual(zone.tov, 0, `Expected 0 TOV vs ZONE, got ${zone.tov}`);
assert.strictEqual(zone.oreb, 1, `Expected 1 O-REB vs ZONE, got ${zone.oreb}`);
console.log('Test 1 Passed: BBA offensive metrics vs ZONE correctly aggregated.');

// Test PRESS
const press = defensiveSchemes.PRESS;
assert.strictEqual(press.ptsScored, 2, `Expected 2 points scored vs PRESS, got ${press.ptsScored}`);
assert.strictEqual(press.fga, 1, `Expected 1 FGA vs PRESS, got ${press.fga}`);
assert.strictEqual(press.tov, 2, `Expected 2 TOV vs PRESS, got ${press.tov}`);
assert.strictEqual(press.ast, 1, `Expected 1 AST vs PRESS, got ${press.ast}`);
assert.strictEqual(press.astTovRatio, 0.5, `Expected 0.5 AST/TOV ratio vs PRESS, got ${press.astTovRatio}`);
console.log('Test 2 Passed: BBA offensive metrics vs PRESS (TOV, AST, AST/TOV) correctly aggregated.');

// Test MAN
const man = defensiveSchemes.MAN;
assert.strictEqual(man.ptsScored, 3, `Expected 3 points scored vs MAN (1 2PT + 1 FT), got ${man.ptsScored}`);
assert.strictEqual(man.fga, 2, `Expected 2 FGA vs MAN (1 made 2PT + 1 missed 3PT), got ${man.fga}`);
assert.strictEqual(man.ast, 1, `Expected 1 AST vs MAN, got ${man.ast}`);
assert.strictEqual(man.tov, 1, `Expected 1 TOV vs MAN, got ${man.tov}`);
assert.strictEqual(man.astTovRatio, 1, `Expected 1.0 AST/TOV ratio vs MAN, got ${man.astTovRatio}`);
console.log('Test 3 Passed: BBA offensive metrics vs MAN correctly aggregated.');

// Test UI Component File Labels
const modalContent = fs.readFileSync('src/components/MatchReviewModal.jsx', 'utf8');
assert(modalContent.includes('EFFICIENZA OFFENSIVA VS DIFESE AVVERSARIE'), 'Modal must have component title "EFFICIENZA OFFENSIVA VS DIFESE AVVERSARIE"');
assert(modalContent.includes('PTS SCORED') || modalContent.includes('PTS SEGNATI'), 'Modal must display PTS SCORED');
assert(modalContent.includes('OUR eFG%') || modalContent.includes('BBA eFG%'), 'Modal must display OUR eFG%');
assert(modalContent.includes('AST/TOV'), 'Modal bottom row must include AST/TOV');
assert(modalContent.includes('O-REB'), 'Modal bottom row must include O-REB');
assert(!modalContent.includes('PTS ALLOWED'), 'Modal must NOT display PTS ALLOWED');

// Verify Section 3 (Defensive Schemes Breakdown) does not use OPP eFG%
const schemeSectionMatch = modalContent.match(/OFFENSIVE EFFICIENCY VS OPPONENT DEFENSIVE SCHEMES[\s\S]*?QUARTER-BY-QUARTER PERFORMANCE MATRIX/);
assert(schemeSectionMatch, 'Scheme section must be found');
assert(!schemeSectionMatch[0].includes('OPP eFG%'), 'Scheme section must NOT display OPP eFG%');
console.log('Test 4 Passed: MatchReviewModal.jsx headers and labels inverted to offensive perspective.');

// Test 0 System Emojis
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
function checkEmojisInDir(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  for (const file of files) {
    const fullPath = `${dir}/${file}`;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      count += checkEmojisInDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (emojiRegex.test(content)) {
        console.warn('Emoji found in:', fullPath);
        count++;
      }
    }
  }
  return count;
}
assert.strictEqual(checkEmojisInDir('src'), 0, 'Found emojis in src/');
console.log('Test 5 Passed: Strictly 0 system emojis in src/.');

console.log('--- ALL PHASE 4.11 TESTS PASSED SUCCESSFULLY! ---');
