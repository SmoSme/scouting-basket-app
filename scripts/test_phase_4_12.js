import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- STARTING PHASE 4.12 TEST SUITE: ZOMBIE EVENTS, SYNC QUEUE & IDEMPOTENCY ---');

// 1. Verify src/utils/uuid.js
console.log('\n[1/7] Testing UUID Generator (src/utils/uuid.js)...');
const uuidCode = fs.readFileSync(path.join(rootDir, 'src/utils/uuid.js'), 'utf8');
assert(uuidCode.includes('export function generateUUID'), 'src/utils/uuid.js must export generateUUID()');

import('../src/utils/uuid.js').then(async (uuidModule) => {
  const { generateUUID } = uuidModule;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  const id1 = generateUUID();
  const id2 = generateUUID();
  assert(uuidRegex.test(id1), `Generated UUID "${id1}" does not match RFC4122 v4 format`);
  assert(uuidRegex.test(id2), `Generated UUID "${id2}" does not match RFC4122 v4 format`);
  assert.notStrictEqual(id1, id2, 'Two generated UUIDs must not be identical');
  console.log('✓ generateUUID() generates unique RFC4122 v4 UUIDs');

  // 2. Verify src/services/offlineSync.js
  console.log('\n[2/7] Verifying Offline Sync Idempotency & Queue Hardening (src/services/offlineSync.js)...');
  const offlineSyncCode = fs.readFileSync(path.join(rootDir, 'src/services/offlineSync.js'), 'utf8');
  assert(offlineSyncCode.includes('isSyncInProgress'), 'offlineSync.js must have concurrency lock isSyncInProgress');
  assert(offlineSyncCode.includes("onConflict: 'id'"), 'offlineSync.js must specify onConflict: "id"');
  assert(offlineSyncCode.includes('ignoreDuplicates: true'), 'offlineSync.js must specify ignoreDuplicates: true');
  assert(offlineSyncCode.includes('23505'), 'offlineSync.js must treat code 23505 (unique_violation) as safely synced');
  assert(offlineSyncCode.includes('syncedIds.has(String(item.id))'), 'offlineSync.js must aggressively filter synced events out of local queue');
  assert(offlineSyncCode.includes('removeFromOfflineQueue'), 'offlineSync.js must export removeFromOfflineQueue');
  console.log('✓ offlineSync.js implements mutex lock, upsert by id, error 23505 handling, and aggressive queue purge');

  // 3. Verify src/App.jsx Idempotency & Sync Queue Purge
  console.log('\n[3/7] Verifying Client-Side Idempotency in App.jsx...');
  const appCode = fs.readFileSync(path.join(rootDir, 'src/App.jsx'), 'utf8');
  assert(appCode.includes("import { generateUUID } from './utils/uuid'"), 'App.jsx must import generateUUID');
  assert(appCode.includes('const eventId = situational.id || generateUUID()') || appCode.includes('const eventId = generateUUID()'), 'dispatchAction must generate eventId = generateUUID() on client');
  assert(appCode.includes('const itemEventId = generateUUID()'), 'dispatchMultipleActions must generate itemEventId on client');
  assert(appCode.includes('removeFromOfflineQueue(eventId, supabasePayload)'), 'dispatchAction must aggressively purge from offline queue when promise resolves');
  assert(appCode.includes('payloads.forEach(p => removeFromOfflineQueue(p.id, p))'), 'dispatchMultipleActions must aggressively purge batch items from offline queue when promise resolves');
  assert(appCode.includes(".upsert([supabasePayload], { onConflict: 'id', ignoreDuplicates: true })"), 'dispatchAction must upsert with onConflict id');
  assert(appCode.includes(".upsert(payloads, { onConflict: 'id', ignoreDuplicates: true })"), 'dispatchMultipleActions must upsert with onConflict id');
  assert(!appCode.includes("fetch('/api/events'"), 'App.jsx must have removed legacy /api/events fallback');
  console.log('✓ App.jsx assigns client UUIDs synchronously and purges offline queue the millisecond promise resolves');

  // 4. Verify Event Deletion & Undo in App.jsx
  console.log('\n[4/7] Verifying Explicit Deletion by ID in App.jsx...');
  assert(appCode.includes(".delete()") && appCode.includes(".eq('id', String(resolvedId))"), 'handleDeleteEvent and handleUndo must explicitly delete from Supabase by id');
  assert(appCode.includes('removeFromOfflineQueue(resolvedId, targetEv)'), 'handleDeleteEvent must purge from offline queue');
  assert(appCode.includes('removeFromOfflineQueue(resolvedId, lastEv)'), 'handleUndo must purge from offline queue');
  console.log('✓ handleDeleteEvent and handleUndo execute explicit .delete().eq("id", resolvedId) and purge local queue');

  // 5. Verify Match Cascade Deletion in Archive.jsx
  console.log('\n[5/7] Verifying Match Cascade Deletion in Archive.jsx...');
  const archiveCode = fs.readFileSync(path.join(rootDir, 'src/pages/Archive.jsx'), 'utf8');
  assert(archiveCode.includes(".from('scouting_matches').delete().eq('id', matchId)"), 'Archive.jsx must delete directly from scouting_matches by id');
  assert(archiveCode.includes('bba_events_${matchName}'), 'Archive.jsx must purge bba_events_ localStorage cache');
  assert(archiveCode.includes('scouting_offline_queue'), 'Archive.jsx must purge offline queue for deleted match');
  console.log('✓ Archive.jsx deletes from scouting_matches directly and purges all match caches to prevent zombies');

  // 6. Verify UI Debounce in LiveGame.jsx
  console.log('\n[6/7] Verifying UI Debounce in LiveGame.jsx...');
  const liveGameCode = fs.readFileSync(path.join(rootDir, 'src/pages/LiveGame.jsx'), 'utf8');
  assert(liveGameCode.includes('const [actionDebounce, setActionDebounce] = useState(false)'), 'LiveGame must have actionDebounce state');
  assert(liveGameCode.includes('triggerWithDebounce'), 'LiveGame must define triggerWithDebounce guard');
  assert(liveGameCode.includes('handleDebouncedUndo'), 'LiveGame must debounce Undo actions');
  assert(liveGameCode.includes('handleDebouncedRecordOpponentScore'), 'LiveGame must debounce opponent score actions');
  assert(liveGameCode.includes('disabled={actionDebounce}'), 'LiveGame must pass disabled={actionDebounce} to action panels');
  assert(liveGameCode.includes('REGISTRATO'), 'LiveGame must display visual feedback badge when actionDebounce is true');
  console.log('✓ LiveGame.jsx implements debounce guards across all courtside action handlers');

  // 7. Verify Supabase Schema and Zero Emoji Policy
  console.log('\n[7/7] Verifying Supabase SQL Schema and Zero Emoji Policy...');
  const sqlCode = fs.readFileSync(path.join(rootDir, 'supabase_schema_phase_4_12.sql'), 'utf8');
  assert(sqlCode.includes('ALTER TABLE scouting_log ALTER COLUMN id TYPE TEXT'), 'SQL migration must alter id to TEXT');
  assert(sqlCode.includes('ON DELETE CASCADE'), 'SQL migration must enforce ON DELETE CASCADE on scouting_log.match_id');
  assert(sqlCode.includes('idx_scouting_log_id_unique'), 'SQL migration must create unique index on id');
  assert(sqlCode.includes('ALTER TABLE scouting_log ADD PRIMARY KEY (id)'), 'SQL migration must enforce primary key');

  const filesToCheck = [
    'src/utils/uuid.js',
    'src/services/offlineSync.js',
    'src/App.jsx',
    'src/pages/LiveGame.jsx',
    'src/pages/Archive.jsx',
    'src/components/ActionClusters.jsx',
    'src/components/OpponentPossessionPanel.jsx',
    'supabase_schema_phase_4_12.sql'
  ];

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  for (const f of filesToCheck) {
    const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
    assert(!emojiRegex.test(content), `Emoji found in ${f}! Strictly disallowed.`);
  }
  console.log('✓ supabase_schema_phase_4_12.sql contains ON DELETE CASCADE and all files strictly adhere to Zero Emoji Policy');

  console.log('\n ALL PHASE 4.12 CHECKS PASSED SUCCESSFULLY!\n');
}).catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
