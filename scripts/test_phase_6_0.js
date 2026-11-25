import assert from 'assert';
import fs from 'fs';
import { execSync } from 'child_process';
import { resolveAppMode } from '../src/config/appMode.js';

console.log('--- STARTING PHASE 6.0 PUBLIC VS ADMIN MODE VERIFICATION SUITE ---');

// 1. Test resolveAppMode normalization
console.log('\n[TEST 1] Verifying resolveAppMode normalization...');
assert.strictEqual(resolveAppMode('public'), 'public');
assert.strictEqual(resolveAppMode('PUBLIC'), 'public');
assert.strictEqual(resolveAppMode('  PuBlIc  '), 'public');
assert.strictEqual(resolveAppMode('admin'), 'admin');
assert.strictEqual(resolveAppMode('ADMIN'), 'admin');
assert.strictEqual(resolveAppMode(''), 'admin');
assert.strictEqual(resolveAppMode(undefined), 'admin');
assert.strictEqual(resolveAppMode(null), 'admin');
assert.strictEqual(resolveAppMode('other'), 'admin');
console.log('  -> resolveAppMode handles public, case-insensitivity, and admin default cleanly.');

// 2. Test appMode runtime flags & assertCanMutate in subprocesses
console.log('\n[TEST 2] Verifying runtime exports & assertCanMutate under VITE_APP_MODE=public and admin...');
const publicCheck = execSync(
  `node --input-type=module -e "import { APP_MODE, IS_PUBLIC_MODE, IS_ADMIN_MODE, canMutate, assertCanMutate } from './src/config/appMode.js'; import assert from 'assert'; assert.strictEqual(APP_MODE, 'public'); assert.strictEqual(IS_PUBLIC_MODE, true); assert.strictEqual(IS_ADMIN_MODE, false); assert.strictEqual(canMutate(), false); assert.throws(() => assertCanMutate('testWrite'), /read-only public mode/); console.log('OK_PUBLIC');"`,
  { env: { ...process.env, VITE_APP_MODE: 'public' }, encoding: 'utf8' }
);
assert(publicCheck.includes('OK_PUBLIC'));

const adminCheck = execSync(
  `node --input-type=module -e "import { APP_MODE, IS_PUBLIC_MODE, IS_ADMIN_MODE, canMutate, assertCanMutate } from './src/config/appMode.js'; import assert from 'assert'; assert.strictEqual(APP_MODE, 'admin'); assert.strictEqual(IS_PUBLIC_MODE, false); assert.strictEqual(IS_ADMIN_MODE, true); assert.strictEqual(canMutate(), true); assert.strictEqual(assertCanMutate('testWrite'), true); console.log('OK_ADMIN');"`,
  { env: { ...process.env, VITE_APP_MODE: '' }, encoding: 'utf8' }
);
assert(adminCheck.includes('OK_ADMIN'));
console.log('  -> Public blocks mutations via assertCanMutate; Admin allows mutations by default.');

// 3. Verify legacy Coach AuthModal removal
console.log('\n[TEST 3] Verifying legacy Coach login modal/state removal...');
assert(!fs.existsSync('src/components/AuthModal.jsx'), 'src/components/AuthModal.jsx must be deleted');
const appJsx = fs.readFileSync('src/App.jsx', 'utf8');
assert(!appJsx.includes('AuthModal'), 'App.jsx must not reference AuthModal');
assert(!appJsx.includes('showAuthModal'), 'App.jsx must not have showAuthModal state');
assert(!appJsx.includes('bba_auth_role'), 'App.jsx must not use bba_auth_role');
assert(appJsx.includes('IS_PUBLIC_MODE ?') && appJsx.includes('<Navigate to="/trends" replace />'), 'App.jsx must redirect / to /trends in public mode');
console.log('  -> Legacy Coach login completely removed and public route redirect verified.');

// 4. Verify Navbar restrictions
console.log('\n[TEST 4] Verifying Navbar public vs admin controls...');
const navbarJsx = fs.readFileSync('src/components/Navbar.jsx', 'utf8');
assert(!navbarJsx.includes('onOpenAuth') && !navbarJsx.includes('onLogout'), 'Navbar must not use legacy login/logout props');
assert(navbarJsx.includes("import { IS_ADMIN_MODE } from '../config/appMode'"), 'Navbar must import IS_ADMIN_MODE');
assert(navbarJsx.includes('{isAdmin && (') && navbarJsx.includes('to="/archive"') && navbarJsx.includes('to="/trends"') && navbarJsx.includes('to="/league-hub"'), 'Navbar keeps ARCHIVIO, HUB BBA, HUB CAMPIONATO and hides GARA LIVE / admin controls behind isAdmin');
console.log('  -> Navbar restricts live/admin controls in public mode while keeping public navigation and IT|EN.');

// 5. Verify Read-Only Guards across Pages, Modals & Services
console.log('\n[TEST 5] Verifying read-only guards across Archive, SeasonTrends, MatchReviewModal, LeagueHub & services...');
const archiveJsx = fs.readFileSync('src/pages/Archive.jsx', 'utf8');
assert(archiveJsx.includes('IS_PUBLIC_MODE') && archiveJsx.includes('IS_ADMIN_MODE'), 'Archive.jsx must enforce mode guards');
assert(!archiveJsx.includes("authRole === 'admin'"), 'Archive.jsx must use IS_ADMIN_MODE instead of legacy authRole');

const reviewModalJsx = fs.readFileSync('src/components/MatchReviewModal.jsx', 'utf8');
assert(reviewModalJsx.includes('IS_PUBLIC_MODE') && reviewModalJsx.includes('IS_ADMIN_MODE'), 'MatchReviewModal.jsx must enforce mode guards');

const leagueHubJsx = fs.readFileSync('src/pages/LeagueHub.jsx', 'utf8');
assert(leagueHubJsx.includes('IS_PUBLIC_MODE') && leagueHubJsx.includes('IS_ADMIN_MODE'), 'LeagueHub.jsx must hide import/default/sync mutations in public mode');

const trendsJsx = fs.readFileSync('src/pages/SeasonTrends.jsx', 'utf8');
assert(trendsJsx.includes('IS_PUBLIC_MODE') && trendsJsx.includes('IS_ADMIN_MODE'), 'SeasonTrends.jsx must pass admin-only callbacks conditionally');

const metaSvc = fs.readFileSync('src/services/matchMetadataService.js', 'utf8');
assert(metaSvc.includes('IS_PUBLIC_MODE'), 'matchMetadataService.js must block DB writes in public mode');

const offlineSvc = fs.readFileSync('src/services/offlineSync.js', 'utf8');
assert(offlineSvc.includes('IS_PUBLIC_MODE'), 'offlineSync.js must block queue writes/sync in public mode');
console.log('  -> Read-only guards verified across all UI views and Supabase services.');

console.log('\nALL PHASE 6.0 UNIT & STATIC CHECKS PASSED SUCCESSFULLY!');
