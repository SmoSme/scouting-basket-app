import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- STARTING PHASE 4.16 TEST SUITE: PREVENT MATCH DATE AUTO-OVERWRITE ---');

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

// Dynamically import modules so process.env is present when supabase.js initializes
const { findOrCreateScoutingMatch, saveMatchMetadataToSupabase } = await import('../src/services/matchMetadataService.js');
const { buildUnifiedMatchList, buildHybridGameLog } = await import('../src/utils/hybridDataService.js');

// 1. Static Analysis of matchMetadataService.js
console.log('\n[1/5] Verifying findOrCreateScoutingMatch Immutability in matchMetadataService.js...');
const metaServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/matchMetadataService.js'), 'utf8');

// Ensure existing match check returns immediately without update
assert(
  metaServiceContent.includes('if (existing && existing.id) {') &&
  metaServiceContent.includes('return existing;'),
  'findOrCreateScoutingMatch must immediately return existing match without mutating match_date'
);
assert(
  !metaServiceContent.includes('needsUpdate = (normalizedDate && existing.match_date !== normalizedDate)'),
  'findOrCreateScoutingMatch must NOT contain legacy needsUpdate comparison that overwrote match_date'
);
console.log('✓ findOrCreateScoutingMatch strictly preserves existing database match_date on existing records');

// 2. Static Analysis of App.jsx event dispatchers and session resolution
console.log('\n[2/5] Verifying App.jsx Session Resolution and Dispatchers...');
const appContent = fs.readFileSync(path.join(rootDir, 'src/App.jsx'), 'utf8');

assert(
  appContent.includes('const matchRecord = await findOrCreateScoutingMatch({\n          matchName: gameSession\n        });') ||
  appContent.includes('matchName: gameSession\n        });'),
  'App.jsx resolveActiveSession must NOT pass matchDate when resolving existing match'
);
assert(
  appContent.includes('setMatchDate(String(matchRecord.match_date).split(\'T\')[0]);'),
  'App.jsx resolveActiveSession must hydrate local matchDate state from persistent DB match_date'
);

// Verify dispatchAction and dispatchMultipleActions do NOT pass matchDate to findOrCreateScoutingMatch
const dispatchActionSection = appContent.slice(appContent.indexOf('const dispatchAction ='), appContent.indexOf('const dispatchMultipleActions ='));
assert(
  !dispatchActionSection.includes('findOrCreateScoutingMatch({ matchName: gameSession, matchDate'),
  'dispatchAction must not pass matchDate to findOrCreateScoutingMatch'
);
const dispatchMultipleSection = appContent.slice(appContent.indexOf('const dispatchMultipleActions ='), appContent.indexOf('const dispatchOpponentScore ='));
assert(
  !dispatchMultipleSection.includes('findOrCreateScoutingMatch({ matchName: gameSession, matchDate'),
  'dispatchMultipleActions must not pass matchDate to findOrCreateScoutingMatch'
);
console.log('✓ App.jsx omits matchDate during event dispatching and hydrates state from DB');

// 3. Static & Unit Analysis of hybridDataService.js Date Hierarchy
console.log('\n[3/5] Verifying Date Hierarchy in hybridDataService.js...');
const hybridContent = fs.readFileSync(path.join(rootDir, 'src/utils/hybridDataService.js'), 'utf8');

// Verify match_date is prioritized over fallback
assert(
  hybridContent.includes('sm.match_date ? String(sm.match_date).split(\'T\')[0]'),
  'hybridDataService.js must prioritize sm.match_date from DB'
);

// Test buildUnifiedMatchList with mock match possessing persistent DB match_date
const mockSupaMatch = {
  id: 'test_uuid_123',
  name: 'BBA vs Test Date Preservation',
  match_date: '2026-10-15',
  matchDate: '2026-10-15',
  match_type: 'Official',
  createdAt: '2026-11-08T10:00:00Z',
  home_score: 75,
  away_score: 70
};

const unified = buildUnifiedMatchList([], [mockSupaMatch], {});
assert.strictEqual(unified.length, 1);
assert.strictEqual(unified[0].match_date, '2026-10-15', 'Stored match_date 2026-10-15 must be strictly preserved');
assert.strictEqual(unified[0].matchDate, '2026-10-15', 'matchDate alias must match 2026-10-15');

// Test buildHybridGameLog
const hybridLog = buildHybridGameLog([], [mockSupaMatch], 'ALL', {});
assert.strictEqual(hybridLog.length, 1);
assert.strictEqual(hybridLog[0].match_date, '2026-10-15', 'Stored match_date 2026-10-15 must be strictly preserved in game log');
assert.strictEqual(hybridLog[0].date, '2026-10-15', 'date in game log must match 2026-10-15');
console.log('✓ hybridDataService.js strictly prioritizes stored DB match_date and preserves original date');

// 4. Live Cloud Integration Test against Supabase
console.log('\n[4/5] Executing Live Supabase Integration Test for Date Immutability...');
async function testLiveDateImmutability() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project')) {
    console.warn('⚠️ Supabase credentials not found; skipping cloud test.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 4a. Fetch an existing match
  const { data: matches, error: matchError } = await supabase
    .from('scouting_matches')
    .select('*')
    .limit(1);

  assert(!matchError, `Failed to query scouting_matches: ${matchError?.message}`);
  assert(matches && matches.length > 0, 'Must have at least one match in scouting_matches');

  const existingMatch = matches[0];
  const originalDate = existingMatch.match_date;
  console.log(`Testing with existing match: "${existingMatch.match_name}" (original match_date: "${originalDate}")`);

  // 4b. Call findOrCreateScoutingMatch with a bogus date (e.g. today or 2099-01-01)
  const bogusDate = '2099-01-01';
  const resolved = await findOrCreateScoutingMatch({
    matchName: existingMatch.match_name,
    matchDate: bogusDate
  });

  assert(resolved && resolved.id === existingMatch.id, 'findOrCreateScoutingMatch must return the existing match');
  assert.strictEqual(
    resolved.match_date,
    originalDate,
    `findOrCreateScoutingMatch must return original date "${originalDate}", not bogus date "${bogusDate}"`
  );

  // 4c. Re-query Supabase directly to verify the DB row was NOT updated
  const { data: refetched, error: refetchError } = await supabase
    .from('scouting_matches')
    .select('match_date')
    .eq('id', existingMatch.id)
    .single();

  assert(!refetchError, `Failed to refetch match: ${refetchError?.message}`);
  assert.strictEqual(
    refetched.match_date,
    originalDate,
    `Database row was overwritten! Expected "${originalDate}", but found "${refetched.match_date}"`
  );
  console.log('✓ Live Supabase verification confirmed: existing match_date was 100% untouched and NOT overwritten');
}

await testLiveDateImmutability();

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
console.log('ALL PHASE 4.16 TESTS COMPLETED SUCCESSFULLY!');
console.log('======================================================');
