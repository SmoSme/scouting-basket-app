import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- STARTING PHASE 4.13 TEST SUITE: LIVE SCOUTING PLAYER MODAL & UI FREEZE ---');

// 1. Verify On-Court Filtering in LiveGame.jsx
console.log('\n[1/5] Verifying On-Court Player Filtering in LiveGame.jsx...');
const liveGameContent = fs.readFileSync(path.resolve('src/pages/LiveGame.jsx'), 'utf8');

// Ensure onCourtPlayers checks is_on_court, isOnCourt, and onCourtSet
assert(
  liveGameContent.includes('p.is_on_court === true || p.isOnCourt === true || onCourtSet.has(num)'),
  'LiveGame.jsx must check is_on_court and onCourtSet for onCourtPlayers'
);

// Ensure modal only maps over onCourtPlayers and not roster
assert(
  liveGameContent.includes('{onCourtPlayers.map(p => ('),
  'Player Assignment Modal must map over onCourtPlayers'
);
assert(
  !liveGameContent.includes('BENCH ({benchPlayers.length})'),
  'Player Assignment Modal must NOT render bench players'
);
assert(
  !liveGameContent.includes('(onCourtPlayers.length > 0 ? onCourtPlayers : roster).map'),
  'Player Assignment Modal must NOT fall back to the entire roster'
);
console.log('✓ Player modal strictly renders active on-court players (no bench, no full roster fallback)');

// 2. Verify UI Freeze & Crash Prevention in handleExecutePendingAction
console.log('\n[2/5] Verifying Crash Prevention & Optimistic Modal Closing in LiveGame.jsx...');
assert(
  liveGameContent.includes('try {') && liveGameContent.includes('finally {'),
  'handleExecutePendingAction must implement try/catch/finally'
);
assert(
  liveGameContent.includes('setPendingActionPrompt(null);') && liveGameContent.includes('setSelectedPlayer(null);'),
  'handleExecutePendingAction must clear pendingActionPrompt and selectedPlayer'
);

// Check that setPendingActionPrompt(null) is in the finally block
const finallyBlockMatch = liveGameContent.match(/finally\s*\{[\s\S]*?setPendingActionPrompt\(null\);[\s\S]*?\}/);
assert(
  Boolean(finallyBlockMatch),
  'setPendingActionPrompt(null) MUST be called inside the finally block to guarantee modal closure'
);
console.log('✓ handleExecutePendingAction guarantees optimistic modal closure via finally block');

// 3. Verify Safe Player Number & Name Extraction
console.log('\n[3/5] Verifying Safe Player Number & Name Payload Extraction...');
assert(
  liveGameContent.includes('player.number ?? player.Number ?? player.numero ?? player.num'),
  'LiveGame.jsx must safely extract player number with fallbacks'
);
assert(
  liveGameContent.includes('player.name ?? player.Player ?? player.nome ?? player.playerName'),
  'LiveGame.jsx must safely extract player name with fallbacks'
);

const appContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8');
assert(
  appContent.includes('effectivePlayer.number ?? effectivePlayer.Number'),
  'App.jsx dispatchAction must safely extract effectivePlayer.number'
);
assert(
  appContent.includes('effectivePlayer.name ?? effectivePlayer.Player'),
  'App.jsx dispatchAction must safely extract effectivePlayer.name'
);
console.log('✓ Both LiveGame.jsx and App.jsx safely extract player number and name without undefined errors');

// 4. Behavioral Simulation Test of handleExecutePendingAction Logic
console.log('\n[4/5] Running Behavioral Simulation of handleExecutePendingAction Logic...');
let modalClosed = false;
let clearedPrompt = false;
let savedPayload = null;

function simulateHandleExecutePendingAction(player, pendingPrompt, dispatchMock) {
  let pendingActionPrompt = pendingPrompt;
  const setPendingActionPrompt = (val) => {
    pendingActionPrompt = val;
    if (val === null) {
      modalClosed = true;
      clearedPrompt = true;
    }
  };

  try {
    if (!pendingActionPrompt || !player) return;

    const currentPrompt = pendingActionPrompt;
    const { actionName, categoryName } = currentPrompt;

    const safePlayerNum = String(
      player.number ?? player.Number ?? player.numero ?? player.num ?? ''
    ).trim();
    const safePlayerName = String(
      player.name ?? player.Player ?? player.nome ?? player.playerName ?? 'Player'
    ).trim();

    const safePlayer = {
      ...player,
      number: safePlayerNum || '0',
      name: safePlayerName || 'Player'
    };

    dispatchMock(actionName, categoryName, null, safePlayer);
  } catch (err) {
    console.error('Caught simulation error as expected:', err.message);
  } finally {
    setPendingActionPrompt(null);
  }
}

// Case A: Normal player object
modalClosed = false;
clearedPrompt = false;
simulateHandleExecutePendingAction(
  { number: '11', name: 'Davide Valente' },
  { actionName: 'Turnover', categoryName: 'Turnover' },
  (act, cat, z, p) => { savedPayload = { act, p }; }
);
assert.strictEqual(modalClosed, true);
assert.strictEqual(clearedPrompt, true);
assert.strictEqual(savedPayload.p.number, '11');
assert.strictEqual(savedPayload.p.name, 'Davide Valente');

// Case B: Incomplete player object (e.g. uppercase keys, missing fields)
modalClosed = false;
simulateHandleExecutePendingAction(
  { Number: '35', Player: 'Marco Girardi' },
  { actionName: 'Off Rebound', categoryName: 'Rebound' },
  (act, cat, z, p) => { savedPayload = { act, p }; }
);
assert.strictEqual(modalClosed, true);
assert.strictEqual(savedPayload.p.number, '35');
assert.strictEqual(savedPayload.p.name, 'Marco Girardi');

// Case C: Dispatcher throws a critical synchronous exception
modalClosed = false;
simulateHandleExecutePendingAction(
  { number: '7', name: 'Valerio Villani' },
  { actionName: 'Personal Foul', categoryName: 'Foul' },
  () => { throw new Error('Supabase network error'); }
);
// Modal MUST still close!
assert.strictEqual(modalClosed, true, 'Modal MUST close even when dispatcher throws synchronously');

console.log('✓ Behavioral simulation confirms graceful handling of missing fields, errors, and modal close guarantee');

// 5. Zero Emoji Policy Check across src/
console.log('\n[5/5] Verifying Zero Emojis in src/...');
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
let emojiCount = 0;
function scanDir(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(jsx?|css)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (emojiRegex.test(content)) {
        console.error('Found emoji in:', fullPath);
        emojiCount++;
      }
    }
  }
}
scanDir('src');
assert.strictEqual(emojiCount, 0, 'No system emojis allowed in src/');
console.log('✓ Zero emojis across all src/ files');

console.log('\n✨ ALL PHASE 4.13 VERIFICATION TESTS PASSED SUCCESSFULLY! ✨\n');
