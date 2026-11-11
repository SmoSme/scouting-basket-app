/**
 * Phase 4.18 Automated Verification Suite:
 * Decoupled App Entry, Idle Dashboard State & Match Resumption
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- STARTING PHASE 4.18 TEST SUITE ---');

// 1. Verify App.jsx decoupling and startup modal removal
console.log('Test 1: App.jsx startup modal is not forced open on initial load');
const appContent = fs.readFileSync('src/App.jsx', 'utf8');

assert(
  appContent.includes("const [showSessionModal, setShowSessionModal] = useState(false);"),
  'showSessionModal must initialize with false to decouple app entry'
);
assert(
  !appContent.includes("useState(!localStorage.getItem('current_game_session'))"),
  'Old forced modal logic (!localStorage.getItem(...)) must be completely eliminated'
);
console.log('  Passed: showSessionModal initializes to false.');

// 2. Verify handleResetGame clears active session and returns to idle
console.log('Test 2: handleResetGame clears session state and localStorage');
assert(
  appContent.includes("setGameSession('')") && 
  appContent.includes("setCurrentMatchId(null)") &&
  appContent.includes("localStorage.removeItem('current_game_session')") &&
  appContent.includes("localStorage.removeItem('current_match_id')"),
  'handleResetGame must reset gameSession, currentMatchId, and clear localStorage'
);
console.log('  Passed: handleResetGame clears session to return to idle.');

// 3. Verify handleResumeMatchSession implementation
console.log('Test 3: handleResumeMatchSession extracts on_court and restores active state');
assert(
  appContent.includes('handleResumeMatchSession'),
  'handleResumeMatchSession function must exist in App.jsx'
);
assert(
  appContent.includes('lastOnCourt') && appContent.includes('updateOnCourtPlayerNums'),
  'handleResumeMatchSession must extract on_court snapshot and restore onCourtPlayerNums'
);
assert(
  appContent.includes('onResumeMatch={handleResumeMatchSession}'),
  'handleResumeMatchSession must be passed to Archive route'
);
console.log('  Passed: handleResumeMatchSession properly implemented.');

// 4. Verify LiveGame.jsx Idle State UI
console.log('Test 4: LiveGame.jsx renders Idle State when !gameSession');
const liveGameContent = fs.readFileSync('src/pages/LiveGame.jsx', 'utf8');

assert(
  liveGameContent.includes('!gameSession ?'),
  'LiveGame must branch on !gameSession'
);
assert(
  liveGameContent.includes('Nessuna Partita in Corso') && 
  liveGameContent.includes('No Active Match'),
  'LiveGame idle state must include bilingual match heading'
);
assert(
  liveGameContent.includes('Inizia Nuova Partita') &&
  liveGameContent.includes('Start New Match'),
  'LiveGame idle state must have button to start new match'
);
assert(
  liveGameContent.includes('Sfoglia Archivio per Riprendere') &&
  liveGameContent.includes('Browse Archive to Resume'),
  'LiveGame idle state must have button to browse archive'
);
assert(
  liveGameContent.includes("navigate('/archive')"),
  'Browse Archive button must navigate to /archive'
);
assert(
  liveGameContent.includes('#022D32') && liveGameContent.includes('#0CA17A') && liveGameContent.includes('#DDF3E9'),
  'LiveGame idle state must adhere to official BBA color palette'
);
console.log('  Passed: LiveGame renders Idle State UI with BBA palette and navigation.');

// 5. Verify Archive.jsx and MatchReviewModal.jsx resumption actions
console.log('Test 5: Archive.jsx and MatchReviewModal.jsx provide Resume Live Scouting action');
const archiveContent = fs.readFileSync('src/pages/Archive.jsx', 'utf8');
const reviewModalContent = fs.readFileSync('src/components/MatchReviewModal.jsx', 'utf8');

assert(
  archiveContent.includes('handleResumeMatch'),
  'Archive.jsx must implement handleResumeMatch'
);
assert(
  archiveContent.includes('onResumeMatch') && archiveContent.includes("navigate('/')"),
  'Archive.jsx must accept onResumeMatch and redirect to Live tab'
);
assert(
  archiveContent.includes('onResumeScouting={handleResumeMatch}'),
  'Archive.jsx must pass onResumeScouting to MatchReviewModal'
);
assert(
  reviewModalContent.includes('onResumeScouting'),
  'MatchReviewModal must accept onResumeScouting'
);
assert(
  reviewModalContent.includes('Riprendi Live') && reviewModalContent.includes('Resume Live'),
  'MatchReviewModal must include Resume Live button'
);
console.log('  Passed: Resumption buttons present in Archive and MatchReviewModal.');

// 6. Verify Navbar.jsx handles empty session cleanly
console.log('Test 6: Navbar.jsx renders clean shortcut when no session is active');
const navbarContent = fs.readFileSync('src/components/Navbar.jsx', 'utf8');

assert(
  navbarContent.includes('Nuova Partita') && navbarContent.includes('New Match'),
  'Navbar must offer clean New Match button when no session is active'
);
console.log('  Passed: Navbar handles idle session cleanly.');

// 7. Verify zero system emojis
console.log('Test 7: Strictly zero system emojis');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const checkedFiles = [
  'src/App.jsx',
  'src/pages/LiveGame.jsx',
  'src/pages/Archive.jsx',
  'src/components/MatchReviewModal.jsx',
  'src/components/Navbar.jsx',
  'src/context/LanguageContext.jsx'
];

for (const f of checkedFiles) {
  const content = fs.readFileSync(f, 'utf8');
  assert(!emojiRegex.test(content), `No system emojis allowed in ${f}`);
}
console.log('  Passed: 0 system emojis across all modified files.');

console.log('--- ALL PHASE 4.18 TESTS PASSED SUCCESSFULLY! ---');
